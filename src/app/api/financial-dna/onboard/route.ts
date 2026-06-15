import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/mongoose";
import { FinancialDNAOnboardingModel, FinancialDNAModel, UserModel } from "@/models";

type IncomeType =
  | "salaried"
  | "business"
  | "freelance"
  | "student"
  | "homemaker"
  | "retired"
  | "other";

type DNAAnswers = {
  emergency?: boolean;
  financialGoal?: string;
  incomeAmount?: number;
  incomeType?: IncomeType;
  occupation?: string;
};

const incomeTypePatterns: { type: IncomeType; pattern: RegExp }[] = [
  { type: "salaried", pattern: /\b(salary|salaried|employee|job|teacher|professor|engineer|developer|doctor|nurse|government job|private job)\b/i },
  { type: "business", pattern: /\b(business|shop|store|merchant|vendor|owner|self employed|self-employed|startup|company)\b/i },
  { type: "freelance", pattern: /\b(freelance|freelancer|contract|consultant|gig|delivery|driver|creator)\b/i },
  { type: "student", pattern: /\b(student|college|school|studying)\b/i },
  { type: "homemaker", pattern: /\b(homemaker|housewife|house husband|home maker)\b/i },
  { type: "retired", pattern: /\b(retired|pension|pensioner)\b/i },
  { type: "other", pattern: /\b(other|none of these)\b/i }
];

function normalizeAmount(raw: string) {
  const cleaned = raw.replace(/,/g, "");
  const value = Number(cleaned);

  return Number.isFinite(value) ? value : undefined;
}

function normalizeAmountRange(firstRaw: string, secondRaw?: string) {
  const first = normalizeAmount(firstRaw);
  const second = secondRaw ? normalizeAmount(secondRaw) : undefined;

  if (first === undefined) {
    return undefined;
  }

  if (second === undefined) {
    return first;
  }

  const scaledFirst =
    first < 1000 && second >= 1000
      ? first * 10 ** Math.max(0, String(Math.round(second)).length - String(Math.round(first)).length)
      : first;

  return Math.round((scaledFirst + second) / 2);
}

const numberWords: Record<string, number> = {
  a: 1,
  an: 1,
  eight: 8,
  eighteen: 18,
  eighty: 80,
  eleven: 11,
  fifteen: 15,
  fifty: 50,
  five: 5,
  forty: 40,
  four: 4,
  fourteen: 14,
  hundred: 100,
  nine: 9,
  nineteen: 19,
  ninety: 90,
  one: 1,
  seven: 7,
  seventeen: 17,
  seventy: 70,
  six: 6,
  sixteen: 16,
  sixty: 60,
  ten: 10,
  thirteen: 13,
  thirty: 30,
  three: 3,
  twelve: 12,
  twenty: 20,
  two: 2,
  zero: 0
};

