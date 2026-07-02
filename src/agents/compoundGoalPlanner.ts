import { FinancialDNAModel, GoalModel } from "@/models";
import { getBudgetCoachResult } from "@/lib/budget-coach";
import { getCashSmoothingResult } from "@/lib/cash-smoothing";
import { getGoalRoadmaps } from "@/lib/goal-roadmap";

import { Intent } from "./intents";
import type { AgentContext, AgentResponse } from "./types";

type ParsedGoal = {
  description: string;
  goalType:
    | "emergency_fund"
    | "investment"
    | "debt_repayment"
    | "purchase"
    | "education"
    | "travel"
    | "other";
  targetAmount: number;
  targetDate?: Date;
  title: string;
};

type FinancialDNASnapshot = {
  monthlyIncome: number;
  occupation?: string;
};

const monthIndex: Record<string, number> = {
  january: 0,
  jan: 0,
  february: 1,
  feb: 1,
  march: 2,
  mar: 2,
  april: 3,
  apr: 3,
  may: 4,
  june: 5,
  jun: 5,
  july: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sep: 8,
  october: 9,
  oct: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11
};

const wordNumbers: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  fifteen: 15,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50
};

function formatRupees(value: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(Math.round(value));
}

function monthsUntil(targetDate?: Date) {
  if (!targetDate) {
    return null;
  }

  const now = new Date();
  const months =
    (targetDate.getFullYear() - now.getFullYear()) * 12 +
    targetDate.getMonth() -
    now.getMonth();

  return Math.max(1, months);
}

function parseTargetDate(message: string) {
  const match = message.match(
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{4})\b/i
  );

  if (!match?.[1] || !match[2] || !match[3]) {
    return undefined;
  }

  return new Date(Number(match[3]), monthIndex[match[2].toLowerCase()], Number(match[1]));
}

function extractNumericAmounts(normalized: string) {
  const amounts: number[] = [];
  const numberPattern = /\d+(?:\.\d+)?/g;

  for (const match of normalized.matchAll(numberPattern)) {
    const raw = match[0];
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      continue;
    }

    const after = normalized.slice((match.index ?? 0) + raw.length, (match.index ?? 0) + raw.length + 16);
    if (/\s*(?:lakh|lakhs|lac|lacs)\b/.test(after)) {
      amounts.push(value * 100000);
    } else if (/\s*(?:crore|crores|cr)\b/.test(after)) {
      amounts.push(value * 10000000);
    } else if (value >= 1000) {
      amounts.push(value);
    }
  }

  return amounts;
}

function extractWordAmounts(normalized: string) {
  const amounts: number[] = [];
  const wordPattern = new RegExp(
    `\\b(${Object.keys(wordNumbers).join("|")})\\s+(lakh|lakhs|lac|lacs|crore|crores|cr)\\b`,
    "g"
  );

  for (const match of normalized.matchAll(wordPattern)) {
    const value = wordNumbers[match[1]];
    if (!value) {
      continue;
    }

    amounts.push(/crore|cr/.test(match[2]) ? value * 10000000 : value * 100000);
  }

  return amounts;
}

function parseTargetAmount(message: string) {
  const normalized = message.toLowerCase().replaceAll(",", "");
  const amounts = [
    ...extractNumericAmounts(normalized),
    ...extractWordAmounts(normalized)
  ].filter((value) => Number.isFinite(value) && value > 0);

  return amounts.length > 0 ? Math.round(Math.max(...amounts)) : 0;
}

function classifyGoal(message: string): ParsedGoal["goalType"] {
  if (/\b(car|bike|scooter|phone|laptop|house|home|buy|purchase)\b/i.test(message)) {
    return "purchase";
  }

  if (/\beducation|college|school|degree\b/i.test(message)) {
    return "education";
  }

  if (/\btravel|trip|vacation\b/i.test(message)) {
    return "travel";
  }

  if (/\bdebt|loan|emi|repay\b/i.test(message)) {
    return "debt_repayment";
  }

  if (/\binvest|sip|portfolio\b/i.test(message)) {
    return "investment";
  }

  if (/\bemergency\b/i.test(message)) {
    return "emergency_fund";
  }

  return "other";
}

function parseGoal(message: string): ParsedGoal {
  const targetDate = parseTargetDate(message);
  const targetAmount = parseTargetAmount(message);
  const lower = message.toLowerCase();
  let title = "Financial goal";

  if (/\bcar\b/.test(lower)) {
    title = /mom|mother|maa/i.test(message) ? "Buy a car for mom" : "Buy a car";
  } else if (/\bbike|scooter\b/.test(lower)) {
    title = "Buy a bike";
  } else if (/\bhouse|home\b/.test(lower)) {
    title = "Buy a home";
  } else if (/\beducation|college|school|degree\b/.test(lower)) {
    title = "Education goal";
  } else {
    const goalMatch = message.match(
      /(?:goal is|want to|i want to|planning to)\s+(.+?)(?:\s+by\s+|\s+on\s+|\s+without\s+|$)/i
    );
    title = goalMatch?.[1]?.trim() || title;
  }

  return {
    description: message.trim(),
    goalType: classifyGoal(message),
    targetAmount,
    targetDate,
    title
  };
}

