"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Languages,
  Mic,
  MicOff,
  RotateCcw,
  Volume2
} from "lucide-react";

type SpeechRecognitionConstructor = new () => SpeechRecognition;

type SpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event?: { error?: string }) => void) | null;
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

type Capture = {
  id: string;
  ok: boolean;
  reply: string;
  text: string;
};

const languageOptions = [
  { label: "English", value: "en-IN" },
  { label: "Hindi", value: "hi-IN" },
  { label: "Marathi", value: "mr-IN" },
  { label: "Gujarati", value: "gu-IN" },
  { label: "Tamil", value: "ta-IN" },
  { label: "Telugu", value: "te-IN" }
];

async function saveTransaction(text: string) {
  const response = await fetch("/api/transactions/voice", {
    body: JSON.stringify({
      source: "web",
      text
    }),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });
  const result = await response.json();

  return {
    ok: response.ok && Boolean(result.ok),
    reply: result.message ?? result.error ?? "Could not save transaction."
  };
}

function speak(text: string) {
  if (!("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}

export function VoiceModeClient() {
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [error, setError] = useState("");
  const [interimText, setInterimText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState("en-IN");
  const [lastReply, setLastReply] = useState("Tap start, then speak naturally.");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldListenRef = useRef(false);

  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  async function handleFinalTranscript(text: string) {
    const cleaned = text.trim();

    if (!cleaned) {
      return;
    }

    setInterimText("");
    setLastReply("Saving...");
    const result = await saveTransaction(cleaned);
    const capture = {
      id: `${Date.now()}-${cleaned}`,
      ok: result.ok,
      reply: result.reply,
      text: cleaned
    };

    setCaptures((current) => [capture, ...current].slice(0, 8));
    setLastReply(result.reply);
    speak(result.reply);
  }

  function startListening() {
    const SpeechRecognitionApi =
      (window as Window & {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
      }).SpeechRecognition ??
      (window as Window & {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
      }).webkitSpeechRecognition;

    if (!SpeechRecognitionApi) {
      setError(
        "Voice Mode is not supported in this browser. Try Chrome on Android or desktop."
      );
      return;
    }

    setError("");
    shouldListenRef.current = true;
    setIsListening(true);

    const recognition = new SpeechRecognitionApi();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event) => {
      let finalText = "";
      let interim = "";

      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result?.[0]?.transcript ?? "";

        if ((result as typeof result & { isFinal?: boolean })?.isFinal) {
          finalText += transcript;
        } else {
          interim += transcript;
        }
      }

      setInterimText(interim.trim());

      if (finalText.trim()) {
        void handleFinalTranscript(finalText);
      }
    };

    recognition.onerror = () => {
      setError("Voice recognition stopped. Try starting again.");
    };

    recognition.onend = () => {
      if (shouldListenRef.current) {
        try {
          recognition.start();
        } catch {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setLastReply("Listening. Say: I spent 500 on groceries.");
    } catch {
      setError("Could not start listening. Stop and try again.");
      setIsListening(false);
    }
  }

  function stopListening() {
    shouldListenRef.current = false;
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterimText("");
    setLastReply("Voice Mode stopped.");
  }

  function resetSession() {
    setCaptures([]);
    setError("");
    setInterimText("");
    setLastReply("Session cleared. Start listening when ready.");
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border bg-slate-950 p-5 text-white">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-300">
              <Volume2 className="size-4" aria-hidden="true" />
              App-open voice capture
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Speak transactions without typing
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-slate-200">
              Tap start once, keep this page open, and ArthSaathi will keep
              listening for transaction sentences.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-slate-950"
            >
              {isListening ? (
                <MicOff className="size-4" aria-hidden="true" />
              ) : (
                <Mic className="size-4" aria-hidden="true" />
              )}
              {isListening ? "Stop" : "Start listening"}
            </button>
            <button
              type="button"
              onClick={resetSession}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-white/20 px-4 text-sm font-medium text-white"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Reset
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="rounded-lg border bg-background p-5">
          <label className="space-y-2">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Languages className="size-4" aria-hidden="true" />
              Language
            </span>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              disabled={isListening}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-60"
            >
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-5 rounded-md border bg-muted/30 p-3">
            <p className="text-sm font-semibold">Status</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {isListening ? "Listening while this page stays open." : lastReply}
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-background p-5">
          <p className="font-semibold">Live transcript</p>
          <div className="mt-3 min-h-24 rounded-md border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
            {interimText || "Recognized speech will appear here."}
          </div>
          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
        </div>
      </section>

      <section className="rounded-lg border bg-background p-5">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-5 text-emerald-700" aria-hidden="true" />
          <h2 className="font-semibold">Saved in this session</h2>
        </div>

        <div className="mt-4 space-y-3">
          {captures.length ? (
            captures.map((capture) => (
              <div key={capture.id} className="rounded-md border p-4">
                <p className="text-sm font-medium">{capture.text}</p>
                <p
                  className={`mt-2 text-sm ${
                    capture.ok ? "text-emerald-700" : "text-destructive"
                  }`}
                >
                  {capture.reply}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No voice captures yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
