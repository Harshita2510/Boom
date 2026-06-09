"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  saveFinancialDNA,
  type FinancialDNAFormState
} from "./actions";

const initialState: FinancialDNAFormState = {
  ok: false,
  message: ""
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
    >
      {pending ? "Saving..." : "Generate my Financial DNA"}
    </button>
  );
}

export function FinancialDNAForm() {
  const [state, formAction] = useActionState(saveFinancialDNA, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Occupation</span>
          <input
            name="occupation"
            required
            placeholder="Example: Software engineer"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Income Type</span>
          <select
            name="incomeType"
            required
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            defaultValue="salaried"
          >
            <option value="salaried">Salaried</option>
            <option value="business">Business</option>
            <option value="freelance">Freelance</option>
            <option value="student">Student</option>
            <option value="homemaker">Homemaker</option>
            <option value="retired">Retired</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Monthly Income</span>
          <input
            name="monthlyIncome"
            required
            min="0"
            type="number"
            placeholder="Example: 50000"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Dependents</span>
          <input
            name="dependents"
            required
            min="0"
            type="number"
            placeholder="Example: 2"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          />
        </label>
      </div>

      <label className="space-y-2 block">
        <span className="text-sm font-medium">Financial Goals</span>
        <textarea
          name="financialGoals"
          required
          placeholder="Example: emergency fund, buy home, save tax"
          className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </label>

      <label className="space-y-2 block">
        <span className="text-sm font-medium">Risk Appetite</span>
        <select
          name="riskAppetite"
          required
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          defaultValue="medium"
        >
          <option value="low">Low - I prefer safety</option>
          <option value="medium">Medium - I want balance</option>
          <option value="high">High - I can take more risk</option>
        </select>
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SubmitButton />
        {state.message ? (
          <p
            className={`text-sm ${
              state.ok ? "text-emerald-700" : "text-destructive"
            }`}
          >
            {state.ok ? "Saved. " : ""}
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
