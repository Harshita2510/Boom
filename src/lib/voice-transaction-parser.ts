const expenseWords = [
  "spent",
  "spend",
  "paid",
  "bought",
  "buy",
  "purchase",
  "transaction",
  "expense",
  "kharch",
  "kharcha"
];

const incomeWords = [
  "earned",
  "earn",
  "received",
  "got",
  "income",
  "salary",
  "credited",
  "deposit",
  "kamaya",
  "mila"
];

const categoryAliases: Record<string, string[]> = {
  education: ["school", "college", "fees", "tuition", "education"],
  entertainment: ["movie", "netflix", "subscription", "entertainment"],
  food: ["food", "snack", "lunch", "dinner", "breakfast", "restaurant"],
  groceries: ["grocery", "groceries", "vegetables", "ration", "kirana", "sabzi"],
  investment: ["sip", "mutual fund", "fd", "investment"],
  medical: ["medical", "medicine", "doctor", "hospital"],
  rent: ["rent", "house rent"],
  salary: ["salary", "wage", "payment", "income"],
  shopping: ["shopping", "clothes", "dress", "shoes"],
  travel: ["travel", "bus", "train", "cab", "taxi", "auto", "petrol", "fuel"]
};

export type ParsedVoiceTransaction = {
  amount: number;
  category: string;
  confidence: "low" | "medium" | "high";
  text: string;
  type: "income" | "expense";
};

function normalizeText(text: string) {
  return text.toLowerCase().replaceAll(",", "").trim();
}

function detectType(text: string): "income" | "expense" {
  const normalized = normalizeText(text);
  const hasIncomeWord = incomeWords.some((word) =>
    new RegExp(`\\b${word}\\b`, "i").test(normalized)
  );
  const hasExpenseWord = expenseWords.some((word) =>
    new RegExp(`\\b${word}\\b`, "i").test(normalized)
  );

  if (hasIncomeWord && !hasExpenseWord) {
    return "income";
  }

  return "expense";
}

function detectCategory(text: string, type: "income" | "expense") {
  const normalized = normalizeText(text);

  for (const [category, aliases] of Object.entries(categoryAliases)) {
    if (aliases.some((alias) => normalized.includes(alias))) {
      return category;
    }
  }

  const afterConnector = normalized.match(
    /\b(?:on|for|from|at)\s+([a-zA-Z ]{2,40})/
  )?.[1];

  if (afterConnector) {
    return afterConnector.trim().split(/\s+/).slice(0, 3).join(" ");
  }

  return type === "income" ? "income" : "general";
}

export function parseVoiceTransaction(text: string): ParsedVoiceTransaction {
  const normalized = normalizeText(text);
  const amountMatch = normalized.match(
    /(?:rs\.?|inr|₹|rupees?)?\s*(\d+(?:\.\d+)?)\s*(?:rs\.?|inr|₹|rupees?)?/i
  );
  const amount = amountMatch ? Number(amountMatch[1]) : 0;
  const type = detectType(text);
  const category = detectCategory(text, type);
  const hasKnownVerb = [...expenseWords, ...incomeWords].some((word) =>
    new RegExp(`\\b${word}\\b`, "i").test(normalized)
  );

  return {
    amount,
    category,
    confidence: amount > 0 && hasKnownVerb ? "high" : amount > 0 ? "medium" : "low",
    text: text.trim(),
    type
  };
}
