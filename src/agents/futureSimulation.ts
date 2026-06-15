import { FinancialDNAModel, TransactionModel } from "@/models";

import { Intent } from "./intents";
import { AgentContext, AgentResponse, SimulationResult } from "./types";

type FinancialDNASnapshot = {
  monthlyIncome: number;
};

type TransactionSnapshot = {
  amount: number;
  type: "income" | "expense" | "transfer";
};

function extractAmount(message: string) {
  const normalized = message.replaceAll(",", "");
  const saveMatch = normalized.match(
    /(?:save|saving|invest|increase|add|put|spend|buy|purchase|get)?\s*(?:₹|rs\.?|inr)?\s*(\d{2,8})/i
  );

  return saveMatch?.[1] ? Number(saveMatch[1]) : 1000;
}

function extractMonths(message: string) {
  const monthsMatch = message.match(/(\d+)\s*months?|in\s*(\d+)\s*months?/i);
  return monthsMatch ? Number(monthsMatch[1] || monthsMatch[2]) : 12;
}

function formatRupees(value: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(Math.round(value));
}

export async function handleFutureSimulation(
  message: string,
  context: AgentContext = {}
): Promise<AgentResponse<SimulationResult>> {
  if (!context.appUserId) {
    return {
      agent: "future_simulation",
      intent: Intent.FUTURE_SIMULATION,
      text:
        "I can run simulations after sign-in. Complete Financial DNA and add a few transactions first."
    };
  }

  const [financialDNA, transactions] = await Promise.all([
    FinancialDNAModel.findOne({
      userId: context.appUserId
    }).lean<FinancialDNASnapshot | null>(),
    TransactionModel.find({ userId: context.appUserId })
      .sort({ transactionDate: -1 })
      .limit(90)
      .lean<TransactionSnapshot[]>()
  ]);

  if (!financialDNA) {
    return {
      agent: "future_simulation",
      intent: Intent.FUTURE_SIMULATION,
      text: "Complete Financial DNA before running a simulation."
    };
  }

  const monthlyIncome = financialDNA.monthlyIncome || 0;
  const expenses = transactions.filter(
    (transaction) => transaction.type === "expense"
  );
  const monthlyExpenseEstimate =
    expenses.reduce((sum, transaction) => sum + transaction.amount, 0) / 3;
  const currentBalance = Math.max(
    0,
    Math.round(monthlyIncome - monthlyExpenseEstimate)
  );
  const additional = extractAmount(message);
  const months = extractMonths(message);

  const projected = currentBalance + additional * months;

  const result: SimulationResult = {
    months,
    currentBalance,
    projectedBalance: projected,
    recommendation:
      additional >= 1000
        ? "This can improve your future buffer if essential expenses stay covered."
        : "Try increasing the monthly amount or reducing one recurring expense first."
  };

  return {
    agent: "future_simulation",
    intent: Intent.FUTURE_SIMULATION,
    text: `Simulation for ${months} months: your current estimated monthly surplus is ${formatRupees(
      currentBalance
    )}. If you add ${formatRupees(additional)} per month, projected impact becomes ${formatRupees(
      projected
    )}. ${result.recommendation}${
      expenses.length
        ? ""
        : " Add expense entries to make this projection more accurate."
    }`,
    data: result
  };
}
