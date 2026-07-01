import { NextResponse } from "next/server";

import { getTransactionsByFilter } from "@/lib/api-transactions";

export async function GET(req: Request) {
  try {
    return await getTransactionsByFilter(req, { type: "expense" });
  } catch (err) {
    console.error("/api/expenses error", err);
    return NextResponse.json(
      { error: "Could not load expenses." },
      { status: 500 }
    );
  }
}
