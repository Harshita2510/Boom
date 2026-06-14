import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import {
  Activity,
  AudioLines,
  Brain,
  ChartNoAxesCombined,
  CloudSun,
  FileSearch,
  Goal,
  Landmark,
  LibraryBig,
  MessageCircle,
  Mic,
  Smartphone,
  Radar,
  Repeat2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UsersRound
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { getOrCreateCurrentAppUser } from "@/lib/current-app-user";
import { getOrCalculateFinancialHealthScore } from "@/lib/financial-health-score-service";
import { connectToDatabase } from "@/lib/mongoose";

export const dynamic = "force-dynamic";

function getDashboardCards(healthScore: {
  explanation: string;
  score: number;
}) {
  return [
  {
    title: "AI Action Plan",
    description: "One brain for all agents",
    icon: Sparkles,
    value: "Working model",
    detail: "Combines your ledger, goals, risk, schemes, investments, recurring spends, scam safety, and Gemini coach.",
    accent: "bg-slate-100 text-slate-800",
    href: "/dashboard/action-plan"
  },
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
    title: "Financial Education",
    description: "Concepts with local analogies",
    icon: LibraryBig,
    value: "UPI to SIP",
    detail: "Learn UPI, FD, SIP, mutual funds, loans, credit, and insurance in simple language.",
    accent: "bg-sky-50 text-sky-700",
    href: "/dashboard/learn"
  },
  {
    title: "Scheme Agent",
    description: "Yojana recommendations",
    icon: Landmark,
    value: "Check eligibility",
    detail: "Find schemes worth checking for banking access, insurance, pension, savings, and farmer support.",
    accent: "bg-orange-50 text-orange-700",
    href: "/dashboard/schemes"
  },
  {
    title: "Financial Health Score",
    description: "Overall money health",
    icon: Activity,
    value: `${healthScore.score} / 100`,
    detail: healthScore.explanation,
    accent: "bg-emerald-50 text-emerald-700",
    href: ""
  },
  {
    title: "Voice Ledger",
    description: "Quick expense capture",
    icon: AudioLines,
    value: "Hands-free ready",
    detail: "Record inside the app today; Siri, Google Assistant, and WhatsApp can feed the same ledger next.",
    accent: "bg-violet-50 text-violet-700",
    href: "/dashboard/voice-ledger"
  },
  {
    title: "Voice Mode",
    description: "App-open listening flow",
    icon: Mic,
    value: "One tap",
    detail: "Start listening once, keep the app open, and save spoken transactions continuously.",
    accent: "bg-teal-50 text-teal-700",
    href: "/dashboard/voice-mode"
  },
  {
    title: "AI Spending Coach",
    description: "Budgeting and cashflow forecast",
    icon: ChartNoAxesCombined,
    value: "Leak detector",
    detail: "Find top spend categories, recurring costs, emergency fund gaps, and low-balance risk.",
    accent: "bg-lime-50 text-lime-700",
    href: "/dashboard/budget-coach"
  },
  {
    title: "Recurring Tracker",
    description: "Subscriptions and autopays",
    icon: Repeat2,
    value: "Annual leaks",
    detail: "Detect repeated payments, estimate annual cost, and review subscriptions or plans.",
    accent: "bg-fuchsia-50 text-fuchsia-700",
    href: "/dashboard/recurring"
  },
  {
    title: "Cash Smoothing",
    description: "Future shock buffer",
    icon: CloudSun,
    value: "Seasonal guard",
    detail: "Prepare for low-income weeks, crop cycles, school fees, festivals, and surprise expenses.",
    accent: "bg-yellow-50 text-yellow-800",
    href: "/dashboard/cash-smoothing"
  },
  {
    title: "Goal Agent",
    description: "Roadmaps for future purchases",
    icon: Goal,
    value: "Purpose per rupee",
    detail: "Create goals and see monthly saving steps, emergency guardrails, and risk status.",
    accent: "bg-indigo-50 text-indigo-700",
    href: "/dashboard/goals"
  },
  {
    title: "Investment Agent",
    description: "FD, RD, SIP guidance",
    icon: TrendingUp,
    value: "Safety first",
    detail: "Get category-level guidance based on goals, risk appetite, emergency fund, and cashflow.",
    accent: "bg-green-50 text-green-700",
    href: "/dashboard/investments"
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
  },
  {
    title: "Documents & Disputes",
    description: "Explain papers and draft complaints",
    icon: FileSearch,
    value: "Explain + act",
    detail: "Ask questions about financial documents, flag risks, and prepare complaint drafts from the same flow.",
    accent: "bg-purple-50 text-purple-700",
    href: "/dashboard/documents"
  }
  ];
}

export default async function DashboardPage() {
  await connectToDatabase();
  const user = await currentUser();
  const appUser = await getOrCreateCurrentAppUser();
  const healthScore = appUser
    ? await getOrCalculateFinancialHealthScore(appUser._id)
    : {
        band: "weak" as const,
        explanation: "Add Financial DNA, transactions, and goals to calculate your real score.",
        input: {
          debt: 0,
          expenses: 0,
          goalProgress: 0,
          income: 1,
          savings: 0
        },
        parts: {
          debt: 100,
          expenses: 100,
          goals: 0,
          savings: 0
        },
        score: 50
      };
  const dashboardCards = getDashboardCards(healthScore);
  const displayName =
    user?.firstName ?? user?.username ?? user?.emailAddresses[0]?.emailAddress;

  return (
    <main className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome{displayName ? `, ${displayName}` : ""}
        </h1>
        <p className="text-muted-foreground">
          Your ArthSaathi mobile dashboard for money decisions, scam checks,
          and voice-first transaction tracking.
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-lg border bg-slate-950 p-5 text-white">
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-white/10 p-2 text-emerald-300">
              <Smartphone className="size-5" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">
                Built as a mobile product first
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-slate-200">
                Users can open the app to review money health, correct entries,
                and see insights. Hands-free capture later comes through phone
                assistant shortcuts or WhatsApp, not background web listening.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/dashboard/voice-ledger"
          className="rounded-lg border bg-background p-5 transition-colors hover:bg-accent"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-emerald-50 p-2 text-emerald-700">
              <MessageCircle className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold">Try capture flow</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Say or type: spent 500 on groceries.
              </p>
            </div>
          </div>
        </Link>
      </section>

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
    </main>
  );
}
