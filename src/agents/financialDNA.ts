import { AgentResponse, FinancialDNAProfile } from "./types";
import { Intent } from "./intents";

export async function handleFinancialDNA(message: string): Promise<AgentResponse<FinancialDNAProfile>> {
  // Simple rule-based extraction for demo; replace with NLP/LLM in future
  const m = message.toLowerCase();
  const profile: FinancialDNAProfile = {
    incomeType: undefined,
    monthlyIncome: undefined,
    goals: [],
    riskProfile: null,
    dependents: 0,
    habits: [],
  };

  // crude extraction examples
  const incomeMatch = m.match(/(\d+[.,]?\d*)\s*(?:rs|₹|inr)?\s*(?:per month|\/month|monthly|month)/i);
  if (incomeMatch && incomeMatch[1]) {
    const num = String(incomeMatch[1]).replace(/,/g, "");
    profile.monthlyIncome = parseFloat(num);
    profile.incomeType = "self-employed"; // guess
  }

  if (/bike|motorcycle/.test(m)) profile.goals!.push("Buy a bike");
  if (/delivery|driver|gig/.test(m)) profile.incomeType = "gig_worker";

  // mock risk logic
  profile.riskProfile = profile.monthlyIncome && profile.monthlyIncome > 30000 ? "medium" : "low";

  profile.habits = /save|saving/.test(m) ? ["saves_monthly"] : [];

  const response: AgentResponse<FinancialDNAProfile> = {
    agent: "financial_dna",
    intent: Intent.FINANCIAL_DNA,
    text: `Generated financial DNA profile for input: ${message}`,
    data: profile,
  };

  return response;
}
