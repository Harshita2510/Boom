"use server";

import { revalidatePath } from "next/cache";

import { getOrCreateCurrentAppUser } from "@/lib/current-app-user";
import { connectToDatabase } from "@/lib/mongoose";
import {
  CommunityPatternModel,
  FinancialDNAModel,
  FutureSimulationModel,
  TransactionModel
} from "@/models";

export type SimulationState = {
  ok: boolean;
  message: string;
};

type FinancialDNASnapshot = {
  monthlyIncome: number;
};

type TransactionSnapshot = {
  amount: number;
  type: "income" | "expense" | "transfer";
};

type CommunityPatternSnapshot = {
  insight?: string;
};

function extractSavingsDelta(question: string) {
  const amountMatch = question.replaceAll(",", "").match(/(?:₹|rs\.?|inr)?\s*(\d{2,7})/i);
  return amountMatch ? Number(amountMatch[1]) : 1000;
}

function formatRupees(value: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(value);
}

export async function runFutureSimulation(
  _previousState: SimulationState,
  formData: FormData
): Promise<SimulationState> {
  const question = String(formData.get("question") ?? "").trim();

  if (question.length < 8) {
    return {
      ok: false,
      message: "Ask a what-if question with a monthly amount."
    };
  }

  await connectToDatabase();
  const appUser = await getOrCreateCurrentAppUser();

  if (!appUser) {
    return {
      ok: false,
      message: "Please sign in with an email account first."
    };
  }

  const [financialDNA, transactions, communityPatterns] = await Promise.all([
    FinancialDNAModel.findOne({ userId: appUser._id }).lean<FinancialDNASnapshot | null>(),
    TransactionModel.find({ userId: appUser._id })
      .sort({ transactionDate: -1 })
      .limit(90)
      .lean<TransactionSnapshot[]>(),
    CommunityPatternModel.find({
      patternType: { $in: ["positive", "negative", "recommended_action"] }
    })
      .sort({ updatedAt: -1 })
      .limit(6)
      .lean<CommunityPatternSnapshot[]>()
  ]);

  const monthlyIncome = financialDNA?.monthlyIncome ?? 50000;
  const monthlyExpenseEstimate =
    transactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((sum, transaction) => sum + transaction.amount, 0) / 3 || monthlyIncome * 0.65;

  const baselineMonthlySavings = Math.max(
    0,
    Math.round(monthlyIncome - monthlyExpenseEstimate)
  );
  const monthlySavingsDelta = extractSavingsDelta(question);
  const projectedMonthlySavings = baselineMonthlySavings + monthlySavingsDelta;
  const projectedSixMonthImpact = monthlySavingsDelta * 6;
  const projectedTwelveMonthImpact = monthlySavingsDelta * 12;
  const projectedEmergencyFundMonths =
    monthlyExpenseEstimate > 0
      ? Number(((projectedMonthlySavings * 6) / monthlyExpenseEstimate).toFixed(1))
      : 0;

  const communityInsightSummary =
    communityPatterns
      .map((pattern) => pattern.insight)
      .filter(Boolean)
      .slice(0, 2)
      .join(" ") ||
    "Community insights suggest that small automatic savings habits improve consistency.";

  const explanation = `Saving ${formatRupees(monthlySavingsDelta)} more each month can add ${formatRupees(projectedTwelveMonthImpact)} in 12 months. Your projected monthly savings becomes ${formatRupees(projectedMonthlySavings)}, before investment returns or inflation.`;

  await FutureSimulationModel.create({
    userId: appUser._id,
    question,
    monthlySavingsDelta,
    baselineMonthlySavings,
    projectedMonthlySavings,
    projectedSixMonthImpact,
    projectedTwelveMonthImpact,
    projectedEmergencyFundMonths,
    communityInsightSummary,
    explanation
  });

  revalidatePath("/dashboard/future-simulation");

  return {
    ok: true,
    message: explanation
  };
}
