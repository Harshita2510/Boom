"use server";

import { revalidatePath } from "next/cache";

import { getOrCreateCurrentAppUser } from "@/lib/current-app-user";
import { connectToDatabase } from "@/lib/mongoose";
import { analyzeScamText } from "@/lib/scam-intelligence";
import { AlertModel, ScamAnalysisModel } from "@/models";

export type ScamShieldState = {
  ok: boolean;
  message: string;
};

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
  const analysis = analyzeScamText(textForAnalysis);

  await ScamAnalysisModel.create({
    userId: appUser._id,
    inputType: file ? "screenshot" : "text",
    fileName: file?.name,
    messageText,
    riskScore: analysis.riskScore,
    riskLevel: analysis.riskLevel,
    indicators: analysis.indicators,
    explanation: `${analysis.explanation} ${analysis.safetySteps.join(" ")}`
  });

  if (analysis.riskLevel !== "low") {
    await AlertModel.create({
      userId: appUser._id,
      title: "Scam Shield risk detected",
      message: analysis.explanation,
      alertType: "risk",
      severity: analysis.riskLevel === "high" ? "critical" : "warning",
      actionUrl: "/dashboard/scam-shield",
      metadata: {
        riskScore: analysis.riskScore,
        riskLevel: analysis.riskLevel
      }
    });
  }

  revalidatePath("/dashboard/scam-shield");

  return {
    ok: true,
    message: `Risk score ${analysis.riskScore}/100 (${analysis.riskLevel}). ${analysis.explanation} ${analysis.safetySteps[0]}`
  };
}
