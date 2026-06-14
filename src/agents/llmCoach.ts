import { generateLLMText, hasLLMProvider } from "@/lib/llm";
import { Intent } from "./intents";
import { AgentContext, AgentResponse } from "./types";

const SYSTEM_PROMPT = `You are ArthSaathi, an India-focused AI financial coach for everyday people.
Give practical, simple, culturally familiar guidance in plain language.
Reply in the user's language when you can. Hinglish, Hindi, and simple English are all acceptable.
You can explain UPI, budgeting, saving, scams, loans, SIPs, FDs, government schemes, documents, and complaint drafts.
Safety rules:
- Do not ask for or store OTPs, UPI PINs, card PINs, passwords, or full account numbers.
- Do not promise investment returns or give guaranteed buy/sell advice.
- For investments, explain options and risks; suggest consulting a SEBI-registered advisor for personalized advice.
- For legal or complaint matters, provide drafts and next steps, not final legal advice.
- If something looks like fraud, tell the user to stop, verify through official channels, and report quickly.
Keep answers concise, helpful, and action-oriented.`;

export async function handleLLMCoach(
  message: string,
  context: AgentContext = {}
): Promise<AgentResponse<{ provider?: string; llmEnabled: boolean }>> {
  if (!hasLLMProvider()) {
    return fallbackResponse();
  }

  const result = await generateLLMText({
    system: SYSTEM_PROMPT,
    prompt: buildPrompt(message, context),
    temperature: 0.35,
    maxTokens: 650,
  });

  if (!result.ok || !result.text) {
    return fallbackResponse(result.error);
  }

  return {
    agent: "llm_coach",
    intent: Intent.UNKNOWN,
    text: result.text,
    data: {
      provider: result.provider,
      llmEnabled: true,
    },
  };
}

function buildPrompt(message: string, context: AgentContext): string {
  const channel = context.channel ? `Channel: ${context.channel}` : "Channel: web";

  return `${channel}
User message: ${message}

If the user is trying to record a transaction, tell them the exact natural format they can use, for example "I spent 500 on groceries" or "I earned 20000 salary".
If the user asks a general finance question, answer directly.
If the user shares a suspicious message, mention scam-checking steps and ask them not to click links or share OTP/PIN.
If the user uses Hindi, Hinglish, or another Indian language, reply in the same language unless they ask otherwise.`;
}

function fallbackResponse(error?: string): AgentResponse<{ llmEnabled: boolean; error?: string }> {
  return {
    agent: "llm_coach",
    intent: Intent.UNKNOWN,
    text:
      "I can help with expenses, income, scam checks, learning finance basics, goals, and future planning. Try: I spent 500 on groceries, explain SIP, or check if this message is a scam.",
    data: {
      llmEnabled: false,
      error,
    },
  };
}
