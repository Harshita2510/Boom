export type FinancialHealthScoreInput = {
  income: number;
  savings: number;
  expenses: number;
  debt: number;
  goalProgress: number;
};

export type FinancialHealthScoreSnapshot = FinancialHealthScoreResult & {
  input: FinancialHealthScoreInput;
};

export type FinancialHealthScoreResult = {
  score: number;
  band: "critical" | "weak" | "stable" | "strong" | "excellent";
  explanation: string;
  parts: {
    savings: number;
    expenses: number;
    debt: number;
    goals: number;
  };
};

function clamp(value: number, min = 0, max = 100) {
  return Math.min(Math.max(value, min), max);
}

export function calculateFinancialHealthScore(
  input: FinancialHealthScoreInput
): FinancialHealthScoreResult {
  const income = Math.max(input.income, 1);
  const savingsRate = input.savings / income;
  const expenseRate = input.expenses / income;
  const debtRate = input.debt / income;

  const savings = clamp(savingsRate * 100 * 2);
  const expenses = clamp(100 - expenseRate * 100);
  const debt = clamp(100 - debtRate * 120);
  const goals = clamp(input.goalProgress);

  const score = Math.round(
    savings * 0.3 + expenses * 0.25 + debt * 0.25 + goals * 0.2
  );

  let band: FinancialHealthScoreResult["band"] = "critical";

  if (score >= 85) {
    band = "excellent";
  } else if (score >= 70) {
    band = "strong";
  } else if (score >= 50) {
    band = "stable";
  } else if (score >= 30) {
    band = "weak";
  }

  const explanation =
    score >= 70
      ? "Good savings and manageable expenses are helping your score."
      : "Your score can improve by saving more, lowering expenses, or reducing debt.";

  return {
    score,
    band,
    explanation,
    parts: {
      savings: Math.round(savings),
      expenses: Math.round(expenses),
      debt: Math.round(debt),
      goals: Math.round(goals)
    }
  };
}
