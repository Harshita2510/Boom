import { AgentResponse, CommunityInsight } from "./types";
import { Intent } from "./intents";

export async function handleCommunityIntelligence(message: string): Promise<AgentResponse<CommunityInsight[]>> {
  const insights: CommunityInsight[] = [
    { topic: "savings tips", outcome: "users who saved 10% more improved stability", confidence: 0.82 },
    { topic: "local lending", outcome: "short-term loans increased default risk for low-income users", confidence: 0.6 },
    { topic: "gold strategy", outcome: "mixed outcomes, depends on timing", confidence: 0.5 },
  ];

  return {
    agent: "community_intelligence",
    intent: Intent.COMMUNITY_INTELLIGENCE,
    text: "Community insights based on anonymous patterns",
    data: insights,
  };
}
