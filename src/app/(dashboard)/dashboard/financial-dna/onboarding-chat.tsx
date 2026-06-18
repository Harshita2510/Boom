"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  Loader2,
  Mic,
  Pencil,
  Send,
  Smile,
  Sparkles,
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

type QuickReply = {
  label: string;
  value: string;
};

const moodReplies: QuickReply[] = [
  { label: "Feeling great", value: "Feeling great" },
  { label: "Doing okay", value: "Doing okay" },
  { label: "A little stressed", value: "A little stressed" },
  { label: "Need guidance", value: "Need guidance" }
];

const quickRepliesByStep: Record<number, QuickReply[]> = {
  0: [
    { label: "Salaried", value: "I get salary" },
    { label: "Business owner", value: "I run a business" },
    { label: "Freelancer", value: "I freelance" },
    { label: "Student", value: "I am a student" },
    { label: "Homemaker", value: "I am a homemaker" },
    { label: "Retired", value: "I am retired" }
  ],
  1: [
    { label: "Under Rs20,000", value: "I earn 15000 rupees per month" },
    { label: "Rs20k - Rs40k", value: "I earn 30000 rupees per month" },
    { label: "Rs40k - Rs70k", value: "I earn 55000 rupees per month" },
    { label: "Rs70k - Rs1L", value: "I earn 85000 rupees per month" },
    { label: "Above Rs1L", value: "I earn 125000 rupees per month" }
  ],
  2: [
    { label: "Emergency fund", value: "Build an emergency fund" },
    { label: "Clear debt", value: "Clear debt" },
    { label: "Buy home", value: "Buy a home" },
    { label: "Education", value: "Save for education" },
    { label: "Retirement", value: "Plan for retirement" },
    { label: "Big purchase", value: "Save for a big purchase" }
  ],
  3: [
    { label: "Yes, I have it", value: "Yes, I have at least one month saved" },
    { label: "Not yet", value: "No, not yet" }
  ]
};

function getActiveStep(messages: Msg[], completed: boolean) {
  if (completed) {
    return 4;
  }

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const step = messages[index]?.meta?.step;

    if (typeof step === "number") {
      return step;
    }
  }

  return 0;
}

function getProgress(step: number, completed: boolean) {
  if (completed) {
    return 100;
  }

  return Math.max(12, Math.min(88, 12 + step * 22));
}

const welcomeMessage =
  "Namaste, I am ArthSaathi.\n\nBefore we build your Financial DNA, tell me one tiny thing. How are you feeling today?";

const startDNAAfterMoodMessage =
  "Love that you are here. We will keep this light, simple, and useful.\n\nLet us build your Financial DNA in a few easy taps. What kind of work do you do?";

