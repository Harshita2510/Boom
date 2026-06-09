"use client";

import React, { useEffect, useState } from "react";

type Msg = { role: "system" | "user" | "agent"; text: string; meta?: any };

export function OnboardingChat({ userId }: { userId?: string }) {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "agent", text: "Welcome! Let's set up your Financial DNA. First: what is your income type? (salaried, business, freelance, student, homemaker, retired, other)" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // focus input
    const el = document.getElementById("onboard-input") as HTMLInputElement | null;
    el?.focus();
  }, []);

  async function send(msg: string) {
    if (!msg) return;
    const userMsg: Msg = { role: "user", text: msg };
    setMessages((s) => [...s, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/financial-dna/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, userId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Server error");

      const agentMsg: Msg = { role: "agent", text: data.reply, meta: data };
      setMessages((s) => [...s, agentMsg]);
    } catch (e: any) {
      const errMsg: Msg = { role: "agent", text: "Sorry, something went wrong. Try again." };
      setMessages((s) => [...s, errMsg]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="h-80 overflow-y-auto rounded-md border p-3">
        {messages.map((m, i) => (
          <div key={i} className={`mb-2 ${m.role === "user" ? "text-right" : "text-left"}`}>
            <div className={`inline-block rounded-md p-2 ${m.role === "user" ? "bg-sky-100" : "bg-gray-100"}`}>{m.text}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          id="onboard-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
          placeholder="Type your answer and press Enter"
          className="flex-1 rounded-md border px-3 py-2"
        />
        <button disabled={loading} onClick={() => send(input)} className="rounded-md bg-primary px-3 text-white">Send</button>
      </div>
    </div>
  );
}
