import { generateLLMText, hasLLMProvider } from "./llm.ts";

export type DocumentQuestionAnswer = {
  answer: string;
  sources: string[];
};

export type DocumentIntelligenceResult = {
  chunks: string[];
  summary: string;
};

const importantKeywords = [
  "fee",
  "charge",
  "penalty",
  "interest",
  "refund",
  "loan",
  "emi",
  "insurance",
  "maturity",
  "premium",
  "foreclosure",
  "failed",
  "debit",
  "credit",
  "consent",
  "risk",
  "term",
  "condition"
];

const feeKeywords = [
  "fee",
  "fees",
  "charge",
  "charges",
  "penalty",
  "penalties",
  "interest",
  "emi",
  "premium",
  "deductible",
  "copay",
  "co-pay",
  "foreclosure",
  "prepayment",
  "late",
  "bounce",
  "processing",
  "cancellation",
  "admin",
  "administrative"
];

const riskKeywords = [
  "reject",
  "rejection",
  "not covered",
  "excluded",
  "exclusion",
  "waiting period",
  "pre-existing",
  "cap",
  "capped",
  "limit",
  "subject to",
  "jurisdiction",
  "documents",
  "within",
  "notice",
  "revise",
  "dispute",
  "default"
];

const creditScoreKeywords = [
  "credit score",
  "cibil",
  "credit bureau",
  "default",
  "missed",
  "late",
  "delay",
  "overdue",
  "settlement",
  "bounce",
  "emi"
];

export function chunkDocumentText(text: string, chunkSize = 120, overlap = 24) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];

  for (let index = 0; index < words.length; index += chunkSize - overlap) {
    chunks.push(words.slice(index, index + chunkSize).join(" "));

    if (index + chunkSize >= words.length) {
      break;
    }
  }

  return chunks;
}

function scoreChunk(chunk: string, query: string) {
  const queryTerms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 2);
  const lower = chunk.toLowerCase();
  const queryScore = queryTerms.filter((term) => lower.includes(term)).length;
  const importantScore = importantKeywords.filter((term) =>
    lower.includes(term)
  ).length;

  return queryScore * 3 + importantScore;
}

