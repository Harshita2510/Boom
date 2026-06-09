"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ShieldAlert, Upload } from "lucide-react";

import { analyzeScamMessage, type ScamShieldState } from "./actions";

const initialState: ScamShieldState = {
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
      <ShieldAlert className="size-4" aria-hidden="true" />
      {pending ? "Analyzing..." : "Analyze message"}
    </button>
  );
}

export function ScamShieldForm() {
  const [state, formAction] = useActionState(analyzeScamMessage, initialState);

  return (
    <form action={formAction} className="space-y-5 rounded-lg border bg-background p-5">
      <label className="block space-y-2">
        <span className="text-sm font-medium">Message text</span>
        <textarea
          name="messageText"
          placeholder="Paste SMS, WhatsApp, email, payment request, or link text"
          className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Screenshot</span>
        <span className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed bg-muted/30 px-4 py-5 text-center text-sm text-muted-foreground">
          <Upload className="mb-2 size-5" aria-hidden="true" />
          Upload PNG, JPG, or WebP screenshot
        </span>
        <input
          name="screenshot"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="block w-full text-sm text-muted-foreground"
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
