import { Schema, model, models, type InferSchemaType } from "mongoose";

const futureSimulationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    question: {
      type: String,
      required: true,
      trim: true
    },
    monthlySavingsDelta: {
      type: Number,
      required: true
    },
    baselineMonthlySavings: {
      type: Number,
      required: true
    },
    projectedMonthlySavings: {
      type: Number,
      required: true
    },
    projectedSixMonthImpact: {
      type: Number,
      required: true
    },
    projectedTwelveMonthImpact: {
      type: Number,
      required: true
    },
    projectedEmergencyFundMonths: {
      type: Number,
      required: true
    },
    communityInsightSummary: {
      type: String,
      trim: true
    },
    explanation: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

futureSimulationSchema.index({ userId: 1, createdAt: -1 });

export type FutureSimulation = InferSchemaType<typeof futureSimulationSchema>;

export const FutureSimulationModel =
  models.FutureSimulation ||
  model("FutureSimulation", futureSimulationSchema);
