import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongoose";
import { FinancialDNAOnboardingModel, FinancialDNAModel, UserModel } from "@/models";

type IncomeType =
  | "salaried"
  | "business"
  | "freelance"
  | "student"
  | "retired"
  | "other";

type RiskAppetite = "low" | "medium" | "high";

type DNAAnswers = {
  ageRange?: string;
  city?: string;
  dependents?: number;
  emiAmount?: number;
  emiRange?: string;
  financialGoals?: string[];
  hasLoans?: boolean;
  incomeAmount?: number;
  incomeRange?: string;
  incomeType?: IncomeType;
  lifeStage?: string;
  name?: string;
  occupation?: string;
  riskAppetite?: RiskAppetite;
};

const TOTAL_STEPS = 11;

const incomeTypeByMessage: { pattern: RegExp; type: IncomeType; occupation: string }[] = [
  { occupation: "salaried professional", pattern: /salaried/i, type: "salaried" },
  { occupation: "self-employed professional", pattern: /self-employed|self employed/i, type: "other" },
  { occupation: "business owner", pattern: /business/i, type: "business" },
  { occupation: "freelancer", pattern: /freelance/i, type: "freelance" },
  { occupation: "retired", pattern: /retired/i, type: "retired" },
  { occupation: "student", pattern: /student/i, type: "student" }
];

function getIncomeAmount(message: string) {
  if (/under/i.test(message)) {
    return 15000;
  }

  if (/20k|20,000|40k|40,000/i.test(message)) {
    return 30000;
  }

  if (/70k|70,000/i.test(message)) {
    return 55000;
  }

  if (/1 lakh|1l|1 lakh/i.test(message) && /70k|70,000/i.test(message)) {
    return 85000;
  }

  if (/2l|2 lakh|2 lakhs/i.test(message)) {
    return /above/i.test(message) ? 250000 : 150000;
  }

  const numeric = message.replace(/,/g, "").match(/\d+(?:\.\d+)?/);

  return numeric ? Number(numeric[0]) : 50000;
}

function getEmiAmount(message: string) {
  if (/under/i.test(message)) {
    return 3000;
  }

  if (/5k|5,000|15k|15,000/i.test(message)) {
    return 10000;
  }

  if (/30k|30,000/i.test(message)) {
    return 22500;
  }

  if (/50k|50,000/i.test(message)) {
    return 40000;
  }

  if (/above/i.test(message)) {
    return 60000;
  }

  const numeric = message.replace(/,/g, "").match(/\d+(?:\.\d+)?/);

  return numeric ? Number(numeric[0]) : 0;
}

function getDependents(message: string) {
  if (/none|zero|0/i.test(message)) {
    return 0;
  }

  if (/4\+|four/i.test(message)) {
    return 4;
  }

  const numeric = message.match(/\d+/);

  return numeric ? Number(numeric[0]) : 0;
}

function getLoanStatus(message: string) {
  if (/yes|loan|emi/i.test(message)) {
    return true;
  }

  if (/no|debt-free|debt free/i.test(message)) {
    return false;
  }

  return undefined;
}

function getRiskAppetite(message: string): RiskAppetite | undefined {
  if (/conservative|safety|lower/i.test(message)) {
    return "low";
  }

  if (/aggressive|volatility|maximum/i.test(message)) {
    return "high";
  }

  if (/moderate|balanced|growth/i.test(message)) {
    return "medium";
  }

  return undefined;
}

