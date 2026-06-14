import { getBudgetCoachResult } from "@/lib/budget-coach";
import { getOrCreateChannelUser } from "@/lib/voice-transaction";

import { Intent } from "./intents";
import type { AgentContext, AgentResponse } from "./types";

type BudgetUserId = Parameters<typeof getBudgetCoachResult>[0];

export async function handleBudgetCoach(
  _message: string,
  context: AgentContext = {}
): Promise<AgentResponse> {
  const channelUser =
    !context.appUserId && context.externalUserId
      ? await getOrCreateChannelUser({
          channel: context.channel ?? "chat",
          externalUserId: context.externalUserId
        })
      : null;
  const appUserId = context.appUserId ?? channelUser?._id;

  if (!appUserId) {
    return {
      agent: "budget_coach",
      intent: Intent.BUDGET_COACH,
      text:
        "I can coach your budget after sign-in. Add income and expenses through Voice Ledger, then ask: where is my money leaking?"
    };
  }

  const result = await getBudgetCoachResult(appUserId as BudgetUserId);
  const topInsight = result.insights[0];
  const leakText = result.moneyLeakCategory
    ? ` Your biggest money leak is ${result.moneyLeakCategory.category} at ₹${Math.round(result.moneyLeakCategory.amount)} this month.`
    : " Add a few more transactions so I can detect your biggest money leak.";
  const subscriptionText =
    result.subscriptionEstimate.monthly > 0
      ? ` Recurring spends are around ₹${Math.round(result.subscriptionEstimate.monthly)}/month, or ₹${Math.round(result.subscriptionEstimate.yearly)}/year.`
      : "";

  return {
    agent: "budget_coach",
    intent: Intent.BUDGET_COACH,
    text: `${topInsight?.message ?? "Here is your budget summary."}${leakText}${subscriptionText} Estimated monthly cashflow: ₹${Math.round(result.netMonthlyCashflow)}.`,
    data: result
  };
}
