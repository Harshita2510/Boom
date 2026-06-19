"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RotateCcw } from "lucide-react";

export function RetakeDNAButton({ userId }: { userId?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function retake() {
    if (!userId || loading) {
      return;
    }

    setLoading(true);
    localStorage.clear();

    try {
      await fetch("/api/financial-dna/onboard", {
        body: JSON.stringify({ reset: true, userId }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={retake}
      disabled={loading || !userId}
      className="inline-flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-60"
    >
      <RotateCcw className="size-4" aria-hidden="true" />
      {loading ? "Resetting..." : "Retake"}
    </button>
  );
}
