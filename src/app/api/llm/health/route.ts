import { NextResponse } from "next/server";

import { generateLLMText, type LLMProvider } from "@/lib/llm";

const providers = ["gemini", "groq", "openrouter", "nvidia"] as const;

function isProvider(value: string | null): value is LLMProvider {
  return providers.includes(value as LLMProvider);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider");

  if (provider && !isProvider(provider)) {
    return NextResponse.json(
      {
        ok: false,
        error: `Unsupported provider "${provider}".`
      },
      { status: 400 }
    );
  }

  const selectedProvider: LLMProvider | undefined = provider && isProvider(provider) ? provider : undefined;

  const result = await generateLLMText({
    system: "You are a health check endpoint. Reply with a short plain text confirmation.",
    prompt: "Say: ok",
    temperature: 0,
    maxTokens: 64,
    timeoutMs: 8000,
    provider: selectedProvider
  });

  return NextResponse.json({
    ok: result.ok,
    provider: result.provider,
    model: result.model,
    text: result.text,
    error: result.error
  });
}
