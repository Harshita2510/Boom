import { Schema, model, models, type InferSchemaType } from "mongoose";

const communityPostSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    community: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    postType: {
      type: String,
      enum: ["tip", "question", "warning", "local_insight"],
      required: true
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 600
    },
    safetyStatus: {
      type: String,
      enum: ["safe", "flagged", "blocked"],
      required: true,
      index: true
    },
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    riskIndicators: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

communityPostSchema.index({ community: 1, createdAt: -1 });

export type CommunityPost = InferSchemaType<typeof communityPostSchema>;

export const CommunityPostModel =
  models.CommunityPost || model("CommunityPost", communityPostSchema);
