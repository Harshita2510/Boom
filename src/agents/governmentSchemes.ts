import { FinancialDNAModel } from "@/models";
import {
  formatSchemeReply,
  recommendGovernmentSchemes
} from "@/lib/government-schemes";

import { Intent } from "./intents";
import type { AgentContext, AgentResponse } from "./types";

type FinancialDNASnapshot = {
  dependents?: number;
  financialGoals?: string[];
  incomeType?: string;
  occupation?: string;
  riskAppetite?: string;
};

export async function handleGovernmentSchemes(
  _message: string,
  context: AgentContext = {}
): Promise<AgentResponse> {
  const profile = context.appUserId
    ? await FinancialDNAModel.findOne({ userId: context.appUserId }).lean<FinancialDNASnapshot | null>()
    : null;
  const recommendations = recommendGovernmentSchemes({
    dependents: profile?.dependents,
    financialGoals: profile?.financialGoals,
    incomeType: profile?.incomeType,
    occupation: profile?.occupation,
    riskAppetite: profile?.riskAppetite
  });

  return {
    agent: "government_schemes",
    data: recommendations,
    intent: Intent.GOVERNMENT_SCHEMES,
    text: `Here are schemes worth checking. Please verify final eligibility through official bank/government channels:\n\n${formatSchemeReply(recommendations)}`
  };
}
