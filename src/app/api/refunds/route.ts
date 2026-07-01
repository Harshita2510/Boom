import { NextResponse } from "next/server";

import { getTransactionsByFilter } from "@/lib/api-transactions";

const refundMatcher = /refund|reversal|chargeback|cashback|returned/i;

export async function GET(req: Request) {
  try {
    return await getTransactionsByFilter(req, {
      $or: [
        { category: refundMatcher },
        { merchant: refundMatcher },
        { description: refundMatcher },
        { tags: refundMatcher }
      ]
    });
  } catch (err) {
    console.error("/api/refunds error", err);
    return NextResponse.json(
      { error: "Could not load refunds." },
      { status: 500 }
    );
  }
}
