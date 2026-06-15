"use client";

import { useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";

type AgentResponse = {
  agent?: string;
  data?: unknown;
  intent?: string;
  text?: string;
};

const quickTasks = [
  "Find schemes I may be eligible for",
  "Review my budget and money leaks",
  "Show my goal roadmap",
  "Check my cash smoothing risk",
  "Find recurring expenses",
  "Guide my investments",
  "Run a future simulation"
];

function formatAgentName(value?: string) {
  if (!value) {
    return "Orchestrator";
  }

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function OrchestratorTask() {
  const [task, setTask] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState<AgentResponse | null>(null);

  async function submitTask(rawTask = task) {
    const message = rawTask.trim();

    if (!message || loading) {
      return;
    }

    setTask(message);
    setLoading(true);
    setError("");
    setResponse(null);

    try {
      const res = await fetch("/api/orchestrate", {
        body: JSON.stringify({ message }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || "Could not run task.");
      }

      setResponse(json.agentResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not run task.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg border bg-background p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-slate-950 p-2 text-white">
          <Sparkles className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Orchestrator
          </h2>
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {quickTasks.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => submitTask(item)}
            className="rounded-md border bg-muted/30 px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-5 flex gap-2">
        <textarea
          value={task}
          onChange={(event) => setTask(event.target.value)}
          placeholder="Tell ArthSaathi what you want done"
          className="min-h-24 min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => submitTask()}
          disabled={loading || !task.trim()}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white disabled:opacity-50"
          aria-label="Run task"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      {response ? (
        <div className="mt-4 rounded-lg border bg-muted/30 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-slate-950 px-2 py-1 text-xs font-semibold text-white">
              {formatAgentName(response.agent)}
            </span>
            {response.intent ? (
              <span className="rounded-md border bg-background px-2 py-1 text-xs font-medium text-muted-foreground">
                {response.intent.replaceAll("_", " ")}
              </span>
            ) : null}
          </div>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">
            {response.text}
          </p>
        </div>
      ) : null}
    </section>
  );
}
