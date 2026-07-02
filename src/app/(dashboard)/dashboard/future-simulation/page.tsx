import { BarChart3, GitCompareArrows, TrendingUp } from "lucide-react";

import { requireFinancialDNA } from "@/lib/financial-dna-gate";
import { connectToDatabase } from "@/lib/mongoose";
import { FinancialDNAModel, FutureSimulationModel, TransactionModel } from "@/models";

import { SimulationForm } from "./simulation-form";

export const dynamic = "force-dynamic";

type SimulationSnapshot = {
  communityInsightSummary?: string;
  explanation: string;
  projectedEmergencyFundMonths: number;
  projectedMonthlySavings: number;
  projectedSixMonthImpact: number;
  projectedTwelveMonthImpact: number;
  question: string;
  recommendation?: string;
  scenarioA?: {
    emergencyFundMonths?: number;
    label?: string;
    note?: string;
    savingsAfterTwelveMonths?: number;
  };
  scenarioB?: {
    emergencyFundMonths?: number;
    label?: string;
    note?: string;
    savingsAfterTwelveMonths?: number;
  };
  scenarios?: {
    emergencyFundMonths?: number;
    key?: string;
    label?: string;
    note?: string;
    priority?: "best" | "neutral" | "risk";
    savingsAfterTwelveMonths?: number;
  }[];
};

function formatRupees(value: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(value);
}

export default async function FutureSimulationPage() {
  await connectToDatabase();
  const { appUser } = await requireFinancialDNA();

  const financialDNA = await FinancialDNAModel.exists({ userId: appUser._id });
  const transactionCount = await TransactionModel.countDocuments({
    userId: appUser._id
  });
  const latestSimulation = await FutureSimulationModel.findOne({
    userId: appUser._id
  })
    .sort({ createdAt: -1 })
    .lean<SimulationSnapshot | null>();

  const maxBar =
    latestSimulation &&
    (Math.abs(latestSimulation.projectedSixMonthImpact) > 0 ||
      Math.abs(latestSimulation.projectedTwelveMonthImpact) > 0)
      ? Math.max(
          Math.abs(latestSimulation.projectedSixMonthImpact),
          Math.abs(latestSimulation.projectedTwelveMonthImpact)
        )
      : 12000;

  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Future Simulation Engine
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Model financial outcomes using your Financial DNA, transactions, and
          anonymous community insights.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <InputSignal label="Financial DNA" value={financialDNA ? "Connected" : "Required"} />
        <InputSignal label="Transactions" value={`${transactionCount} records`} />
        <InputSignal label="Community Insights" value="Anonymous patterns" />
      </section>

      <SimulationForm />

      {latestSimulation ? (
        <section className="space-y-4 rounded-lg border bg-background p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-emerald-50 p-2 text-emerald-700">
              <TrendingUp className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-semibold">Projected outcome</h2>
              <p className="text-sm text-muted-foreground">
                {latestSimulation.question}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Metric
              label="Monthly savings"
              value={formatRupees(latestSimulation.projectedMonthlySavings)}
            />
            <Metric
              label="6 month impact"
              value={formatRupees(latestSimulation.projectedSixMonthImpact)}
            />
            <Metric
              label="12 month impact"
              value={formatRupees(latestSimulation.projectedTwelveMonthImpact)}
            />
            <Metric
              label="Emergency cover"
              value={`${latestSimulation.projectedEmergencyFundMonths} mo`}
            />
          </div>

          {latestSimulation.scenarios?.length ? (
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="flex items-center gap-2">
                <GitCompareArrows
                  className="size-5 text-emerald-700"
                  aria-hidden="true"
                />
                <h3 className="font-semibold">Generated scenarios</h3>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {latestSimulation.scenarios.map((scenario) => (
                  <ScenarioCard
                    key={scenario.key ?? scenario.label}
                    scenario={scenario}
                  />
                ))}
              </div>

              {latestSimulation.recommendation ? (
                <p className="mt-4 rounded-md bg-slate-950 p-3 text-sm leading-6 text-white">
                  {latestSimulation.recommendation}
                </p>
              ) : null}
            </div>
          ) : latestSimulation.scenarioA && latestSimulation.scenarioB ? (
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="flex items-center gap-2">
                <GitCompareArrows
                  className="size-5 text-emerald-700"
                  aria-hidden="true"
                />
                <h3 className="font-semibold">Future self comparison</h3>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <ScenarioCard scenario={latestSimulation.scenarioA} />
                <ScenarioCard scenario={latestSimulation.scenarioB} />
              </div>

              {latestSimulation.recommendation ? (
                <p className="mt-4 rounded-md bg-slate-950 p-3 text-sm leading-6 text-white">
                  {latestSimulation.recommendation}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-3">
            <ProjectionBar
              label="6 months"
              value={latestSimulation.projectedSixMonthImpact}
              max={maxBar}
            />
            <ProjectionBar
              label="12 months"
              value={latestSimulation.projectedTwelveMonthImpact}
              max={maxBar}
            />
          </div>

          <p className="text-sm leading-6 text-muted-foreground">
            {latestSimulation.explanation}
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            Community context: {latestSimulation.communityInsightSummary}
          </p>
        </section>
      ) : (
        <section className="rounded-lg border bg-background p-5 text-sm text-muted-foreground">
          Run your first simulation to see projected outcomes visually.
        </section>
      )}
    </main>
  );
}

function ScenarioCard({
  scenario
}: {
  scenario: {
    emergencyFundMonths?: number;
    priority?: "best" | "neutral" | "risk";
    label?: string;
    note?: string;
    savingsAfterTwelveMonths?: number;
  };
}) {
  const priorityClass =
    scenario.priority === "best"
      ? "border-emerald-200 bg-emerald-50/40"
      : scenario.priority === "risk"
        ? "border-rose-200 bg-rose-50/40"
        : "bg-background";

  return (
    <div className={`rounded-md border p-4 ${priorityClass}`}>
      <p className="font-semibold">{scenario.label}</p>
      <p className="mt-3 text-2xl font-semibold">
        {formatRupees(scenario.savingsAfterTwelveMonths ?? 0)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        savings after 12 months
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        Emergency cover: {scenario.emergencyFundMonths ?? 0} months
      </p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {scenario.note}
      </p>
    </div>
  );
}

function InputSignal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <BarChart3 className="size-4" aria-hidden="true" />
        <p className="text-sm">{label}</p>
      </div>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function ProjectionBar({
  label,
  max,
  value
}: {
  label: string;
  max: number;
  value: number;
}) {
  const normalizedWidth = `${Math.min(
    100,
    Math.round((Math.abs(value) / max) * 100)
  )}%`;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{formatRupees(value)}</span>
      </div>
      <div className="h-3 rounded-full bg-muted">
        <div
          className={`h-3 rounded-full ${
            value < 0 ? "bg-rose-500" : "bg-emerald-500"
          }`}
          style={{ width: normalizedWidth }}
        />
      </div>
    </div>
  );
}
