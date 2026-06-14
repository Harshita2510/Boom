import {
  formatInvestmentReply,
  getInvestmentGuidance
} from "@/lib/investment-guidance";

import { Intent } from "./intents";
import type { AgentContext, AgentResponse } from "./types";

type InvestmentUserId = Parameters<typeof getInvestmentGuidance>[0];

export async function handleInvestmentAgent(
  _message: string,
  context: AgentContext = {}
): Promise<AgentResponse> {
  if (!context.appUserId) {
    return {
      agent: "investment_agent",
      intent: Intent.INVESTMENT_AGENT,
      text:
        "I can suggest investment categories after sign-in. Add Financial DNA, transactions, and goals first."
    };
  }

  const suggestions = await getInvestmentGuidance(context.appUserId as InvestmentUserId);

  return {
    agent: "investment_agent",
    data: suggestions,
    intent: Intent.INVESTMENT_AGENT,
    text: `Investment guidance, not specific fund advice:\n\n${formatInvestmentReply(
      suggestions
    )}`
  };
}
