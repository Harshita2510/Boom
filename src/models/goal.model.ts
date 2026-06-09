import { Schema, model, models, type InferSchemaType } from "mongoose";

const goalSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    goalType: {
      type: String,
      enum: ["emergency_fund", "investment", "debt_repayment", "purchase", "education", "travel", "other"],
      required: true
    },
    targetAmount: {
      type: Number,
      required: true,
      min: 0
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      default: "INR"
    },
    targetDate: Date,
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },
    status: {
      type: String,
      enum: ["active", "paused", "completed", "cancelled"],
      default: "active",
      index: true
    }
  },
  {
    timestamps: true
  }
);

goalSchema.index({ userId: 1, status: 1 });

export type Goal = InferSchemaType<typeof goalSchema>;

export const GoalModel = models.Goal || model("Goal", goalSchema);
