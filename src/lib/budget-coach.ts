import type { Types } from "mongoose";

import { FinancialDNAModel, TransactionModel } from "@/models";

type TransactionSnapshot = {
  amount: number;
  category: string;
  description?: string;
  transactionDate: Date;
  type: "income" | "expense" | "transfer";
};

type FinancialDNASnapshot = {
  incomeStability?: "low" | "medium" | "high";
  monthlyIncome: number;
  occupation?: string;
};

export type BudgetCoachInsight = {
  label: string;
  message: string;
  severity: "good" | "info" | "warning";
  value: string;
};

export type BudgetCoachResult = {
  balanceProjectionDays: number | null;
  emergencyFundTarget: number;
  estimatedMonthlyExpenses: number;
  estimatedMonthlyIncome: number;
  insights: BudgetCoachInsight[];
  moneyLeakCategory: {
    amount: number;
    category: string;
  } | null;
  netMonthlyCashflow: number;
  savingsRate: number;
  subscriptionEstimate: {
    monthly: number;
    yearly: number;
  };
};

const subscriptionWords = [
  "subscription",
  "netflix",
  "prime",
  "hotstar",
  "spotify",
  "youtube",
  "recharge",
  "membership",
  "plan"
];

function formatRupees(value: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(Math.round(value));
}

function getMonthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function getDaysElapsedThisMonth() {
  return Math.max(1, new Date().getDate());
}

function getTopExpenseCategory(transactions: TransactionSnapshot[]) {
  const totals = new Map<string, number>();

  for (const transaction of transactions) {
    if (transaction.type !== "expense") {
      continue;
    }

    totals.set(
      transaction.category,
      (totals.get(transaction.category) ?? 0) + transaction.amount
    );
  }

  const [category, amount] =
    [...totals.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];

  return category ? { amount, category } : null;
}

function getSubscriptionEstimate(transactions: TransactionSnapshot[]) {
  const monthly = transactions
    .filter((transaction) => transaction.type === "expense")
    .filter((transaction) => {
      const text = `${transaction.category} ${transaction.description ?? ""}`.toLowerCase();
      return subscriptionWords.some((word) => text.includes(word));
    })
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return {
    monthly,
    yearly: monthly * 12
  };
}

export async function getBudgetCoachResult(
  userId: Types.ObjectId
): Promise<BudgetCoachResult> {
  const monthStart = getMonthStart();
  const [financialDNA, monthTransactions] = await Promise.all([
    FinancialDNAModel.findOne({ userId }).lean<FinancialDNASnapshot | null>(),
    TransactionModel.find({
      userId,
      transactionDate: { $gte: monthStart }
    })
      .sort({ transactionDate: -1 })
      .lean<TransactionSnapshot[]>()
  ]);

  const incomeFromTransactions = monthTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const expensesSoFar = monthTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const estimatedMonthlyIncome =
    financialDNA?.monthlyIncome || incomeFromTransactions || 0;
  const dailySpendRate = expensesSoFar / getDaysElapsedThisMonth();
  const estimatedMonthlyExpenses = Math.round(dailySpendRate * 30);
  const netMonthlyCashflow = estimatedMonthlyIncome - estimatedMonthlyExpenses;
  const savingsRate =
    estimatedMonthlyIncome > 0
      ? Math.round((netMonthlyCashflow / estimatedMonthlyIncome) * 100)
      : 0;
  const emergencyFundTarget = estimatedMonthlyExpenses * 6;
  const moneyLeakCategory = getTopExpenseCategory(monthTransactions);
  const subscriptionEstimate = getSubscriptionEstimate(monthTransactions);
  const balanceProjectionDays =
    dailySpendRate > 0 && netMonthlyCashflow < 0
      ? Math.max(1, Math.floor(5000 / dailySpendRate))
      : null;

  const insights: BudgetCoachInsight[] = [];

  if (balanceProjectionDays) {
    insights.push({
      label: "Low balance forecast",
      message: `Based on this month's spend rate, your buffer may fall by ${formatRupees(5000)} in about ${balanceProjectionDays} days.`,
      severity: "warning",
      value: `${balanceProjectionDays} days`
    });
  } else {
    insights.push({
      label: "Cashflow forecast",
      message:
        netMonthlyCashflow >= 0
          ? "Your current month is tracking positive. Keep assigning a job to every rupee before spending."
          : "Your expenses are running ahead of income. Review the top leak before making new purchases.",
      severity: netMonthlyCashflow >= 0 ? "good" : "warning",
      value: formatRupees(netMonthlyCashflow)
    });
  }

  if (moneyLeakCategory) {
    insights.push({
      label: "Money leak",
      message: `${moneyLeakCategory.category} is your biggest expense category this month.`,
      severity: "info",
      value: formatRupees(moneyLeakCategory.amount)
    });
  }

  if (subscriptionEstimate.monthly > 0) {
    insights.push({
      label: "Recurring expenses",
      message: `You spend around ${formatRupees(subscriptionEstimate.monthly)} per month on subscriptions or recurring plans.`,
      severity: "info",
      value: formatRupees(subscriptionEstimate.yearly)
    });
  }

  insights.push({
    label: "Emergency fund",
    message: `A six-month emergency fund target for your current expense level is ${formatRupees(emergencyFundTarget)}.`,
    severity: emergencyFundTarget > 0 ? "info" : "warning",
    value: formatRupees(emergencyFundTarget)
  });

  if (financialDNA?.incomeStability && financialDNA.incomeStability !== "high") {
    insights.push({
      label: "Seasonal income guardrail",
      message:
        "Your income may fluctuate. Keep a separate shock buffer before locking money into long-term goals.",
      severity: "warning",
      value: financialDNA.incomeStability
    });
  }

  return {
    balanceProjectionDays,
    emergencyFundTarget,
    estimatedMonthlyExpenses,
    estimatedMonthlyIncome,
    insights,
    moneyLeakCategory,
    netMonthlyCashflow,
    savingsRate,
    subscriptionEstimate
  };
}

export { formatRupees as formatBudgetRupees };
