import { Schema, model, models, type InferSchemaType } from "mongoose";

const communityPatternSchema = new Schema(
  {
    segmentKey: {
      type: String,
      required: true,
      index: true
    },
    segmentName: {
      type: String,
      required: true,
      trim: true
    },
    city: String,
    ageRange: String,
    incomeRange: String,
    category: {
      type: String,
      required: true,
      trim: true
    },
    patternType: {
      type: String,
      enum: ["positive", "negative", "recommended_action", "membership"],
      default: "membership",
      index: true
    },
    insight: {
      type: String,
      trim: true
    },
    recommendedAction: {
      type: String,
      trim: true
    },
    averageMonthlySpend: {
      type: Number,
      min: 0
    },
    medianMonthlySpend: {
      type: Number,
      min: 0
    },
    savingsRate: {
      type: Number,
      min: 0,
      max: 100
    },
    sampleSize: {
      type: Number,
      required: true,
      min: 1
    },
    confidenceLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },
    calculatedForMonth: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

communityPatternSchema.index({
  segmentKey: 1,
  category: 1,
  patternType: 1,
  calculatedForMonth: 1
});

export type CommunityPattern = InferSchemaType<typeof communityPatternSchema>;

export const CommunityPatternModel =
  models.CommunityPattern ||
  model("CommunityPattern", communityPatternSchema);
