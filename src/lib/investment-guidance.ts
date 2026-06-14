import type { Types } from "mongoose";

import { getBudgetCoachResult } from "@/lib/budget-coach";
import { FinancialDNAModel, GoalModel } from "@/models";

export type InvestmentSuggestion = {
  action: string;
  fitReason: string;
  horizon: "short" | "medium" | "long";
  priority: "high" | "medium" | "low";
  risk: "low" | "medium" | "high";
  title: string;
  warning?: string;
};

type FinancialDNASnapshot = {
  riskAppetite?: "low" | "medium" | "high";
};

type GoalSnapshot = {
  goalType: string;
  targetAmount: number;
  targetDate?: Date;
  title: string;
};

function getMonthsUntil(date?: Date) {
  if (!date) {
    return null;
  }

  const now = new Date();
  return Math.max(
    1,
    (date.getFullYear() - now.getFullYear()) * 12 +
      date.getMonth() -
      now.getMonth()
  );
}

function getGoalHorizon(goal?: GoalSnapshot): InvestmentSuggestion["horizon"] {
  const months = getMonthsUntil(goal?.targetDate);

  if (!months || months <= 18) {
    return "short";
  }

  if (months <= 60) {
    return "medium";
  }

  return "long";
}

export async function getInvestmentGuidance(
  userId: Types.ObjectId
): Promise<InvestmentSuggestion[]> {
  const [budget, financialDNA, goals] = await Promise.all([
    getBudgetCoachResult(userId),
    FinancialDNAModel.findOne({ userId }).lean<FinancialDNASnapshot | null>(),
    GoalModel.find({ userId, status: "active" })
      .sort({ priority: -1, targetDate: 1 })
      .limit(3)
      .lean<GoalSnapshot[]>()
  ]);
  const suggestions: InvestmentSuggestion[] = [];
  const riskAppetite = financialDNA?.riskAppetite ?? "low";
  const monthlySurplus = Math.max(0, budget.netMonthlyCashflow);
  const emergencyGap =
    budget.emergencyFundTarget > 0 &&
    budget.netMonthlyCashflow < budget.emergencyFundTarget / 6;
  const primaryGoal = goals[0];
  const horizon = getGoalHorizon(primaryGoal);

  if (emergencyGap || monthlySurplus <= 0) {
    suggestions.push({
      action:
        "Build or protect emergency savings before starting risky investments.",
      fitReason:
        "Your cashflow or emergency target needs attention, so safety comes first.",
      horizon: "short",
      priority: "high",
      risk: "low",
      title: "Emergency fund first",
      warning:
        "Do not invest emergency money in market-linked products that can fall when you need cash."
    });
  }

  if (horizon === "short" || riskAppetite === "low") {
    suggestions.push({
      action:
        "Consider safe options like savings buffer, recurring deposit, or fixed deposit for short-term goals.",
      fitReason:
        primaryGoal
          ? `${primaryGoal.title} appears short-term or safety-sensitive.`
          : "Short-term money should be stable and easy to access.",
      horizon: "short",
      priority: "high",
      risk: "low",
      title: "FD/RD for near goals"
    });
  }

  if (monthlySurplus > 0 && horizon !== "short" && riskAppetite !== "low") {
    suggestions.push({
      action:
        "A small SIP in a suitable mutual fund category may fit long-term goals after emergency savings.",
      fitReason:
        "You have some monthly surplus and a medium/long horizon, so disciplined investing can help.",
      horizon,
      priority: "medium",
      risk: riskAppetite === "high" ? "high" : "medium",
      title: "SIP for long-term goals",
      warning:
        "Mutual fund returns are market-linked and not guaranteed. Choose category after reading risk."
    });
  }

  if (budget.subscriptionEstimate.monthly > 0) {
    suggestions.push({
      action:
        "Cancel unused subscriptions and redirect that amount toward goals before adding new investments.",
      fitReason: `Recurring spends are around ₹${Math.round(
        budget.subscriptionEstimate.monthly
      )}/month.`,
      horizon: "short",
      priority: "medium",
      risk: "low",
      title: "Free up investable surplus"
    });
  }

  suggestions.push({
    action:
      "Avoid tips, guaranteed high returns, crypto/stock pressure groups, and unknown loan-investment schemes.",
    fitReason:
      "High-return promises are often unsuitable or fraudulent for general users.",
    horizon: "short",
    priority: "medium",
    risk: "high",
    title: "Avoid high-return traps",
    warning:
      "If someone promises fixed high returns with urgency, check with Scam Shield first."
  });

  return suggestions.slice(0, 5);
}

export function formatInvestmentReply(suggestions: InvestmentSuggestion[]) {
  return suggestions
    .map(
      (suggestion, index) =>
        `${index + 1}. ${suggestion.title}: ${suggestion.action} Reason: ${suggestion.fitReason}`
    )
    .join("\n");
}
