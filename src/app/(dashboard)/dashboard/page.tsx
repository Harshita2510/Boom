import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import {
  Activity,
  AudioLines,
  Brain,
  Radar,
  ShieldCheck,
  UsersRound
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { calculateFinancialHealthScore } from "@/lib/financial-health-score";

export const dynamic = "force-dynamic";

const demoHealthScore = calculateFinancialHealthScore({
  income: 80000,
  savings: 18000,
  expenses: 48000,
  debt: 10000,
  goalProgress: 65
});

const dashboardCards = [
  {
    title: "Financial DNA",
    description: "Your money behavior snapshot",
    icon: Brain,
    value: "Balanced Planner",
    detail: "Savings consistency is improving this month.",
    accent: "bg-blue-50 text-blue-700",
    href: "/dashboard/financial-dna"
  },
  {
    title: "Financial Health Score",
    description: "Overall money health",
    icon: Activity,
    value: `${demoHealthScore.score} / 100`,
    detail: demoHealthScore.explanation,
    accent: "bg-emerald-50 text-emerald-700",
    href: ""
  },
  {
    title: "Voice Ledger",
    description: "Quick expense capture",
    icon: AudioLines,
    value: "12 entries",
    detail: "Dummy voice notes are ready for future ledger features.",
    accent: "bg-violet-50 text-violet-700",
    href: "/dashboard/voice-ledger"
  },
  {
    title: "Community Intelligence",
    description: "Anonymous peer patterns",
    icon: UsersRound,
    value: "5 groups",
    detail: "Join Farmers, Gig Workers, Students, Teachers, or Small Businesses.",
    accent: "bg-cyan-50 text-cyan-700",
    href: "/dashboard/community-intelligence"
  },
  {
    title: "Future Simulation",
    description: "What-if money planning",
    icon: Radar,
    value: "6 months",
    detail: "Ask what-if questions and compare projected outcomes.",
    accent: "bg-amber-50 text-amber-700",
    href: "/dashboard/future-simulation"
  },
  {
    title: "Scam Shield",
    description: "Risk and fraud awareness",
    icon: ShieldCheck,
    value: "Low risk",
    detail: "Upload screenshots or text to score scam risk.",
    accent: "bg-rose-50 text-rose-700",
    href: "/dashboard/scam-shield"
  }
];

export default async function DashboardPage() {
  const user = await currentUser();
  const displayName =
    user?.firstName ?? user?.username ?? user?.emailAddresses[0]?.emailAddress;

  return (
    <main className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome{displayName ? `, ${displayName}` : ""}
        </h1>
        <p className="text-muted-foreground">
          Here is your Boom dashboard preview with dummy data.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {dashboardCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.title} className="overflow-hidden">
              <CardHeader className="flex-row items-start justify-between space-y-0 gap-4">
                <div className="space-y-1.5">
                  <CardTitle>
                    {card.href ? (
                      <Link href={card.href} className="hover:underline">
                        {card.title}
                      </Link>
                    ) : (
                      card.title
                    )}
                  </CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </div>
                <div className={`rounded-md p-2 ${card.accent}`}>
                  <Icon className="size-5" aria-hidden="true" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tracking-tight">
                  {card.value}
                </p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {card.detail}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="rounded-lg border bg-background p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight">
              Financial Health Score
            </h2>
            <p className="text-sm text-muted-foreground">
              This score uses income, savings, expenses, debt, and goal
              progress.
            </p>
          </div>
          <div className="rounded-lg bg-emerald-50 px-4 py-3 text-emerald-800">
            <p className="text-3xl font-semibold">{demoHealthScore.score}</p>
            <p className="text-xs font-medium uppercase">
              {demoHealthScore.band}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          {Object.entries(demoHealthScore.parts).map(([label, value]) => (
            <div key={label} className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs capitalize text-muted-foreground">
                {label}
              </p>
              <p className="mt-1 text-lg font-semibold">{value}/100</p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {demoHealthScore.explanation}
        </p>
      </section>
    </main>
  );
}