function parseSmallNumberWords(text: string) {
  const tokens = text
    .toLowerCase()
    .replace(/-/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  let total = 0;
  let current = 0;
  let found = false;

  for (const token of tokens) {
    const value = numberWords[token];

    if (value === undefined) {
      continue;
    }

    found = true;

    if (token === "hundred") {
      current = Math.max(1, current) * 100;
    } else {
      current += value;
    }
  }

  total += current;

  return found ? total : undefined;
}

function extractIndianWordAmount(message: string) {
  const normalized = message.toLowerCase().replace(/,/g, "");
  const numberWordPattern =
    "(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|a|an)";
  const match = normalized.match(
    new RegExp(
      `\\b((?:\\d+(?:\\.\\d+)?|${numberWordPattern}(?:[-\\s]+${numberWordPattern}){0,4}))\\s+(lakh|lac|lakhs|lacs|crore|crores|thousand|k)\\b`,
      "i"
    )
  );

  if (!match?.[1] || !match[2]) {
    return undefined;
  }

  const base = Number.isFinite(Number(match[1]))
    ? Number(match[1])
    : parseSmallNumberWords(match[1]);

  if (!base) {
    return undefined;
  }

  const multipliers: Record<string, number> = {
    crore: 10000000,
    crores: 10000000,
    k: 1000,
    lac: 100000,
    lacs: 100000,
    lakh: 100000,
    lakhs: 100000,
    thousand: 1000
  };
  const multiplier = multipliers[match[2].toLowerCase()];

  if (!multiplier) {
    return undefined;
  }

  return Math.round(base * multiplier);
}

function extractIncomeAmount(message: string) {
  const normalized = message.replace(/[–—]/g, "-");
  const range = normalized.match(
    /(?:earn|earned|earning|income|salary|make|receive|received|getting|got|paid)\D{0,40}(?:₹|rs\.?|inr|rupees?)?\s*(\d[\d,]*(?:\.\d+)?)\s*(?:to|-)\s*(?:₹|rs\.?|inr|rupees?)?\s*(\d[\d,]*(?:\.\d+)?)/i
  );

  if (range?.[1] && range[2]) {
    return normalizeAmountRange(range[1], range[2]);
  }

  const direct = normalized.match(
    /(?:earn|earned|earning|income|salary|make|receive|received|getting|got|paid)\D{0,40}(?:₹|rs\.?|inr|rupees?)?\s*(\d[\d,]*(?:\.\d+)?)(?!\s*(?:to|-)\s*(?:₹|rs\.?|inr|rupees?)?\s*\d)/i
  );

  if (direct?.[1]) {
    return normalizeAmount(direct[1]);
  }

  const wordAmount = extractIndianWordAmount(normalized);

  if (wordAmount !== undefined) {
    return wordAmount;
  }

  const currencyRange = normalized.match(
    /(?:rs\.?|inr|rupees?|₹)\s*(\d[\d,]*(?:\.\d+)?)\s*(?:to|-)\s*(?:rs\.?|inr|rupees?|₹)?\s*(\d[\d,]*(?:\.\d+)?)/i
  );

  if (currencyRange?.[1] && currencyRange[2]) {
    return normalizeAmountRange(currencyRange[1], currencyRange[2]);
  }

  const withCurrency = normalized.match(
    /(?:rs\.?|inr|rupees?|₹)\s*(\d[\d,]*(?:\.\d+)?)|(\d[\d,]*(?:\.\d+)?)\s*(?:rs\.?|inr|rupees?|₹)/i
  );
  const matched = withCurrency?.[1] ?? withCurrency?.[2];

  return matched ? normalizeAmount(matched) : undefined;
}

function extractIncomeType(message: string): IncomeType | undefined {
  return incomeTypePatterns.find((item) => item.pattern.test(message))?.type;
}

function extractOccupation(message: string) {
  const patterns = [
    /\bi am (?:a |an )?([a-zA-Z ]{2,40}?)(?: with| and| who| earning| making|$)/i,
    /\bi work as (?:a |an )?([a-zA-Z ]{2,40}?)(?: with| and| earning| making|$)/i,
    /\bmy occupation is ([a-zA-Z ]{2,40}?)(?: with| and| earning| making|$)/i
  ];

  for (const pattern of patterns) {
    const value = message.match(pattern)?.[1]?.trim();

    if (value) {
      return value;
    }
  }

  if (/\bteacher\b/i.test(message)) {
    return "teacher";
  }

  return undefined;
}

function extractGoal(message: string) {
  const goalMatch = message.match(
    /(?:goal is|main goal is|my goal is|main aim is|want to|planning to|plan to|save for|buy|purchase)\s+(.+?)(?:\s+and\s+(?:my\s+)?emergency|\s+with\s+(?:my\s+)?emergency|$)/i
  );

  if (goalMatch?.[1]) {
    return goalMatch[1]
      .replace(/^to\s+/i, "")
      .trim();
  }

  if (
    /\b(house|home|education|family|bike|car|wedding|business|loan|debt|retirement)\b/i.test(message) &&
    !/\b(emergency fund|emergency savings|emergencies)\b/i.test(message)
  ) {
    return message.trim();
  }

  return undefined;
}

function extractEmergency(message: string) {
  if (/\b(yes|yep|yeah|true|i have|have emergency|saved|one month|1 month)\b/i.test(message)) {
    return true;
  }

  if (/\b(no|nope|nah|false|not yet|do not|don't|dont|no savings)\b/i.test(message)) {
    return false;
  }

  return undefined;
}

function mergeAnswers(current: DNAAnswers, message: string, step: number): DNAAnswers {
  const next = { ...current };
  const isEmergencyStep = step === 3;
  const emergency = extractEmergency(message);
  const hasIncomeCorrection = /\b(earn|earned|earning|income|salary|make|receive|received|getting|got|paid)\b/i.test(message);
  const canUpdateProfileFields = !isEmergencyStep || (isEmergencyStep && emergency === undefined);
  const incomeType = canUpdateProfileFields ? extractIncomeType(message) : undefined;
  const incomeAmount =
    canUpdateProfileFields || hasIncomeCorrection
      ? extractIncomeAmount(message)
      : undefined;
  const occupation = canUpdateProfileFields ? extractOccupation(message) : undefined;
  const goal = canUpdateProfileFields ? extractGoal(message) : undefined;

  if (incomeType && !next.incomeType) {
    next.incomeType = incomeType;
  }

  if (
    incomeAmount !== undefined &&
    (next.incomeAmount === undefined || hasIncomeCorrection || step === 1)
  ) {
    next.incomeAmount = incomeAmount;
  }

  if (occupation && !next.occupation) {
    next.occupation = occupation;
  }

  if (goal && !next.financialGoal) {
    next.financialGoal = goal;
  }

  if (emergency !== undefined) {
    next.emergency = emergency;
  }

  const trimmed = message.trim();

  if (step === 0 && !incomeType && /^[a-zA-Z ]{2,30}$/.test(trimmed)) {
    next.incomeType = extractIncomeType(`I am ${trimmed}`) ?? next.incomeType;
  }

  if (step === 1 && incomeAmount === undefined) {
    const value = normalizeAmount(trimmed);

    if (value !== undefined) {
      next.incomeAmount = value;
    }
  }

  if (step === 2 && !goal && trimmed.length >= 2) {
    next.financialGoal = trimmed;
  }

  return next;
}

function getNextStep(answers: DNAAnswers) {
  if (!answers.incomeType) {
    return 0;
  }

  if (answers.incomeAmount === undefined) {
    return 1;
  }

  if (!answers.financialGoal) {
    return 2;
  }

  if (answers.emergency === undefined) {
    return 3;
  }

  return 4;
}

function getPromptForStep(step: number, answers: DNAAnswers) {
  if (step === 0) {
    return "Tell me your income type in your own words. Example: I get salary, I run a shop, I freelance, I am a student.";
  }

  if (step === 1) {
    return "Got it. What is your monthly income amount? You can say something like: I earn 45,000 rupees per month.";
  }

  if (step === 2) {
    return "Thanks. What is your main financial goal? You can mention family, house, education, emergency fund, debt, or any big purchase.";
  }

  if (step === 3) {
    const capturedIncome =
      answers.incomeAmount !== undefined
        ? new Intl.NumberFormat("en-IN", {
            currency: "INR",
            maximumFractionDigits: 0,
            style: "currency"
          }).format(answers.incomeAmount)
        : "not captured";

    return `Last check: do you already have at least 1 month of expenses saved for emergencies? You can answer yes or no. I have captured income type as ${answers.incomeType} and income as ${capturedIncome}.`;
  }

  return "";
}

function getRiskAppetite(answers: DNAAnswers): "low" | "medium" | "high" {
  if (answers.incomeAmount && answers.incomeAmount > 80000 && answers.emergency) {
    return "high";
  }

  if (answers.emergency) {
    return "medium";
  }

  return "low";
}

function getSummary(answers: DNAAnswers) {
  const occupation = answers.occupation || "user";
  const income =
    answers.incomeAmount !== undefined
      ? new Intl.NumberFormat("en-IN", {
          currency: "INR",
          maximumFractionDigits: 0,
          style: "currency"
        }).format(answers.incomeAmount)
      : "your stated income";
  const emergencyText = answers.emergency
    ? "You already have a basic emergency cushion."
    : "Your first priority should be building at least one month of emergency savings.";

  return `You are a ${occupation} with ${answers.incomeType} income of ${income} per month. Your main goal is ${answers.financialGoal}. ${emergencyText}`;
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
      return NextResponse.json({ error: "User profile not found. Please refresh and try again." }, { status: 404 });
    }

    const appUserId = appUser._id;

    // find or create onboarding doc
    let onboard = await FinancialDNAOnboardingModel.findOne({ userId: appUserId });
    if (!onboard) {
      onboard = await FinancialDNAOnboardingModel.create({ userId: appUserId, answers: {}, step: 0 });
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
        reply:
          "Okay, let's update your Financial DNA. Tell me about your current work, income, monthly earning, main goal, and emergency savings."
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

    if (nextStep < 4) {
      return NextResponse.json({
        answers,
        reply: getPromptForStep(nextStep, answers),
        step: nextStep
      });
    }

      const riskAppetite = getRiskAppetite(answers);
      const summary = getSummary(answers);
      const fdna = await FinancialDNAModel.findOneAndUpdate(
        { userId: appUserId },
        {
          userId: appUserId,
          occupation: answers.occupation || appUser.firstName || "Not specified",
          incomeType: answers.incomeType || "other",
          monthlyIncome: answers.incomeAmount || 0,
          financialGoals: [answers.financialGoal || ""],
          dependents: 0,
          riskAppetite,
          summary,
          riskProfile: riskAppetite === "high" ? "growth" : riskAppetite === "low" ? "conservative" : "balanced",
          incomeStability: answers.incomeType === "salaried" ? "high" : answers.incomeType === "business" || answers.incomeType === "freelance" ? "medium" : "low",
          lastCalculatedAt: new Date()
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      onboard.completed = true;
      await onboard.save();
      appUser.onboardingStatus = "completed";
      await appUser.save();

      return NextResponse.json({
        answers,
        completed: true,
        fdna,
        reply: `All done. Your Financial DNA is ready: ${fdna?.summary}`
      });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
