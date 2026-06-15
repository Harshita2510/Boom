import { MessageSquareText, ShieldCheck, UsersRound } from "lucide-react";

import { communities } from "@/lib/community-intelligence";
import { requireFinancialDNA } from "@/lib/financial-dna-gate";
import { connectToDatabase } from "@/lib/mongoose";
import { CommunityPatternModel, CommunityPostModel } from "@/models";

import { CommunityJoinForm } from "./community-join-form";
import { CommunityPostForm } from "./community-post-form";

export const dynamic = "force-dynamic";

type CommunityAggregate = {
  segmentName: string;
  sampleSize: number;
};

type CommunityPostSnapshot = {
  _id: unknown;
  body: string;
  community: string;
  createdAt: Date;
  postType: "tip" | "question" | "warning" | "local_insight";
  riskScore: number;
  safetyStatus: "safe" | "flagged" | "blocked";
};

async function getCommunityAggregates() {
  await connectToDatabase();

  const rows = await CommunityPatternModel.find({
    category: "community-membership",
    patternType: "membership"
  })
    .select("segmentName sampleSize")
    .lean<CommunityAggregate[]>();

  const counts = new Map(
    rows.map((row) => [row.segmentName, row.sampleSize ?? 0])
  );

  return communities.map((community) => ({
    community,
    members: counts.get(community) ?? 0
  }));
}

async function getCommunityFeed() {
  await connectToDatabase();

  return CommunityPostModel.find({
    safetyStatus: { $in: ["safe", "flagged"] }
  })
    .sort({ createdAt: -1 })
    .limit(12)
    .lean<CommunityPostSnapshot[]>();
}

export default async function CommunityIntelligencePage() {
  await requireFinancialDNA();
  const [aggregates, feed] = await Promise.all([
    getCommunityAggregates(),
    getCommunityFeed()
  ]);
  const totalAnonymousJoins = aggregates.reduce(
    (sum, item) => sum + item.members,
    0
  );

  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Community Intelligence Network
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Join a community to compare anonymous patterns, spot shared risks, and
          choose practical next actions. Personal user data is never displayed or
          stored in community pattern records.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-background p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-cyan-50 p-2 text-cyan-700">
              <UsersRound className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-semibold">Anonymous network size</h2>
              <p className="text-sm text-muted-foreground">
                Aggregate joins recorded this month
              </p>
            </div>
          </div>
          <p className="mt-5 text-3xl font-semibold tracking-tight">
            {totalAnonymousJoins}
          </p>
        </div>

        <div className="rounded-lg border bg-background p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-emerald-50 p-2 text-emerald-700">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-semibold">Privacy guardrail</h2>
              <p className="text-sm text-muted-foreground">
                No names, emails, IDs, or individual profile details are shared.
              </p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">
            Community records contain only the selected community, anonymous
            pattern category, sample size, confidence, and month.
          </p>
        </div>
      </section>

      <CommunityJoinForm />

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquareText className="size-5 text-slate-700" aria-hidden="true" />
          <h2 className="text-xl font-semibold tracking-tight">
            ArthSaathi Circles feed
          </h2>
        </div>
        <CommunityPostForm />

        <div className="grid gap-3">
          {feed.length ? (
            feed.map((post) => (
              <div key={String(post._id)} className="rounded-lg border bg-background p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">
                        {post.community}
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium capitalize text-slate-700">
                        {post.postType.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6">{post.body}</p>
                  </div>
                  <span
                    className={`w-fit rounded-md border px-2 py-1 text-xs font-semibold ${
                      post.safetyStatus === "flagged"
                        ? "border-amber-200 bg-amber-50 text-amber-900"
                        : "border-emerald-200 bg-emerald-50 text-emerald-800"
                    }`}
                  >
                    {post.safetyStatus === "flagged"
                      ? `flagged ${post.riskScore}/100`
                      : "AI checked"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border bg-muted/30 p-5 text-sm text-muted-foreground">
              No community posts yet. Share the first useful tip or question.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border bg-background p-5">
        <h2 className="text-base font-semibold tracking-tight">
          Community participation
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {aggregates.map((item) => (
            <div key={item.community} className="rounded-md border p-3">
              <p className="text-sm font-medium">{item.community}</p>
              <p className="mt-2 text-2xl font-semibold">{item.members}</p>
              <p className="text-xs text-muted-foreground">anonymous joins</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
