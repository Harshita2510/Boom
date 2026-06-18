import { currentUser } from "@clerk/nextjs/server";

import { connectToDatabase } from "@/lib/mongoose";
import { FinancialDNAModel, UserModel } from "@/models";

import { OnboardingChat } from "./onboarding-chat";

export const dynamic = "force-dynamic";

function summaryToPoints(summary: string) {
  return summary
    .split(/(?<=\.)\s+/)
    .map((point) => point.trim())
    .filter(Boolean);
}

export default async function FinancialDNAPage() {
  const clerkUser = await currentUser();
  let existingSummary = "";

  if (clerkUser) {
    await connectToDatabase();
    const appUser = await UserModel.findOne({ clerkId: clerkUser.id });

    if (appUser) {
      const financialDNA = await FinancialDNAModel.findOne({
        userId: appUser._id
      });
      existingSummary = financialDNA?.summary ?? "";
    }
  }

  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Financial DNA
        </h1>
      </div>

      <OnboardingChat
        initialSummary={existingSummary}
        userId={clerkUser?.id}
      />

      {existingSummary ? (
        <section className="rounded-lg border border-emerald-100 bg-[#f0fff7] p-5 text-emerald-950 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
            Result
          </p>
          <h2 className="mt-1 text-xl font-semibold">
            Your Financial DNA snapshot
          </h2>
          <ul className="mt-4 space-y-3 text-sm leading-6">
            {summaryToPoints(existingSummary).map((point) => (
              <li
                key={point}
                className="flex gap-3 rounded-md border border-emerald-100 bg-white/80 px-3 py-2"
              >
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-700" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
