import { Schema, model, models, type InferSchemaType } from "mongoose";

const financialDNASchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    occupation: {
      type: String,
      required: true,
      trim: true
    },
    incomeType: {
      type: String,
      enum: ["salaried", "business", "freelance", "student", "homemaker", "retired", "other"],
      required: true
    },
    ageRange: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    monthlyIncome: {
      type: Number,
      required: true,
      min: 0
    },
    monthlyIncomeRange: {
      type: String,
      trim: true
    },
    lifeStage: {
      type: String,
      trim: true
    },
    financialGoals: {
      type: [String],
      default: []
    },
    dependents: {
      type: Number,
      required: true,
      min: 0
    },
    riskAppetite: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true
    },
    summary: {
      type: String,
      required: true
    },
    riskProfile: {
      type: String,
      enum: ["conservative", "balanced", "growth", "aggressive"],
      default: "balanced"
    },
    moneyPersonality: {
      type: String,
      enum: ["saver", "spender", "planner", "investor", "avoider"],
      default: "planner"
    },
    incomeStability: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },
    spendingDisciplineScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    },
    savingsConsistencyScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    },
    debtComfortLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },
    hasLoans: {
      type: Boolean,
      default: false
    },
    monthlyEmi: {
      type: Number,
      min: 0,
      default: 0
    },
    monthlyEmiRange: {
      type: String,
      trim: true
    },
    preferredAdviceStyle: {
      type: String,
      enum: ["simple", "detailed", "data_driven"],
      default: "simple"
    },
    tags: [String],
    lastCalculatedAt: Date
  },
  {
    timestamps: true
  }
);

export type FinancialDNA = InferSchemaType<typeof financialDNASchema>;

export const FinancialDNAModel =
  models.FinancialDNA || model("FinancialDNA", financialDNASchema);
