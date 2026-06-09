import { currentUser } from "@clerk/nextjs/server";

import { connectToDatabase } from "@/lib/mongoose";
import { FinancialDNAModel, UserModel } from "@/models";

import { FinancialDNAForm } from "./financial-dna-form";
import { OnboardingChat } from "./onboarding-chat";

export const dynamic = "force-dynamic";

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
        <p className="text-muted-foreground">
          Answer a few questions. Boom will save them and create your money
          profile.
        </p>
      </div>

      {existingSummary ? (
        <section className="rounded-lg border bg-emerald-50 p-4 text-emerald-900">
          <h2 className="font-medium">Your current summary</h2>
          <p className="mt-2 text-sm leading-6">{existingSummary}</p>
        </section>
      ) : null}

      <section className="rounded-lg border bg-background p-5">
        {/* Render conversational onboarding chat UI */}
        <OnboardingChat userId={clerkUser?.id} />
      </section>
    </main>
  );
}
