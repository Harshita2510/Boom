"use client";

import { useMemo, useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, UsersRound } from "lucide-react";

import {
  communities,
  communityInsightMap,
  type CommunityName
} from "@/lib/community-intelligence";

import { joinCommunity, type CommunityJoinState } from "./actions";

const initialState: CommunityJoinState = {
  ok: false,
  message: ""
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
    >
      <UsersRound className="size-4" aria-hidden="true" />
      {pending ? "Joining..." : "Join anonymously"}
    </button>
  );
}

export function CommunityJoinForm() {
  const [state, formAction] = useActionState(joinCommunity, initialState);
  const [selectedCommunity, setSelectedCommunity] =
    useState<CommunityName>("Farmers");

  const activeCommunity = useMemo(() => {
    if (state.ok && state.selectedCommunity) {
      return state.selectedCommunity as CommunityName;
    }

    return selectedCommunity;
  }, [selectedCommunity, state.ok, state.selectedCommunity]);

  const insights = communityInsightMap[activeCommunity];

  return (
    <div className="space-y-6">
      <form action={formAction} className="rounded-lg border bg-background p-5">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <label className="space-y-2">
            <span className="text-sm font-medium">Choose community</span>
            <select
              name="community"
              value={selectedCommunity}
              onChange={(event) =>
                setSelectedCommunity(event.target.value as CommunityName)
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            >
              {communities.map((community) => (
                <option key={community} value={community}>
                  {community}
                </option>
              ))}
            </select>
          </label>

          <SubmitButton />
        </div>

        {state.message ? (
          <p
            className={`mt-3 text-sm ${
              state.ok ? "text-emerald-700" : "text-destructive"
            }`}
          >
            {state.message}
          </p>
        ) : null}
      </form>

      <section className="grid gap-4 lg:grid-cols-3">
        <PatternColumn
          title="Positive patterns"
          tone="positive"
          items={insights.positivePatterns}
        />
        <PatternColumn
          title="Negative patterns"
          tone="negative"
          items={insights.negativePatterns}
        />
        <PatternColumn
          title="Recommended actions"
          tone="action"
          items={insights.recommendedActions}
        />
      </section>
    </div>
  );
}

function PatternColumn({
  items,
  title,
  tone
}: {
  items: string[];
  title: string;
  tone: "positive" | "negative" | "action";
}) {
  const toneClass = {
    action: "border-blue-200 bg-blue-50 text-blue-800",
    negative: "border-rose-200 bg-rose-50 text-rose-800",
    positive: "border-emerald-200 bg-emerald-50 text-emerald-800"
  }[tone];

  return (
    <div className="rounded-lg border bg-background p-4">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item} className={`rounded-md border p-3 ${toneClass}`}>
            <div className="flex gap-2">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <p className="text-sm leading-6">{item}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
