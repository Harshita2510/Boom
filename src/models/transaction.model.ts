import { Schema, model, models, type InferSchemaType } from "mongoose";

const transactionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ["income", "expense", "transfer"],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: "INR"
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    merchant: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    transactionDate: {
      type: Date,
      required: true,
      index: true
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "upi", "card", "bank_transfer", "wallet", "other"],
      default: "other"
    },
    source: {
      type: String,
      enum: ["manual", "voice", "bank_sync", "document_upload"],
      default: "manual"
    },
    isRecurring: {
      type: Boolean,
      default: false
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: "UploadedDocument"
    },
    tags: [String]
  },
  {
    timestamps: true
  }
);

transactionSchema.index({ userId: 1, transactionDate: -1 });
transactionSchema.index({ userId: 1, category: 1 });

export type Transaction = InferSchemaType<typeof transactionSchema>;

export const TransactionModel =
  models.Transaction || model("Transaction", transactionSchema);