export function isCompoundGoalPlanningRequest(message: string) {
  const hasGoalLanguage = /\b(goal|want to|planning to|buy|purchase|achieve|roadmap|financial crisis|without crisis|how can i afford)\b/i.test(
    message
  );
  const looksLikeBudgetFollowUp =
    /\b(budget|price|cost|amount|on-road|on road|range)\b/i.test(message) &&
    parseTargetAmount(message) > 0;

  return hasGoalLanguage || looksLikeBudgetFollowUp;
}

async function getPendingGoal(context: AgentContext) {
  if (!context.appUserId) {
    return null;
  }

  return GoalModel.findOne({
    status: "active",
    targetAmount: 0,
    userId: context.appUserId
  }).sort({ updatedAt: -1 });
}

async function saveGoal(parsedGoal: ParsedGoal, context: AgentContext) {
  if (!context.appUserId) {
    return null;
  }

  const goal = await GoalModel.findOneAndUpdate(
    {
      status: "active",
      title: parsedGoal.title,
      userId: context.appUserId
    },
    {
      $set: {
        description: parsedGoal.description,
        goalType: parsedGoal.goalType,
        priority: "high",
        targetAmount: parsedGoal.targetAmount,
        targetDate: parsedGoal.targetDate,
        title: parsedGoal.title,
        userId: context.appUserId
      },
      $setOnInsert: {
        currentAmount: 0,
        currency: "INR",
        status: "active"
      }
    },
    {
      new: true,
      setDefaultsOnInsert: true,
      upsert: true
    }
  );

  const dna = await FinancialDNAModel.findOne({ userId: context.appUserId });
  if (dna) {
    const existingGoals = Array.isArray(dna.financialGoals) ? dna.financialGoals : [];
    dna.financialGoals = [
      parsedGoal.title,
      ...existingGoals.filter((goalTitle: string) => goalTitle !== parsedGoal.title)
    ];
    await dna.save();
  }

  return goal;
}

function getCompletedPrompt(parsedGoal: ParsedGoal, monthlyRequired: number, targetMonths: number | null) {
  const dateText = parsedGoal.targetDate
    ? ` by ${new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(parsedGoal.targetDate)}`
    : "";
  const monthsText = targetMonths ? ` over ${targetMonths} months` : "";

  return `Plan the goal "${parsedGoal.title}"${dateText} with target budget ${formatRupees(
    parsedGoal.targetAmount
  )}${monthsText}. Required monthly saving is ${formatRupees(monthlyRequired)}.`;
}

function getSavingsSafetyText(monthlyRequired: number, netMonthlyCashflow: number) {
  if (netMonthlyCashflow <= 0) {
    return "I cannot confirm affordability yet because your recorded monthly expenses are missing or higher than income. Add recent expenses before committing to this purchase.";
  }

  if (monthlyRequired > netMonthlyCashflow) {
    return `This goal is not safe at the current pace: it needs ${formatRupees(
      monthlyRequired
    )}/month, but your estimated spare cash is ${formatRupees(netMonthlyCashflow)}/month.`;
  }

  const remaining = netMonthlyCashflow - monthlyRequired;
  return `This can be workable if you reserve ${formatRupees(
    monthlyRequired
  )}/month first and keep about ${formatRupees(remaining)}/month as breathing room.`;
}

function getTimelineText(targetMonths: number | null) {
  if (!targetMonths) {
    return "No target date is set yet, so I used a 12-month planning view. Add a date if the deadline matters.";
  }

  return `Timeline: ${targetMonths} month${targetMonths > 1 ? "s" : ""} remaining.`;
}

