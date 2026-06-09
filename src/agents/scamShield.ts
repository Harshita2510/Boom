import { AgentResponse, ScamReport } from "./types";
import { Intent } from "./intents";

export async function handleScamShield(message: string): Promise<AgentResponse<ScamReport>> {
  const m = message.toLowerCase();
  const reasons: string[] = [];
  if (/click here|congratulations|claim|urgent|otp|password/.test(m)) reasons.push("Contains common scam keywords");
  if (/http:\/\//.test(m)) reasons.push("Contains unsecure http link");

  const score = Math.min(100, reasons.length * 40 + (m.includes("http") ? 10 : 0));

  const report: ScamReport = {
    riskScore: score,
    reasons,
    suggestion: "Do not click links or share personal info. Block and report the sender.",
  };

  return {
    agent: "scam_shield",
    intent: Intent.SCAM_SHIELD,
    text: `Scam analysis for input: ${message}`,
    data: report,
  };
}
