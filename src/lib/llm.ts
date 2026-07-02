type GenerateLLMTextInput = {
  system: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  provider?: LLMProvider;
  task?: LLMTask;
};

export type LLMProvider = "gemini" | "groq" | "openrouter" | "nvidia";
export type LLMTask = "action_plan" | "coach" | "document" | "simulation";

export type LLMResult = {
  ok: boolean;
  provider?: LLMProvider;
  text?: string;
  error?: string;
  model?: string;
};

const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";
const DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant";
const DEFAULT_OPENROUTER_MODEL = "z-ai/glm-4.5-air:free";
const DEFAULT_NVIDIA_MODEL = "nvidia/nemotron-3-nano-30b-a3b";
const DEFAULT_TIMEOUT_MS = 12000;
const TASK_MODEL_ENV: Record<LLMTask, string> = {
  action_plan: "ACTION_PLAN_LLM_MODELS",
  coach: "COACH_LLM_MODELS",
  document: "DOCUMENT_LLM_MODELS",
  simulation: "SIMULATION_LLM_MODELS"
};

type LLMRoute = {
  provider: LLMProvider;
  model?: string;
};

function getModelList(value: string | undefined, fallback: string) {
  return (value || fallback)
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);
}

function parseProvider(value: string): LLMProvider | null {
  return ["gemini", "groq", "openrouter", "nvidia"].includes(value)
    ? (value as LLMProvider)
    : null;
}

function getTaskRoutes(task: LLMTask | undefined): LLMRoute[] {
  if (!task) {
    return [];
  }

  const value = process.env[TASK_MODEL_ENV[task]];

  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry): LLMRoute | null => {
      const separatorIndex = entry.indexOf(":");

      if (separatorIndex === -1) {
        return null;
      }

      const provider = parseProvider(entry.slice(0, separatorIndex));
      const model = entry.slice(separatorIndex + 1).trim();

      return provider && model ? { provider, model } : null;
    })
    .filter((route): route is LLMRoute => Boolean(route));
}

export function getConfiguredLLMProviders(): LLMProvider[] {
  const providers: LLMProvider[] = [];

  if (process.env.GEMINI_API_KEY) {
    providers.push("gemini");
  }

  if (process.env.GROQ_API_KEY) {
    providers.push("groq");
  }

  if (process.env.OPENROUTER_API_KEY) {
    providers.push("openrouter");
  }

  if (process.env.NVIDIA_API_KEY) {
    providers.push("nvidia");
  }

  return providers;
}

export function hasLLMProvider(): boolean {
  return getConfiguredLLMProviders().length > 0;
}

export async function generateLLMText(input: GenerateLLMTextInput): Promise<LLMResult> {
  const providers = input.provider
    ? getConfiguredLLMProviders().filter((provider) => provider === input.provider)
    : getConfiguredLLMProviders();
  const taskRoutes = getTaskRoutes(input.task).filter((route) =>
    providers.includes(route.provider)
  );

  if (!providers.length) {
    return {
      ok: false,
      error:
        "No LLM provider configured. Add GEMINI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY, or NVIDIA_API_KEY.",
    };
  }

  const errors: string[] = [];

  for (const route of taskRoutes) {
    const result = await generateWithProvider(input, route.provider, route.model);

    if (result.ok && result.text) {
      return result;
    }

    errors.push(
      `${route.provider}:${route.model}: ${result.error || "No response text"}`
    );
  }

  for (const provider of providers) {
    const result = await generateWithProvider(input, provider);

    if (result.ok && result.text) {
      return result;
    }

    errors.push(`${provider}: ${result.error || "No response text"}`);
  }

  return {
    ok: false,
    error: errors.join("; "),
  };
}

async function generateWithProvider(
  input: GenerateLLMTextInput,
  provider: LLMProvider,
  modelOverride?: string
) {
  return provider === "gemini"
    ? generateWithGemini(input, modelOverride)
    : provider === "groq"
      ? generateWithGroq(input, modelOverride)
      : provider === "openrouter"
        ? generateWithOpenRouter(input, modelOverride)
        : generateWithNvidia(input, modelOverride);
}

