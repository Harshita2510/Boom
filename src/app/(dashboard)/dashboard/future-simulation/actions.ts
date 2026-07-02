"use server";

import { revalidatePath } from "next/cache";

import { getOrCreateCurrentAppUser } from "@/lib/current-app-user";
import { generateLLMText, hasLLMProvider } from "@/lib/llm";
import { connectToDatabase } from "@/lib/mongoose";
import {
  CommunityPatternModel,
  FinancialDNAModel,
  FutureSimulationModel,
  TransactionModel
} from "@/models";

export type SimulationState = {
  ok: boolean;
  message: string;
};

type FinancialDNASnapshot = {
  debtComfortLevel?: "low" | "medium" | "high";
  dependents?: number;
  incomeStability?: "low" | "medium" | "high";
  monthlyIncome: number;
  monthlyEmi?: number;
  preferredAdviceStyle?: "simple" | "detailed" | "data_driven";
  riskAppetite?: "low" | "medium" | "high";
};

type TransactionSnapshot = {
  amount: number;
  category?: string;
  transactionDate?: Date;
  type: "income" | "expense" | "transfer";
};

type CommunityPatternSnapshot = {
  insight?: string;
};

type AISimulationResponse = {
  communityInsightSummary?: string;
  explanation?: string;
  recommendation?: string;
  scenarios?: {
    key?: string;
    label?: string;
    note?: string;
  }[];
  scenarioA?: {
    label?: string;
    note?: string;
  };
  scenarioB?: {
    label?: string;
    note?: string;
  };
};

type AIPriceEstimateResponse = {
  confidence?: "high" | "low" | "medium";
  estimatedOnRoadPrice?: number;
  highPrice?: number;
  lowPrice?: number;
  notes?: string;
  productName?: string;
};

type SimulationIntent =
  | "cut_expense"
  | "income_change"
  | "loan_emi"
  | "monthly_saving"
  | "purchase"
  | "unknown";

type ParsedScenario = {
  amount: number | null;
  estimatedPriceNote?: string;
  horizonMonths: number;
  intent: SimulationIntent;
  monthlySavingsDelta: number;
  purchaseCost: number;
  purchaseLabel?: string;
  registrationCity?: string;
  waitMonths: number;
};

type GeneratedScenario = {
  emergencyFundMonths: number;
  key: string;
  label: string;
  note: string;
  priority: "best" | "neutral" | "risk";
  savingsAfterTwelveMonths: number;
};

function normalizeQuestion(question: string) {
  return question.toLowerCase().replaceAll(",", "");
}

