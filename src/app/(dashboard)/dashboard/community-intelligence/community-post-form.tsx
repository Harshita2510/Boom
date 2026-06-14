"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { MessageSquarePlus } from "lucide-react";

import { communities, type CommunityName } from "@/lib/community-intelligence";

import {
  createCommunityPost,
  type CommunityPostState
} from "./actions";

const initialState: CommunityPostState = {
  ok: false,
  message: ""
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white disabled:opacity-60"
    >
      <MessageSquarePlus className="size-4" aria-hidden="true" />
      {pending ? "Checking..." : "Post anonymously"}
    </button>
  );
}

export function CommunityPostForm() {
  const [state, formAction] = useActionState(
    createCommunityPost,
    initialState
  );
  const [selectedCommunity, setSelectedCommunity] =
    useState<CommunityName>("Farmers");

  return (
    <form action={formAction} className="rounded-lg border bg-background p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Community</span>
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

        <label className="space-y-2">
          <span className="text-sm font-medium">Post type</span>
          <select
            name="postType"
            defaultValue="tip"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="tip">Money tip</option>
            <option value="question">Question</option>
            <option value="warning">Scam warning</option>
            <option value="local_insight">Local insight</option>
          </select>
        </label>
      </div>

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-medium">Anonymous post</span>
        <textarea
          name="body"
          required
          maxLength={600}
          placeholder="Share a useful money tip, question, or scam warning. Posts asking for OTP/PIN/payment links are blocked."
          className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </label>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SubmitButton />
        {state.message ? (
          <p
            className={`text-sm ${
              state.ok ? "text-emerald-700" : "text-destructive"
            }`}
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
