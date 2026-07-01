"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, RotateCcw } from "lucide-react";

import { LanguageText } from "@/components/language-text";

export function RetakeDNAButton({ userId }: { userId?: string }) {
  const router = useRouter();

  function retake() {
    if (!userId) {
      return;
    }

    router.push("/dashboard/financial-dna?update=1");
  }

  return (
    <div className="rounded-2xl border-2 border-emerald-700 bg-emerald-950 p-4 shadow-lg shadow-emerald-950/20">
      <button
        type="button"
        onClick={retake}
        disabled={!userId}
        className="flex w-full items-center justify-between gap-4 rounded-xl px-2 py-2 text-left transition hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 disabled:opacity-60 sm:px-3 sm:py-3"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-emerald-800 sm:size-14">
            <RotateCcw className="size-6" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-base font-bold text-white sm:text-lg">
              <LanguageText id="financialDna.updateTitle" />
            </span>
            <span className="block text-sm font-semibold leading-5 text-emerald-100 sm:text-base">
              <LanguageText id="financialDna.updateSubtitle" />
            </span>
          </span>
        </span>
        <ChevronRight className="size-7 shrink-0 text-white" aria-hidden="true" />
      </button>
    </div>
  );
}