async function generateWithGemini(
  input: GenerateLLMTextInput,
  modelOverride?: string
): Promise<LLMResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return { ok: false, provider: "gemini", error: "Missing GEMINI_API_KEY" };
  }

  const errors: string[] = [];
  const models = modelOverride
    ? [modelOverride]
    : getModelList(
        process.env.GEMINI_MODELS || process.env.GEMINI_MODEL,
        DEFAULT_GEMINI_MODEL
      );

  for (const model of models) {
    try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        signal: AbortSignal.timeout(input.timeoutMs ?? DEFAULT_TIMEOUT_MS),
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: input.system }],
          },
          contents: [
            {
              parts: [{ text: input.prompt }],
            },
          ],
          generationConfig: {
            temperature: input.temperature ?? 0.4,
            maxOutputTokens: input.maxTokens ?? 700,
          },
        }),
      }
    );

    if (!response.ok) {
      errors.push(`${model}: request failed with ${response.status}`);
      continue;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || "")
      .join("")
      .trim();

    if (text) {
      return { ok: true, provider: "gemini", text, model };
    }

    const finishReason = data?.candidates?.[0]?.finishReason;
    const blockReason = data?.promptFeedback?.blockReason;
    errors.push(
      `${model}: returned empty text${
        finishReason ? `, finishReason=${finishReason}` : ""
      }${blockReason ? `, blockReason=${blockReason}` : ""}`
    );
    } catch (error: unknown) {
      errors.push(`${model}: ${error instanceof Error ? error.message : "request failed"}`);
    }
  }

  return {
    ok: false,
    provider: "gemini",
    error: errors.join("; ") || "Gemini request failed",
  };
}

async function generateWithGroq(
  input: GenerateLLMTextInput,
  modelOverride?: string
): Promise<LLMResult> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return { ok: false, provider: "groq", error: "Missing GROQ_API_KEY" };
  }

  const errors: string[] = [];
  const models = modelOverride
    ? [modelOverride]
    : getModelList(
        process.env.GROQ_MODELS || process.env.GROQ_MODEL,
        DEFAULT_GROQ_MODEL
      );

  for (const model of models) {
    try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(input.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: input.system },
          { role: "user", content: input.prompt },
        ],
        temperature: input.temperature ?? 0.4,
        max_tokens: input.maxTokens ?? 700,
      }),
    });

    if (!response.ok) {
      errors.push(`${model}: request failed with ${response.status}`);
      continue;
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim();

    if (text) {
      return { ok: true, provider: "groq", text, model };
    }

    errors.push(`${model}: returned empty text`);
    } catch (error: unknown) {
      errors.push(`${model}: ${error instanceof Error ? error.message : "request failed"}`);
    }
  }

  return {
    ok: false,
    provider: "groq",
    error: errors.join("; ") || "Groq request failed",
  };
}

async function generateWithOpenRouter(
  input: GenerateLLMTextInput,
  modelOverride?: string
): Promise<LLMResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return {
      ok: false,
      provider: "openrouter",
      error: "Missing OPENROUTER_API_KEY"
    };
  }

  const errors: string[] = [];
  const models = modelOverride
    ? [modelOverride]
    : getModelList(
        process.env.OPENROUTER_MODELS || process.env.OPENROUTER_MODEL,
        DEFAULT_OPENROUTER_MODEL
      );

  for (const model of models) {
    try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-OpenRouter-Title": "ArthSaathi",
        "X-Title": "ArthSaathi"
      },
      signal: AbortSignal.timeout(input.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: input.system },
          { role: "user", content: input.prompt },
        ],
        temperature: input.temperature ?? 0.4,
        max_tokens: input.maxTokens ?? 700,
      }),
    });

    if (!response.ok) {
      errors.push(`${model}: request failed with ${response.status}`);
      continue;
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim();

    if (text) {
      return { ok: true, provider: "openrouter", text, model };
    }

    errors.push(`${model}: returned empty text`);
    } catch (error: unknown) {
      errors.push(`${model}: ${error instanceof Error ? error.message : "request failed"}`);
    }
  }

  return {
    ok: false,
    provider: "openrouter",
    error: errors.join("; ") || "OpenRouter request failed",
  };
}

async function generateWithNvidia(
  input: GenerateLLMTextInput,
  modelOverride?: string
): Promise<LLMResult> {
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    return {
      ok: false,
      provider: "nvidia",
      error: "Missing NVIDIA_API_KEY"
    };
  }

  const errors: string[] = [];
  const models = modelOverride
    ? [modelOverride]
    : getModelList(
        process.env.NVIDIA_MODELS || process.env.NVIDIA_MODEL,
        DEFAULT_NVIDIA_MODEL
      );

  for (const model of models) {
    try {
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      signal: AbortSignal.timeout(input.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: input.system },
          { role: "user", content: input.prompt }
        ],
        temperature: input.temperature ?? 0.4,
        max_tokens: input.maxTokens ?? 700
      })
    });

    if (!response.ok) {
      errors.push(`${model}: request failed with ${response.status}`);
      continue;
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim();

    if (text) {
      return { ok: true, provider: "nvidia", text, model };
    }

    errors.push(`${model}: returned empty text`);
    } catch (error: unknown) {
      errors.push(`${model}: ${error instanceof Error ? error.message : "request failed"}`);
    }
  }

  return {
    ok: false,
    provider: "nvidia",
    error: errors.join("; ") || "NVIDIA NIM request failed"
  };
}
