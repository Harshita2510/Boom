import { AlertTriangle, Banknote, TrendingUp } from "lucide-react";

import { requireFinancialDNA } from "@/lib/financial-dna-gate";
import { getInvestmentGuidance } from "@/lib/investment-guidance";
import { connectToDatabase } from "@/lib/mongoose";

export const dynamic = "force-dynamic";

const priorityTone = {
  high: "border-emerald-200 bg-emerald-50 text-emerald-800",
  low: "border-slate-200 bg-slate-50 text-slate-700",
  medium: "border-blue-200 bg-blue-50 text-blue-800"
};

const riskTone = {
  high: "bg-rose-50 text-rose-800",
  low: "bg-emerald-50 text-emerald-800",
  medium: "bg-amber-50 text-amber-900"
};

export default async function InvestmentsPage() {
  await connectToDatabase();
  const { appUser } = await requireFinancialDNA();
  const suggestions = await getInvestmentGuidance(appUser._id);

  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Investment Agent
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Category-level guidance based on your cashflow, goals, emergency
          fund, and risk appetite.
        </p>
      </div>

      <section className="rounded-lg border bg-amber-50 p-4 text-amber-900">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5" aria-hidden="true" />
          <p className="text-sm leading-6">
            This is educational guidance, not a specific fund or stock
            recommendation. Market-linked investments can lose value.
          </p>
        </div>
      </section>

      <section className="grid gap-4">
        {suggestions.length ? (
          suggestions.map((suggestion) => (
            <div key={suggestion.title} className="rounded-lg border bg-background p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-slate-950 p-2 text-white">
                    <TrendingUp className="size-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="font-semibold">{suggestion.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {suggestion.fitReason}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-md border px-2 py-1 text-xs font-semibold ${priorityTone[suggestion.priority]}`}
                  >
                    {suggestion.priority} priority
                  </span>
                  <span
                    className={`rounded-md px-2 py-1 text-xs font-semibold ${riskTone[suggestion.risk]}`}
                  >
                    {suggestion.risk} risk
                  </span>
                </div>
              </div>

              <div className="mt-5 rounded-md border bg-muted/30 p-4">
                <div className="flex items-center gap-2">
                  <Banknote className="size-4 text-emerald-700" aria-hidden="true" />
                  <p className="font-semibold">Suggested action</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {suggestion.action}
                </p>
                {suggestion.warning ? (
                  <p className="mt-3 text-sm leading-6 text-amber-800">
                    {suggestion.warning}
                  </p>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border bg-muted/30 p-5 text-sm text-muted-foreground">
            Add Financial DNA, transactions, and goals to unlock investment
            guidance.
          </div>
        )}
      </section>
    </main>
  );
}
