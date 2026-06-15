import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

import { requireFinancialDNA } from "@/lib/financial-dna-gate";
import { connectToDatabase } from "@/lib/mongoose";
import { TransactionModel } from "@/models";

import { VoiceLedgerForm } from "./voice-ledger-form";

export const dynamic = "force-dynamic";

export default async function VoiceLedgerPage() {
  await connectToDatabase();
  const { appUser } = await requireFinancialDNA();
  let transactions: Array<{
    id: string;
    amount: number;
    type: string;
    category: string;
    description?: string;
    transactionDate: string;
  }> = [];

  const rows = await TransactionModel.find({ userId: appUser._id })
    .sort({ transactionDate: -1 })
    .limit(10)
    .lean();

  transactions = rows.map((transaction) => ({
    id: String(transaction._id),
    amount: transaction.amount,
    type: transaction.type,
    category: transaction.category,
    description: transaction.description,
    transactionDate: new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(transaction.transactionDate)
  }));

  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Voice Ledger</h1>
        <p className="text-muted-foreground">
          The app shows and corrects transactions. Hands-free capture can later
          come from Siri, Google Assistant shortcuts, or WhatsApp.
        </p>
      </div>

      <section className="rounded-lg border bg-background p-5">
        <VoiceLedgerForm />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">
          Transaction history
        </h2>
        {transactions.length ? (
          <>
          <div className="grid gap-3 md:hidden">
            {transactions.map((transaction) => {
              const isIncome = transaction.type === "income";
              const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;

              return (
                <div key={transaction.id} className="rounded-lg border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`rounded-md p-2 ${isIncome ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                        <Icon className="size-4" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="font-semibold capitalize">
                          {transaction.category}
                        </p>
                        <p className="mt-1 text-sm leading-5 text-muted-foreground">
                          {transaction.description}
                        </p>
                      </div>
                    </div>
                    <p className={`whitespace-nowrap font-semibold ${isIncome ? "text-emerald-700" : "text-slate-950"}`}>
                      {isIncome ? "+" : "-"}₹{transaction.amount}
                    </p>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {transaction.transactionDate}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="hidden overflow-hidden rounded-lg border md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left">
                <tr>
                  <th className="p-3 font-medium">Type</th>
                  <th className="p-3 font-medium">Amount</th>
                  <th className="p-3 font-medium">Category</th>
                  <th className="p-3 font-medium">Text</th>
                  <th className="p-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-t">
                    <td className="p-3 capitalize">{transaction.type}</td>
                    <td className="p-3">₹{transaction.amount}</td>
                    <td className="p-3 capitalize">{transaction.category}</td>
                    <td className="p-3 text-muted-foreground">
                      {transaction.description}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {transaction.transactionDate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        ) : (
          <div className="rounded-lg border bg-muted/30 p-5 text-sm text-muted-foreground">
            No transactions yet.
          </div>
        )}
      </section>
    </main>
  );
}
