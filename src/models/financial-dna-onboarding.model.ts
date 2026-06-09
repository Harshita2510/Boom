import { Schema, model, models, type InferSchemaType } from "mongoose";

const onboardingSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    answers: {
      type: Schema.Types.Mixed,
      default: {}
    },
    step: {
      type: Number,
      default: 0
    },
    completed: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export type FinancialDNAOnboarding = InferSchemaType<typeof onboardingSchema>;

export const FinancialDNAOnboardingModel =
  models.FinancialDNAOnboarding || model("FinancialDNAOnboarding", onboardingSchema);