export function retrieveDocumentChunks(
  text: string,
  query: string,
  topK = 3
) {
  return chunkDocumentText(text)
    .map((chunk) => ({
      chunk,
      score: scoreChunk(chunk, query)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((item) => item.chunk);
}

export function summarizeDocumentText(text: string): DocumentIntelligenceResult {
  const chunks = chunkDocumentText(text);
  const summary = buildRuleBasedSummary(text);

  return {
    chunks,
    summary
  };
}

export async function summarizeDocumentTextWithAI(
  text: string
): Promise<DocumentIntelligenceResult> {
  const chunks = chunkDocumentText(text);

  if (!hasLLMProvider()) {
    return {
      chunks,
      summary: buildRuleBasedSummary(text)
    };
  }

  const relevantText = retrieveDocumentChunks(text, importantKeywords.join(" "), 5).join("\n\n");
  const result = await generateLLMText({
    system:
      "You are ArthSaathi's financial document explainer for Indian users. Explain, do not copy. Use plain language. Flag fees, deadlines, exclusions, penalties, claim risks, borrower risks, and user actions. Never provide final legal advice.",
    prompt: `Document text:\n${relevantText || text.slice(0, 3500)}\n\nCreate a concise analysis with these headings exactly:\nSimple summary\nMoney impact\nRed flags\nWhat to do next`,
    temperature: 0.2,
    maxTokens: 520,
    timeoutMs: 5000
  });

  return {
    chunks,
    summary: result.ok && result.text ? result.text : buildRuleBasedSummary(text)
  };
}

export async function answerDocumentQuestion(
  text: string,
  question: string
): Promise<DocumentQuestionAnswer> {
  const sources = retrieveDocumentChunks(text, question, 3);

  if (!sources.length || !sources[0]) {
    return {
      answer:
        "I could not find a relevant section in this document text. Try asking with words from the document.",
      sources: []
    };
  }

  if (hasLLMProvider()) {
    const result = await generateLLMText({
      system:
        "You are ArthSaathi's financial document Q&A assistant. Answer from the provided document excerpts only. Explain the meaning and user impact in simple language. If the document does not contain the answer, say so. Do not ask for OTP, PIN, password, or full account numbers. Always finish every sentence.",
      prompt: `Question: ${question}\n\nRelevant document excerpts:\n${sources.join("\n\n")}\n\nAnswer with these headings exactly:\nDirect answer\nWhy it matters\nRisks or hidden catches\nNext step\n\nRules:\n- Give at least 2 complete sentences under Direct answer.\n- If the question asks about credit score, explain exactly what event affects it, such as missed EMI, delayed payment, default, or settlement, only if supported by the excerpts.\n- End with a complete Next step sentence.`,
      temperature: 0.2,
      maxTokens: 850,
      timeoutMs: 7000
    });

    if (result.ok && result.text && isCompleteDocumentAnswer(result.text)) {
      return {
        answer: result.text,
        sources
      };
    }
  }

  const answer = buildRuleBasedAnswer(question, sources);

  return {
    answer,
    sources
  };
}

function getSentences(text: string) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+|(?=\d+\.\s+)/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 12);
}

function findSentences(text: string, keywords: string[], limit = 5) {
  const sentences = getSentences(text);

  return sentences
    .map((sentence) => {
      const lower = sentence.toLowerCase();
      const score = keywords.filter((keyword) => lower.includes(keyword)).length;
      return { score, sentence };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.sentence);
}

function bulletList(items: string[], fallback: string) {
  if (!items.length) {
    return `- ${fallback}`;
  }

  return items.map((item) => `- ${explainClause(item)}`).join("\n");
}

function buildRuleBasedSummary(text: string) {
  const moneyItems = findSentences(text, feeKeywords, 5);
  const riskItems = findSentences(text, riskKeywords, 5);
  const firstSentences = getSentences(text).slice(0, 2).join(" ");

  return [
    "Simple summary",
    firstSentences
      ? `This appears to be about: ${firstSentences}`
      : "This document contains financial terms that should be reviewed before signing or paying.",
    "",
    "Money impact",
    bulletList(
      moneyItems,
      "I could not detect a clear fee, penalty, premium, EMI, or interest clause from the pasted text."
    ),
    "",
    "Red flags",
    bulletList(
      riskItems,
      "I could not detect a clear exclusion, deadline, rejection, limit, or dispute clause from the pasted text."
    ),
    "",
    "What to do next",
    "- Ask about fees, penalties, exclusions, deadlines, cancellation, and complaint process.",
    "- Verify final terms with the bank, insurer, lender, or official support channel.",
    "- Do not share OTP, PIN, password, or full account details with anyone claiming to help."
  ].join("\n");
}

function buildRuleBasedAnswer(question: string, sources: string[]) {
  const combined = sources.join(" ");
  const questionText = question.toLowerCase();
  const focusKeywords =
    questionText.includes("credit score") || questionText.includes("cibil")
      ? creditScoreKeywords
      : questionText.includes("fee") || questionText.includes("penalt")
        ? [...feeKeywords, ...riskKeywords]
        : [...questionText.split(/[^a-z0-9]+/).filter((term) => term.length > 3), ...importantKeywords];
  const relevantSentences = findSentences(combined, focusKeywords, 7);
  const directAnswer =
    questionText.includes("credit score") || questionText.includes("cibil")
      ? buildCreditScoreAnswer(combined, relevantSentences)
      : bulletList(
          relevantSentences.slice(0, 4),
          "I found related text, but it does not clearly answer the question."
        );

  return [
    "Direct answer",
    directAnswer,
    "",
    "Why it matters",
    inferImpact(relevantSentences.join(" ")),
    "",
    "Risks or hidden catches",
    bulletList(
      findSentences(combined, riskKeywords, 4),
      "No obvious hidden catch was detected in the retrieved excerpt, but verify the full document."
    ),
    "",
    "Next step",
    "- Ask the provider to confirm the exact rupee amount, deadline, waiver possibility, and complaint path in writing."
  ].join("\n");
}

function buildCreditScoreAnswer(text: string, relevantSentences: string[]) {
  const lower = text.toLowerCase();
  const triggers: string[] = [];

  if (/(missed|late|delay|overdue).{0,40}(emi|payment|installment)|(?:emi|payment|installment).{0,40}(missed|late|delay|overdue)/i.test(text)) {
    triggers.push("missing or delaying EMI/payment");
  }

  if (lower.includes("default")) {
    triggers.push("loan default");
  }

  if (lower.includes("settlement")) {
    triggers.push("settlement or written-off style reporting");
  }

  if (lower.includes("bounce")) {
    triggers.push("EMI/payment bounce");
  }

  if (!triggers.length) {
    return [
      "- The retrieved document text does not clearly say that your credit score will be affected.",
      "- In general, credit score impact usually happens when a lender reports missed EMI, delayed repayment, default, settlement, or bounced repayment to a credit bureau."
    ].join("\n");
  }

  return [
    `- Yes, your credit score can be negatively affected if this document's situation leads to ${triggers.join(", ")}.`,
    "- The impact is usually not from reading or signing the document itself; it comes from repayment behavior being reported to a credit bureau.",
    ...relevantSentences.slice(0, 2).map((sentence) => `- Relevant clause: ${explainClause(sentence)}`)
  ].join("\n");
}

function isCompleteDocumentAnswer(answer: string) {
  const trimmed = answer.trim();

  if (trimmed.length < 180) {
    return false;
  }

  if (
    !trimmed.includes("Direct answer") ||
    !trimmed.includes("Why it matters") ||
    !trimmed.includes("Next step")
  ) {
    return false;
  }

  if (/\b(if you|because|when|where|and|or|but|to|with|for|by)\.?$/i.test(trimmed)) {
    return false;
  }

  return /[.!?]$/.test(trimmed);
}

function explainClause(sentence: string) {
  const clean = sentence.replace(/^\d+\.\s*/, "").trim();
  const lower = clean.toLowerCase();

  if (lower.includes("waiting period")) {
    return `${clean} Meaning: you may not be able to claim immediately.`;
  }

  if (lower.includes("pre-existing")) {
    return `${clean} Meaning: older health issues may be covered only after the stated condition is met.`;
  }

  if (lower.includes("cap") || lower.includes("limit")) {
    return `${clean} Meaning: the company may pay only up to this limit; extra cost can fall on you.`;
  }

  if (lower.includes("reject")) {
    return `${clean} Meaning: missing documents or rule violations can lead to denial.`;
  }

  if (lower.includes("prepayment") || lower.includes("foreclosure")) {
    return `${clean} Meaning: closing early may cost extra.`;
  }

  if (lower.includes("interest")) {
    return `${clean} Meaning: this directly affects total amount paid.`;
  }

  if (lower.includes("penalty") || lower.includes("charge") || lower.includes("fee")) {
    return `${clean} Meaning: this can increase your out-of-pocket cost.`;
  }

  return clean;
}

function inferImpact(text: string) {
  const lower = text.toLowerCase();

  if (lower.includes("insurance") || lower.includes("claim") || lower.includes("covered")) {
    return "- This affects whether your claim gets accepted and how much you may pay from your own pocket.";
  }

  if (lower.includes("loan") || lower.includes("emi") || lower.includes("interest")) {
    return "- This affects your EMI burden, total repayment, and charges if you pay late or close early.";
  }

  if (lower.includes("fee") || lower.includes("charge") || lower.includes("penalty")) {
    return "- This affects the real cost, not just the headline amount.";
  }

  return "- This matters because financial documents often hide cost, timing, and rejection conditions inside detailed clauses.";
}