function extractAmount(question: string) {
  const normalized = normalizeQuestion(question).replace(
    /\b\d{1,2}\s+months?\b/g,
    ""
  );
  const amountMatch = normalized.match(
    /(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(lakh|lac|k|thousand)?/i
  );

  if (!amountMatch?.[1]) {
    return null;
  }

  const amount = Number(amountMatch[1]);
  const unit = amountMatch[2];

  if (/lakh|lac/i.test(unit ?? "")) {
    return amount * 100000;
  }

  if (/k|thousand/i.test(unit ?? "")) {
    return amount * 1000;
  }

  return amount;
}

function extractPurchaseLabel(question: string) {
  const normalized = question
    .replace(/\bwhat if\b|\bshould i\b|\bcan i\b|\bbuy\b|\bpurchase\b|\bget\b/gi, " ")
    .replace(/(?:₹|rs\.?|inr)?\s*\d+(?:\.\d+)?\s*(?:lakh|lac|k|thousand)?/gi, " ")
    .replace(/\b(?:now|vs|wait|after|in|for)\s+\d{1,2}\s+months?\b/gi, " ")
    .replace(/[?.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized || "the vehicle";
}

function parsePositiveNumber(value: FormDataEntryValue | null) {
  const numberValue = Number(String(value ?? "").replaceAll(",", "").trim());
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
}

function extractMonths(question: string, fallback: number) {
  const match = question.match(/(?:wait|after|in|for)\s+(\d{1,2})\s+months?/i);
  return match ? Number(match[1]) : fallback;
}

function inferIntent(question: string): SimulationIntent {
  const normalized = normalizeQuestion(question);

  if (/(buy|purchase|get).*(bike|scooter|phone|laptop|car|house|home)|\b(bike|scooter|phone|laptop|car)\b/.test(normalized)) {
    return "purchase";
  }

  if (/(emi|loan|borrow|debt)/.test(normalized)) {
    return "loan_emi";
  }

  if (/(raise|salary|income|earn|increment|bonus)/.test(normalized)) {
    return "income_change";
  }

  if (/(cut|reduce|cancel|save on|lower|stop).*(expense|spend|subscription|rent|food|shopping|dining|cab|transport)/.test(normalized)) {
    return "cut_expense";
  }

  if (/(save|saving|invest|sip|deposit|add|put aside|per month|monthly)/.test(normalized)) {
    return "monthly_saving";
  }

  return "unknown";
}

function parseScenario(
  question: string,
  overrides: {
    estimatedPriceNote?: string;
    monthlySavingsAvailable?: number | null;
    onRoadPrice?: number | null;
    purchaseLabel?: string;
    registrationCity?: string;
  } = {}
): ParsedScenario {
  const extractedAmount = extractAmount(question);
  const intent = inferIntent(question);
  const amount = overrides.onRoadPrice ?? extractedAmount;
  const waitMonths = extractMonths(question, 6);
  const horizonMonths = extractMonths(question, 12);
  const isMonthlySavingsIncrease =
    intent === "monthly_saving" || intent === "income_change" || intent === "cut_expense";
  const monthlySavingsDelta =
    intent === "loan_emi"
      ? -(amount ?? 0)
      : isMonthlySavingsIncrease
        ? (overrides.monthlySavingsAvailable ?? amount ?? 0)
        : 0;

  return {
    amount,
    estimatedPriceNote: overrides.estimatedPriceNote,
    horizonMonths: Math.max(1, horizonMonths),
    intent,
    monthlySavingsDelta,
    purchaseCost: intent === "purchase" ? amount ?? 0 : 0,
    purchaseLabel: overrides.purchaseLabel,
    registrationCity: overrides.registrationCity,
    waitMonths: Math.max(0, waitMonths)
  };
}

function formatRupees(value: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(value);
}

function calculateMonthlyExpenseEstimate(transactions: TransactionSnapshot[]) {
  const expenses = transactions.filter(
    (transaction) => transaction.type === "expense"
  );

  if (!expenses.length) {
    return {
      estimate: 0,
      confidence: "low" as const
    };
  }

  const timestamps = expenses
    .map((transaction) => transaction.transactionDate?.getTime())
    .filter((timestamp): timestamp is number => Boolean(timestamp));
  const daysCovered =
    timestamps.length >= 2
      ? Math.max(
          1,
          (Math.max(...timestamps) - Math.min(...timestamps)) / (1000 * 60 * 60 * 24)
        )
      : expenses.length >= 12
        ? 60
        : 30;
  const monthsCovered = Math.max(1, Math.min(3, daysCovered / 30));
  const totalExpenses = expenses.reduce(
    (sum, transaction) => sum + transaction.amount,
    0
  );
  const confidence =
    expenses.length >= 20 && monthsCovered >= 2
      ? "high"
      : expenses.length >= 8
        ? "medium"
        : "low";

  return {
    estimate: totalExpenses / monthsCovered,
    confidence
  };
}

function emergencyFundMonths(savingsAfterTwelveMonths: number, monthlyExpenseEstimate: number) {
  return monthlyExpenseEstimate > 0
    ? Number((Math.max(0, savingsAfterTwelveMonths) / monthlyExpenseEstimate).toFixed(1))
    : 0;
}

function createScenario(input: {
  key: string;
  label: string;
  monthlyExpenseEstimate: number;
  note: string;
  priority: GeneratedScenario["priority"];
  savingsAfterTwelveMonths: number;
}): GeneratedScenario {
  return {
    emergencyFundMonths: emergencyFundMonths(
      input.savingsAfterTwelveMonths,
      input.monthlyExpenseEstimate
    ),
    key: input.key,
    label: input.label,
    note: input.note,
    priority: input.priority,
    savingsAfterTwelveMonths: Math.max(0, Math.round(input.savingsAfterTwelveMonths))
  };
}

function generatePurchaseScenarios(input: {
  baselineMonthlySavings: number;
  monthlyExpenseEstimate: number;
  priceEstimateNote?: string;
  purchaseCost: number;
  purchaseLabel: string;
  waitMonths: number;
}) {
  const twelveMonthSavings = input.baselineMonthlySavings * 12;
  const waitSavings = input.baselineMonthlySavings * input.waitMonths;
  const negotiatedCost = input.purchaseCost * 0.95;
  const boostedMonthlySavings = input.baselineMonthlySavings * 1.2;
  const downPayment = input.purchaseCost * 0.3;
  const emiMonths = 12;
  const estimatedEmi = (input.purchaseCost - downPayment) / emiMonths;
  const priceNote = input.priceEstimateNote ? ` ${input.priceEstimateNote}` : "";

  return [
    createScenario({
      key: "buy_now",
      label: "Buy now",
      monthlyExpenseEstimate: input.monthlyExpenseEstimate,
      note: `Buying ${input.purchaseLabel} now reduces your 12-month buffer by ${formatRupees(input.purchaseCost)}.${priceNote}`,
      priority: "risk",
      savingsAfterTwelveMonths: twelveMonthSavings - input.purchaseCost
    }),
    createScenario({
      key: "wait",
      label: `Wait ${input.waitMonths} months`,
      monthlyExpenseEstimate: input.monthlyExpenseEstimate,
      note: `Waiting first lets you build ${formatRupees(waitSavings)} before purchase.${priceNote}`,
      priority: "best",
      savingsAfterTwelveMonths:
        twelveMonthSavings - Math.max(0, input.purchaseCost - waitSavings)
    }),
    createScenario({
      key: "negotiate",
      label: "Negotiate 5% lower",
      monthlyExpenseEstimate: input.monthlyExpenseEstimate,
      note: `A 5% dealer/insurance/accessories negotiation would reduce the assumed price by about ${formatRupees(input.purchaseCost - negotiatedCost)}.`,
      priority: "neutral",
      savingsAfterTwelveMonths: twelveMonthSavings - negotiatedCost
    }),
    createScenario({
      key: "boost_savings",
      label: "Save 20% more, then buy",
      monthlyExpenseEstimate: input.monthlyExpenseEstimate,
      note: `If you can temporarily save 20% more each month, you build ${formatRupees(boostedMonthlySavings * input.waitMonths)} before purchase.`,
      priority: "best",
      savingsAfterTwelveMonths:
        boostedMonthlySavings * 12 -
        Math.max(0, input.purchaseCost - boostedMonthlySavings * input.waitMonths)
    }),
    createScenario({
      key: "emi_guardrail",
      label: "30% down payment + EMI",
      monthlyExpenseEstimate: input.monthlyExpenseEstimate,
      note: `A rough 30% down payment is ${formatRupees(downPayment)} and a simple 12-month principal-only EMI estimate is ${formatRupees(estimatedEmi)}/month before interest and fees.`,
      priority: "risk",
      savingsAfterTwelveMonths:
        twelveMonthSavings - downPayment - estimatedEmi * emiMonths
    })
  ];
}

function getFallbackRecommendation(input: {
  dataConfidence: "high" | "low" | "medium";
  intent: SimulationIntent;
  registrationCity?: string;
  scenarioA: {
    savingsAfterTwelveMonths: number;
  } | null;
  scenarioB: {
    savingsAfterTwelveMonths: number;
  } | null;
}) {
  const confidenceNote =
    input.dataConfidence === "low"
      ? " Add more transactions before treating this as a final decision."
      : "";

  if (input.scenarioA && input.scenarioB) {
    const buyerGuidance = getPurchaseGuidance(input.registrationCity);

    return input.scenarioB.savingsAfterTwelveMonths > input.scenarioA.savingsAfterTwelveMonths
      ? `Waiting is safer because it preserves more emergency cover. ${buyerGuidance}${confidenceNote}`
      : `Doing it now may be manageable, but avoid high-interest debt. ${buyerGuidance}${confidenceNote}`;
  }

  if (input.intent === "loan_emi") {
    return `Take the EMI only if essentials and emergency cover stay protected.${confidenceNote}`;
  }

  return `This improves your buffer only if essential expenses remain covered.${confidenceNote}`;
}

function getPurchaseGuidance(registrationCity?: string) {
  const cityText = registrationCity ? ` in ${registrationCity}` : "";

  return `For vehicle purchases${cityText}, compare final on-road quotes from at least 2-3 dealers, negotiate near month-end or quarter-end, ask for a full RTO/insurance/accessories breakup, and check whether any state-specific female-owner registration or insurance concession actually applies before registering in someone else's name.`;
}

function parseJSONResponse(text: string): AISimulationResponse | null {
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fencedMatch?.[1] ?? text;

  try {
    return JSON.parse(jsonText.trim()) as AISimulationResponse;
  } catch {
    return null;
  }
}

function parsePriceEstimateResponse(text: string): AIPriceEstimateResponse | null {
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fencedMatch?.[1] ?? text;

  try {
    return JSON.parse(jsonText.trim()) as AIPriceEstimateResponse;
  } catch {
    return null;
  }
}

async function estimateOnRoadPrice(input: {
  question: string;
  registrationCity?: string;
}) {
  if (!hasLLMProvider()) {
    return null;
  }

  const productName = extractPurchaseLabel(input.question);
  const result = await generateLLMText({
    system:
      "You estimate typical Indian vehicle on-road prices from general market knowledge. You do not browse live web data. Be conservative, admit uncertainty, and return only valid JSON.",
    prompt: JSON.stringify({
      instruction:
        "Estimate the usual current on-road price in INR for the requested vehicle and city. Return JSON with keys: productName, lowPrice, highPrice, estimatedOnRoadPrice, confidence, notes. estimatedOnRoadPrice must be the midpoint or conservative typical value. If uncertain, use low confidence and explain that dealer quotes must be verified.",
      question: input.question,
      productName,
      registrationCity: input.registrationCity
    }),
    temperature: 0.15,
    maxTokens: 260,
    timeoutMs: 7000,
    task: "simulation"
  });

  if (!result.ok || !result.text) {
    return null;
  }

  const parsed = parsePriceEstimateResponse(result.text);
  const estimatedOnRoadPrice = Number(parsed?.estimatedOnRoadPrice);

  if (!Number.isFinite(estimatedOnRoadPrice) || estimatedOnRoadPrice <= 0) {
    return null;
  }

  return {
    confidence: parsed?.confidence ?? "low",
    estimatedOnRoadPrice,
    highPrice: Number(parsed?.highPrice) || undefined,
    lowPrice: Number(parsed?.lowPrice) || undefined,
    notes: parsed?.notes,
    productName: parsed?.productName || productName
  };
}

async function generateAISimulation(input: {
  baselineMonthlySavings: number;
  communityInsightSummary: string;
  dataConfidence: "high" | "low" | "medium";
  financialDNA: FinancialDNASnapshot;
  horizonMonths: number;
  intent: SimulationIntent;
  monthlyExpenseEstimate: number;
  monthlyIncome: number;
  monthlySavingsDelta: number;
  purchaseCost: number;
  purchaseGuidance?: string;
  purchaseLabel?: string;
  priceEstimateNote?: string;
  registrationCity?: string;
  projectedEmergencyFundMonths: number;
  projectedMonthlySavings: number;
  projectedSixMonthImpact: number;
  projectedTwelveMonthImpact: number;
  question: string;
  scenarios?: GeneratedScenario[];
  scenarioA: {
    emergencyFundMonths: number;
    label: string;
    note: string;
    savingsAfterTwelveMonths: number;
  } | null;
  scenarioB: {
    emergencyFundMonths: number;
    label: string;
    note: string;
    savingsAfterTwelveMonths: number;
  } | null;
}) {
  if (!hasLLMProvider()) {
    return null;
  }

  const result = await generateLLMText({
    system:
      "You are ArthSaathi's India-focused financial simulation coach. Interpret the user's what-if question using the provided numeric projections. Use only the supplied numbers. Be practical, cautious, and personalized. Do not promise returns, do not recommend specific securities, and do not ask for OTPs, PINs, passwords, or account numbers. Return only valid JSON.",
    prompt: JSON.stringify({
      instruction:
        "Return JSON with keys: explanation, recommendation, communityInsightSummary, scenarios, scenarioA, scenarioB. scenarios may include objects with key, label, note; preserve the supplied scenario keys and do not change numeric fields. Mention low data confidence if dataConfidence is low. For purchases, mention when priceEstimateNote says the price is estimated, include practical Indian buying timing/negotiation guidance from purchaseGuidance, but do not claim female-owner discounts are universal. Do not invent new rupee amounts. Keep each text field concise.",
      input
    }),
    temperature: 0.3,
    maxTokens: 650,
    timeoutMs: 7000,
    task: "simulation"
  });

  if (!result.ok || !result.text) {
    return null;
  }

  return parseJSONResponse(result.text);
}

export async function runFutureSimulation(
  _previousState: SimulationState,
  formData: FormData
): Promise<SimulationState> {
  const question = String(formData.get("question") ?? "").trim();
  const onRoadPrice = parsePositiveNumber(formData.get("onRoadPrice"));
  const monthlySavingsAvailable = parsePositiveNumber(
    formData.get("monthlySavingsAvailable")
  );
  const registrationCity = String(formData.get("registrationCity") ?? "").trim();

  if (question.length < 8) {
    return {
      ok: false,
      message: "Ask a what-if question with a monthly amount."
    };
  }

  await connectToDatabase();
  const appUser = await getOrCreateCurrentAppUser();

  if (!appUser) {
    return {
      ok: false,
      message: "Please sign in with an email account first."
    };
  }

  const [financialDNA, transactions, communityPatterns] = await Promise.all([
    FinancialDNAModel.findOne({ userId: appUser._id }).lean<FinancialDNASnapshot | null>(),
    TransactionModel.find({ userId: appUser._id })
      .sort({ transactionDate: -1 })
      .limit(90)
      .lean<TransactionSnapshot[]>(),
    CommunityPatternModel.find({
      patternType: { $in: ["positive", "negative", "recommended_action"] }
    })
      .sort({ updatedAt: -1 })
      .limit(6)
      .lean<CommunityPatternSnapshot[]>()
  ]);

  if (!financialDNA) {
    return {
      ok: false,
      message: "Complete Financial DNA before running a simulation."
    };
  }

  const monthlyIncome = financialDNA.monthlyIncome;
  const expenseTransactions = transactions.filter(
    (transaction) => transaction.type === "expense"
  );
  const { confidence: dataConfidence, estimate: monthlyExpenseEstimate } =
    calculateMonthlyExpenseEstimate(transactions);
  const preliminaryScenario = parseScenario(question, {
    monthlySavingsAvailable,
    onRoadPrice,
    registrationCity: registrationCity || undefined
  });
  const estimatedPrice =
    preliminaryScenario.intent === "purchase" && !onRoadPrice
      ? await estimateOnRoadPrice({
          question,
          registrationCity: registrationCity || undefined
        })
      : null;
  const estimatedPriceNote = estimatedPrice
    ? `Estimated usual on-road price for ${estimatedPrice.productName}${
        registrationCity ? ` in ${registrationCity}` : ""
      } is ${formatRupees(estimatedPrice.estimatedOnRoadPrice)}${
        estimatedPrice.lowPrice && estimatedPrice.highPrice
          ? `, likely around ${formatRupees(estimatedPrice.lowPrice)}-${formatRupees(estimatedPrice.highPrice)}`
          : ""
      }. Verify with dealer quotes; taxes, insurance, variant, and accessories can change it.`
    : undefined;
  const parsedScenario = parseScenario(question, {
    estimatedPriceNote,
    monthlySavingsAvailable,
    onRoadPrice: onRoadPrice ?? estimatedPrice?.estimatedOnRoadPrice,
    purchaseLabel: estimatedPrice?.productName ?? extractPurchaseLabel(question),
    registrationCity: registrationCity || undefined
  });

  if (parsedScenario.intent === "purchase" && parsedScenario.purchaseCost <= 0) {
    return {
      ok: false,
      message:
        "Add the vehicle's on-road price or mention it in the question. Live on-road price lookup needs a dedicated vehicle-price/search API, so I will not guess the price."
    };
  }

  const calculatedMonthlySavings = Math.max(
    0,
    Math.round(monthlyIncome - monthlyExpenseEstimate)
  );
  const baselineMonthlySavings =
    monthlySavingsAvailable ?? calculatedMonthlySavings;
  const monthlySavingsDelta = parsedScenario.monthlySavingsDelta;
  const projectedMonthlySavings = Math.max(
    0,
    baselineMonthlySavings + monthlySavingsDelta
  );
  const projectedSixMonthImpact =
    parsedScenario.intent === "purchase"
      ? baselineMonthlySavings * 6 - parsedScenario.purchaseCost
      : monthlySavingsDelta * 6;
  const projectedTwelveMonthImpact =
    parsedScenario.intent === "purchase"
      ? baselineMonthlySavings * 12 - parsedScenario.purchaseCost
      : monthlySavingsDelta * 12;
  const projectedEmergencyFundMonths =
    monthlyExpenseEstimate > 0
      ? Number(((projectedMonthlySavings * 6) / monthlyExpenseEstimate).toFixed(1))
      : 0;

  const communityInsightSummary =
    communityPatterns
      .map((pattern) => pattern.insight)
      .filter(Boolean)
      .slice(0, 2)
      .join(" ") ||
    "Community insights suggest that small automatic savings habits improve consistency.";

  const generatedScenarios =
    parsedScenario.intent === "purchase"
      ? generatePurchaseScenarios({
          baselineMonthlySavings,
          monthlyExpenseEstimate,
          priceEstimateNote: parsedScenario.estimatedPriceNote,
          purchaseCost: parsedScenario.purchaseCost,
          purchaseLabel: parsedScenario.purchaseLabel ?? "the vehicle",
          waitMonths: parsedScenario.waitMonths
        })
      : [];
  const scenarioA = generatedScenarios[0] ?? null;
  const scenarioB = generatedScenarios[1] ?? null;
  const recommendation = getFallbackRecommendation({
    dataConfidence,
    intent: parsedScenario.intent,
    registrationCity: parsedScenario.registrationCity,
    scenarioA,
    scenarioB
  });

  const explanation =
    scenarioA && scenarioB
      ? `${scenarioA.label} leaves ${formatRupees(scenarioA.savingsAfterTwelveMonths)} after 12 months. ${scenarioB.label} leaves ${formatRupees(scenarioB.savingsAfterTwelveMonths)}. ${recommendation}`
      : `${monthlySavingsDelta >= 0 ? "Adding" : "Taking on"} ${formatRupees(Math.abs(monthlySavingsDelta))} per month changes your 12-month buffer by ${formatRupees(projectedTwelveMonthImpact)}. Your projected monthly savings becomes ${formatRupees(projectedMonthlySavings)}, before investment returns or inflation.${
          expenseTransactions.length
            ? ""
          : " Add expense transactions to calculate emergency-cover impact accurately."
        }`;

  const aiSimulation = await generateAISimulation({
    baselineMonthlySavings,
    communityInsightSummary,
    dataConfidence,
    financialDNA,
    horizonMonths: parsedScenario.horizonMonths,
    intent: parsedScenario.intent,
    monthlyExpenseEstimate,
    monthlyIncome,
    monthlySavingsDelta,
    purchaseCost: parsedScenario.purchaseCost,
    purchaseGuidance:
      parsedScenario.intent === "purchase"
        ? getPurchaseGuidance(parsedScenario.registrationCity)
        : undefined,
    purchaseLabel: parsedScenario.purchaseLabel,
    priceEstimateNote: parsedScenario.estimatedPriceNote,
    registrationCity: parsedScenario.registrationCity,
    projectedEmergencyFundMonths,
    projectedMonthlySavings,
    projectedSixMonthImpact,
    projectedTwelveMonthImpact,
    question,
    scenarios: generatedScenarios,
    scenarioA,
    scenarioB
  });
  const finalCommunityInsightSummary =
    aiSimulation?.communityInsightSummary || communityInsightSummary;
  const finalRecommendation = aiSimulation?.recommendation || recommendation;
  const finalScenarioA =
    scenarioA && aiSimulation?.scenarioA
      ? {
          ...scenarioA,
          label: aiSimulation.scenarioA.label || scenarioA.label,
          note: aiSimulation.scenarioA.note || scenarioA.note
        }
      : scenarioA;
  const finalScenarioB =
    scenarioB && aiSimulation?.scenarioB
      ? {
          ...scenarioB,
          label: aiSimulation.scenarioB.label || scenarioB.label,
          note: aiSimulation.scenarioB.note || scenarioB.note
        }
      : scenarioB;
  const finalScenarios = generatedScenarios.map((scenario) => {
    const aiScenario = aiSimulation?.scenarios?.find(
      (item) => item.key === scenario.key
    );

    return aiScenario
      ? {
          ...scenario,
          label: aiScenario.label || scenario.label,
          note: aiScenario.note || scenario.note
        }
      : scenario;
  });
  const finalExplanation = aiSimulation?.explanation || explanation;

  await FutureSimulationModel.create({
    userId: appUser._id,
    question,
    monthlySavingsDelta,
    baselineMonthlySavings,
    projectedMonthlySavings,
    projectedSixMonthImpact,
    projectedTwelveMonthImpact,
    projectedEmergencyFundMonths,
    scenarioA: finalScenarioA,
    scenarioB: finalScenarioB,
    scenarios: finalScenarios,
    recommendation: finalRecommendation,
    communityInsightSummary: finalCommunityInsightSummary,
    explanation: finalExplanation
  });

  revalidatePath("/dashboard/future-simulation");

  return {
    ok: true,
    message: finalExplanation
  };
}
