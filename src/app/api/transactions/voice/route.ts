import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  captureVoiceTransaction,
  type VoiceTransactionSource
} from "@/lib/voice-transaction";
import { connectToDatabase } from "@/lib/mongoose";
import { UserModel } from "@/models";

const requestSchema = z.object({
  externalUserId: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  source: z
    .enum(["web", "whatsapp", "siri_shortcut", "google_shortcut", "chat"])
    .default("web"),
  text: z.string().min(1)
});

async function getCurrentAppUserId() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) {
    return null;
  }

  await connectToDatabase();

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
      new: true,
      setDefaultsOnInsert: true,
      upsert: true
    }
  );

  return appUser._id;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.errors[0]?.message ??
            "Send text and source for the transaction."
        },
        { status: 400 }
      );
    }

    const source = parsed.data.source as VoiceTransactionSource;
    const appUserId = parsed.data.externalUserId
      ? null
      : await getCurrentAppUserId();

    const result = await captureVoiceTransaction({
      appUserId,
      channelUser: parsed.data.externalUserId
        ? {
            channel: source,
            externalUserId: parsed.data.externalUserId,
            name: parsed.data.name
          }
        : undefined,
      source,
      text: parsed.data.text
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    console.error("/api/transactions/voice error", err);
    return NextResponse.json(
      { error: "Could not record transaction." },
      { status: 500 }
    );
  }
}
