"use client";

import { useActionState, useMemo, useState } from "react";
import { Mic, Square } from "lucide-react";
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
      className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
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
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={startListening}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          <Mic className="size-4" aria-hidden="true" />
          Record voice
        </button>
        <button
          type="button"
          disabled={!isListening}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium disabled:opacity-50"
        >
          <Square className="size-4" aria-hidden="true" />
          {isListening ? "Listening..." : "Stopped"}
        </button>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Speech text</span>
        <textarea
          name="transcript"
          required
          value={transcript}
          onChange={(event) => setTranscript(event.target.value)}
          placeholder="Example: spent 250 on food"
          className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
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
