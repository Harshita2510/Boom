import type { Types } from "mongoose";

import {
  FinancialDNAModel,
  GoalModel,
  ScamAnalysisModel,
  TransactionModel
} from "@/models";
import { getBudgetCoachResult } from "@/lib/budget-coach";
import { getGoalRoadmaps } from "@/lib/goal-roadmap";
import { getInvestmentGuidance } from "@/lib/investment-guidance";
import { recommendGovernmentSchemes } from "@/lib/government-schemes";
import { getRecurringExpenseResult } from "@/lib/recurring-expenses";
import { generateLLMText, hasLLMProvider } from "@/lib/llm";

export type ActionPlanItem = {
  action: string;
  reason: string;
  tag: "budget" | "goal" | "investment" | "safety" | "scheme" | "data";
  urgency: "today" | "this_week" | "this_month";
};

export type ActionPlanResult = {
  aiSummary: string | null;
  coachMode: "ai" | "rules";
  dataReadiness: {
    label: string;
    complete: boolean;
  }[];
  highlights: {
    label: string;
    value: string;
    note: string;
  }[];
  nextActions: ActionPlanItem[];
  risks: string[];
};

type FinancialDNASnapshot = {
  dependents?: number;
  financialGoals?: string[];
  incomeStability?: "low" | "medium" | "high";
  incomeType?: string;
  monthlyIncome?: number;
  occupation?: string;
  preferredAdviceStyle?: "simple" | "detailed" | "data_driven";
  riskAppetite?: "low" | "medium" | "high";
  summary?: string;
};

function formatRupees(value: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(Math.round(value));
}

function addAction(
  actions: ActionPlanItem[],
  action: ActionPlanItem
) {
  if (!actions.some((item) => item.action === action.action)) {
    actions.push(action);
  }
}

