import type { Types } from "mongoose";

import { GoalModel } from "@/models";
import { getBudgetCoachResult } from "@/lib/budget-coach";

export type GoalRoadmap = {
  gapAmount: number;
  monthsRemaining: number | null;
  monthlyRequired: number;
  progressPercent: number;
  status: "on_track" | "needs_attention" | "at_risk";
  steps: string[];
};

type GoalSnapshot = {
  _id: Types.ObjectId;
  currentAmount: number;
  priority: "low" | "medium" | "high";
  targetAmount: number;
  targetDate?: Date;
  title: string;
};

export function formatGoalRupees(value: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(Math.round(value));
}

function getMonthsRemaining(targetDate?: Date) {
  if (!targetDate) {
    return null;
  }

  const now = new Date();
  const months =
    (targetDate.getFullYear() - now.getFullYear()) * 12 +
    targetDate.getMonth() -
    now.getMonth();

  return Math.max(1, months);
}

export async function buildGoalRoadmap(
  userId: Types.ObjectId,
  goal: GoalSnapshot
): Promise<GoalRoadmap> {
  const budget = await getBudgetCoachResult(userId);
  const gapAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
  const monthsRemaining = getMonthsRemaining(goal.targetDate);
  const monthlyRequired = monthsRemaining
    ? Math.ceil(gapAmount / monthsRemaining)
    : Math.ceil(gapAmount / 12);
  const progressPercent =
    goal.targetAmount > 0
      ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
      : 0;
  const spareCash = Math.max(0, budget.netMonthlyCashflow);

  let status: GoalRoadmap["status"] = "on_track";

  if (monthlyRequired > spareCash && goal.priority === "high") {
    status = "at_risk";
  } else if (monthlyRequired > spareCash) {
    status = "needs_attention";
  }

  const steps = [
    `Set aside ${formatGoalRupees(monthlyRequired)} per month for this goal.`,
    `Keep at least ${formatGoalRupees(budget.emergencyFundTarget)} as emergency protection before risky commitments.`,
    budget.moneyLeakCategory
      ? `Review ${budget.moneyLeakCategory.category}; it is your top spending leak this month.`
      : "Record more transactions so ArthSaathi can find spending leaks.",
    budget.subscriptionEstimate.monthly > 0
      ? `Check recurring spends worth ${formatGoalRupees(budget.subscriptionEstimate.monthly)} per month.`
      : "Avoid adding new recurring expenses until this goal is funded."
  ];

  return {
    gapAmount,
    monthsRemaining,
    monthlyRequired,
    progressPercent,
    status,
    steps
  };
}

export async function getGoalRoadmaps(userId: Types.ObjectId) {
  const goals = await GoalModel.find({ userId, status: "active" })
    .sort({ priority: -1, targetDate: 1, createdAt: -1 })
    .lean<GoalSnapshot[]>();

  return Promise.all(
    goals.map(async (goal) => ({
      goal,
      roadmap: await buildGoalRoadmap(userId, goal)
    }))
  );
}
