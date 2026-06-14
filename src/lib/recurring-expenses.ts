import type { Types } from "mongoose";

import { TransactionModel } from "@/models";

type TransactionSnapshot = {
  amount: number;
  category: string;
  description?: string;
  merchant?: string;
  transactionDate: Date;
  type: "income" | "expense" | "transfer";
};

export type RecurringExpenseItem = {
  annualCost: number;
  averageAmount: number;
  category: string;
  confidence: "low" | "medium" | "high";
  count: number;
  label: string;
  lastSeen: Date;
  monthlyEstimate: number;
  reviewAction: string;
};

export type RecurringExpenseResult = {
  annualEstimate: number;
  items: RecurringExpenseItem[];
  monthlyEstimate: number;
  possibleYearlySavings: number;
  summary: string;
};

const recurringWords = [
  "subscription",
  "membership",
  "netflix",
  "prime",
  "hotstar",
  "spotify",
  "youtube",
  "recharge",
  "plan",
  "emi",
  "rent",
  "insurance",
  "premium",
  "wifi",
  "broadband",
  "electricity",
  "mobile",
  "loan"
];

function getLookbackDate(days = 120) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function normalizeKey(transaction: TransactionSnapshot) {
  const text = `${transaction.merchant ?? ""} ${transaction.category} ${
    transaction.description ?? ""
  }`
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const keyword = recurringWords.find((word) => text.includes(word));

  if (keyword) {
    return keyword;
  }

  return transaction.merchant?.toLowerCase() || transaction.category.toLowerCase();
}

function getLabel(key: string, transactions: TransactionSnapshot[]) {
  const merchant = transactions.find((transaction) => transaction.merchant)?.merchant;

  if (merchant) {
    return merchant;
  }

  const category = transactions[0]?.category ?? key;
  return key === category.toLowerCase() ? category : key;
}

function getReviewAction(item: {
  category: string;
  label: string;
  monthlyEstimate: number;
}) {
  if (/emi|loan|rent|insurance|premium/i.test(`${item.label} ${item.category}`)) {
    return "Review due date and make sure this recurring payment is planned before discretionary spends.";
  }

  if (item.monthlyEstimate >= 500) {
    return "Check whether this service is still used. Cancelling or downgrading could free goal money.";
  }

  return "Keep only if it is actively used; small autopays add up over a year.";
}

export async function getRecurringExpenseResult(
  userId: Types.ObjectId
): Promise<RecurringExpenseResult> {
  const transactions = await TransactionModel.find({
    userId,
    type: "expense",
    transactionDate: { $gte: getLookbackDate() }
  })
    .sort({ transactionDate: -1 })
    .lean<TransactionSnapshot[]>();
  const grouped = new Map<string, TransactionSnapshot[]>();

  for (const transaction of transactions) {
    const key = normalizeKey(transaction);
    const text = `${key} ${transaction.category} ${transaction.description ?? ""}`.toLowerCase();
    const looksRecurring =
      recurringWords.some((word) => text.includes(word)) ||
      transactions.filter(
        (candidate) =>
          normalizeKey(candidate) === key &&
          Math.abs(candidate.amount - transaction.amount) <=
            Math.max(25, transaction.amount * 0.15)
      ).length >= 2;

    if (!looksRecurring) {
      continue;
    }

    grouped.set(key, [...(grouped.get(key) ?? []), transaction]);
  }

  const items = [...grouped.entries()]
    .map(([key, rows]) => {
      const total = rows.reduce((sum, row) => sum + row.amount, 0);
      const averageAmount = Math.round(total / rows.length);
      const monthlyEstimate =
        rows.length >= 2 ? averageAmount : Math.round(averageAmount / 4);
      const annualCost = monthlyEstimate * 12;
      const label = getLabel(key, rows);
      const confidence: RecurringExpenseItem["confidence"] =
        rows.length >= 3 ? "high" : rows.length >= 2 ? "medium" : "low";

      return {
        annualCost,
        averageAmount,
        category: rows[0]?.category ?? "general",
        confidence,
        count: rows.length,
        label,
        lastSeen: rows[0]?.transactionDate ?? new Date(),
        monthlyEstimate,
        reviewAction: getReviewAction({
          category: rows[0]?.category ?? "general",
          label,
          monthlyEstimate
        })
      };
    })
    .sort((a, b) => b.monthlyEstimate - a.monthlyEstimate)
    .slice(0, 12);

  const monthlyEstimate = items.reduce(
    (sum, item) => sum + item.monthlyEstimate,
    0
  );
  const annualEstimate = monthlyEstimate * 12;
  const possibleYearlySavings = items
    .filter((item) => !/emi|loan|rent|insurance/i.test(`${item.label} ${item.category}`))
    .reduce((sum, item) => sum + Math.round(item.annualCost * 0.5), 0);

  return {
    annualEstimate,
    items,
    monthlyEstimate,
    possibleYearlySavings,
    summary: items.length
      ? `Detected ${items.length} likely recurring expense${items.length > 1 ? "s" : ""}.`
      : "No recurring expenses detected yet. Add more ledger entries to improve detection."
  };
}

export function formatRecurringRupees(value: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(Math.round(value));
}
