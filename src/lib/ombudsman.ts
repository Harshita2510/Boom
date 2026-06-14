export type OmbudsmanAnalysis = {
  complaintDraft: string;
  plainSummary: string;
  riskScore: number;
  riskSignals: string[];
};

type OmbudsmanInput = {
  documentText: string;
  institutionName?: string;
  issueType: string;
  title: string;
};

const riskRules = [
  {
    label: "Unexpected or hidden fee language",
    pattern: /(hidden|undisclosed|unexpected|surprise|not informed|without notice|charges? applied)/i,
    score: 18
  },
  {
    label: "Penalty, foreclosure, bounce, or late-fee pressure",
    pattern: /(penalty|foreclosure|prepayment|bounce|late fee|overdue|penal charge)/i,
    score: 16
  },
  {
    label: "High interest, compounding, or unclear APR",
    pattern: /(high interest|compound|apr|annual percentage|interest.*per day|interest.*month)/i,
    score: 18
  },
  {
    label: "Consent, mis-selling, or forced product concern",
    pattern: /(without consent|mis.?sold|forced|not explained|agent promised|verbal promise)/i,
    score: 22
  },
  {
    label: "Refund, reversal, or failed transaction issue",
    pattern: /(refund|reversal|failed transaction|debited|not credited|double debit|chargeback)/i,
    score: 16
  },
  {
    label: "Threat, harassment, or unfair recovery language",
    pattern: /(harass|threat|legal action|police|recovery agent|call family|call employer)/i,
    score: 24
  }
];

function chunkText(text: string, chunkSize = 80, overlap = 12) {
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

function retrieveRelevantChunks(text: string) {
  const chunks = chunkText(text);
  const keywords = [
    "fee",
    "charge",
    "penalty",
    "interest",
    "refund",
    "failed",
    "consent",
    "loan",
    "emi",
    "insurance",
    "recovery"
  ];

  return chunks
    .map((chunk) => ({
      chunk,
      score: keywords.filter((keyword) =>
        chunk.toLowerCase().includes(keyword)
      ).length
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.chunk);
}

export function analyzeOmbudsmanCase(input: OmbudsmanInput): OmbudsmanAnalysis {
  const signals = riskRules
    .filter((rule) => rule.pattern.test(input.documentText))
    .map((rule) => rule.label);
  const riskScore = Math.min(
    100,
    riskRules
      .filter((rule) => rule.pattern.test(input.documentText))
      .reduce((sum, rule) => sum + rule.score, 0)
  );
  const relevant = retrieveRelevantChunks(input.documentText);
  const plainSummary =
    relevant.length > 0
      ? `Key issue found: ${relevant[0].slice(0, 360)}${
          relevant[0].length > 360 ? "..." : ""
        }`
      : "The document text was captured, but no strong fee, loan, refund, or recovery issue was detected.";
  const institution = input.institutionName || "the financial institution";
  const complaintDraft = `Subject: Request for review and resolution - ${input.title}

To,
The Grievance Officer,
${institution}

I request a review of the issue described below. I believe the charge, decision, or communication may be unfair or insufficiently explained.

Issue type: ${input.issueType}

Summary:
${plainSummary}

Risk signals noticed by ArthSaathi:
${signals.length ? signals.map((signal) => `- ${signal}`).join("\n") : "- No strong automated risk signal found, but clarification is requested."}

Requested resolution:
1. Please provide a written explanation of the charge, decision, or policy applied.
2. Please share the relevant terms and dates used for this decision.
3. If the charge or action was applied incorrectly, please reverse it and confirm the correction.
4. If more documents are required, please specify them clearly.

Regards,
[Your Name]`;

  return {
    complaintDraft,
    plainSummary,
    riskScore,
    riskSignals: signals
  };
}
