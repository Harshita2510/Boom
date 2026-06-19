import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  FileSearch,
  Goal,
  Mic,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
  WandSparkles
} from "lucide-react";

import { requireFinancialDNA } from "@/lib/financial-dna-gate";
import { connectToDatabase } from "@/lib/mongoose";
import {
  FinancialDNAModel,
  GoalModel,
  TransactionModel,
  UploadedDocumentModel
} from "@/models";

export const dynamic = "force-dynamic";

type FinancialDNASnapshot = {
  financialGoals?: string[];
  monthlyIncome?: number;
  riskAppetite?: "low" | "medium" | "high";
};

type GoalSnapshot = {
  currentAmount?: number;
  targetAmount?: number;
  title?: string;
};

const rupee = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  maximumFractionDigits: 0,
  style: "currency"
});

const firstTimeActions = [
  {
    caption: "I spent ₹500 on groceries",
    href: "/dashboard/voice-ledger",
    icon: Mic,
    title: "Log an Expense"
  },
  {
    caption: "Upload a loan, insurance, or bank document",
    href: "/dashboard/documents",
    icon: FileSearch,
    title: "Understand a Document"
  },
  {
    caption: "Explore how today's decisions affect tomorrow",
    href: "/dashboard/future-simulation",
    icon: Radar,
    title: "See Your Future"
  },
  {
    caption: "Save for something important",
    href: "/dashboard/goals",
    icon: Goal,
    title: "Create a Goal"
  }
];

const returningActions = [
  {
    href: "/dashboard/voice-ledger",
    icon: Mic,
    title: "Log Expense"
  },
  {
    href: "/dashboard/documents",
    icon: FileSearch,
    title: "Understand Document"
  },
  {
    href: "/dashboard/future-simulation",
    icon: Radar,
    title: "Future Simulation"
  },
  {
    href: "/dashboard/scam-shield",
    icon: ShieldCheck,
    title: "Scam Check"
  }
];

function getRiskStyle(riskAppetite?: string) {
  if (riskAppetite === "high") {
    return "Growth";
  }

  if (riskAppetite === "low") {
    return "Conservative";
  }

  return "Moderate";
}

function getPrimaryGoal(profile: FinancialDNASnapshot | null) {
  const goal = profile?.financialGoals?.find((item) => item.trim().length > 0);

  return goal || "Emergency Fund";
}

function getChecklistProgress(input: {
  documentsCount: number;
  expenseCount: number;
  simulationsCount: number;
}) {
  const items = [
    input.expenseCount > 0,
    input.simulationsCount > 0,
    input.documentsCount > 0
  ];
  const completed = items.filter(Boolean).length;

  return Math.round((completed / items.length) * 100);
}

