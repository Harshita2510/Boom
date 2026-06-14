"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { FileQuestion, Scale, Upload } from "lucide-react";

import {
  askDocumentQuestion,
  createDocumentDisputeDraft,
  createDocumentRecord,
  type DocumentFormState
} from "./actions";

const initialState: DocumentFormState = {
  ok: false,
  message: ""
};

function SubmitDocumentButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white disabled:opacity-60"
    >
      <Upload className="size-4" aria-hidden="true" />
      {pending ? "Processing..." : "Process document"}
    </button>
  );
}

function AskButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white disabled:opacity-60"
    >
      <FileQuestion className="size-4" aria-hidden="true" />
      {pending ? "Searching..." : "Ask"}
    </button>
  );
}

function DraftButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white disabled:opacity-60"
    >
      <Scale className="size-4" aria-hidden="true" />
      {pending ? "Drafting..." : "Prepare complaint"}
    </button>
  );
}

export function DocumentCreateForm() {
  const [state, formAction] = useActionState(
    createDocumentRecord,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4 rounded-lg border bg-background p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Document name</span>
          <input
            name="fileName"
            placeholder="Loan agreement text"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Document type</span>
          <select
            name="fileType"
            defaultValue="other"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="bank_statement">Bank statement</option>
            <option value="salary_slip">Salary slip</option>
            <option value="tax_document">Tax document</option>
            <option value="receipt">Receipt</option>
            <option value="other">Other</option>
          </select>
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Upload text file</span>
        <input
          name="textFile"
          type="file"
          accept=".txt,text/plain"
          className="block w-full text-sm text-muted-foreground"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Or paste extracted text</span>
        <textarea
          name="documentText"
          placeholder="Paste PDF/document text here..."
          className="min-h-36 w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SubmitDocumentButton />
        {state.message ? (
          <p className={`text-sm ${state.ok ? "text-emerald-700" : "text-destructive"}`}>
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}

export function DocumentQuestionForm({
  documents
}: {
  documents: { id: string; name: string }[];
}) {
  const [state, formAction] = useActionState(
    askDocumentQuestion,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4 rounded-lg border bg-background p-5">
      <div className="grid gap-4 md:grid-cols-[240px_1fr_auto] md:items-end">
        <label className="space-y-2">
          <span className="text-sm font-medium">Document</span>
          <select
            name="documentId"
            required
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            {documents.map((document) => (
              <option key={document.id} value={document.id}>
                {document.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">Question</span>
          <input
            name="question"
            required
            placeholder="What fees or penalties should I notice?"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          />
        </label>

        <AskButton />
      </div>

      {state.message ? (
        <div
          className={`rounded-md border p-3 text-sm leading-6 ${
            state.ok ? "bg-emerald-50 text-emerald-800" : "text-destructive"
          }`}
        >
          {state.message}
        </div>
      ) : null}
    </form>
  );
}

export function DocumentDisputeForm() {
  const [state, formAction] = useActionState(
    createDocumentDisputeDraft,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4 rounded-lg border bg-background p-5">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">
          Turn a document or issue into a complaint
        </h2>
        <p className="text-sm text-muted-foreground">
          Paste the problematic clause, fee message, claim rejection, failed UPI
          note, or loan text. ArthSaathi will infer the issue type.
        </p>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Institution name</span>
        <input
          name="institutionName"
          placeholder="Bank, insurer, lender, wallet app"
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Issue text</span>
        <textarea
          name="documentText"
          required
          placeholder="Paste the fee message, policy clause, loan term, rejection reason, or failed transaction details..."
          className="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <DraftButton />
        {state.message ? (
          <p className={`text-sm ${state.ok ? "text-emerald-700" : "text-destructive"}`}>
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
