import { ShieldCheck, UsersRound } from "lucide-react";

import { communities } from "@/lib/community-intelligence";
import { connectToDatabase } from "@/lib/mongoose";
import { CommunityPatternModel } from "@/models";

import { CommunityJoinForm } from "./community-join-form";

export const dynamic = "force-dynamic";

type CommunityAggregate = {
  segmentName: string;
  sampleSize: number;
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

export default async function CommunityIntelligencePage() {
  const aggregates = await getCommunityAggregates();
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
