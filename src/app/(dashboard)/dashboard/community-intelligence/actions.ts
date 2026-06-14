"use server";

import { revalidatePath } from "next/cache";

import {
  communityInsightMap,
  isCommunityName
} from "@/lib/community-intelligence";
import { getOrCreateCurrentAppUser } from "@/lib/current-app-user";
import { connectToDatabase } from "@/lib/mongoose";
import { analyzeScamText } from "@/lib/scam-intelligence";
import { CommunityPatternModel, CommunityPostModel } from "@/models";

export type CommunityJoinState = {
  ok: boolean;
  message: string;
  selectedCommunity?: string;
};

export type CommunityPostState = {
  ok: boolean;
  message: string;
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

export async function createCommunityPost(
  _previousState: CommunityPostState,
  formData: FormData
): Promise<CommunityPostState> {
  const community = formData.get("community");
  const postType = String(formData.get("postType") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!isCommunityName(community)) {
    return {
      ok: false,
      message: "Choose a valid community."
    };
  }

  if (!["tip", "question", "warning", "local_insight"].includes(postType)) {
    return {
      ok: false,
      message: "Choose a valid post type."
    };
  }

  if (body.length < 10) {
    return {
      ok: false,
      message: "Write at least 10 characters."
    };
  }

  if (body.length > 600) {
    return {
      ok: false,
      message: "Keep community posts under 600 characters."
    };
  }

  await connectToDatabase();
  const appUser = await getOrCreateCurrentAppUser();

  if (!appUser) {
    return {
      ok: false,
      message: "Please sign in first."
    };
  }

  const analysis = analyzeScamText(body);

  if (analysis.riskLevel === "high") {
    return {
      ok: false,
      message:
        "This post looks risky and was blocked. Remove links, OTP/PIN requests, payment demands, or suspicious claims."
    };
  }

  await CommunityPostModel.create({
    userId: appUser._id,
    community,
    postType,
    body,
    safetyStatus: analysis.riskLevel === "medium" ? "flagged" : "safe",
    riskScore: analysis.riskScore,
    riskIndicators: analysis.indicators
  });

  revalidatePath("/dashboard/community-intelligence");

  return {
    ok: true,
    message:
      analysis.riskLevel === "medium"
        ? "Post added with a safety flag for the community."
        : "Post added anonymously."
  };
}
