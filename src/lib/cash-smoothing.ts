import type { Types } from "mongoose";

import { FinancialDNAModel, GoalModel, TransactionModel } from "@/models";

type FinancialDNASnapshot = {
  incomeStability?: "low" | "medium" | "high";
  incomeType?: string;
  monthlyIncome: number;
  occupation?: string;
};

type TransactionSnapshot = {
  amount: number;
  category?: string;
  transactionDate: Date;
  type: "income" | "expense" | "transfer";
};

type GoalSnapshot = {
  targetAmount: number;
};

export type CashSmoothingResult = {
  actions: string[];
  monthlyShockBuffer: number;
  riskLevel: "low" | "medium" | "high";
  seasonalSignals: string[];
  summary: string;
};

function formatRupees(value: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(Math.round(value));
}

function getLookbackDate(days = 180) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export async function getCashSmoothingResult(
  userId: Types.ObjectId
): Promise<CashSmoothingResult> {
  const [financialDNA, transactions, goals] = await Promise.all([
    FinancialDNAModel.findOne({ userId }).lean<FinancialDNASnapshot | null>(),
    TransactionModel.find({
      userId,
      transactionDate: { $gte: getLookbackDate() }
    }).lean<TransactionSnapshot[]>(),
    GoalModel.find({ userId, status: "active" }).lean<GoalSnapshot[]>()
  ]);
  const income = financialDNA?.monthlyIncome || 0;
  const monthlyExpenses =
    transactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((sum, transaction) => sum + transaction.amount, 0) / 6 || income * 0.65;
  const recentIncome =
    transactions
      .filter((transaction) => transaction.type === "income")
      .reduce((sum, transaction) => sum + transaction.amount, 0) / 6 || income;
  const incomeVolatile =
    financialDNA?.incomeStability !== "high" ||
    /(business|freelance|farmer|gig|other)/i.test(
      `${financialDNA?.incomeType ?? ""} ${financialDNA?.occupation ?? ""}`
    );
  const goalLoad = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const seasonalSignals: string[] = [];

  if (incomeVolatile) {
    seasonalSignals.push("Income may vary across months or seasons.");
  }

  if (monthlyExpenses > recentIncome * 0.75) {
    seasonalSignals.push("Essential expenses are high compared with recent income.");
  }

  if (goalLoad > recentIncome * 6) {
    seasonalSignals.push("Active goals are large compared with current income.");
  }

  const riskLevel =
    seasonalSignals.length >= 3 ? "high" : seasonalSignals.length >= 1 ? "medium" : "low";
  const monthlyShockBuffer =
    riskLevel === "high"
      ? monthlyExpenses * 0.25
      : riskLevel === "medium"
        ? monthlyExpenses * 0.15
        : monthlyExpenses * 0.08;
  const actions = [
    `Move ${formatRupees(monthlyShockBuffer)} per month into a shock buffer before flexible spending.`,
    "Keep annual or seasonal expenses in a separate bucket.",
    "Delay non-essential purchases during low-income weeks.",
    "Use Future Simulation before taking new EMI or large purchases."
  ];

  return {
    actions,
    monthlyShockBuffer,
    riskLevel,
    seasonalSignals:
      seasonalSignals.length > 0
        ? seasonalSignals
        : ["No strong seasonal shock signal detected yet."],
    summary: `Recommended monthly shock buffer: ${formatRupees(monthlyShockBuffer)}.`
  };
}

export { formatRupees as formatCashSmoothingRupees };