export async function handleCompoundGoalPlanner(
  message: string,
  context: AgentContext = {}
): Promise<AgentResponse> {
  const rawParsedGoal = parseGoal(message);
  const pendingGoal = await getPendingGoal(context);
  const isBudgetFollowUp = Boolean(pendingGoal) && rawParsedGoal.targetAmount > 0;
  const parsedGoal: ParsedGoal =
    isBudgetFollowUp && pendingGoal
      ? {
          description: pendingGoal.description
            ? `${pendingGoal.description} ${message.trim()}`
            : message.trim(),
          goalType: pendingGoal.goalType,
          targetAmount: rawParsedGoal.targetAmount,
          targetDate: pendingGoal.targetDate,
          title: pendingGoal.title
        }
      : rawParsedGoal;
  const savedGoal = await saveGoal(parsedGoal, context);

  if (parsedGoal.targetAmount <= 0) {
    const dateText = parsedGoal.targetDate
      ? ` by ${new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(parsedGoal.targetDate)}`
      : "";

    return {
      agent: "orchestrator",
      data: {
        goalId: savedGoal ? String(savedGoal._id) : null,
        missing: "targetAmount",
        parsedGoal
      },
      intent: Intent.ACTION_PLAN,
      text: `I saved "${parsedGoal.title}" as your main active goal${dateText}. I still need the expected budget/on-road price before calculating monthly saving. Tell me like: "car budget is 10 lakh to 20 lakh".`
    };
  }

  const targetMonths = monthsUntil(parsedGoal.targetDate) ?? 12;
  const monthlyRequired = Math.ceil(parsedGoal.targetAmount / targetMonths);
  const completePrompt = getCompletedPrompt(parsedGoal, monthlyRequired, targetMonths);

  const [financialDNA, budgetResult, cashResult, roadmaps, simulationAgent] = await Promise.all([
    context.appUserId
      ? FinancialDNAModel.findOne({ userId: context.appUserId }).lean<FinancialDNASnapshot | null>()
      : null,
    context.appUserId ? getBudgetCoachResult(context.appUserId as any) : null,
    context.appUserId ? getCashSmoothingResult(context.appUserId as any) : null,
    context.appUserId ? getGoalRoadmaps(context.appUserId as any) : [],
    import("./futureSimulation")
  ]);
  const simulationResult = await simulationAgent.handleFutureSimulation(
    `what if I save ${monthlyRequired} per month for ${targetMonths} months`,
    context
  );

  const activeRoadmap = roadmaps.find(
    ({ goal }: any) => String(goal._id) === String(savedGoal?._id)
  )?.roadmap;
  const dateText = parsedGoal.targetDate
    ? ` by ${new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(parsedGoal.targetDate)}`
    : "";
  const incomeText = financialDNA?.monthlyIncome
    ? `Your Financial DNA income is ${formatRupees(financialDNA.monthlyIncome)}/month.`
    : "Your monthly income is not available in Financial DNA yet.";
  const netCashflow = budgetResult?.netMonthlyCashflow ?? 0;
  const savingsRate = budgetResult?.savingsRate ?? 0;
  const affordabilityText = getSavingsSafetyText(monthlyRequired, netCashflow);
  const expenseText =
    budgetResult && budgetResult.estimatedMonthlyExpenses > 0
      ? `Estimated expenses are ${formatRupees(budgetResult.estimatedMonthlyExpenses)}/month, so estimated spare cash is ${formatRupees(netCashflow)}/month.`
      : "I do not have enough expense entries yet, so this is a provisional plan until you log real spending.";
  const cashText = cashResult
    ? `Cash-smoothing risk is ${cashResult.riskLevel}. Keep a shock buffer of about ${formatRupees(
        cashResult.monthlyShockBuffer
      )}/month before flexible spending.`
    : "Cash-smoothing check needs your profile and transactions.";
  const roadmapStatus = activeRoadmap?.status
    ? activeRoadmap.status.replaceAll("_", " ")
    : monthlyRequired > netCashflow
      ? "at risk"
      : "on track";

  return {
    agent: "orchestrator",
    data: {
      agentsUsed: ["goals", "budget_coach", "cash_smoothing", "future_simulation"],
      completePrompt,
      goalId: savedGoal ? String(savedGoal._id) : null,
      parsedGoal,
      results: {
        budget: budgetResult,
        cashSmoothing: cashResult,
        goals: activeRoadmap ?? null,
        simulation: simulationResult.data
      }
    },
    intent: Intent.ACTION_PLAN,
    text: `${isBudgetFollowUp ? "Got it. I updated" : "I added"} "${parsedGoal.title}" as your main active goal${dateText}. Target budget used: ${formatRupees(
      parsedGoal.targetAmount
    )}.

1. Goal roadmap
${getTimelineText(targetMonths)} Required saving: ${formatRupees(monthlyRequired)}/month. Current roadmap status: ${roadmapStatus}.

2. Budget safety check
${incomeText} ${expenseText} ${affordabilityText} Savings rate from available data: ${savingsRate}%.

3. Cash-crisis protection
${cashText} Do not take an EMI or booking amount until emergency money and monthly goal saving are separated.

4. What-if simulation
${simulationResult.text}

Next best action: log this month's major expenses and confirm whether the target budget should be the lower end or upper end of the car range. I used the upper end for safer planning.`
  };
}
