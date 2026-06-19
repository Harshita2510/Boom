import {
  AlertTriangle,
  Banknote,
  Dna,
  PiggyBank,
  Shield,
  Sparkles,
  Star,
  TrendingUp
} from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";

import { connectToDatabase } from "@/lib/mongoose";
import { FinancialDNAModel, UserModel } from "@/models";

import { OnboardingChat } from "./onboarding-chat";
import { RetakeDNAButton } from "./retake-dna-button";

export const dynamic = "force-dynamic";

type FinancialDNASnapshot = {
  ageRange?: string;
  city?: string;
  dependents?: number;
  financialGoals?: string[];
  hasLoans?: boolean;
  incomeType?: string;
  lifeStage?: string;
  monthlyEmi?: number;
  monthlyIncome?: number;
  monthlyIncomeRange?: string;
  occupation?: string;
  riskAppetite?: "low" | "medium" | "high";
  summary?: string;
};

const rupee = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  maximumFractionDigits: 0,
  style: "currency"
});

const goalEmoji: Record<string, string> = {
  "Buy a Car": "🚗",
  "Buy a Home": "🏠",
  "Child's Education": "🎓",
  "Emergency Fund": "🛡️",
  Retirement: "🌴",
  "Start Business": "🚀",
  Travel: "✈️",
  Wedding: "💍"
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function formatValue(value?: string | number) {
  if (value === undefined || value === null || value === "") {
    return "Not captured";
  }

  return String(value);
}

function getRiskMeta(risk?: string) {
  if (risk === "low") {
    return {
      Icon: Shield,
      bubble: "bg-emerald-100 text-emerald-700",
      label: "Conservative Investor",
      text: "You prefer stability and safety before chasing higher returns."
    };
  }

  if (risk === "high") {
    return {
      Icon: AlertTriangle,
      bubble: "bg-rose-100 text-rose-700",
      label: "Aggressive Investor",
      text: "You can tolerate volatility for stronger long-term growth."
    };
  }

  return {
    Icon: TrendingUp,
    bubble: "bg-amber-100 text-amber-700",
    label: "Moderate Investor",
    text: "You balance risk with potential returns for steady growth."
  };
}

function getMetrics(profile: FinancialDNASnapshot) {
  const income = profile.monthlyIncome ?? 0;
  const emi = profile.monthlyEmi ?? 0;
  const livingExpenses = income * 0.45;
  const savingsCapacity = Math.max(0, income - emi - livingExpenses);
  const recommendedSip = Math.round((savingsCapacity * 0.6) / 1000) * 1000;
  const emiBurden = income > 0 ? Math.round((emi / income) * 100) : 0;

  return {
    emi,
    emiBurden,
    income,
    recommendedSip,
    savingsCapacity
  };
}

function getBreakdown(profile: FinancialDNASnapshot) {
  const { emiBurden, income, savingsCapacity } = getMetrics(profile);
  const goals = profile.financialGoals ?? [];
  const hasEmergencyGoal = goals.some((goal) => /emergency/i.test(goal));
  const hasInsuranceNeed =
    (profile.dependents ?? 0) > 0 ||
    /married|kids|parent/i.test(profile.lifeStage ?? "");

  const debtManagement = clamp(100 - emiBurden * 2);
  const savingsDiscipline = income > 0 ? clamp(Math.round((savingsCapacity / income) * 250)) : 45;
  const investmentDiversity = clamp(
    45 +
      goals.filter((goal) => !/emergency/i.test(goal)).length * 8 +
      (profile.riskAppetite === "high" ? 14 : profile.riskAppetite === "medium" ? 8 : 2)
  );
  const emergencyReadiness = clamp(hasEmergencyGoal ? 78 : savingsCapacity > 0 ? 55 : 35);
  const insuranceCoverage = clamp(hasInsuranceNeed ? 42 + (profile.hasLoans ? 8 : 0) : 68);

  return [
    { label: "Savings Discipline", score: savingsDiscipline },
    { label: "Debt Management", score: debtManagement },
    { label: "Investment Diversity", score: investmentDiversity },
    { label: "Emergency Readiness", score: emergencyReadiness },
    { label: "Insurance Coverage", score: insuranceCoverage }
  ];
}

function getColor(score: number) {
  if (score >= 75) {
    return {
      arc: "stroke-emerald-500",
      bar: "bg-emerald-500",
      dot: "🟢",
      text: "text-emerald-700"
    };
  }

  if (score >= 50) {
    return {
      arc: "stroke-amber-500",
      bar: "bg-amber-500",
      dot: "🟡",
      text: "text-amber-700"
    };
  }

  return {
    arc: "stroke-rose-500",
    bar: "bg-rose-500",
    dot: "🔴",
    text: "text-rose-700"
  };
}

function getScoreLabel(score: number) {
  if (score >= 75) return "Excellent";
  if (score >= 60) return "Good Standing";
  if (score >= 50) return "Fair";
  return "Needs Attention";
}

function getRecommendation(weakest: { label: string; score: number }, profile: FinancialDNASnapshot) {
  const income = profile.monthlyIncome ?? 0;
  const sip = getMetrics(profile).recommendedSip;

  if (weakest.label === "Debt Management") {
    return "Your EMI burden needs attention. Prioritize prepaying high-interest loans before increasing new investments.";
  }

  if (weakest.label === "Emergency Readiness") {
    return `Build an emergency fund worth at least 3 months of expenses. Start with ${rupee.format(Math.max(1000, Math.round(income * 0.1)))} this month.`;
  }

  if (weakest.label === "Investment Diversity") {
    return `Your goals need a stronger investment plan. Consider starting a diversified SIP near ${rupee.format(Math.max(1000, sip))}/month.`;
  }

  if (weakest.label === "Insurance Coverage") {
    return "Your insurance coverage score is low. Consider term life protection sized around your family's needs before taking on more risk.";
  }

  return "Your savings discipline can improve. Automate a transfer on salary day so your goals get funded before spending begins.";
}

function ScoreRing({ score }: { score: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getColor(score);

  return (
    <div className="relative grid place-items-center">
      <svg className="size-40 -rotate-90" viewBox="0 0 140 140" aria-hidden="true">
        <circle
          cx="70"
          cy="70"
          fill="none"
          r={radius}
          stroke="rgb(226 232 240)"
          strokeWidth="12"
        />
        <circle
          cx="70"
          cy="70"
          fill="none"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth="12"
          className={`${color.arc} transition-all duration-700 ease-out`}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-4xl font-bold tracking-tight text-slate-950">{score}</p>
        <p className="text-sm font-semibold text-slate-500">/ 100</p>
      </div>
    </div>
  );
}

function StarRating({ score }: { score: number }) {
  const filled = Math.max(1, Math.ceil(score / 20));

  return (
    <div className="flex justify-center gap-1">
      {[1, 2, 3, 4, 5].map((item) => (
        <Star
          key={item}
          className={`size-5 ${
            item <= filled ? "fill-amber-400 text-amber-400" : "text-slate-300"
          }`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function FinancialDNAInsights({ profile }: { profile: FinancialDNASnapshot }) {
  const metrics = getMetrics(profile);
  const breakdown = getBreakdown(profile);
  const score = Math.round(
    breakdown.reduce((total, item) => total + item.score, 0) / breakdown.length
  );
  const weakest = [...breakdown].sort((a, b) => a.score - b.score)[0];
  const risk = getRiskMeta(profile.riskAppetite);
  const RiskIcon = risk.Icon;
  const scoreColor = getColor(score);
  const goals = profile.financialGoals?.filter(Boolean) ?? [];

  return (
    <section className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-[28px] border border-white/70 bg-white/85 p-6 text-center shadow-sm shadow-slate-200/70 backdrop-blur">
          <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Dna className="size-6" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">
            DNA Score
          </h2>
          <div className="mt-2">
            <ScoreRing score={score} />
          </div>
          <StarRating score={score} />
          <p className={`mt-2 text-sm font-bold ${scoreColor.text}`}>
            {getScoreLabel(score)}
          </p>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-600">
            Based on your income, debt, goals, and risk appetite. Updated every
            time you retake.
          </p>
        </article>

        <article className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-sm shadow-slate-200/70 backdrop-blur">
          <div className="flex gap-4">
            <div className={`grid size-12 shrink-0 place-items-center rounded-2xl ${risk.bubble}`}>
              <RiskIcon className="size-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                {risk.label}
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">{risk.text}</p>
            </div>
          </div>

          <div className="my-5 h-px bg-slate-100" />

          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            {[
              ["Age", formatValue(profile.ageRange)],
              ["City", formatValue(profile.city)],
              ["Employment", formatValue(profile.incomeType)],
              ["Life Stage", formatValue(profile.lifeStage)],
              ["Monthly", metrics.income ? rupee.format(metrics.income) : formatValue(profile.monthlyIncomeRange)],
              ["Dependents", formatValue(profile.dependents ?? 0)]
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
                <p className="mt-1 font-semibold text-slate-950">{value}</p>
              </div>
            ))}
          </div>

          {goals.length > 0 ? (
            <>
              <div className="my-5 h-px bg-slate-100" />
              <p className="text-sm font-semibold text-slate-950">Your Goals</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {goals.map((goal) => (
                  <span
                    key={goal}
                    className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-900"
                  >
                    {goalEmoji[goal] ?? "🎯"} {goal}
                  </span>
                ))}
              </div>
            </>
          ) : null}
        </article>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            Icon: PiggyBank,
            label: "Savings Capacity",
            subline: "Est. per month",
            value: rupee.format(metrics.savingsCapacity)
          },
          {
            Icon: TrendingUp,
            label: "Recommended SIP",
            subline: "Monthly target",
            value: rupee.format(metrics.recommendedSip)
          },
          {
            Icon: Banknote,
            label: "EMI Burden",
            subline: "Of income to EMI",
            value: `${metrics.emiBurden}%`
          }
        ].map(({ Icon, label, subline, value }) => (
          <article
            key={label}
            className="rounded-[24px] border border-white/70 bg-white/85 p-5 shadow-sm shadow-slate-200/70 backdrop-blur"
          >
            <div className="grid size-11 place-items-center rounded-2xl bg-slate-950 text-white">
              <Icon className="size-5" aria-hidden="true" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{value}</p>
            <p className="mt-1 text-sm text-slate-500">{subline}</p>
          </article>
        ))}
      </div>

      <article className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-sm shadow-slate-200/70 backdrop-blur">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950">
          DNA Breakdown
        </h2>
        <div className="mt-5 space-y-4">
          {breakdown.map((item) => {
            const color = getColor(item.score);

            return (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-slate-700">{item.label}</span>
                  <span className="font-bold text-slate-950">
                    {item.score}/100 {color.dot}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${color.bar} transition-all duration-700`}
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </article>

      <article className="rounded-[28px] border border-amber-100 bg-[linear-gradient(135deg,#fff7ed_0%,#ecfeff_100%)] p-6 shadow-sm shadow-slate-200/70">
        <div className="flex gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white text-amber-700 shadow-sm">
            <PiggyBank className="size-6" aria-hidden="true" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-bold uppercase text-slate-600">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Top Recommendation for You
            </div>
            <p className="mt-3 text-base font-semibold leading-7 text-slate-950">
              {getRecommendation(weakest, profile)}
            </p>
          </div>
        </div>
      </article>
    </section>
  );
}

export default async function FinancialDNAPage() {
  const clerkUser = await currentUser();
  let financialDNA: FinancialDNASnapshot | null = null;

  if (clerkUser) {
    await connectToDatabase();
    const appUser = await UserModel.findOne({ clerkId: clerkUser.id });

    if (appUser) {
      financialDNA = await FinancialDNAModel.findOne({
        userId: appUser._id
      }).lean<FinancialDNASnapshot | null>();
    }
  }

  const existingSummary = financialDNA?.summary ?? "";

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Financial DNA
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Your unique financial personality and risk profile.
          </p>
        </div>
        <RetakeDNAButton userId={clerkUser?.id} />
      </div>

      <OnboardingChat initialSummary={existingSummary} userId={clerkUser?.id} />

      {financialDNA ? <FinancialDNAInsights profile={financialDNA} /> : null}
    </main>
  );
}
