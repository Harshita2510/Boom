import { CalendarDays, Flag, PiggyBank, Route } from "lucide-react";

import {
  formatGoalRupees,
  getGoalRoadmaps,
  type GoalRoadmap
} from "@/lib/goal-roadmap";
import { requireFinancialDNA } from "@/lib/financial-dna-gate";
import { connectToDatabase } from "@/lib/mongoose";

import { GoalForm } from "./goal-form";

export const dynamic = "force-dynamic";

const statusTone = {
  at_risk: "border-rose-200 bg-rose-50 text-rose-800",
  needs_attention: "border-amber-200 bg-amber-50 text-amber-900",
  on_track: "border-emerald-200 bg-emerald-50 text-emerald-800"
};

function formatDate(date?: Date) {
  if (!date) {
    return "Flexible";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium"
  }).format(date);
}

export default async function GoalsPage() {
  await connectToDatabase();
  const { appUser } = await requireFinancialDNA();
  const roadmaps = await getGoalRoadmaps(appUser._id);

  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Goal Agent</h1>
        <p className="max-w-3xl text-muted-foreground">
          Turn money goals into a monthly roadmap using your budget, emergency
          fund needs, and spending leaks.
        </p>
      </div>

      <GoalForm />

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Route className="size-5 text-emerald-700" aria-hidden="true" />
          <h2 className="text-xl font-semibold tracking-tight">
            Active roadmaps
          </h2>
        </div>

        {roadmaps.length ? (
          <div className="grid gap-4">
            {roadmaps.map(({ goal, roadmap }) => (
              <GoalRoadmapCard
                key={String(goal._id)}
                goal={{
                  currentAmount: goal.currentAmount,
                  priority: goal.priority,
                  targetAmount: goal.targetAmount,
                  targetDate: goal.targetDate,
                  title: goal.title
                }}
                roadmap={roadmap}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-muted/30 p-5 text-sm text-muted-foreground">
            No goals yet. Create one above to get a roadmap.
          </div>
        )}
      </section>
    </main>
  );
}

function GoalRoadmapCard({
  goal,
  roadmap
}: {
  goal: {
    currentAmount: number;
    priority: "low" | "medium" | "high";
    targetAmount: number;
    targetDate?: Date;
    title: string;
  };
  roadmap: GoalRoadmap;
}) {
  return (
    <div className="rounded-lg border bg-background p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Flag className="size-5 text-slate-700" aria-hidden="true" />
            <h3 className="text-lg font-semibold">{goal.title}</h3>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-4" aria-hidden="true" />
              {formatDate(goal.targetDate)}
            </span>
            <span className="capitalize">Priority: {goal.priority}</span>
          </div>
        </div>

        <div
          className={`w-fit rounded-md border px-3 py-2 text-sm font-semibold ${statusTone[roadmap.status]}`}
        >
          {roadmap.status.replaceAll("_", " ")}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <Metric label="Target" value={formatGoalRupees(goal.targetAmount)} />
        <Metric label="Saved" value={formatGoalRupees(goal.currentAmount)} />
        <Metric label="Gap" value={formatGoalRupees(roadmap.gapAmount)} />
        <Metric
          label="Monthly needed"
          value={formatGoalRupees(roadmap.monthlyRequired)}
        />
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">Progress</span>
          <span className="text-muted-foreground">
            {roadmap.progressPercent}%
          </span>
        </div>
        <div className="h-3 rounded-full bg-muted">
          <div
            className="h-3 rounded-full bg-emerald-500"
            style={{ width: `${roadmap.progressPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-5 rounded-md border bg-muted/30 p-4">
        <div className="flex items-center gap-2">
          <PiggyBank className="size-4 text-emerald-700" aria-hidden="true" />
          <p className="font-semibold">Roadmap steps</p>
        </div>
        <ol className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
          {roadmap.steps.map((step, index) => (
            <li key={step}>
              {index + 1}. {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
