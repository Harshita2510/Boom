import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  ListChecks,
  Sparkles,
  TriangleAlert
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildActionPlan } from "@/lib/action-plan";
import { getOrCreateCurrentAppUser } from "@/lib/current-app-user";
import { connectToDatabase } from "@/lib/mongoose";

export const dynamic = "force-dynamic";

const urgencyLabel = {
  today: "Today",
  this_month: "This month",
  this_week: "This week"
};

const tagClass = {
  budget: "bg-emerald-50 text-emerald-700",
  data: "bg-slate-100 text-slate-700",
  goal: "bg-indigo-50 text-indigo-700",
  investment: "bg-green-50 text-green-700",
  safety: "bg-rose-50 text-rose-700",
  scheme: "bg-orange-50 text-orange-700"
};

export default async function ActionPlanPage() {
  await connectToDatabase();
  const appUser = await getOrCreateCurrentAppUser();

  if (!appUser?._id) {
    return (
      <main className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">AI Action Plan</h1>
        <p className="text-muted-foreground">
          Sign in and complete your profile to generate a personal action plan.
        </p>
      </main>
    );
  }

  const plan = await buildActionPlan(appUser._id);

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Sparkles className="size-4" aria-hidden="true" />
            {plan.coachMode === "ai" ? "Gemini assisted" : "Rule-based mode"}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            AI Action Plan
          </h1>
          <p className="max-w-3xl text-muted-foreground">
            One working model view that combines budget, goals, recurring
            expenses, schemes, investments, fraud safety, and data readiness.
          </p>
        </div>
        <Button asChild>
          <Link href="/chat">
            Ask coach
            <ArrowRight className="ml-2 size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>

      {plan.aiSummary ? (
        <section className="rounded-lg border bg-slate-950 p-5 text-white">
          <div className="mb-3 flex items-center gap-2 text-emerald-300">
            <Sparkles className="size-5" aria-hidden="true" />
            <h2 className="font-semibold">Coach summary</h2>
          </div>
          <p className="whitespace-pre-line text-sm leading-6 text-slate-100">
            {plan.aiSummary}
          </p>
        </section>
      ) : (
        <section className="rounded-lg border bg-muted/40 p-5">
          <div className="mb-2 flex items-center gap-2">
            <ListChecks className="size-5 text-primary" aria-hidden="true" />
            <h2 className="font-semibold">Coach summary</h2>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            Gemini is not available for this request, so ArthSaathi is using its
            local financial rules. Your actions below are still generated from
            your real app data.
          </p>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {plan.highlights.map((highlight) => (
          <Card key={highlight.label}>
            <CardHeader>
              <CardDescription>{highlight.label}</CardDescription>
              <CardTitle className="text-2xl">{highlight.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{highlight.note}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader>
            <CardTitle>Next best actions</CardTitle>
            <CardDescription>
              Ordered for a general user: protect cash first, then goals,
              investment, schemes, and fraud safety.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {plan.nextActions.map((item, index) => (
              <div
                key={`${item.action}-${index}`}
                className="rounded-lg border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">
                    {index + 1}. {item.action}
                  </span>
                  <span
                    className={`rounded-md px-2 py-1 text-xs font-medium ${tagClass[item.tag]}`}
                  >
                    {item.tag}
                  </span>
                  <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">
                    {urgencyLabel[item.urgency]}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.reason}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data readiness</CardTitle>
              <CardDescription>
                What is ready for a working demo model.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {plan.dataReadiness.map((item) => {
                const Icon = item.complete ? CheckCircle2 : Circle;

                return (
                  <div key={item.label} className="flex items-center gap-2">
                    <Icon
                      className={
                        item.complete
                          ? "size-4 text-emerald-600"
                          : "size-4 text-muted-foreground"
                      }
                      aria-hidden="true"
                    />
                    <span className="text-sm">{item.label}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk watch</CardTitle>
              <CardDescription>Issues the model will keep tracking.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {plan.risks.length ? (
                plan.risks.map((risk) => (
                  <div key={risk} className="flex items-start gap-2">
                    <TriangleAlert
                      className="mt-0.5 size-4 text-amber-600"
                      aria-hidden="true"
                    />
                    <p className="text-sm leading-6 text-muted-foreground">
                      {risk}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">
                  No major risk is visible yet. Add more transactions and goals
                  to improve detection.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
