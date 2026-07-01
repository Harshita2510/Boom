import Link from "next/link";
import {
  ArrowRight,
  Check,
  FileSearch,
  Goal,
  Mic,
  Radar,
  ShieldCheck,
  Target,
  WandSparkles,
  type LucideIcon
} from "lucide-react";

import { LanguageText } from "@/components/language-text";
import type { TranslationKey } from "@/lib/i18n";
import { requireFinancialDNA } from "@/lib/financial-dna-gate";
import { connectToDatabase } from "@/lib/mongoose";
import {
  FinancialDNAModel,
  GoalModel,
  TransactionModel,
  UploadedDocumentModel,
  UserModel
} from "@/models";
import { DashboardGreeting } from "./dashboard-greeting";

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

type UserGreeting = {
  firstName?: string | null;
  preferredLanguage?: string | null;
};

const rupee = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  maximumFractionDigits: 0,
  style: "currency"
});

const firstTimeActions = [
  {
    captionKey: "dashboard.logExpenseCaption",
    href: "/dashboard/voice-ledger",
    icon: Mic,
    titleKey: "dashboard.logExpense"
  },
  {
    captionKey: "dashboard.understandDocumentCaption",
    href: "/dashboard/documents",
    icon: FileSearch,
    titleKey: "dashboard.understandDocument"
  },
  {
    captionKey: "dashboard.seeFutureCaption",
    href: "/dashboard/future-simulation",
    icon: Radar,
    titleKey: "dashboard.seeFuture"
  },
  {
    captionKey: "dashboard.createGoalCaption",
    href: "/dashboard/goals",
    icon: Goal,
    titleKey: "dashboard.createGoal"
  }
] satisfies Array<{
  captionKey: TranslationKey;
  href: string;
  icon: LucideIcon;
  titleKey: TranslationKey;
}>;

const returningActions = [
  {
    href: "/dashboard/voice-ledger",
    icon: Mic,
    titleKey: "dashboard.logExpense"
  },
  {
    href: "/dashboard/documents",
    icon: FileSearch,
    titleKey: "dashboard.understandDocument"
  },
  {
    href: "/dashboard/future-simulation",
    icon: Radar,
    titleKey: "dashboard.futureSimulation"
  },
  {
    href: "/dashboard/scam-shield",
    icon: ShieldCheck,
    titleKey: "dashboard.scamCheck"
  }
] satisfies Array<{
  href: string;
  icon: LucideIcon;
  titleKey: TranslationKey;
}>;

function getRiskStyle(riskAppetite?: string) {
  if (riskAppetite === "high") {
    return "dashboard.growth";
  }

  if (riskAppetite === "low") {
    return "dashboard.conservative";
  }

  return "dashboard.moderate";
}

function getPrimaryGoal(profile: FinancialDNASnapshot | null) {
  const goal = profile?.financialGoals?.find((item) => item.trim().length > 0);

  return goal || "dashboard.emergencyFund";
}

function getDisplayName(user: UserGreeting) {
  return user.firstName?.trim() || "there";
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
  captionKey,
  href,
  icon: Icon,
  titleKey
}: {
  captionKey?: TranslationKey;
  href: string;
  icon: LucideIcon;
  titleKey: TranslationKey;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[118px] flex-col justify-between rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm shadow-slate-200/70 backdrop-blur transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span>
        <span className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-950 sm:text-base">
          <LanguageText id={titleKey} />
          <ArrowRight
            className="size-4 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-indigo-600"
            aria-hidden="true"
          />
        </span>
        {captionKey ? (
          <span className="mt-2 block text-sm leading-5 text-slate-600">
            <LanguageText id={captionKey} />
          </span>
        ) : null}
      </span>
    </Link>
  );
}

