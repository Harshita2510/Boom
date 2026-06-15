import { AlertTriangle, ShieldCheck } from "lucide-react";

import { requireFinancialDNA } from "@/lib/financial-dna-gate";
import { connectToDatabase } from "@/lib/mongoose";
import { ScamAnalysisModel } from "@/models";

import { ScamShieldForm } from "./scam-shield-form";

export const dynamic = "force-dynamic";

const riskTone = {
  high: "bg-rose-50 text-rose-800 border-rose-200",
  low: "bg-emerald-50 text-emerald-800 border-emerald-200",
  medium: "bg-amber-50 text-amber-800 border-amber-200"
};

export default async function ScamShieldPage() {
  await connectToDatabase();
  const { appUser } = await requireFinancialDNA();
  const recentAnalyses = await ScamAnalysisModel.find({ userId: appUser._id })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const latest = recentAnalyses[0];

  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Scam Shield</h1>
        <p className="max-w-3xl text-muted-foreground">
          Upload a screenshot or paste message text to detect scam indicators,
          generate a risk score, and store the analysis.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-[1fr_260px]">
        <ScamShieldForm />

        <div className="rounded-lg border bg-background p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-rose-50 p-2 text-rose-700">
              <AlertTriangle className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-semibold">Latest risk</h2>
              <p className="text-sm text-muted-foreground">
                Stored database result
              </p>
            </div>
          </div>

          {latest ? (
            <div className="mt-5">
              <div
                className={`inline-flex rounded-md border px-3 py-1 text-sm font-medium ${
                  riskTone[latest.riskLevel as keyof typeof riskTone]
                }`}
              >
                {latest.riskLevel} risk
              </div>
              <p className="mt-4 text-4xl font-semibold">
                {latest.riskScore}/100
              </p>
              <div className="mt-4 h-3 rounded-full bg-muted">
                <div
                  className="h-3 rounded-full bg-rose-500"
                  style={{ width: `${latest.riskScore}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">
              No scam analysis stored yet.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-lg border bg-background p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-emerald-700" aria-hidden="true" />
          <h2 className="text-base font-semibold tracking-tight">
            Recent analyses
          </h2>
        </div>

        <div className="mt-4 space-y-3">
          {recentAnalyses.length > 0 ? (
            recentAnalyses.map((analysis) => (
              <div key={String(analysis._id)} className="rounded-md border p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-medium">
                    {analysis.inputType === "screenshot"
                      ? analysis.fileName ?? "Screenshot"
                      : "Text message"}
                  </p>
                  <span
                    className={`w-fit rounded-md border px-2 py-1 text-xs font-medium ${
                      riskTone[analysis.riskLevel as keyof typeof riskTone]
                    }`}
                  >
                    {analysis.riskScore}/100 {analysis.riskLevel}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {analysis.explanation}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Analyses will appear here after you submit a screenshot or text.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
