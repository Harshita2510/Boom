import { AgentResponse, ScamReport } from "./types";
import { Intent } from "./intents";
import { analyzeScamText } from "@/lib/scam-intelligence";

export async function handleScamShield(message: string): Promise<AgentResponse<ScamReport>> {
  const analysis = analyzeScamText(message);

  const report: ScamReport = {
    riskScore: analysis.riskScore,
    reasons: analysis.indicators,
    suggestion: analysis.safetySteps.join(" "),
  };

  return {
    agent: "scam_shield",
    intent: Intent.SCAM_SHIELD,
    text: `Risk score ${analysis.riskScore}/100 (${analysis.riskLevel}). ${analysis.explanation} ${analysis.safetySteps[0]}`,
    data: report,
  };
}
