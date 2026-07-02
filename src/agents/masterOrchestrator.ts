import { detectIntent, Intent, isGreeting } from "./intents";
import { AgentContext, AgentResponse } from "./types";
import {
  handleCompoundGoalPlanner,
  isCompoundGoalPlanningRequest
} from "./compoundGoalPlanner";

export async function orchestrate(
  message: string,
  context: AgentContext = {}
): Promise<AgentResponse> {
  if (isCompoundGoalPlanningRequest(message)) {
    return handleCompoundGoalPlanner(message, context);
  }

  const intent = detectIntent(message);

  switch (intent) {
    case Intent.ACTION_PLAN: {
      const mod = await import("./actionPlanAgent");
      return await mod.handleActionPlanAgent(message, context);
    }
    case Intent.BUDGET_COACH: {
      const mod = await import("./budgetCoach");
      return await mod.handleBudgetCoach(message, context);
    }
    case Intent.CASH_SMOOTHING: {
      const mod = await import("./cashSmoothingAgent");
      return await mod.handleCashSmoothingAgent(message, context);
    }
    case Intent.FINANCIAL_EDUCATION: {
      const mod = await import("./financialEducation");
      return await mod.handleFinancialEducation(message, context);
    }
    case Intent.FINANCIAL_DNA: {
      const mod = await import("./financialDNA");
      return await mod.handleFinancialDNA(message);
    }
    case Intent.GOVERNMENT_SCHEMES: {
      const mod = await import("./governmentSchemes");
      return await mod.handleGovernmentSchemes(message, context);
    }
    case Intent.GOALS: {
      const mod = await import("./goalAgent");
      return await mod.handleGoalAgent(message, context);
    }
    case Intent.INVESTMENT_AGENT: {
      const mod = await import("./investmentAgent");
      return await mod.handleInvestmentAgent(message, context);
    }
    case Intent.RECURRING_EXPENSES: {
      const mod = await import("./recurringAgent");
      return await mod.handleRecurringAgent(message, context);
    }
    case Intent.VOICE_LEDGER: {
      const mod = await import("./voiceLedger");
      return await mod.handleVoiceLedger(message, context);
    }
    case Intent.FUTURE_SIMULATION: {
      const mod = await import("./futureSimulation");
      return await mod.handleFutureSimulation(message, context);
    }
    case Intent.COMMUNITY_INTELLIGENCE: {
      const mod = await import("./communityIntelligence");
      return await mod.handleCommunityIntelligence(message);
    }
    case Intent.SCAM_SHIELD: {
      const mod = await import("./scamShield");
      return await mod.handleScamShield(message);
    }
    default:
      if (isGreeting(message)) {
        return {
          agent: "orchestrator",
          intent,
          text:
            "Hi, I am ArthSaathi. You can message things like:\n- I spent 500 on groceries\n- I earned 20000 salary\n- Check if this link is a scam\n- Simulate saving 5000 per month",
        } as AgentResponse;
      }

      const mod = await import("./llmCoach");
      return await mod.handleLLMCoach(message, context);
  }
}
