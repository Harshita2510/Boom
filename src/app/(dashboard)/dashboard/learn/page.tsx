import { BookOpen, Lightbulb, ShieldCheck } from "lucide-react";

import {
  createFinancialLesson,
  listFinancialLessons
} from "@/lib/financial-education";
import { getOrCreateCurrentAppUser } from "@/lib/current-app-user";
import { connectToDatabase } from "@/lib/mongoose";
import { FinancialDNAModel } from "@/models";

export const dynamic = "force-dynamic";

type FinancialDNASnapshot = {
  incomeType?: string;
  occupation?: string;
};

export default async function LearnPage() {
  await connectToDatabase();
  const appUser = await getOrCreateCurrentAppUser();
  const profile = appUser
    ? await FinancialDNAModel.findOne({ userId: appUser._id }).lean<FinancialDNASnapshot | null>()
    : null;
  const featuredLesson = createFinancialLesson("Explain UPI", {
    incomeType: profile?.incomeType,
    occupation: profile?.occupation
  });
  const topics = listFinancialLessons();

  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Financial Education Agent
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Learn finance concepts through simple explanations and analogies based
          on your work and money life.
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-lg border bg-background p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-emerald-50 p-2 text-emerald-700">
              <Lightbulb className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-semibold">{featuredLesson.title}</h2>
              <p className="text-sm text-muted-foreground">
                Occupation-aware explanation
              </p>
            </div>
          </div>

          <p className="mt-5 text-sm leading-6 text-muted-foreground">
            {featuredLesson.analogy}
          </p>

          <div className="mt-4 space-y-2">
            {featuredLesson.keyPoints.map((point) => (
              <div key={point} className="rounded-md border bg-muted/30 p-3 text-sm">
                {point}
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-md bg-slate-950 p-4 text-sm leading-6 text-white">
            Next step: {featuredLesson.nextStep}
          </div>
        </div>

        <div className="rounded-lg border bg-background p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-emerald-700" aria-hidden="true" />
            <h2 className="font-semibold">Safety habit</h2>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Ask the assistant questions like “Explain SIP”, “What is FD?”, or
            “What is UPI?” ArthSaathi will answer using simple analogies and
            safety notes.
          </p>
        </div>
      </section>

      <section className="rounded-lg border bg-background p-5">
        <div className="flex items-center gap-2">
          <BookOpen className="size-5 text-slate-700" aria-hidden="true" />
          <h2 className="font-semibold">Topics</h2>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {topics.map((topic) => (
            <div key={topic.concept} className="rounded-md border p-4">
              <p className="font-semibold">{topic.title}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Ask in chat: Explain {topic.title}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
