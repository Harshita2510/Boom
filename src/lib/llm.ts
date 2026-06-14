type GenerateLLMTextInput = {
  system: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
};

export type LLMProvider = "gemini" | "groq";

export type LLMResult = {
  ok: boolean;
  provider?: LLMProvider;
  text?: string;
  error?: string;
};

const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";
const DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant";
const DEFAULT_TIMEOUT_MS = 12000;

export function getConfiguredLLMProviders(): LLMProvider[] {
  const providers: LLMProvider[] = [];

  if (process.env.GEMINI_API_KEY) {
    providers.push("gemini");
  }

  if (process.env.GROQ_API_KEY) {
    providers.push("groq");
  }

  return providers;
}

export function hasLLMProvider(): boolean {
  return getConfiguredLLMProviders().length > 0;
}

export async function generateLLMText(input: GenerateLLMTextInput): Promise<LLMResult> {
  const providers = getConfiguredLLMProviders();

  if (!providers.length) {
    return {
      ok: false,
      error: "No LLM provider configured. Add GEMINI_API_KEY or GROQ_API_KEY.",
    };
  }

  const errors: string[] = [];

  for (const provider of providers) {
    const result =
      provider === "gemini"
        ? await generateWithGemini(input)
        : await generateWithGroq(input);

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

async function generateWithGemini(input: GenerateLLMTextInput): Promise<LLMResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return { ok: false, provider: "gemini", error: "Missing GEMINI_API_KEY" };
  }

  try {
    const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
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
      return {
        ok: false,
        provider: "gemini",
        error: `Gemini request failed with ${response.status}`,
      };
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || "")
      .join("")
      .trim();

    return text
      ? { ok: true, provider: "gemini", text }
      : { ok: false, provider: "gemini", error: "Gemini returned empty text" };
  } catch (error: unknown) {
    return {
      ok: false,
      provider: "gemini",
      error: error instanceof Error ? error.message : "Gemini request failed",
    };
  }
}

async function generateWithGroq(input: GenerateLLMTextInput): Promise<LLMResult> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return { ok: false, provider: "groq", error: "Missing GROQ_API_KEY" };
  }

  try {
    const model = process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;
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
      return {
        ok: false,
        provider: "groq",
        error: `Groq request failed with ${response.status}`,
      };
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim();

    return text
      ? { ok: true, provider: "groq", text }
      : { ok: false, provider: "groq", error: "Groq returned empty text" };
  } catch (error: unknown) {
    return {
      ok: false,
      provider: "groq",
      error: error instanceof Error ? error.message : "Groq request failed",
    };
  }
}
