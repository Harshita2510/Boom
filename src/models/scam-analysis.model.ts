import { Schema, model, models, type InferSchemaType } from "mongoose";

const scamAnalysisSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    inputType: {
      type: String,
      enum: ["text", "screenshot"],
      required: true
    },
    fileName: {
      type: String,
      trim: true
    },
    messageText: {
      type: String,
      trim: true
    },
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
      index: true
    },
    indicators: {
      type: [String],
      default: []
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

scamAnalysisSchema.index({ userId: 1, createdAt: -1 });

export type ScamAnalysis = InferSchemaType<typeof scamAnalysisSchema>;

export const ScamAnalysisModel =
  models.ScamAnalysis || model("ScamAnalysis", scamAnalysisSchema);
