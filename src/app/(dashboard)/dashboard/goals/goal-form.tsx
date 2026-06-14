"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { createGoal, type GoalFormState } from "./actions";

const initialState: GoalFormState = {
  ok: false,
  message: ""
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 rounded-md bg-slate-950 px-4 text-sm font-medium text-white disabled:opacity-60"
    >
      {pending ? "Creating..." : "Create roadmap"}
    </button>
  );
}

export function GoalForm() {
  const [state, formAction] = useActionState(createGoal, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-lg border bg-background p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Goal</span>
          <input
            name="title"
            required
            placeholder="Buy a bike"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Goal type</span>
          <select
            name="goalType"
            defaultValue="purchase"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="emergency_fund">Emergency fund</option>
            <option value="investment">Investment</option>
            <option value="debt_repayment">Debt repayment</option>
            <option value="purchase">Purchase</option>
            <option value="education">Education</option>
            <option value="travel">Travel</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Target amount</span>
          <input
            name="targetAmount"
            required
            min="1"
            type="number"
            placeholder="85000"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Saved already</span>
          <input
            name="currentAmount"
            defaultValue="0"
            min="0"
            type="number"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Target date</span>
          <input
            name="targetDate"
            type="date"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Priority</span>
          <select
            name="priority"
            defaultValue="medium"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Notes</span>
        <textarea
          name="description"
          placeholder="Why this matters, constraints, family context..."
          className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SubmitButton />
        {state.message ? (
          <p className={`text-sm ${state.ok ? "text-emerald-700" : "text-destructive"}`}>
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
