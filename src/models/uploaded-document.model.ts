import { Schema, model, models, type InferSchemaType } from "mongoose";

const uploadedDocumentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    fileName: {
      type: String,
      required: true,
      trim: true
    },
    fileType: {
      type: String,
      enum: ["bank_statement", "salary_slip", "tax_document", "receipt", "other"],
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    fileSizeBytes: {
      type: Number,
      required: true,
      min: 0
    },
    cloudinaryPublicId: {
      type: String,
      required: true
    },
    cloudinarySecureUrl: {
      type: String,
      required: true
    },
    processingStatus: {
      type: String,
      enum: ["uploaded", "processing", "processed", "failed"],
      default: "uploaded",
      index: true
    },
    extractedText: String,
    extractedData: {
      type: Schema.Types.Mixed,
      default: {}
    },
    failureReason: String,
    processedAt: Date
  },
  {
    timestamps: true
  }
);

uploadedDocumentSchema.index({ userId: 1, createdAt: -1 });

export type UploadedDocument = InferSchemaType<typeof uploadedDocumentSchema>;

export const UploadedDocumentModel =
  models.UploadedDocument ||
  model("UploadedDocument", uploadedDocumentSchema);