const completedMessage =
  "Your Financial DNA is ready.\n\nBeautiful work. You answered the essentials, and I have shaped them into a simple money profile for you.\n\nYour snapshot is waiting below in clean points.";

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
      text: initialSummary ? completedMessage : welcomeMessage
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [moodAnswered, setMoodAnswered] = useState(false);
  const [completed, setCompleted] = useState(Boolean(initialSummary));
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<DNARecognition | null>(null);
  const activeStep = getActiveStep(messages, completed);
  const isMoodStep = !moodAnswered;
  const progress = isMoodStep ? 8 : getProgress(activeStep, completed);
  const quickReplies = isMoodStep
    ? moodReplies
    : completed
      ? []
      : quickRepliesByStep[activeStep] ?? [];

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

  function answerMood(rawMessage: string, displayMessage?: string) {
    const msg = rawMessage.trim();
    const visibleMessage = (displayMessage ?? msg).trim();

    if (!msg || loading) {
      return;
    }

    setMessages((current) => [
      ...current,
      { role: "user", text: visibleMessage || msg },
      {
        role: "agent",
        text: completed
          ? "Thank you for sharing. Your money snapshot is ready below, and you can update your DNA whenever life changes."
          : startDNAAfterMoodMessage
      }
    ]);
    setInput("");
    setMoodAnswered(true);
  }

  async function send(rawMessage = input, displayMessage?: string) {
    const msg = rawMessage.trim();
    const visibleMessage = (displayMessage ?? msg).trim();

    if (!msg || loading || completed) {
      return;
    }

    setMessages((current) => [
      ...current,
      { role: "user", text: visibleMessage || msg }
    ]);
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
          text: data.completed ? completedMessage : data.reply
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
      setMoodAnswered(false);
      setInput("");
      setMessages([
        {
          role: "agent",
          text: welcomeMessage
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
    <div className="overflow-hidden rounded-lg border border-[#dfe6df] bg-[#f8f7f2] font-sans shadow-[0_18px_55px_rgba(25,55,45,0.10)]">
      <header className="flex items-center justify-between gap-4 border-b border-[#e7e2d7] bg-white px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#216f61] text-white shadow-[0_10px_24px_rgba(33,111,97,0.28)]">
            <Sparkles className="size-6" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold tracking-tight text-slate-950">
              ArthSaathi
            </h2>
            <p className="truncate text-[13px] font-medium leading-5 text-[#6d746c] sm:text-sm">
              Cheerful money clarity, one easy choice at a time
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="w-10 text-right text-sm font-semibold text-[#6d746c]">
            {progress}%
          </span>
          <div
            className="h-2 w-24 overflow-hidden rounded-full bg-[#e5e7df] sm:w-44"
            aria-label={`Financial DNA progress ${progress}%`}
          >
            <div
              className="h-full rounded-full bg-[#216f61] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {completed ? (
        <div className="border-b border-emerald-100 bg-[#ecfff6] px-4 py-3 text-emerald-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              DNA complete. Nicely done.
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

      <section className="flex min-h-[520px] flex-col bg-[linear-gradient(180deg,#fbfaf6_0%,#f6f5ef_100%)] sm:min-h-[640px]">
          <div ref={scrollRef} className="flex-1 space-y-7 overflow-y-auto p-4 sm:p-8">
            {messages.map((message, index) => {
              const isUser = message.role === "user";

              return (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser ? (
                    <div className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-full bg-[#216f61] text-white shadow-sm">
                      <Bot className="size-5" aria-hidden="true" />
                    </div>
                  ) : null}
                  <div
                    className={`max-w-[78%] whitespace-pre-line px-4 py-3 text-[15px] font-medium leading-7 shadow-[0_10px_26px_rgba(15,23,42,0.08)] sm:px-5 sm:text-base ${
                      isUser
                        ? "rounded-3xl rounded-tr-lg bg-[#216f61] text-white"
                        : "rounded-3xl rounded-tl-lg border border-[#e5e0d6] bg-white text-slate-950"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              );
            })}

            {loading ? (
              <div className="flex items-start gap-3">
                <div className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-full bg-[#216f61] text-white shadow-sm">
                  <Bot className="size-5" aria-hidden="true" />
                </div>
                <div className="inline-flex items-center gap-2 rounded-3xl rounded-tl-lg border border-[#e5e0d6] bg-white px-5 py-3 text-sm text-muted-foreground shadow-[0_10px_26px_rgba(15,23,42,0.08)]">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Reading your answer
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-[#e7e2d7] bg-white p-4 sm:p-5">
            {quickReplies.length > 0 ? (
              <div className="mb-4 flex flex-wrap gap-3">
                {quickReplies.map((reply) => (
                  <button
                    key={reply.value}
                    type="button"
                    onClick={() =>
                      isMoodStep
                        ? answerMood(reply.value, reply.label)
                        : send(reply.value, reply.label)
                    }
                    disabled={loading}
                    className="inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-[#dfe4dc] bg-[#fffdfa] px-4 text-[15px] font-semibold leading-none text-slate-950 shadow-[0_7px_18px_rgba(15,23,42,0.07)] transition hover:-translate-y-0.5 hover:border-[#216f61] hover:bg-[#f4fbf7] hover:text-[#216f61] disabled:opacity-50 sm:text-base"
                  >
                    {isMoodStep ? (
                      <Smile className="size-4 text-[#216f61]" aria-hidden="true" />
                    ) : (
                      <BriefcaseBusiness className="size-4 text-[#216f61]" aria-hidden="true" />
                    )}
                    {reply.label}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="flex gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    if (isMoodStep) {
                      answerMood(input);
                    } else {
                      void send();
                    }
                  }
                }}
                placeholder={
                  completed
                    ? "Use the chips above, or update your DNA"
                    : isMoodStep
                      ? "How are you feeling today?"
                      : "Type only if you want a custom answer..."
                }
                disabled={completed && !isMoodStep}
                className="h-12 min-w-0 flex-1 rounded-full border border-[#dfe4dc] bg-[#fffdfa] px-4 text-[15px] font-medium shadow-inner placeholder:text-slate-400 disabled:opacity-60 sm:text-sm"
              />
              <button
                type="button"
                onClick={isListening ? stopVoiceInput : startVoiceInput}
                disabled={completed && !isMoodStep}
                className={`inline-flex size-12 items-center justify-center rounded-full border ${
                  isListening
                    ? "bg-rose-50 text-rose-700"
                    : "bg-[#fffdfa] text-slate-900"
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
                onClick={
                  isMoodStep ? () => answerMood(input) : () => void send()
                }
                disabled={
                  loading || (completed && !isMoodStep) || !input.trim()
                }
                className="inline-flex size-12 items-center justify-center rounded-full bg-[#216f61] text-white shadow-[0_10px_20px_rgba(33,111,97,0.24)] disabled:opacity-50"
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
