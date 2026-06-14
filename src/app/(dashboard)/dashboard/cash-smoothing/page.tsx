import { CloudSun, ShieldCheck } from "lucide-react";

import {
  formatCashSmoothingRupees,
  getCashSmoothingResult
} from "@/lib/cash-smoothing";
import { getOrCreateCurrentAppUser } from "@/lib/current-app-user";
import { connectToDatabase } from "@/lib/mongoose";

export const dynamic = "force-dynamic";

const riskTone = {
  high: "border-rose-200 bg-rose-50 text-rose-800",
  low: "border-emerald-200 bg-emerald-50 text-emerald-800",
  medium: "border-amber-200 bg-amber-50 text-amber-900"
};

export default async function CashSmoothingPage() {
  await connectToDatabase();
  const appUser = await getOrCreateCurrentAppUser();
  const result = appUser
    ? await getCashSmoothingResult(appUser._id)
    : {
        actions: [],
        monthlyShockBuffer: 0,
        riskLevel: "low" as const,
        seasonalSignals: ["Sign in to calculate cash smoothing."],
        summary: "Sign in to calculate cash smoothing."
      };

  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Macro-Climate Cash Smoothing
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Prepare for seasonal income shocks, school fees, festival spending,
          crop cycles, low-demand weeks, and other future cash pressure.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-[1fr_280px]">
        <div className="rounded-lg border bg-slate-950 p-5 text-white">
          <div className="flex items-center gap-3">
            <CloudSun className="size-6 text-emerald-300" aria-hidden="true" />
            <div>
              <p className="text-sm text-slate-300">Shock buffer</p>
              <p className="mt-1 text-3xl font-semibold">
                {formatCashSmoothingRupees(result.monthlyShockBuffer)}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-200">
            {result.summary}
          </p>
        </div>

        <div className={`rounded-lg border p-5 ${riskTone[result.riskLevel]}`}>
          <p className="text-sm font-medium">Risk level</p>
          <p className="mt-2 text-3xl font-semibold capitalize">
            {result.riskLevel}
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Panel title="Signals" items={result.seasonalSignals} />
        <Panel title="Recommended actions" items={result.actions} />
      </section>
    </main>
  );
}

function Panel({ items, title }: { items: string[]; title: string }) {
  return (
    <div className="rounded-lg border bg-background p-5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-5 text-emerald-700" aria-hidden="true" />
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <div key={item} className="rounded-md border bg-muted/30 p-3 text-sm leading-6">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