function FirstTimeDashboard({
  profile,
  user
}: {
  profile: FinancialDNASnapshot | null;
  user: UserGreeting;
}) {
  const primaryGoal = getPrimaryGoal(profile);
  const income = profile?.monthlyIncome || 50000;
  const riskStyle = getRiskStyle(profile?.riskAppetite);
  const displayName = getDisplayName(user);

  return (
    <main className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-[linear-gradient(135deg,#fff7ed_0%,#eef2ff_48%,#ecfeff_100%)] p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-5">
          <div className="max-w-2xl">
            <DashboardGreeting
              displayName={displayName}
              initialLanguage={user.preferredLanguage}
            />
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">
          <LanguageText id="dashboard.snapshot" />
        </h2>
        <div className="rounded-2xl border border-white/70 bg-slate-950 p-4 text-white shadow-xl shadow-slate-200 lg:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["dashboard.goal", primaryGoal],
              ["dashboard.income", `${rupee.format(income)}/month`],
              ["dashboard.riskStyle", riskStyle],
              ["dashboard.focus", "dashboard.saveMore"]
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-white/10 bg-white/10 p-3 backdrop-blur lg:p-4"
              >
                <p className="text-xs font-medium uppercase text-white/60">
                  <LanguageText id={label as TranslationKey} />
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {String(value).startsWith("dashboard.") ? (
                    <LanguageText id={value as TranslationKey} />
                  ) : (
                    value
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">
          <LanguageText id="dashboard.firstAction" />
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {firstTimeActions.map((action) => (
            <ActionCard key={action.href} {...action} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-indigo-100 bg-white/90 p-4 shadow-sm backdrop-blur lg:p-5">
        <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-indigo-600 text-white">
            <WandSparkles className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              <LanguageText id="dashboard.firstSuggestion" />
            </h2>
            <p className="mt-2 text-base leading-7 text-slate-700">
              <LanguageText id="dashboard.suggestionText" />
            </p>
          </div>
        </div>
      </section>

      <p className="rounded-[24px] bg-emerald-50 px-5 py-4 text-center text-sm leading-6 text-emerald-950">
        <LanguageText id="dashboard.learnsFromYou" />
      </p>
    </main>
  );
}

function ReturningDashboard({
  documentsCount,
  expenseCount,
  firstGoal,
  goalsCount,
  simulationsCount,
  user
}: {
  documentsCount: number;
  expenseCount: number;
  firstGoal: GoalSnapshot | null;
  goalsCount: number;
  simulationsCount: number;
  user: UserGreeting;
}) {
  const goalTitle = firstGoal?.title;
  const displayName = getDisplayName(user);
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
      <section className="rounded-2xl border border-white/70 bg-[linear-gradient(135deg,#f8fafc_0%,#ecfeff_52%,#fff7ed_100%)] p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <DashboardGreeting
              displayName={displayName}
              initialLanguage={user.preferredLanguage}
            />
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur sm:rounded-[28px] sm:p-6">
        <div className="flex items-start gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
            <Target className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-500">
              <LanguageText id="dashboard.goalProgress" />
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950 sm:text-xl">
              🎯{" "}
              {goalTitle ? (
                goalTitle
              ) : (
                <LanguageText id="dashboard.emergencyFund" />
              )}
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
          <LanguageText id="dashboard.quickActions" />
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
            <LanguageText id="dashboard.yourActivity" />
          </h2>
          <div className="mt-4 grid gap-3">
            {[
              ["dashboard.expensesLogged", expenseCount],
              ["dashboard.goalsCreated", goalsCount],
              ["dashboard.documentsAnalyzed", documentsCount]
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-[20px] bg-slate-50 px-4 py-3"
              >
                <span className="text-sm font-medium text-slate-600">
                  <LanguageText id={label as TranslationKey} />
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
                <LanguageText id="dashboard.aiInsight" />
              </h2>
              <p className="mt-2 text-base leading-7 text-slate-700">
                <LanguageText id="dashboard.aiInsightText" />
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-white/70 bg-slate-950 p-4 text-white shadow-xl shadow-slate-200 sm:rounded-[28px] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-white/60">
              <LanguageText id="dashboard.suggestedNextStep" />
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
              <LanguageText id="dashboard.completeFirstWeek" />
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
            { complete: expenseCount > 0, label: "dashboard.logFirstExpenses" },
            { complete: simulationsCount > 0, label: "dashboard.runFutureSimulation" },
            { complete: documentsCount > 0, label: "dashboard.uploadFinancialDocument" }
          ].map(({ complete, label }) => (
            <div key={label} className="flex items-center gap-3">
              <span
                className={`grid size-6 place-items-center rounded-full ${
                  complete ? "bg-emerald-400 text-slate-950" : "bg-white/10"
                }`}
              >
                {complete ? <Check className="size-4" aria-hidden="true" /> : null}
              </span>
              <span className="text-sm font-medium text-white/85">
                <LanguageText id={label as TranslationKey} />
              </span>
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
    firstGoal,
    freshUser
  ] = await Promise.all([
    FinancialDNAModel.findOne({ userId: appUser._id }).lean<FinancialDNASnapshot | null>(),
    TransactionModel.countDocuments({ type: "expense", userId: appUser._id }),
    GoalModel.countDocuments({ userId: appUser._id }),
    UploadedDocumentModel.countDocuments({ userId: appUser._id }),
    0,
    GoalModel.findOne({ status: "active", userId: appUser._id })
      .sort({ createdAt: 1 })
      .lean<GoalSnapshot | null>(),
    UserModel.findById(appUser._id).lean<UserGreeting | null>()
  ]);

  const hasActivity =
    expenseCount > 0 ||
    goalsCount > 0 ||
    documentsCount > 0 ||
    simulationsCount > 0;
  const userGreeting = {
    firstName: freshUser?.firstName ?? appUser.firstName,
    preferredLanguage: freshUser?.preferredLanguage ?? appUser.preferredLanguage
  };

  if (!hasActivity) {
    return <FirstTimeDashboard profile={profile} user={userGreeting} />;
  }

  return (
    <ReturningDashboard
      documentsCount={documentsCount}
      expenseCount={expenseCount}
      firstGoal={firstGoal}
      goalsCount={goalsCount}
      simulationsCount={simulationsCount}
      user={userGreeting}
    />
  );
}
