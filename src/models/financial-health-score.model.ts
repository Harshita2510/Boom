import { Schema, model, models, type InferSchemaType } from "mongoose";

const financialHealthScoreSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    savingsScore: {
      type: Number,
      min: 0,
      max: 100
    },
    spendingScore: {
      type: Number,
      min: 0,
      max: 100
    },
    debtScore: {
      type: Number,
      min: 0,
      max: 100
    },
    investmentScore: {
      type: Number,
      min: 0,
      max: 100
    },
    cashflowScore: {
      type: Number,
      min: 0,
      max: 100
    },
    scoreBand: {
      type: String,
      enum: ["critical", "weak", "stable", "strong", "excellent"],
      required: true
    },
    insights: [String],
    calculatedForMonth: {
      type: String,
      required: true
    },
    calculatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

financialHealthScoreSchema.index(
  { userId: 1, calculatedForMonth: 1 },
  { unique: true }
);

export type FinancialHealthScore = InferSchemaType<
  typeof financialHealthScoreSchema
>;

export const FinancialHealthScoreModel =
  models.FinancialHealthScore ||
  model("FinancialHealthScore", financialHealthScoreSchema);
