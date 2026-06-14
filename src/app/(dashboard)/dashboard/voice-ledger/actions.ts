"use server";

import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { z } from "zod";

import { captureVoiceTransaction } from "@/lib/voice-transaction";
import { connectToDatabase } from "@/lib/mongoose";
import { UserModel } from "@/models";

const transactionSchema = z.object({
  transcript: z.string().min(2, "Please record or type a sentence."),
  amount: z.coerce.number().positive("Amount must be more than 0."),
  category: z.string().min(2, "Category is required."),
  type: z.enum(["income", "expense"])
});

export type VoiceLedgerState = {
  ok: boolean;
  message: string;
};

export async function saveVoiceTransaction(
  _previousState: VoiceLedgerState,
  formData: FormData
): Promise<VoiceLedgerState> {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return {
      ok: false,
      message: "Please sign in first."
    };
  }

  const parsed = transactionSchema.safeParse({
    transcript: formData.get("transcript"),
    amount: formData.get("amount"),
    category: formData.get("category"),
    type: formData.get("type")
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
      lastActiveAt: new Date()
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );

  const result = await captureVoiceTransaction({
    appUserId: appUser._id,
    source: "web",
    text: parsed.data.transcript
  });

  if (!result.ok) {
    return {
      ok: false,
      message: result.message
    };
  }

  revalidatePath("/dashboard/voice-ledger");

  return {
    ok: true,
    message: result.message
  };
}
