import Link from "next/link";
import {
  AlertTriangle,
  BadgeIndianRupee,
  PiggyBank,
  TrendingDown,
  WalletCards,
  type LucideIcon
} from "lucide-react";

import {
  formatBudgetRupees,
  getBudgetCoachResult
} from "@/lib/budget-coach";
import { getOrCreateCurrentAppUser } from "@/lib/current-app-user";
import { connectToDatabase } from "@/lib/mongoose";

export const dynamic = "force-dynamic";

const severityTone = {
  good: "border-emerald-200 bg-emerald-50 text-emerald-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900"
};

export default async function BudgetCoachPage() {
  await connectToDatabase();
  const appUser = await getOrCreateCurrentAppUser();
  const result = appUser ? await getBudgetCoachResult(appUser._id) : null;

  if (!appUser || !result) {
    return (
      <main className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            AI Spending Coach
          </h1>
          <p className="text-muted-foreground">
            Sign in and add a few transactions to unlock spending insights.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          AI Spending Coach
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          ArthSaathi assigns a purpose to every rupee before it is spent,
          forecasts cashflow, and highlights money leaks from your ledger.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard
          icon={BadgeIndianRupee}
          label="Monthly income"
          value={formatBudgetRupees(result.estimatedMonthlyIncome)}
        />
        <MetricCard
          icon={WalletCards}
          label="Projected spend"
          value={formatBudgetRupees(result.estimatedMonthlyExpenses)}
        />
        <MetricCard
          icon={PiggyBank}
          label="Savings rate"
          value={`${result.savingsRate}%`}
        />
        <MetricCard
          icon={TrendingDown}
          label="Net cashflow"
          value={formatBudgetRupees(result.netMonthlyCashflow)}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-lg border bg-background p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-amber-50 p-2 text-amber-700">
              <AlertTriangle className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-semibold">Coach insights</h2>
              <p className="text-sm text-muted-foreground">
                Based on this month&apos;s recorded transactions.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {result.insights.map((insight) => (
              <div
                key={insight.label}
                className={`rounded-md border p-4 ${severityTone[insight.severity]}`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold">{insight.label}</p>
                    <p className="mt-1 text-sm leading-6">{insight.message}</p>
                  </div>
                  <p className="shrink-0 text-lg font-semibold">
                    {insight.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border bg-slate-950 p-5 text-white">
            <p className="text-sm font-medium text-emerald-300">
              Emergency target
            </p>
            <p className="mt-3 text-3xl font-semibold">
              {formatBudgetRupees(result.emergencyFundTarget)}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-200">
              Six months of projected expenses, useful before risky purchases
              or long-term investments.
            </p>
          </div>

          <div className="rounded-lg border bg-background p-5">
            <p className="font-semibold">Need more data?</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Add transactions through Voice Ledger. The coach gets sharper as
              your ledger grows.
            </p>
            <Link
              href="/dashboard/voice-ledger"
              className="mt-4 inline-flex h-10 items-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white"
            >
              Add transaction
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function MetricCard({
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
