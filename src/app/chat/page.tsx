"use client";

import React, { useEffect, useState, useRef } from "react";

type Message = {
  role: "user" | "agent";
  text: string;
  agent?: string;
  intent?: string;
  timestamp?: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // auto-scroll
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  async function send() {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", text: input, timestamp: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    const body = { message: input, conversationId };
    setInput("");

    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (json.error) {
        setMessages((m) => [...m, { role: "agent", text: "Error: " + json.error }]);
        return;
      }

      setConversationId(json.conversationId);
      const convo = json.conversation;
      const last = convo.messages[convo.messages.length - 1];
      if (last) {
        setMessages((m) => [...m, { role: last.role, text: last.text, agent: last.agent, intent: last.intent, timestamp: last.timestamp }]);
      }
    } catch (err) {
      setMessages((m) => [...m, { role: "agent", text: "Network error" }]);
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <div ref={containerRef} className="flex-1 overflow-auto p-4 bg-gray-50">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-4 ${msg.role === "user" ? "text-right" : "text-left"}`}>
            <div className={`inline-block p-3 rounded-md ${msg.role === "user" ? "bg-blue-500 text-white" : "bg-white text-gray-900 shadow"}`}>
              <div className="text-sm">{msg.text}</div>
              {msg.agent && <div className="text-xs text-gray-500 mt-1">Agent: {msg.agent} • Intent: {msg.intent}</div>}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t bg-white">
        <div className="flex">
          <input value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 border rounded px-3 py-2 mr-2" placeholder="Type a message..." onKeyDown={(e) => e.key === "Enter" && send()} />
          <button onClick={send} className="bg-blue-600 text-white px-4 py-2 rounded">Send</button>
        </div>
      </div>
    </div>
  );
}
