import { Intent } from "./intents";

export type AgentResponse<T = any> = {
  agent: string;
  intent: Intent;
  text: string;
  data?: T;
};

export type FinancialDNAProfile = {
  incomeType?: string;
  monthlyIncome?: number;
  goals?: string[];
  riskProfile?: "low" | "medium" | "high" | null;
  dependents?: number;
  habits?: string[]; // e.g., ['saves_monthly', 'uses_credit']
};

export type Transaction = {
  id?: string;
  amount: number;
  currency?: string;
  category?: string;
  type: "expense" | "income";
  timestamp?: string; // ISO
  note?: string;
};

export type SimulationResult = {
  months?: number;
  currentBalance?: number;
  projectedBalance?: number;
  recommendation?: string;
};

export type CommunityInsight = {
  topic: string;
  outcome: string;
  confidence: number; // 0-1
};

export type ScamReport = {
  riskScore: number; // 0-100
  reasons: string[];
  suggestion: string;
};
