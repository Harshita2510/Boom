import { currentUser } from "@clerk/nextjs/server";

import { connectToDatabase } from "@/lib/mongoose";
import { TransactionModel, UserModel } from "@/models";

import { VoiceLedgerForm } from "./voice-ledger-form";

export const dynamic = "force-dynamic";

export default async function VoiceLedgerPage() {
  const clerkUser = await currentUser();
  let transactions: Array<{
    id: string;
    amount: number;
    type: string;
    category: string;
    description?: string;
    transactionDate: string;
  }> = [];

  if (clerkUser) {
    await connectToDatabase();
    const appUser = await UserModel.findOne({ clerkId: clerkUser.id });

    if (appUser) {
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
    }
  }

  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Voice Ledger</h1>
        <p className="text-muted-foreground">
          Say something like “spent 250 on food” or “received 50000 salary”.
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
          <div className="overflow-hidden rounded-lg border">
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
        ) : (
          <div className="rounded-lg border bg-muted/30 p-5 text-sm text-muted-foreground">
            No transactions yet.
          </div>
        )}
      </section>
    </main>
  );
}
