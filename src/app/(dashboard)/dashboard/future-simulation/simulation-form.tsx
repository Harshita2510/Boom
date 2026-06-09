"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { WandSparkles } from "lucide-react";

import { runFutureSimulation, type SimulationState } from "./actions";

const initialState: SimulationState = {
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
      <WandSparkles className="size-4" aria-hidden="true" />
      {pending ? "Simulating..." : "Run simulation"}
    </button>
  );
}

export function SimulationForm() {
  const [state, formAction] = useActionState(runFutureSimulation, initialState);

  return (
    <form action={formAction} className="rounded-lg border bg-background p-5">
      <label className="block space-y-2">
        <span className="text-sm font-medium">Ask a what-if question</span>
        <textarea
          name="question"
          required
          defaultValue="What if I save ₹1000 more per month?"
          className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
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
