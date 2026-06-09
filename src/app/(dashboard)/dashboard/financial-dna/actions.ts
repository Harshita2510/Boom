"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";

import { connectToDatabase } from "@/lib/mongoose";
import { FinancialDNAModel, UserModel } from "@/models";

const financialDNASchema = z.object({
  occupation: z.string().min(2, "Occupation is required."),
  incomeType: z.enum([
    "salaried",
    "business",
    "freelance",
    "student",
    "homemaker",
    "retired",
    "other"
  ]),
  monthlyIncome: z.coerce.number().min(0, "Monthly income must be 0 or more."),
  financialGoals: z.string().min(2, "Add at least one goal."),
  dependents: z.coerce.number().int().min(0, "Dependents must be 0 or more."),
  riskAppetite: z.enum(["low", "medium", "high"])
});

export type FinancialDNAFormState = {
  ok: boolean;
  message: string;
};

function generateSummary(input: z.infer<typeof financialDNASchema>) {
  const goals = input.financialGoals
    .split(",")
    .map((goal) => goal.trim())
    .filter(Boolean);

  const riskText = {
    low: "You prefer safety and steady progress.",
    medium: "You can balance safety with growth.",
    high: "You are open to higher growth with higher ups and downs."
  }[input.riskAppetite];

  const dependentText =
    input.dependents === 0
      ? "You currently have no dependents, so your planning can be more flexible."
      : `You support ${input.dependents} dependent${input.dependents > 1 ? "s" : ""}, so protection and emergency planning matter.`;

  return `You are a ${input.occupation} with ${input.incomeType} income. ${riskText} ${dependentText} Your main goals are ${goals.join(", ")}.`;
}

function getRiskProfile(riskAppetite: "low" | "medium" | "high") {
  if (riskAppetite === "low") {
    return "conservative";
  }

  if (riskAppetite === "high") {
    return "growth";
  }

  return "balanced";
}

export async function saveFinancialDNA(
  _previousState: FinancialDNAFormState,
  formData: FormData
): Promise<FinancialDNAFormState> {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return {
      ok: false,
      message: "Please sign in first."
    };
  }

  const parsed = financialDNASchema.safeParse({
    occupation: formData.get("occupation"),
    incomeType: formData.get("incomeType"),
    monthlyIncome: formData.get("monthlyIncome"),
    financialGoals: formData.get("financialGoals"),
    dependents: formData.get("dependents"),
    riskAppetite: formData.get("riskAppetite")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.errors[0]?.message ?? "Please check the form."
    };
  }

  await connectToDatabase();

  const email = clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) {
    return {
      ok: false,
      message: "Your Clerk account needs an email address."
    };
  }

  const appUser = await UserModel.findOneAndUpdate(
    { clerkId: clerkUser.id },
    {
      clerkId: clerkUser.id,
      email,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
      onboardingStatus: "completed",
      lastActiveAt: new Date()
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );

  const goals = parsed.data.financialGoals
    .split(",")
    .map((goal) => goal.trim())
    .filter(Boolean);

  const summary = generateSummary(parsed.data);

  await FinancialDNAModel.findOneAndUpdate(
    { userId: appUser._id },
    {
      userId: appUser._id,
      occupation: parsed.data.occupation,
      incomeType: parsed.data.incomeType,
      monthlyIncome: parsed.data.monthlyIncome,
      financialGoals: goals,
      dependents: parsed.data.dependents,
      riskAppetite: parsed.data.riskAppetite,
      summary,
      riskProfile: getRiskProfile(parsed.data.riskAppetite),
      incomeStability:
        parsed.data.incomeType === "salaried" ? "high" : "medium",
      lastCalculatedAt: new Date()
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/financial-dna");

  return {
    ok: true,
    message: summary
  };
}
