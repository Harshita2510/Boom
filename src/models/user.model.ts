import { Schema, model, models, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    firstName: {
      type: String,
      trim: true
    },
    lastName: {
      type: String,
      trim: true
    },
    imageUrl: String,
    phoneNumber: String,
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },
    onboardingStatus: {
      type: String,
      enum: ["not_started", "in_progress", "completed"],
      default: "not_started"
    },
    preferredCurrency: {
      type: String,
      default: "INR"
    },
    locale: {
      type: String,
      default: "en-IN"
    },
    lastActiveAt: Date
  },
  {
    timestamps: true
  }
);

export type User = InferSchemaType<typeof userSchema>;

export const UserModel = models.User || model("User", userSchema);
