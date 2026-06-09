"use server";

import { revalidatePath } from "next/cache";

import { getOrCreateCurrentAppUser } from "@/lib/current-app-user";
import { connectToDatabase } from "@/lib/mongoose";
import { AlertModel, ScamAnalysisModel } from "@/models";

export type ScamShieldState = {
  ok: boolean;
  message: string;
};

const scamRules = [
  {
    label: "Urgent pressure or deadline",
    pattern: /(urgent|immediately|within \d+|last chance|account.*blocked|expire)/i,
    score: 18
  },
  {
    label: "Requests OTP, PIN, password, or CVV",
    pattern: /(otp|pin|password|cvv|card number|upi pin|netbanking)/i,
    score: 28
  },
  {
    label: "Suspicious link or shortened URL",
    pattern: /(bit\.ly|tinyurl|t\.co|http:\/\/|https:\/\/|\.xyz|\.top|\.click)/i,
    score: 18
  },
  {
    label: "Prize, refund, subsidy, or cashback lure",
    pattern: /(prize|lottery|cashback|refund|subsidy|reward|free money|won)/i,
    score: 16
  },
  {
    label: "Payment or transfer demand",
    pattern: /(transfer|pay now|send money|deposit|processing fee|verification fee)/i,
    score: 18
  },
  {
    label: "Impersonates bank, government, delivery, or platform support",
    pattern: /(bank|rbi|income tax|aadhaar|pan|kyc|courier|delivery|support team)/i,
    score: 12
  }
];

function getRiskLevel(score: number) {
  if (score >= 70) {
    return "high" as const;
  }

  if (score >= 35) {
    return "medium" as const;
  }

  return "low" as const;
}

export async function analyzeScamMessage(
  _previousState: ScamShieldState,
  formData: FormData
): Promise<ScamShieldState> {
  const messageText = String(formData.get("messageText") ?? "").trim();
  const screenshot = formData.get("screenshot");
  const file =
    screenshot instanceof File && screenshot.size > 0 ? screenshot : null;

  if (!messageText && !file) {
    return {
      ok: false,
      message: "Paste message text or upload a screenshot."
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

  const textForAnalysis = `${messageText} ${file?.name ?? ""}`.trim();
  const indicators = scamRules
    .filter((rule) => rule.pattern.test(textForAnalysis))
    .map((rule) => rule.label);
  const rawScore = scamRules
    .filter((rule) => rule.pattern.test(textForAnalysis))
    .reduce((sum, rule) => sum + rule.score, file && !messageText ? 10 : 0);
  const riskScore = Math.min(100, rawScore);
  const riskLevel = getRiskLevel(riskScore);
  const explanation =
    indicators.length > 0
      ? `Detected ${indicators.length} scam indicator${indicators.length > 1 ? "s" : ""}: ${indicators.join(", ")}.`
      : "No strong scam indicators were detected. Still verify the sender before paying or sharing sensitive information.";

  await ScamAnalysisModel.create({
    userId: appUser._id,
    inputType: file ? "screenshot" : "text",
    fileName: file?.name,
    messageText,
    riskScore,
    riskLevel,
    indicators,
    explanation
  });

  if (riskLevel !== "low") {
    await AlertModel.create({
      userId: appUser._id,
      title: "Scam Shield risk detected",
      message: explanation,
      alertType: "risk",
      severity: riskLevel === "high" ? "critical" : "warning",
      actionUrl: "/dashboard/scam-shield",
      metadata: {
        riskScore,
        riskLevel
      }
    });
  }

  revalidatePath("/dashboard/scam-shield");

  return {
    ok: true,
    message: `Risk score ${riskScore}/100 (${riskLevel}). ${explanation}`
  };
}
