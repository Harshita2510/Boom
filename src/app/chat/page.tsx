"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Bot,
  Brain,
  ChartNoAxesCombined,
  Loader2,
  Mic,
  Send,
  ShieldCheck,
  Sparkles
} from "lucide-react";

type Message = {
  agent?: string;
  data?: unknown;
  intent?: string;
  role: "user" | "agent";
  text: string;
  timestamp?: string;
};

const quickPrompts = [
  {
    icon: Mic,
    label: "Log expense",
    text: "I spent 500 on groceries"
  },
  {
    icon: ChartNoAxesCombined,
    label: "Find leaks",
    text: "Where is my money leaking this month?"
  },
  {
    icon: ShieldCheck,
    label: "Check scam",
    text: "Urgent KYC expired, click this link and share OTP"
  },
  {
    icon: Brain,
    label: "Future self",
    text: "What if I buy a bike for 85000 now vs wait 6 months?"
  }
];

function getAgentLabel(agent?: string, intent?: string) {
  const value = agent || intent || "arthsaathi";

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatTime(value?: string) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function DataPreview({ data }: { data?: unknown }) {
  if (!data || typeof data !== "object") {
    return null;
  }

  const entries = Object.entries(data as Record<string, unknown>)
    .filter(([, value]) => typeof value !== "object" || value === null)
    .slice(0, 4);

  if (!entries.length) {
    return null;
  }

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {entries.map(([key, value]) => (
        <div key={key} className="rounded-md border bg-muted/40 p-2">
          <p className="text-[11px] capitalize text-muted-foreground">
            {key.replaceAll(/([A-Z])/g, " $1")}
          </p>
          <p className="mt-1 text-sm font-semibold">{String(value)}</p>
        </div>
      ))}
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      agent: "orchestrator",
      intent: "welcome",
      role: "agent",
      text:
        "Hi, I am ArthSaathi. Ask me to log spends, check scams, find money leaks, or simulate future choices.",
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  async function send(text = input) {
    const trimmed = text.trim();

    if (!trimmed || isSending) {
      return;
    }

    const userMsg: Message = {
      role: "user",
      text: trimmed,
      timestamp: new Date().toISOString()
    };
    setMessages((current) => [...current, userMsg]);
    setInput("");
    setIsSending(true);

    try {
      const res = await fetch("/api/chat", {
        body: JSON.stringify({ conversationId, message: trimmed }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      const json = await res.json();

      if (json.error) {
        setMessages((current) => [
          ...current,
          {
            role: "agent",
            text: `Error: ${json.error}`,
            timestamp: new Date().toISOString()
          }
        ]);
        return;
      }

      setConversationId(json.conversationId);

      if (json.agentResponse) {
        setMessages((current) => [
          ...current,
          {
            agent: json.agentResponse.agent,
            data: json.agentResponse.data,
            intent: json.agentResponse.intent,
            role: "agent",
            text: json.agentResponse.text,
            timestamp: new Date().toISOString()
          }
        ]);
      }
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "agent",
          text: "Network error. Please try again.",
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#f7f7f2]">
      <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              aria-label="Back to dashboard"
              className="inline-flex size-10 items-center justify-center rounded-md border bg-background"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
            </Link>
            <div>
              <h1 className="font-semibold tracking-tight">
                ArthSaathi Assistant
              </h1>
              <p className="text-xs text-muted-foreground">
                Multi-agent financial coach
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-md border bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 sm:flex">
            <Sparkles className="size-4" aria-hidden="true" />
            Context aware
          </div>
        </div>
      </header>

      <section className="container grid min-h-0 flex-1 gap-4 py-4 lg:grid-cols-[280px_1fr]">
        <aside className="hidden rounded-lg border bg-white p-4 lg:block">
          <div className="flex items-center gap-2">
            <Bot className="size-5 text-slate-700" aria-hidden="true" />
            <h2 className="font-semibold">Quick starts</h2>
          </div>
          <div className="mt-4 space-y-2">
            {quickPrompts.map((prompt) => {
              const Icon = prompt.icon;

              return (
                <button
                  key={prompt.label}
                  type="button"
                  onClick={() => send(prompt.text)}
                  className="w-full rounded-md border bg-background p-3 text-left transition-colors hover:bg-accent"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 text-emerald-700" aria-hidden="true" />
                    <p className="text-sm font-semibold">{prompt.label}</p>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {prompt.text}
                  </p>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="flex min-h-[calc(100vh-7rem)] flex-col overflow-hidden rounded-lg border bg-white">
          <div
            ref={containerRef}
            className="flex-1 space-y-4 overflow-y-auto p-4"
          >
            {messages.map((msg, index) => {
              const isUser = msg.role === "user";

              return (
                <div
                  key={`${msg.timestamp}-${index}`}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[88%] rounded-lg p-4 shadow-sm sm:max-w-[72%] ${
                      isUser
                        ? "bg-slate-950 text-white"
                        : "border bg-background text-slate-950"
                    }`}
                  >
                    {!isUser ? (
                      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-emerald-700">
                        <Bot className="size-3.5" aria-hidden="true" />
                        {getAgentLabel(msg.agent, msg.intent)}
                      </div>
                    ) : null}
                    <p className="whitespace-pre-line text-sm leading-6">
                      {msg.text}
                    </p>
                    {!isUser ? <DataPreview data={msg.data} /> : null}
                    <p
                      className={`mt-2 text-right text-[11px] ${
                        isUser ? "text-slate-300" : "text-muted-foreground"
                      }`}
                    >
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}

            {isSending ? (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-3 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Thinking
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t bg-white p-3">
            <div className="mb-3 flex gap-2 overflow-x-auto lg:hidden">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt.label}
                  type="button"
                  onClick={() => send(prompt.text)}
                  className="shrink-0 rounded-md border bg-background px-3 py-2 text-xs font-medium"
                >
                  {prompt.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                className="h-11 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm"
                placeholder="Ask ArthSaathi..."
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void send();
                  }
                }}
              />
              <button
                type="button"
                onClick={() => send()}
                disabled={isSending || !input.trim()}
                className="inline-flex size-11 items-center justify-center rounded-md bg-slate-950 text-white disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
