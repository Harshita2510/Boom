import {
  formatRecurringRupees,
  getRecurringExpenseResult
} from "@/lib/recurring-expenses";

import { Intent } from "./intents";
import type { AgentContext, AgentResponse } from "./types";

type RecurringUserId = Parameters<typeof getRecurringExpenseResult>[0];

export async function handleRecurringAgent(
  _message: string,
  context: AgentContext = {}
): Promise<AgentResponse> {
  if (!context.appUserId) {
    return {
      agent: "recurring_expenses",
      intent: Intent.RECURRING_EXPENSES,
      text:
        "I can detect recurring expenses after sign-in. Add ledger entries for bills, subscriptions, EMI, rent, and recharges first."
    };
  }

  const result = await getRecurringExpenseResult(
    context.appUserId as RecurringUserId
  );

  if (!result.items.length) {
    return {
      agent: "recurring_expenses",
      data: result,
      intent: Intent.RECURRING_EXPENSES,
      text: result.summary
    };
  }

  const items = result.items
    .slice(0, 5)
    .map(
      (item, index) =>
        `${index + 1}. ${item.label}: about ${formatRecurringRupees(
          item.monthlyEstimate
        )}/month, confidence ${item.confidence}. ${item.reviewAction}`
    )
    .join("\n");

  return {
    agent: "recurring_expenses",
    data: result,
    intent: Intent.RECURRING_EXPENSES,
    text: `${result.summary} Estimated recurring spend is ${formatRecurringRupees(
      result.monthlyEstimate
    )}/month or ${formatRecurringRupees(
      result.annualEstimate
    )}/year. Possible yearly savings: ${formatRecurringRupees(
      result.possibleYearlySavings
    )}.\n\nTop items:\n${items}`
  };
}
