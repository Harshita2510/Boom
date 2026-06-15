import { connectToDatabase } from "@/lib/mongoose";
import { FinancialDNAModel, TransactionModel, UserModel } from "@/models";
import {
  parseVoiceTransaction,
  type ParsedVoiceTransaction
} from "@/lib/voice-transaction-parser";

export type VoiceTransactionSource =
  | "web"
  | "whatsapp"
  | "siri_shortcut"
  | "google_shortcut"
  | "chat";

export { parseVoiceTransaction };

export async function getOrCreateChannelUser(input: {
  channel: VoiceTransactionSource;
  externalUserId: string;
  name?: string;
}) {
  const clerkId = `${input.channel}:${input.externalUserId}`;

  return UserModel.findOneAndUpdate(
    { clerkId },
    {
      clerkId,
      email: `${input.externalUserId}@${input.channel}.arthsathi.local`,
      firstName: input.name ?? input.channel,
      phoneNumber:
        input.channel === "whatsapp" ? input.externalUserId : undefined,
      lastActiveAt: new Date()
    },
    {
      new: true,
      setDefaultsOnInsert: true,
      upsert: true
    }
  );
}

export async function saveParsedVoiceTransaction(input: {
  appUserId: unknown;
  parsed: ParsedVoiceTransaction;
  source: VoiceTransactionSource;
}) {
  const transaction = await TransactionModel.create({
    userId: input.appUserId,
    type: input.parsed.type,
    amount: input.parsed.amount,
    category: input.parsed.category,
    description: input.parsed.text,
    transactionDate: new Date(),
    source: "voice",
    paymentMethod: "other",
    tags: [input.source, `confidence:${input.parsed.confidence}`]
  });

  const verb = input.parsed.type === "income" ? "income" : "expense";
  const reply = `Saved ${verb}: ₹${input.parsed.amount} for ${input.parsed.category}.`;

  return {
    reply,
    transaction
  };
}

export async function captureVoiceTransaction(input: {
  appUserId?: unknown;
  channelUser?: {
    channel: VoiceTransactionSource;
    externalUserId: string;
    name?: string;
  };
  source: VoiceTransactionSource;
  text: string;
}) {
  const parsed = parseVoiceTransaction(input.text);

  if (!input.text.trim()) {
    return {
      ok: false as const,
      message: "Please send a transaction sentence.",
      parsed
    };
  }

  if (parsed.amount <= 0) {
    return {
      ok: false as const,
      message:
        "I could not find an amount. Try: I spent 500 on groceries.",
      parsed
    };
  }

  await connectToDatabase();

  const appUser =
    input.appUserId ??
    (input.channelUser
      ? (await getOrCreateChannelUser(input.channelUser))._id
      : null);

  if (!appUser) {
    return {
      ok: false as const,
      message: "Please sign in first.",
      parsed
    };
  }

  const financialDNA = await FinancialDNAModel.exists({ userId: appUser });

  if (!financialDNA) {
    return {
      ok: false as const,
      message: "Please complete Financial DNA before recording transactions.",
      parsed
    };
  }

  const saved = await saveParsedVoiceTransaction({
    appUserId: appUser,
    parsed,
    source: input.source
  });

  return {
    ok: true as const,
    message: saved.reply,
    parsed,
    transactionId: String(saved.transaction._id)
  };
}
