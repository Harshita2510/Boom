import { detectIntent, Intent } from "./intents";
import { AgentResponse } from "./types";

export async function orchestrate(message: string): Promise<AgentResponse> {
  const intent = detectIntent(message);

  switch (intent) {
    case Intent.FINANCIAL_DNA: {
      const mod = await import("./financialDNA");
      return await mod.handleFinancialDNA(message);
    }
    case Intent.VOICE_LEDGER: {
      const mod = await import("./voiceLedger");
      return await mod.handleVoiceLedger(message);
    }
    case Intent.FUTURE_SIMULATION: {
      const mod = await import("./futureSimulation");
      return await mod.handleFutureSimulation(message);
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
      return { agent: "orchestrator", intent, text: "Sorry, I didn't understand. Can you rephrase?" } as AgentResponse;
  }
}
