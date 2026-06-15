import {
  CalendarClock,
  IndianRupee,
  Repeat2,
  Scissors,
  type LucideIcon
} from "lucide-react";

import { requireFinancialDNA } from "@/lib/financial-dna-gate";
import { connectToDatabase } from "@/lib/mongoose";
import {
  formatRecurringRupees,
  getRecurringExpenseResult
} from "@/lib/recurring-expenses";

export const dynamic = "force-dynamic";

const confidenceTone = {
  high: "border-emerald-200 bg-emerald-50 text-emerald-800",
  low: "border-slate-200 bg-slate-50 text-slate-700",
  medium: "border-blue-200 bg-blue-50 text-blue-800"
};

export default async function RecurringExpensesPage() {
  await connectToDatabase();
  const { appUser } = await requireFinancialDNA();
  const result = await getRecurringExpenseResult(appUser._id);

  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Recurring Expense Tracker
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Find subscriptions, EMIs, recharges, memberships, and other repeated
          payments that quietly reduce monthly savings.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Metric
          icon={Repeat2}
          label="Monthly recurring"
          value={formatRecurringRupees(result.monthlyEstimate)}
        />
        <Metric
          icon={CalendarClock}
          label="Annual recurring"
          value={formatRecurringRupees(result.annualEstimate)}
        />
        <Metric
          icon={Scissors}
          label="Possible yearly savings"
          value={formatRecurringRupees(result.possibleYearlySavings)}
        />
      </section>

      <section className="rounded-lg border bg-background p-5">
        <div className="flex items-center gap-2">
          <IndianRupee className="size-5 text-emerald-700" aria-hidden="true" />
          <h2 className="font-semibold">{result.summary}</h2>
        </div>

        <div className="mt-5 space-y-3">
          {result.items.length ? (
            result.items.map((item) => (
              <div key={`${item.label}-${item.category}`} className="rounded-md border p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold capitalize">{item.label}</p>
                      <span
                        className={`rounded-md border px-2 py-1 text-xs font-semibold ${confidenceTone[item.confidence]}`}
                      >
                        {item.confidence} confidence
                      </span>
                    </div>
                    <p className="mt-2 text-sm capitalize text-muted-foreground">
                      {item.category} • seen {item.count} time{item.count > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-lg font-semibold">
                      {formatRecurringRupees(item.monthlyEstimate)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRecurringRupees(item.annualCost)} per year
                    </p>
                  </div>
                </div>

                <p className="mt-3 rounded-md bg-muted/40 p-3 text-sm leading-6 text-muted-foreground">
                  {item.reviewAction}
                </p>
              </div>
            ))
          ) : (
            <p className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
              Add more transactions through Voice Ledger or Voice Mode. Recurring
              detection improves after repeated monthly payments appear.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

function Metric({
  icon: Icon,
  label,
  value
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
        <p className="text-sm">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
