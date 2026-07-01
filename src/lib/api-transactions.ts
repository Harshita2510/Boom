import { NextResponse } from "next/server";

import { getOrCreateCurrentAppUser } from "@/lib/current-app-user";
import { connectToDatabase } from "@/lib/mongoose";
import { TransactionModel } from "@/models";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export function getLimit(req: Request) {
  const url = new URL(req.url);
  const rawLimit = Number(url.searchParams.get("limit") ?? DEFAULT_LIMIT);

  if (!Number.isFinite(rawLimit) || rawLimit <= 0) {
    return DEFAULT_LIMIT;
  }

  return Math.min(Math.floor(rawLimit), MAX_LIMIT);
}

function serializeTransaction(transaction: Record<string, any>) {
  return {
    id: String(transaction._id),
    type: transaction.type,
    amount: transaction.amount,
    currency: transaction.currency,
    category: transaction.category,
    merchant: transaction.merchant ?? null,
    description: transaction.description ?? null,
    transactionDate: transaction.transactionDate,
    paymentMethod: transaction.paymentMethod,
    source: transaction.source,
    isRecurring: transaction.isRecurring,
    tags: transaction.tags ?? [],
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt
  };
}

export async function getTransactionsByFilter(
  req: Request,
  filter: Record<string, any>
) {
  await connectToDatabase();

  const appUser = await getOrCreateCurrentAppUser();

  if (!appUser) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  const transactions = await TransactionModel.find({
    userId: appUser._id,
    ...filter
  })
    .sort({ transactionDate: -1, createdAt: -1 })
    .limit(getLimit(req))
    .lean();

  return NextResponse.json({
    transactions: transactions.map(serializeTransaction)
  });
}
