import { FinancialDNAModel } from "@/models";
import { createFinancialLesson } from "@/lib/financial-education";

import { Intent } from "./intents";
import type { AgentContext, AgentResponse } from "./types";

type FinancialDNASnapshot = {
  incomeType?: string;
  occupation?: string;
};

export async function handleFinancialEducation(
  message: string,
  context: AgentContext = {}
): Promise<AgentResponse> {
  const profile = context.appUserId
    ? await FinancialDNAModel.findOne({ userId: context.appUserId }).lean<FinancialDNASnapshot | null>()
    : null;
  const lesson = createFinancialLesson(message, {
    incomeType: profile?.incomeType,
    occupation: profile?.occupation
  });
  const text = `${lesson.title}\n\n${lesson.analogy}\n\n${lesson.keyPoints
    .map((point) => `- ${point}`)
    .join("\n")}\n\nNext step: ${lesson.nextStep}${
    lesson.warning ? `\n\nSafety note: ${lesson.warning}` : ""
  }`;

  return {
    agent: "financial_education",
    data: lesson,
    intent: Intent.FINANCIAL_EDUCATION,
    text
  };
}
