"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Mic,
  Pencil,
  Send,
  Square
} from "lucide-react";

type Msg = {
  role: "user" | "agent";
  text: string;
  meta?: {
    completed?: boolean;
    step?: number;
  };
};

type DNARecognitionConstructor = new () => DNARecognition;

type DNARecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: DNARecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

type DNARecognitionEvent = {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal?: boolean;
    };
    length: number;
  };
};

export function OnboardingChat({
  initialSummary,
  userId
}: {
  initialSummary?: string;
  userId?: string;
}) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "agent",
      text: initialSummary
        ? `Your Financial DNA is complete: ${initialSummary}`
        : "Welcome. Tell me about your work, income, monthly earning, main goal, and emergency savings. You can answer step by step or in one full sentence."
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [completed, setCompleted] = useState(Boolean(initialSummary));
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<DNARecognition | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      behavior: "smooth",
      top: scrollRef.current.scrollHeight
    });
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  async function send(rawMessage = input) {
    const msg = rawMessage.trim();

    if (!msg || loading || completed) {
      return;
    }

    setMessages((current) => [...current, { role: "user", text: msg }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/financial-dna/onboard", {
        body: JSON.stringify({ message: msg, userId }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Server error");
      }

      setCompleted(Boolean(data.completed));
      setMessages((current) => [
        ...current,
        {
          meta: data,
          role: "agent",
          text: data.reply
        }
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "agent",
          text:
            error instanceof Error
              ? error.message
              : "Sorry, something went wrong. Try again."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function startUpdate() {
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/financial-dna/onboard", {
        body: JSON.stringify({ reset: true, userId }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Server error");
      }

      setCompleted(false);
      setInput("");
      setMessages([
        {
          role: "agent",
          text: data.reply
        }
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "agent",
          text:
            error instanceof Error
              ? error.message
              : "Could not start DNA update. Try again."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function startVoiceInput() {
    const speechWindow = window as Window & {
      SpeechRecognition?: DNARecognitionConstructor;
      webkitSpeechRecognition?: DNARecognitionConstructor;
    };
    const SpeechRecognitionApi =
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognitionApi) {
      setMessages((current) => [
        ...current,
        {
          role: "agent",
          text:
            "Voice input is not supported in this browser. You can type your answer here."
        }
      ]);
      return;
    }

    const recognition = new SpeechRecognitionApi();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result?.[0]?.transcript ?? "";

        if ((result as typeof result & { isFinal?: boolean })?.isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }

      setInput((finalText || interimText).trim());
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }

  function stopVoiceInput() {
    recognitionRef.current?.stop();
    setIsListening(false);
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      {completed ? (
        <div className="border-b bg-emerald-50 px-4 py-3 text-emerald-800">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              DNA complete
            </div>
            <button
              type="button"
              onClick={startUpdate}
              disabled={loading}
              className="inline-flex h-9 w-fit items-center gap-2 rounded-md border border-emerald-200 bg-white px-3 text-sm font-semibold text-emerald-900 disabled:opacity-60"
            >
              <Pencil className="size-4" aria-hidden="true" />
              Update DNA
            </button>
          </div>
        </div>
      ) : null}

      <section className="flex min-h-[420px] flex-col sm:min-h-[560px]">
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-3 sm:p-4">
            {messages.map((message, index) => {
              const isUser = message.role === "user";

              return (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[94%] rounded-lg px-3 py-3 text-sm leading-6 shadow-sm sm:max-w-[88%] sm:px-4 md:max-w-[74%] ${
                      isUser
                        ? "bg-slate-950 text-white"
                        : "border bg-white text-slate-950"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              );
            })}

            {loading ? (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-3 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Reading your answer
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t bg-white p-2 sm:p-3">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void send();
                  }
                }}
                placeholder={
                  completed
                    ? "Financial DNA completed"
                    : "Tell ArthSaathi about your income and goals..."
                }
                disabled={completed}
                className="h-12 min-w-0 flex-1 rounded-md border bg-background px-3 text-base disabled:opacity-60 sm:text-sm"
              />
              <button
                type="button"
                onClick={isListening ? stopVoiceInput : startVoiceInput}
                disabled={completed}
                className={`inline-flex size-12 items-center justify-center rounded-md border ${
                  isListening
                    ? "bg-rose-50 text-rose-700"
                    : "bg-background text-slate-900"
                } disabled:opacity-60`}
                aria-label={isListening ? "Stop voice input" : "Start voice input"}
              >
                {isListening ? (
                  <Square className="size-4" aria-hidden="true" />
                ) : (
                  <Mic className="size-4" aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                onClick={() => send()}
                disabled={loading || completed || !input.trim()}
                className="inline-flex size-12 items-center justify-center rounded-md bg-slate-950 text-white disabled:opacity-50"
                aria-label="Send answer"
              >
                <Send className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
      </section>
    </div>
  );
}
