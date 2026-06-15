import {
  formatCashSmoothingRupees,
  getCashSmoothingResult
} from "@/lib/cash-smoothing";

import { Intent } from "./intents";
import type { AgentContext, AgentResponse } from "./types";

type CashSmoothingUserId = Parameters<typeof getCashSmoothingResult>[0];

export async function handleCashSmoothingAgent(
  _message: string,
  context: AgentContext = {}
): Promise<AgentResponse> {
  if (!context.appUserId) {
    return {
      agent: "cash_smoothing",
      intent: Intent.CASH_SMOOTHING,
      text:
        "I can check cash-smoothing risk after sign-in. Complete Financial DNA and add a few income/expense entries first."
    };
  }

  const result = await getCashSmoothingResult(
    context.appUserId as CashSmoothingUserId
  );
  const signals = result.seasonalSignals
    .slice(0, 3)
    .map((signal) => `- ${signal}`)
    .join("\n");
  const actions = result.actions
    .slice(0, 3)
    .map((action) => `- ${action}`)
    .join("\n");

  return {
    agent: "cash_smoothing",
    data: result,
    intent: Intent.CASH_SMOOTHING,
    text: `Cash smoothing risk: ${result.riskLevel}. Keep about ${formatCashSmoothingRupees(
      result.monthlyShockBuffer
    )} per month as a shock buffer.\n\nSignals:\n${signals}\n\nActions:\n${actions}`
  };
}
