import type { Types } from "mongoose";

import {
  FinancialDNAModel,
  FinancialHealthScoreModel,
  GoalModel,
  TransactionModel
} from "@/models";
import {
  calculateFinancialHealthScore,
  type FinancialHealthScoreSnapshot
} from "@/lib/financial-health-score";

type FinancialDNASnapshot = {
  monthlyIncome: number;
};

type TransactionSnapshot = {
  amount: number;
  category?: string;
  type: "income" | "expense" | "transfer";
};

type GoalSnapshot = {
  currentAmount: number;
  targetAmount: number;
};

function getMonthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function getCurrentMonthKey() {
  return new Intl.DateTimeFormat("en-CA", {
    month: "2-digit",
    timeZone: "Asia/Kolkata",
    year: "numeric"
  }).format(new Date());
}

function estimateDebt(transactions: TransactionSnapshot[]) {
  return transactions
    .filter((transaction) => transaction.type === "expense")
    .filter((transaction) =>
      /(emi|loan|debt|credit card|repayment)/i.test(
        transaction.category ?? ""
      )
    )
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

function calculateGoalProgress(goals: GoalSnapshot[]) {
  if (!goals.length) {
    return 0;
  }

  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalCurrent = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);

  return totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;
}

export async function getOrCalculateFinancialHealthScore(
  userId: Types.ObjectId
): Promise<FinancialHealthScoreSnapshot> {
  const monthStart = getMonthStart();
  const [financialDNA, transactions, goals] = await Promise.all([
    FinancialDNAModel.findOne({ userId }).lean<FinancialDNASnapshot | null>(),
    TransactionModel.find({
      userId,
      transactionDate: { $gte: monthStart }
    }).lean<TransactionSnapshot[]>(),
    GoalModel.find({ userId, status: "active" }).lean<GoalSnapshot[]>()
  ]);

  const transactionIncome = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const expenses = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const income = financialDNA?.monthlyIncome || transactionIncome || 1;
  const savings = Math.max(0, income - expenses);
  const debt = estimateDebt(transactions);
  const goalProgress = calculateGoalProgress(goals);
  const input = {
    debt,
    expenses,
    goalProgress,
    income,
    savings
  };
  const score = calculateFinancialHealthScore(input);
  const insights = [
    score.explanation,
    savings > 0
      ? `You are currently saving about ₹${Math.round(savings)} this month.`
      : "Expenses are consuming your current income estimate.",
    goalProgress > 0
      ? `Your active goals are ${goalProgress}% funded.`
      : "Create a goal to improve the goal-progress part of your score."
  ];

  await FinancialHealthScoreModel.findOneAndUpdate(
    {
      calculatedForMonth: getCurrentMonthKey(),
      userId
    },
    {
      userId,
      overallScore: score.score,
      savingsScore: score.parts.savings,
      spendingScore: score.parts.expenses,
      debtScore: score.parts.debt,
      cashflowScore: score.parts.savings,
      scoreBand: score.band,
      insights,
      calculatedForMonth: getCurrentMonthKey(),
      calculatedAt: new Date()
    },
    {
      new: true,
      setDefaultsOnInsert: true,
      upsert: true
    }
  );

  return {
    ...score,
    input
  };
}
