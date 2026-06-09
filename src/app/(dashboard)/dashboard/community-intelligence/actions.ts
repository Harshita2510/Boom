"use server";

import { revalidatePath } from "next/cache";

import {
  communityInsightMap,
  isCommunityName
} from "@/lib/community-intelligence";
import { connectToDatabase } from "@/lib/mongoose";
import { CommunityPatternModel } from "@/models";

export type CommunityJoinState = {
  ok: boolean;
  message: string;
  selectedCommunity?: string;
};

function getCurrentMonthKey() {
  return new Intl.DateTimeFormat("en-CA", {
    month: "2-digit",
    timeZone: "Asia/Kolkata",
    year: "numeric"
  }).format(new Date());
}

export async function joinCommunity(
  _previousState: CommunityJoinState,
  formData: FormData
): Promise<CommunityJoinState> {
  const community = formData.get("community");

  if (!isCommunityName(community)) {
    return {
      ok: false,
      message: "Choose a valid community."
    };
  }

  const calculatedForMonth = getCurrentMonthKey();
  const segmentKey = community.toLowerCase().replaceAll(" ", "-");
  const insights = communityInsightMap[community];

  await connectToDatabase();

  await CommunityPatternModel.findOneAndUpdate(
    {
      segmentKey,
      category: "community-membership",
      patternType: "membership",
      calculatedForMonth
    },
    {
      $set: {
        segmentKey,
        segmentName: community,
        category: "community-membership",
        patternType: "membership",
        confidenceLevel: "medium",
        calculatedForMonth
      },
      $inc: {
        sampleSize: 1
      }
    },
    {
      new: true,
      setDefaultsOnInsert: true,
      upsert: true
    }
  );

  const patternWrites: {
    category: string;
    insight: string;
    patternType: "positive" | "negative" | "recommended_action";
    recommendedAction?: string;
  }[] = [
    ...insights.positivePatterns.map((insight) => ({
      patternType: "positive" as const,
      category: "positive-patterns",
      insight
    })),
    ...insights.negativePatterns.map((insight) => ({
      patternType: "negative" as const,
      category: "negative-patterns",
      insight
    })),
    ...insights.recommendedActions.map((insight) => ({
      patternType: "recommended_action" as const,
      category: "recommended-actions",
      insight,
      recommendedAction: insight
    }))
  ];

  await Promise.all(
    patternWrites.map((pattern) =>
      CommunityPatternModel.findOneAndUpdate(
        {
          segmentKey,
          category: pattern.category,
          patternType: pattern.patternType,
          insight: pattern.insight,
          calculatedForMonth
        },
        {
          $set: {
            segmentKey,
            segmentName: community,
            category: pattern.category,
            patternType: pattern.patternType,
            insight: pattern.insight,
            recommendedAction: pattern.recommendedAction,
            confidenceLevel: "medium",
            calculatedForMonth
          },
          $max: {
            sampleSize: 1
          }
        },
        {
          new: true,
          setDefaultsOnInsert: true,
          upsert: true
        }
      )
    )
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/community-intelligence");

  return {
    ok: true,
    message:
      "Joined anonymously. Only aggregate community patterns were stored.",
    selectedCommunity: community
  };
}
