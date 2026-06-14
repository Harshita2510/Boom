"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getOrCreateCurrentAppUser } from "@/lib/current-app-user";
import { connectToDatabase } from "@/lib/mongoose";
import { GoalModel } from "@/models";

const goalSchema = z.object({
  currentAmount: z.coerce.number().min(0, "Current amount cannot be negative."),
  description: z.string().optional(),
  goalType: z.enum([
    "emergency_fund",
    "investment",
    "debt_repayment",
    "purchase",
    "education",
    "travel",
    "other"
  ]),
  priority: z.enum(["low", "medium", "high"]),
  targetAmount: z.coerce.number().positive("Target amount must be more than 0."),
  targetDate: z.string().optional(),
  title: z.string().min(2, "Goal title is required.")
});

export type GoalFormState = {
  ok: boolean;
  message: string;
};

export async function createGoal(
  _previousState: GoalFormState,
  formData: FormData
): Promise<GoalFormState> {
  const parsed = goalSchema.safeParse({
    currentAmount: formData.get("currentAmount"),
    description: formData.get("description"),
    goalType: formData.get("goalType"),
    priority: formData.get("priority"),
    targetAmount: formData.get("targetAmount"),
    targetDate: formData.get("targetDate"),
    title: formData.get("title")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.errors[0]?.message ?? "Please check the form."
    };
  }

  await connectToDatabase();
  const appUser = await getOrCreateCurrentAppUser();

  if (!appUser) {
    return {
      ok: false,
      message: "Please sign in with an email account first."
    };
  }

  await GoalModel.create({
    userId: appUser._id,
    title: parsed.data.title,
    description: parsed.data.description,
    goalType: parsed.data.goalType,
    targetAmount: parsed.data.targetAmount,
    currentAmount: parsed.data.currentAmount,
    targetDate: parsed.data.targetDate
      ? new Date(parsed.data.targetDate)
      : undefined,
    priority: parsed.data.priority,
    status: "active"
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/goals");

  return {
    ok: true,
    message: "Goal roadmap created."
  };
}
