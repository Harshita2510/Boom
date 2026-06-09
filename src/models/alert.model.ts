import { Schema, model, models, type InferSchemaType } from "mongoose";

const alertSchema = new Schema(
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
    message: {
      type: String,
      required: true,
      trim: true
    },
    alertType: {
      type: String,
      enum: ["budget", "goal", "risk", "document", "system"],
      required: true
    },
    severity: {
      type: String,
      enum: ["info", "warning", "critical"],
      default: "info",
      index: true
    },
    status: {
      type: String,
      enum: ["unread", "read", "archived"],
      default: "unread",
      index: true
    },
    actionUrl: String,
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    readAt: Date,
    expiresAt: Date
  },
  {
    timestamps: true
  }
);

alertSchema.index({ userId: 1, status: 1, createdAt: -1 });

export type Alert = InferSchemaType<typeof alertSchema>;

export const AlertModel = models.Alert || model("Alert", alertSchema);
