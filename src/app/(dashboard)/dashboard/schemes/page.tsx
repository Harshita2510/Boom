import { Landmark, ShieldAlert } from "lucide-react";

import { getOrCreateCurrentAppUser } from "@/lib/current-app-user";
import { recommendGovernmentSchemes } from "@/lib/government-schemes";
import { connectToDatabase } from "@/lib/mongoose";
import { FinancialDNAModel } from "@/models";

export const dynamic = "force-dynamic";

type FinancialDNASnapshot = {
  dependents?: number;
  financialGoals?: string[];
  incomeType?: string;
  occupation?: string;
  riskAppetite?: string;
};

const priorityTone = {
  high: "border-emerald-200 bg-emerald-50 text-emerald-800",
  low: "border-slate-200 bg-slate-50 text-slate-700",
  medium: "border-blue-200 bg-blue-50 text-blue-800"
};

export default async function SchemesPage() {
  await connectToDatabase();
  const appUser = await getOrCreateCurrentAppUser();
  const profile = appUser
    ? await FinancialDNAModel.findOne({ userId: appUser._id }).lean<FinancialDNASnapshot | null>()
    : null;
  const recommendations = recommendGovernmentSchemes({
    dependents: profile?.dependents,
    financialGoals: profile?.financialGoals,
    incomeType: profile?.incomeType,
    occupation: profile?.occupation,
    riskAppetite: profile?.riskAppetite
  });

  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Government Scheme Agent
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          ArthSaathi suggests schemes to check based on your Financial DNA. This
          is guidance, not final eligibility approval.
        </p>
      </div>

      <section className="rounded-lg border bg-amber-50 p-4 text-amber-900">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 size-5" aria-hidden="true" />
          <p className="text-sm leading-6">
            Verify all scheme rules through official bank or government
            channels. Never share OTP, UPI PIN, or pay a fee to unlock benefits.
          </p>
        </div>
      </section>

      <section className="grid gap-4">
        {recommendations.map((scheme) => (
          <div key={scheme.name} className="rounded-lg border bg-background p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-slate-950 p-2 text-white">
                  <Landmark className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-semibold">{scheme.name}</h2>
                  <p className="mt-1 text-sm capitalize text-muted-foreground">
                    {scheme.category}
                  </p>
                </div>
              </div>
              <span
                className={`w-fit rounded-md border px-3 py-1 text-xs font-semibold ${priorityTone[scheme.priority]}`}
              >
                {scheme.priority} fit
              </span>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <InfoBlock label="Why it may fit" text={scheme.fitReason} />
              <InfoBlock label="Eligibility hint" text={scheme.eligibilityHint} />
              <InfoBlock label="Next step" text={scheme.nextStep} />
              <InfoBlock label="Safety note" text={scheme.safetyNote} />
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}

function InfoBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm leading-6">{text}</p>
    </div>
  );
}
