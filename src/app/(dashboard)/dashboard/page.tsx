import { Activity } from "lucide-react";

import { requireFinancialDNA } from "@/lib/financial-dna-gate";
import { getOrCalculateFinancialHealthScore } from "@/lib/financial-health-score-service";
import { connectToDatabase } from "@/lib/mongoose";

import { OrchestratorTask } from "./orchestrator-task";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await connectToDatabase();
  const { appUser } = await requireFinancialDNA();
  const healthScore = await getOrCalculateFinancialHealthScore(appUser._id);

  return (
    <main className="space-y-6">
      <section className="rounded-lg border bg-background p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="size-5 text-emerald-700" aria-hidden="true" />
              <h2 className="text-xl font-semibold tracking-tight">
                Financial Health Score
              </h2>
            </div>
          </div>
          <div className="rounded-lg bg-emerald-50 px-4 py-3 text-emerald-800">
            <p className="text-3xl font-semibold">{healthScore.score}</p>
            <p className="text-xs font-medium uppercase">
              {healthScore.band}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          {Object.entries(healthScore.parts).map(([label, value]) => (
            <div key={label} className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs capitalize text-muted-foreground">
                {label}
              </p>
              <p className="mt-1 text-lg font-semibold">{value}/100</p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {healthScore.explanation}
        </p>
      </section>

      <OrchestratorTask />
    </main>
  );
}
