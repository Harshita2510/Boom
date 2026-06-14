import { buildActionPlan } from "@/lib/action-plan";
import { Intent } from "./intents";
import type { AgentContext, AgentResponse } from "./types";

type ActionPlanUserId = Parameters<typeof buildActionPlan>[0];

export async function handleActionPlanAgent(
  _message: string,
  context: AgentContext = {}
): Promise<AgentResponse> {
  if (!context.appUserId) {
    return {
      agent: "action_plan",
      intent: Intent.ACTION_PLAN,
      text:
        "I can create your full action plan after sign-in. Complete Financial DNA, add a few transactions, and create one goal."
    };
  }

  const plan = await buildActionPlan(context.appUserId as ActionPlanUserId);
  const actions = plan.nextActions
    .slice(0, 5)
    .map((item, index) => `${index + 1}. ${item.action} Reason: ${item.reason}`)
    .join("\n");
  const riskText = plan.risks.length
    ? `\n\nRisk watch:\n${plan.risks.map((risk) => `- ${risk}`).join("\n")}`
    : "";

  return {
    agent: "action_plan",
    data: plan,
    intent: Intent.ACTION_PLAN,
    text: `${plan.aiSummary ? `${plan.aiSummary}\n\n` : ""}Your next best actions:\n${actions}${riskText}`
  };
}
