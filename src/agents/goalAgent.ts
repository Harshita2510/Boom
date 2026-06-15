import {
  formatGoalRupees,
  getGoalRoadmaps
} from "@/lib/goal-roadmap";

import { Intent } from "./intents";
import type { AgentContext, AgentResponse } from "./types";

type GoalUserId = Parameters<typeof getGoalRoadmaps>[0];

export async function handleGoalAgent(
  _message: string,
  context: AgentContext = {}
): Promise<AgentResponse> {
  if (!context.appUserId) {
    return {
      agent: "goals",
      intent: Intent.GOALS,
      text:
        "I can build goal roadmaps after sign-in. Complete Financial DNA and create a goal first."
    };
  }

  const roadmaps = await getGoalRoadmaps(context.appUserId as GoalUserId);

  if (!roadmaps.length) {
    return {
      agent: "goals",
      data: roadmaps,
      intent: Intent.GOALS,
      text:
        "You do not have an active goal yet. Create one goal with a target amount and date, then I can calculate monthly saving, gap, and risk."
    };
  }

  const summary = roadmaps
    .slice(0, 3)
    .map(({ goal, roadmap }, index) => {
      const months = roadmap.monthsRemaining
        ? `${roadmap.monthsRemaining} month${roadmap.monthsRemaining > 1 ? "s" : ""}`
        : "no target date";

      return `${index + 1}. ${goal.title}: ${roadmap.progressPercent}% complete, gap ${formatGoalRupees(
        roadmap.gapAmount
      )}, needs ${formatGoalRupees(roadmap.monthlyRequired)}/month (${months}). Status: ${roadmap.status.replaceAll(
        "_",
        " "
      )}. Next step: ${roadmap.steps[0]}`;
    })
    .join("\n");

  return {
    agent: "goals",
    data: roadmaps,
    intent: Intent.GOALS,
    text: `Here is your goal roadmap:\n${summary}`
  };
}
