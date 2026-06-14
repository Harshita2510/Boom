export type ScamRiskLevel = "low" | "medium" | "high";

export type ScamAnalysisResult = {
  explanation: string;
  indicators: string[];
  riskLevel: ScamRiskLevel;
  riskScore: number;
  safetySteps: string[];
};

const scamRules = [
  {
    label: "Requests OTP, UPI PIN, password, CVV, or card details",
    pattern: /(otp|one time password|upi pin|pin|password|cvv|card number|netbanking|atm pin)/i,
    score: 30
  },
  {
    label: "Urgent pressure or account-blocking threat",
    pattern: /(urgent|immediately|within \d+|last chance|account.*blocked|kyc.*expire|limited time|act now)/i,
    score: 18
  },
  {
    label: "Suspicious link, shortened URL, or unsafe domain",
    pattern: /(bit\.ly|tinyurl|t\.co|http:\/\/|https:\/\/|\.xyz|\.top|\.click|\.loan|\.work)/i,
    score: 18
  },
  {
    label: "Prize, refund, subsidy, cashback, or free-money lure",
    pattern: /(prize|lottery|cashback|refund|subsidy|reward|free money|won|lucky draw|claim now)/i,
    score: 16
  },
  {
    label: "Payment, deposit, processing fee, or verification fee demand",
    pattern: /(transfer|pay now|send money|deposit|processing fee|verification fee|registration fee|unlock fee)/i,
    score: 18
  },
  {
    label: "Impersonates bank, RBI, government, delivery, Aadhaar, PAN, or support",
    pattern: /(bank|rbi|income tax|aadhaar|aadhar|pan|kyc|courier|delivery|support team|customer care|electricity board)/i,
    score: 14
  },
  {
    label: "Loan scam pattern",
    pattern: /(instant loan|loan approved|pre approved|low interest loan|loan app|processing charge|advance fee)/i,
    score: 18
  },
  {
    label: "Fake job or work-from-home income promise",
    pattern: /(work from home|part time job|daily income|earn.*per day|telegram task|youtube like|rating task)/i,
    score: 16
  },
  {
    label: "Remote-access app or screen-sharing request",
    pattern: /(anydesk|teamviewer|screen share|remote access|install app|download apk|apk file)/i,
    score: 24
  },
  {
    label: "UPI collect/request-money risk",
    pattern: /(collect request|request money|approve.*upi|accept.*payment|receive money.*pin|scan.*qr)/i,
    score: 22
  }
];

function getRiskLevel(score: number): ScamRiskLevel {
  if (score >= 70) {
    return "high";
  }

  if (score >= 35) {
    return "medium";
  }

  return "low";
}

function buildSafetySteps(riskLevel: ScamRiskLevel) {
  const common = [
    "Do not share OTP, UPI PIN, CVV, passwords, or screen access.",
    "Do not click unknown links or install APK files from messages.",
    "Verify using the official app, official website, or known customer-care channel."
  ];

  if (riskLevel === "high") {
    return [
      "Stop the conversation and do not pay.",
      ...common,
      "If money was lost, call 1930 or report quickly at cybercrime.gov.in."
    ];
  }

  if (riskLevel === "medium") {
    return [
      "Pause before acting and verify the sender independently.",
      ...common
    ];
  }

  return [
    "No strong scam signal was detected, but verify before paying or sharing sensitive information.",
    ...common
  ];
}

export function analyzeScamText(text: string): ScamAnalysisResult {
  const normalized = text.trim();
  const matchedRules = scamRules.filter((rule) => rule.pattern.test(normalized));
  const riskScore = Math.min(
    100,
    matchedRules.reduce((sum, rule) => sum + rule.score, 0)
  );
  const riskLevel = getRiskLevel(riskScore);
  const indicators = matchedRules.map((rule) => rule.label);
  const explanation =
    indicators.length > 0
      ? `Detected ${indicators.length} risk signal${indicators.length > 1 ? "s" : ""}: ${indicators.join(", ")}.`
      : "No strong scam indicators were detected in the provided text.";

  return {
    explanation,
    indicators,
    riskLevel,
    riskScore,
    safetySteps: buildSafetySteps(riskLevel)
  };
}