export async function buildActionPlan(
  userId: Types.ObjectId
): Promise<ActionPlanResult> {
  const [
    budget,
    financialDNA,
    goalRoadmaps,
    recurring,
    investments,
    transactionCount,
    activeGoalCount,
    scamCheckCount
  ] = await Promise.all([
    getBudgetCoachResult(userId),
    FinancialDNAModel.findOne({ userId }).lean<FinancialDNASnapshot | null>(),
    getGoalRoadmaps(userId),
    getRecurringExpenseResult(userId),
    getInvestmentGuidance(userId),
    TransactionModel.countDocuments({ userId }),
    GoalModel.countDocuments({ userId, status: "active" }),
    ScamAnalysisModel.countDocuments({ userId })
  ]);

  const schemes = recommendGovernmentSchemes({
    dependents: financialDNA?.dependents,
    financialGoals: financialDNA?.financialGoals,
    incomeType: financialDNA?.incomeType,
    occupation: financialDNA?.occupation,
    riskAppetite: financialDNA?.riskAppetite
  });
  const nextActions: ActionPlanItem[] = [];
  const risks: string[] = [];
  const topGoal = goalRoadmaps[0];

  if (!financialDNA) {
    addAction(nextActions, {
      action: "Complete Financial DNA so every agent can personalize advice.",
      reason: "Occupation, income pattern, dependents, and risk appetite are missing.",
      tag: "data",
      urgency: "today"
    });
  }

  if (transactionCount < 5) {
    addAction(nextActions, {
      action: "Add at least 5 recent income/expense entries through Voice Ledger.",
      reason: "Budget, recurring, and health score become useful only after real transactions.",
      tag: "data",
      urgency: "today"
    });
  }

  if (budget.netMonthlyCashflow < 0) {
    risks.push("Monthly expenses are currently running ahead of income.");
    addAction(nextActions, {
      action: "Pause non-essential spends until cashflow turns positive.",
      reason: `Estimated monthly cashflow is ${formatRupees(budget.netMonthlyCashflow)}.`,
      tag: "budget",
      urgency: "today"
    });
  }

  if (budget.moneyLeakCategory) {
    addAction(nextActions, {
      action: `Review ${budget.moneyLeakCategory.category} spending and set a weekly cap.`,
      reason: `${budget.moneyLeakCategory.category} is the biggest current spend category.`,
      tag: "budget",
      urgency: "this_week"
    });
  }

  if (recurring.monthlyEstimate > 0) {
    addAction(nextActions, {
      action: "Cancel, pause, or downgrade one unused recurring payment.",
      reason: `Recurring spends are about ${formatRupees(recurring.monthlyEstimate)}/month.`,
      tag: "budget",
      urgency: "this_week"
    });
  }

  if (!activeGoalCount) {
    addAction(nextActions, {
      action: "Create one goal with amount and date.",
      reason: "ArthSaathi can assign a purpose to every rupee only after a goal exists.",
      tag: "goal",
      urgency: "this_week"
    });
  } else if (topGoal?.roadmap.status === "at_risk") {
    risks.push(`${topGoal.goal.title} is at risk with current monthly cashflow.`);
    addAction(nextActions, {
      action: `Adjust the ${topGoal.goal.title} roadmap or extend its date.`,
      reason: `It needs ${formatRupees(topGoal.roadmap.monthlyRequired)}/month.`,
      tag: "goal",
      urgency: "this_week"
    });
  }

  const topInvestment = investments[0];
  if (topInvestment) {
    addAction(nextActions, {
      action: topInvestment.action,
      reason: topInvestment.fitReason,
      tag: "investment",
      urgency: topInvestment.priority === "high" ? "this_week" : "this_month"
    });
  }

  const topScheme = schemes[0];
  if (topScheme) {
    addAction(nextActions, {
      action: `Check eligibility for ${topScheme.name}.`,
      reason: topScheme.fitReason,
      tag: "scheme",
      urgency: "this_month"
    });
  }

  if (!scamCheckCount) {
    addAction(nextActions, {
      action: "Run one suspicious message through Scam Shield before clicking links.",
      reason: "This trains the habit of checking OTP, KYC, loan, and UPI fraud attempts.",
      tag: "safety",
      urgency: "this_week"
    });
  }

  if (financialDNA?.incomeStability && financialDNA.incomeStability !== "high") {
    risks.push("Income may be seasonal or irregular, so cash smoothing matters.");
  }

  if (budget.balanceProjectionDays) {
    risks.push(`Low-balance pressure may appear in about ${budget.balanceProjectionDays} days.`);
  }

  const highlights = [
    {
      label: "Monthly cashflow",
      note: "Income minus projected expenses",
      value: formatRupees(budget.netMonthlyCashflow)
    },
    {
      label: "Savings rate",
      note: "Based on this month's run rate",
      value: `${budget.savingsRate}%`
    },
    {
      label: "Emergency target",
      note: "Six months of projected expenses",
      value: formatRupees(budget.emergencyFundTarget)
    },
    {
      label: "Recurring spends",
      note: recurring.summary,
      value: formatRupees(recurring.monthlyEstimate)
    }
  ];

  const dataReadiness = [
    { complete: Boolean(financialDNA), label: "Financial DNA" },
    { complete: transactionCount >= 5, label: "Ledger data" },
    { complete: activeGoalCount > 0, label: "Goals" },
    { complete: scamCheckCount > 0, label: "Scam checks" },
    { complete: hasLLMProvider(), label: "Gemini coach" }
  ];

  const aiSummary = hasLLMProvider()
    ? await buildAISummary({
        budget,
        dataReadiness,
        financialDNA,
        nextActions: nextActions.slice(0, 6),
        risks
      })
    : null;

  return {
    aiSummary,
    coachMode: aiSummary ? "ai" : "rules",
    dataReadiness,
    highlights,
    nextActions: nextActions.slice(0, 8),
    risks
  };
}

async function buildAISummary(input: {
  budget: {
    netMonthlyCashflow: number;
    savingsRate: number;
    emergencyFundTarget: number;
  };
  dataReadiness: { complete: boolean; label: string }[];
  financialDNA: FinancialDNASnapshot | null;
  nextActions: ActionPlanItem[];
  risks: string[];
}) {
  const result = await generateLLMText({
    system:
      "You are ArthSaathi's senior financial coach. Create a short, practical weekly action plan for an Indian user. Avoid guarantees, avoid specific fund names, and never ask for OTP, PIN, password, or full account numbers.",
    prompt: JSON.stringify({
      budget: input.budget,
      dataReadiness: input.dataReadiness,
      financialDNA: input.financialDNA,
      nextActions: input.nextActions,
      risks: input.risks
    }),
    temperature: 0.25,
    maxTokens: 320,
    timeoutMs: 4500,
    task: "action_plan"
  });

  return result.ok ? result.text ?? null : null;
}