function ActionCard({
  caption,
  href,
  icon: Icon,
  title
}: {
  caption?: string;
  href: string;
  icon: typeof Mic;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[132px] flex-col justify-between rounded-[22px] border border-white/70 bg-white/80 p-4 shadow-sm shadow-slate-200/70 backdrop-blur transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:min-h-[148px] sm:rounded-[24px] sm:p-5"
    >
      <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span>
        <span className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-950 sm:text-base">
          {title}
          <ArrowRight
            className="size-4 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-indigo-600"
            aria-hidden="true"
          />
        </span>
        {caption ? (
          <span className="mt-2 block text-sm leading-5 text-slate-600">
            {caption}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

function BoomMark() {
  return (
    <div className="relative grid size-14 place-items-center rounded-[22px] bg-slate-950 text-white shadow-xl shadow-indigo-200 sm:size-16 sm:rounded-[24px]">
      <span className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-emerald-400 text-slate-950">
        <Sparkles className="size-3.5" aria-hidden="true" />
      </span>
      <Mic className="size-6 sm:size-7" aria-hidden="true" />
    </div>
  );
}

function FirstTimeDashboard({
  profile
}: {
  profile: FinancialDNASnapshot | null;
}) {
  const primaryGoal = getPrimaryGoal(profile);
  const income = profile?.monthlyIncome || 50000;
  const riskStyle = getRiskStyle(profile?.riskAppetite);

  return (
    <main className="space-y-5 sm:space-y-6">
      <section className="overflow-hidden rounded-[24px] border border-white/70 bg-[linear-gradient(135deg,#fff7ed_0%,#eef2ff_48%,#ecfeff_100%)] p-4 shadow-sm sm:rounded-[32px] sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <div className="mb-5">
              <BoomMark />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              🎉 Welcome to Boom
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-700 sm:text-lg">
              Your Financial DNA is ready. We've personalized Boom for you.
            </p>
          </div>
          <div className="rounded-[28px] border border-white/70 bg-white/55 p-4 text-sm text-slate-700 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2 font-semibold text-slate-950">
              <BadgeCheck className="size-5 text-emerald-600" aria-hidden="true" />
              DNA complete
            </div>
            <p className="mt-2 max-w-[260px] leading-6">
              Boom now has enough context to guide your first money moves.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">
          Your Snapshot
        </h2>
        <div className="rounded-[24px] border border-white/70 bg-slate-950 p-4 text-white shadow-xl shadow-slate-200 sm:rounded-[28px] sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Goal", primaryGoal],
              ["Income", `${rupee.format(income)}/month`],
              ["Risk Style", riskStyle],
              ["Focus", "Save More"]
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-[20px] border border-white/10 bg-white/10 p-3 backdrop-blur sm:rounded-[22px] sm:p-4"
              >
                <p className="text-xs font-medium uppercase text-white/60">
                  {label}
                </p>
                <p className="mt-2 text-lg font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">
          What would you like to do first?
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {firstTimeActions.map((action) => (
            <ActionCard key={action.href} {...action} />
          ))}
        </div>
      </section>

      <section className="rounded-[24px] border border-indigo-100 bg-white/85 p-4 shadow-sm backdrop-blur sm:rounded-[28px] sm:p-6">
        <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-indigo-600 text-white">
            <WandSparkles className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              Boom's First Suggestion
            </h2>
            <p className="mt-2 text-base leading-7 text-slate-700">
              Based on your profile, building an emergency fund should be your
              first financial milestone.
            </p>
          </div>
        </div>
      </section>

      <p className="rounded-[24px] bg-emerald-50 px-5 py-4 text-center text-sm leading-6 text-emerald-950">
        The more you interact with Boom, the smarter and more personalized your
        financial guidance becomes.
      </p>
    </main>
  );
}

function ReturningDashboard({
  documentsCount,
  expenseCount,
  firstGoal,
  goalsCount,
  simulationsCount
}: {
  documentsCount: number;
  expenseCount: number;
  firstGoal: GoalSnapshot | null;
  goalsCount: number;
  simulationsCount: number;
}) {
  const goalTitle = firstGoal?.title || "Emergency Fund";
  const currentAmount = firstGoal?.currentAmount ?? 5000;
  const targetAmount = firstGoal?.targetAmount ?? 50000;
  const goalProgress =
    targetAmount > 0
      ? Math.min(100, Math.round((currentAmount / targetAmount) * 100))
      : 0;
  const checklistProgress = getChecklistProgress({
    documentsCount,
    expenseCount,
    simulationsCount
  });

  return (
    <main className="space-y-5 sm:space-y-6">
      <section className="rounded-[24px] border border-white/70 bg-[linear-gradient(135deg,#f8fafc_0%,#ecfeff_52%,#fff7ed_100%)] p-4 shadow-sm sm:rounded-[32px] sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              👋 Welcome Back
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-700 sm:text-lg">
              Ready to continue your financial journey?
            </p>
          </div>
          <BoomMark />
        </div>
      </section>

      <section className="rounded-[24px] border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur sm:rounded-[28px] sm:p-6">
        <div className="flex items-start gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
            <Target className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-500">Goal Progress</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950 sm:text-xl">
              🎯 {goalTitle}
            </h2>
            <p className="mt-3 text-lg font-semibold text-slate-950">
              {rupee.format(currentAmount)} / {rupee.format(targetAmount)}
            </p>
            <div className="mt-4 h-3 rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">
          Quick Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {returningActions.map((action) => (
            <ActionCard key={action.href} {...action} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[24px] border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur sm:rounded-[28px] sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">
            Your Activity
          </h2>
          <div className="mt-4 grid gap-3">
            {[
              ["Expenses Logged", expenseCount],
              ["Goals Created", goalsCount],
              ["Documents Analyzed", documentsCount]
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-[20px] bg-slate-50 px-4 py-3"
              >
                <span className="text-sm font-medium text-slate-600">
                  {label}
                </span>
                <span className="text-lg font-semibold text-slate-950">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-indigo-100 bg-indigo-50/80 p-4 shadow-sm backdrop-blur sm:rounded-[28px] sm:p-6">
          <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-indigo-600 text-white">
              <WandSparkles className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">
                AI Insight
              </h2>
              <p className="mt-2 text-base leading-7 text-slate-700">
                You are consistently tracking expenses. Keep logging for a few
                more days to unlock personalized spending insights.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-white/70 bg-slate-950 p-4 text-white shadow-xl shadow-slate-200 sm:rounded-[28px] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-white/60">
              Suggested Next Step
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
              Complete Your First Week
            </h2>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 text-xl font-semibold">
            {checklistProgress}%
          </div>
        </div>
        <div className="mt-5 h-3 rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-cyan-300"
            style={{ width: `${checklistProgress}%` }}
          />
        </div>
        <div className="mt-5 grid gap-3">
          {[
            { complete: expenseCount > 0, label: "Log your first expenses" },
            { complete: simulationsCount > 0, label: "Run a future simulation" },
            { complete: documentsCount > 0, label: "Upload a financial document" }
          ].map(({ complete, label }) => (
            <div key={label} className="flex items-center gap-3">
              <span
                className={`grid size-6 place-items-center rounded-full ${
                  complete ? "bg-emerald-400 text-slate-950" : "bg-white/10"
                }`}
              >
                {complete ? <Check className="size-4" aria-hidden="true" /> : null}
              </span>
              <span className="text-sm font-medium text-white/85">{label}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default async function DashboardPage() {
  await connectToDatabase();
  const { appUser } = await requireFinancialDNA();

  const [
    profile,
    expenseCount,
    goalsCount,
    documentsCount,
    simulationsCount,
    firstGoal
  ] = await Promise.all([
    FinancialDNAModel.findOne({ userId: appUser._id }).lean<FinancialDNASnapshot | null>(),
    TransactionModel.countDocuments({ type: "expense", userId: appUser._id }),
    GoalModel.countDocuments({ userId: appUser._id }),
    UploadedDocumentModel.countDocuments({ userId: appUser._id }),
    0,
    GoalModel.findOne({ status: "active", userId: appUser._id })
      .sort({ createdAt: 1 })
      .lean<GoalSnapshot | null>()
  ]);

  const hasActivity =
    expenseCount > 0 ||
    goalsCount > 0 ||
    documentsCount > 0 ||
    simulationsCount > 0;

  if (!hasActivity) {
    return <FirstTimeDashboard profile={profile} />;
  }

  return (
    <ReturningDashboard
      documentsCount={documentsCount}
      expenseCount={expenseCount}
      firstGoal={firstGoal}
      goalsCount={goalsCount}
      simulationsCount={simulationsCount}
    />
  );
}
