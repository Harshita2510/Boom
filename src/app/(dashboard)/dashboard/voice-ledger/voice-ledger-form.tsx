"use client";

import { useActionState, useMemo, useState } from "react";
import { Bot, MessageCircle, Mic, Smartphone, Square } from "lucide-react";
import { useFormStatus } from "react-dom";

import { saveVoiceTransaction, type VoiceLedgerState } from "./actions";

type SpeechRecognitionConstructor = new () => SpeechRecognition;

type SpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

type SpeechRecognitionEvent = {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
    length: number;
  };
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const initialState: VoiceLedgerState = {
  ok: false,
  message: ""
};

const categoryWords = [
  "food",
  "groceries",
  "grocery",
  "rent",
  "salary",
  "shopping",
  "travel",
  "transport",
  "medical",
  "education",
  "investment",
  "entertainment"
];

const captureChannels = [
  {
    title: "In-app voice",
    description: "Works after the user opens the app and taps record.",
    icon: Mic
  },
  {
    title: "Assistant shortcut",
    description: "Future path for: Hey Siri or Google, tell Boom I spent 500.",
    icon: Bot
  },
  {
    title: "WhatsApp bot",
    description: "Practical always-available capture through text or voice note.",
    icon: MessageCircle
  }
];

function extractTransaction(text: string) {
  const lowerText = text.toLowerCase();
  const amountMatch = lowerText.match(/(?:rs|inr|₹)?\s?(\d+(?:\.\d+)?)/i);
  const amount = amountMatch?.[1] ?? "";
  const isIncome = ["salary", "earned", "received", "income", "credited"].some(
    (word) => lowerText.includes(word)
  );
  const category =
    categoryWords.find((word) => lowerText.includes(word)) ??
    (isIncome ? "salary" : "general");

  return {
    amount,
    category,
    type: isIncome ? "income" : "expense"
  };
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 rounded-md bg-slate-950 px-4 text-sm font-medium text-white disabled:opacity-60"
    >
      {pending ? "Saving..." : "Save transaction"}
    </button>
  );
}

export function VoiceLedgerForm() {
  const [state, formAction] = useActionState(
    saveVoiceTransaction,
    initialState
  );
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const extracted = useMemo(() => extractTransaction(transcript), [transcript]);

  function startListening() {
    const SpeechRecognitionApi =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognitionApi) {
      setTranscript(
        "Voice is not supported in this browser. Type your transaction here."
      );
      return;
    }

    const recognition = new SpeechRecognitionApi();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN";

    recognition.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript ?? "";
      setTranscript(text);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    setIsListening(true);
    recognition.start();
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="rounded-lg border bg-slate-950 p-4 text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-300">
              <Smartphone className="size-4" aria-hidden="true" />
              Mobile capture demo
            </div>
            <p className="text-xl font-semibold tracking-tight">
              Say: I spent 500 rupees on groceries
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={startListening}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-slate-950"
            >
              <Mic className="size-4" aria-hidden="true" />
              Record
            </button>
            <button
              type="button"
              disabled={!isListening}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-white/20 px-4 text-sm font-medium text-white disabled:opacity-50"
            >
              <Square className="size-4" aria-hidden="true" />
              {isListening ? "Listening" : "Ready"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {captureChannels.map((channel) => {
          const Icon = channel.icon;

          return (
            <div key={channel.title} className="rounded-md border bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                <Icon className="size-4 text-emerald-700" aria-hidden="true" />
                <p className="text-sm font-semibold">{channel.title}</p>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {channel.description}
              </p>
            </div>
          );
        })}
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Speech text</span>
        <textarea
          name="transcript"
          required
          value={transcript}
          onChange={(event) => setTranscript(event.target.value)}
          placeholder="Example: hey boom, I made a transaction of 500 rs on groceries"
          className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-base sm:text-sm"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm font-medium">Amount</span>
          <input
            name="amount"
            required
            value={extracted.amount}
            readOnly
            className="h-10 w-full rounded-md border bg-muted px-3 text-sm"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Category</span>
          <input
            name="category"
            required
            value={extracted.category}
            readOnly
            className="h-10 w-full rounded-md border bg-muted px-3 text-sm"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Type</span>
          <input
            name="type"
            required
            value={extracted.type}
            readOnly
            className="h-10 w-full rounded-md border bg-muted px-3 text-sm capitalize"
          />
        </label>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SubmitButton />
        {state.message ? (
          <p
            className={`text-sm ${
              state.ok ? "text-emerald-700" : "text-destructive"
            }`}
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