function mergeAnswers(current: DNAAnswers, message: string, step: number): DNAAnswers {
  const next = { ...current };
  const trimmed = message.trim();

  if (!trimmed) {
    return next;
  }

  if (step === 0) {
    next.name = trimmed.split(/\s+/)[0];
  }

  if (step === 1) {
    next.ageRange = trimmed;
  }

  if (step === 2) {
    next.city = trimmed;
  }

  if (step === 3) {
    const match = incomeTypeByMessage.find((item) => item.pattern.test(trimmed));
    next.incomeType = match?.type ?? "other";
    next.occupation = match?.occupation ?? trimmed;
  }

  if (step === 4) {
    next.incomeRange = trimmed;
    next.incomeAmount = getIncomeAmount(trimmed);
  }

  if (step === 5) {
    next.lifeStage = trimmed;
  }

  if (step === 6) {
    next.dependents = getDependents(trimmed);
  }

  if (step === 7) {
    next.hasLoans = getLoanStatus(trimmed);
    if (next.hasLoans === false) {
      next.emiAmount = 0;
      next.emiRange = "No EMI";
    }
  }

  if (step === 8) {
    next.emiRange = trimmed;
    next.emiAmount = getEmiAmount(trimmed);
  }

  if (step === 9) {
    next.financialGoals = trimmed
      .split(",")
      .map((goal) => goal.trim())
      .filter(Boolean)
      .slice(0, 4);
  }

  if (step === 10) {
    next.riskAppetite = getRiskAppetite(trimmed) ?? "medium";
  }

  return next;
}

function getNextStep(answers: DNAAnswers) {
  if (!answers.name) return 0;
  if (!answers.ageRange) return 1;
  if (!answers.city) return 2;
  if (!answers.incomeType) return 3;
  if (answers.incomeAmount === undefined) return 4;
  if (!answers.lifeStage) return 5;
  if (answers.dependents === undefined) return 6;
  if (answers.hasLoans === undefined) return 7;
  if (answers.hasLoans && answers.emiAmount === undefined) return 8;
  if (!answers.financialGoals?.length) return 9;
  if (!answers.riskAppetite) return 10;

  return TOTAL_STEPS;
}

function getPromptForStep(step: number, answers: DNAAnswers) {
  if (step === 0) {
    return "Namaste! I'm ArthSaathi, your personal AI financial companion.\nBefore we build your Financial DNA, what should I call you?";
  }

  if (step === 1) {
    return `Nice to meet you, ${answers.name}! How old are you?`;
  }

  if (step === 2) {
    return "Which city are you based in?";
  }

  if (step === 3) {
    return `Got it, ${answers.city}! What kind of work do you do?`;
  }

  if (step === 4) {
    return "What's your approximate monthly income?";
  }

  if (step === 5) {
    return "What's your current family situation?";
  }

  if (step === 6) {
    return "How many people depend on you financially? (parents, children, etc.)";
  }

  if (step === 7) {
    return "Do you have any existing loans or EMIs running right now?";
  }

  if (step === 8) {
    return "What's your total monthly EMI across all loans?";
  }

  if (step === 9) {
    return `Almost done, ${answers.name}! What are your main financial goals? Pick up to 4.`;
  }

  if (step === 10) {
    return "Last question! How comfortable are you with investment risk?";
  }

  return "";
}

function getRiskProfile(riskAppetite: RiskAppetite) {
  if (riskAppetite === "low") {
    return "conservative";
  }

  if (riskAppetite === "high") {
    return "growth";
  }

  return "balanced";
}

function getDebtComfortLevel(answers: DNAAnswers) {
  if (!answers.hasLoans || !answers.emiAmount || !answers.incomeAmount) {
    return "low";
  }

  const emiRatio = answers.emiAmount / Math.max(answers.incomeAmount, 1);

  if (emiRatio > 0.4) {
    return "high";
  }

  if (emiRatio > 0.2) {
    return "medium";
  }

  return "low";
}

