import { Schema, model, models, type InferSchemaType } from "mongoose";

const ombudsmanCaseSchema = new Schema(
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
    institutionName: {
      type: String,
      trim: true
    },
    issueType: {
      type: String,
      enum: ["bank_fee", "loan", "insurance", "wallet_upi", "credit_card", "other"],
      required: true
    },
    documentText: {
      type: String,
      required: true,
      trim: true
    },
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    riskSignals: {
      type: [String],
      default: []
    },
    plainSummary: {
      type: String,
      required: true,
      trim: true
    },
    complaintDraft: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["draft", "submitted", "resolved", "closed"],
      default: "draft",
      index: true
    }
  },
  {
    timestamps: true
  }
);

ombudsmanCaseSchema.index({ userId: 1, createdAt: -1 });

export type OmbudsmanCase = InferSchemaType<typeof ombudsmanCaseSchema>;

export const OmbudsmanCaseModel =
  models.OmbudsmanCase || model("OmbudsmanCase", ombudsmanCaseSchema);
