import { FileText, Scale, Search } from "lucide-react";

import { requireFinancialDNA } from "@/lib/financial-dna-gate";
import { connectToDatabase } from "@/lib/mongoose";
import { OmbudsmanCaseModel, UploadedDocumentModel } from "@/models";

import {
  DocumentCreateForm,
  DocumentDisputeForm,
  DocumentQuestionForm
} from "./document-forms";

export const dynamic = "force-dynamic";

type DocumentSnapshot = {
  _id: unknown;
  extractedData?: {
    chunks?: number;
    summary?: string;
  };
  fileName: string;
  fileType: string;
  processedAt?: Date;
};

type DraftSnapshot = {
  _id: unknown;
  complaintDraft: string;
  institutionName?: string;
  plainSummary: string;
  riskScore: number;
  riskSignals: string[];
  title: string;
};

export default async function DocumentsPage() {
  await connectToDatabase();
  const { appUser } = await requireFinancialDNA();
  const documents = await UploadedDocumentModel.find({ userId: appUser._id })
    .sort({ createdAt: -1 })
    .limit(8)
    .lean<DocumentSnapshot[]>();
  const drafts = await OmbudsmanCaseModel.find({ userId: appUser._id })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean<DraftSnapshot[]>();

  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Documents & Disputes
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Understand financial documents, ask questions, and prepare complaint
          drafts from the same place.
        </p>
      </div>

      <DocumentCreateForm />

      {documents.length ? (
        <DocumentQuestionForm
          documents={documents.map((document) => ({
            id: String(document._id),
            name: document.fileName
          }))}
        />
      ) : null}

      <DocumentDisputeForm />

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="size-5 text-slate-700" aria-hidden="true" />
          <h2 className="text-xl font-semibold tracking-tight">
            Processed documents
          </h2>
        </div>

        {documents.length ? (
          <div className="grid gap-4">
            {documents.map((document) => (
              <div key={String(document._id)} className="rounded-lg border bg-background p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-slate-950 p-2 text-white">
                    <Search className="size-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{document.fileName}</h3>
                    <p className="mt-1 text-sm capitalize text-muted-foreground">
                      {document.fileType.replaceAll("_", " ")} •{" "}
                      {document.extractedData?.chunks ?? 0} chunks
                    </p>
                  </div>
                </div>
                {document.extractedData?.summary ? (
                  <div className="mt-4 whitespace-pre-wrap rounded-md border bg-emerald-50/70 p-4 text-sm leading-6 text-emerald-950">
                    {document.extractedData.summary}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-muted/30 p-5 text-sm text-muted-foreground">
            No documents processed yet.
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Scale className="size-5 text-slate-700" aria-hidden="true" />
          <h2 className="text-xl font-semibold tracking-tight">
            Complaint drafts
          </h2>
        </div>

        {drafts.length ? (
          <div className="grid gap-4">
            {drafts.map((item) => (
              <div key={String(item._id)} className="rounded-lg border bg-background p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.institutionName || "Institution not specified"}
                    </p>
                  </div>
                  <span className="w-fit rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900">
                    risk {item.riskScore}/100
                  </span>
                </div>

                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  {item.plainSummary}
                </p>

                {item.riskSignals.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.riskSignals.map((signal) => (
                      <span
                        key={signal}
                        className="rounded-md bg-rose-50 px-2 py-1 text-xs font-medium text-rose-800"
                      >
                        {signal}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-4 text-sm leading-6">
                  {item.complaintDraft}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-muted/30 p-5 text-sm text-muted-foreground">
            No complaint drafts yet.
          </div>
        )}
      </section>
    </main>
  );
}