function getSummary(answers: DNAAnswers) {
  const goals = answers.financialGoals?.join(", ") || "your financial goals";
  const loanText = answers.hasLoans
    ? `You currently have EMIs around ${answers.emiRange}.`
    : "You are currently debt-free.";

  return `${answers.name} is based in ${answers.city}, in the ${answers.ageRange} age range, and is a ${answers.occupation}. Monthly income is around ${answers.incomeRange}. Life stage: ${answers.lifeStage}, with ${answers.dependents ?? 0} financial dependent(s). ${loanText} Main goals: ${goals}. Risk style is ${answers.riskAppetite}.`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, reset, userId } = body;
    await connectToDatabase();

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress;

    const appUser = await UserModel.findOneAndUpdate(
      { clerkId: userId },
      {
        clerkId: userId,
        email: email || `${userId}@clerk.arthsathi.local`,
        firstName: clerkUser?.firstName,
        lastName: clerkUser?.lastName,
        imageUrl: clerkUser?.imageUrl,
        onboardingStatus: "in_progress",
        lastActiveAt: new Date()
      },
      {
        new: true,
        setDefaultsOnInsert: true,
        upsert: true
      }
    );

    if (!appUser) {
      return NextResponse.json(
        { error: "User profile not found. Please refresh and try again." },
        { status: 404 }
      );
    }

    const appUserId = appUser._id;

    let onboard = await FinancialDNAOnboardingModel.findOne({ userId: appUserId });
    if (!onboard) {
      onboard = await FinancialDNAOnboardingModel.create({
        answers: {},
        step: 0,
        userId: appUserId
      });
    }

    if (reset === true) {
      onboard.completed = false;
      onboard.step = 0;
      onboard.answers = {};
      onboard.markModified("answers");
      await onboard.save();
      appUser.onboardingStatus = "in_progress";
      await appUser.save();

      return NextResponse.json({
        completed: false,
        reply: getPromptForStep(0, {})
      });
    }

    if (onboard.completed) {
      const existing = await FinancialDNAModel.findOne({ userId: appUserId });
      const hasUsableDNA =
        existing &&
        existing.monthlyIncome > 0 &&
        existing.financialGoals.some((goal: string) => goal.trim().length > 0);

      if (!hasUsableDNA) {
        onboard.completed = false;
        onboard.step = 0;
        onboard.answers = {};
        onboard.markModified("answers");
        await onboard.save();
      } else {
        const reply = existing?.summary
          ? `Your Financial DNA is already complete: ${existing.summary}`
          : "Your Financial DNA is already complete. You can continue to the dashboard.";
        return NextResponse.json({ completed: true, reply });
      }
    }

    const currentAnswers = (onboard.answers || {}) as DNAAnswers;
    const answers = mergeAnswers(
      currentAnswers,
      String(message || ""),
      onboard.step ?? 0
    );
    const nextStep = getNextStep(answers);

    onboard.answers = answers;
    onboard.step = nextStep;
    onboard.markModified("answers");
    await onboard.save();

    if (nextStep < TOTAL_STEPS) {
      return NextResponse.json({
        answers,
        completed: false,
        reply: getPromptForStep(nextStep, answers),
        step: nextStep
      });
    }

    const riskAppetite = answers.riskAppetite ?? "medium";
    const summary = getSummary(answers);
    const fdna = await FinancialDNAModel.findOneAndUpdate(
      { userId: appUserId },
      {
        ageRange: answers.ageRange,
        city: answers.city,
        debtComfortLevel: getDebtComfortLevel(answers),
        dependents: answers.dependents ?? 0,
        financialGoals: answers.financialGoals ?? [],
        hasLoans: answers.hasLoans ?? false,
        incomeStability:
          answers.incomeType === "salaried"
            ? "high"
            : answers.incomeType === "business" || answers.incomeType === "freelance"
              ? "medium"
              : "low",
        incomeType: answers.incomeType ?? "other",
        lastCalculatedAt: new Date(),
        lifeStage: answers.lifeStage,
        monthlyEmi: answers.emiAmount ?? 0,
        monthlyEmiRange: answers.emiRange,
        monthlyIncome: answers.incomeAmount ?? 0,
        monthlyIncomeRange: answers.incomeRange,
        occupation: answers.occupation || "Not specified",
        preferredAdviceStyle: "simple",
        riskAppetite,
        riskProfile: getRiskProfile(riskAppetite),
        summary,
        tags: [answers.city, answers.lifeStage, answers.incomeRange].filter(Boolean),
        userId: appUserId
      },
      { new: true, setDefaultsOnInsert: true, upsert: true }
    );

    onboard.completed = true;
    await onboard.save();
    appUser.firstName = answers.name || appUser.firstName;
    appUser.onboardingStatus = "completed";
    await appUser.save();

    return NextResponse.json({
      answers,
      completed: true,
      fdna,
      reply: `Excellent, ${answers.name}! I have everything I need.`
    });
  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : String(err);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
