export type FinancialConcept =
  | "upi"
  | "fd"
  | "sip"
  | "mutual_fund"
  | "emergency_fund"
  | "credit_score"
  | "insurance"
  | "loan";

export type FinancialLesson = {
  analogy: string;
  concept: FinancialConcept;
  keyPoints: string[];
  nextStep: string;
  title: string;
  warning?: string;
};

type LearnerProfile = {
  incomeType?: string;
  occupation?: string;
};

const conceptKeywords: Record<FinancialConcept, string[]> = {
  credit_score: ["credit score", "cibil", "credit"],
  emergency_fund: ["emergency fund", "emergency", "buffer"],
  fd: ["fd", "fixed deposit", "deposit"],
  insurance: ["insurance", "health cover", "term plan", "cover"],
  loan: ["loan", "emi", "borrow", "debt"],
  mutual_fund: ["mutual fund", "fund"],
  sip: ["sip", "systematic investment"],
  upi: ["upi", "gpay", "phonepe", "paytm", "qr"]
};

const lessons: Record<FinancialConcept, Omit<FinancialLesson, "analogy" | "concept">> = {
  credit_score: {
    keyPoints: [
      "A credit score reflects how reliably you repay borrowed money.",
      "Late EMI or credit-card payments can reduce it.",
      "A better score can help you get loans at better terms."
    ],
    nextStep: "Pay EMIs on time and avoid using too much of your credit limit.",
    title: "Credit Score"
  },
  emergency_fund: {
    keyPoints: [
      "An emergency fund protects you from sudden income loss or medical/repair expenses.",
      "A common target is three to six months of essential expenses.",
      "Keep it in a safe, easy-to-access place."
    ],
    nextStep: "Start with a small target, then grow it toward six months of expenses.",
    title: "Emergency Fund"
  },
  fd: {
    keyPoints: [
      "A fixed deposit keeps money with a bank for a chosen period.",
      "Returns are usually predictable and lower risk.",
      "Breaking early can reduce interest or add a penalty."
    ],
    nextStep: "Use FDs for safety-first goals or emergency backup, not high-growth needs.",
    title: "Fixed Deposit"
  },
  insurance: {
    keyPoints: [
      "Insurance protects against large unexpected losses.",
      "Health insurance helps with hospital costs.",
      "Term insurance protects dependents if the earning member dies."
    ],
    nextStep: "Prioritize health cover and term cover before risky investments.",
    title: "Insurance"
  },
  loan: {
    keyPoints: [
      "A loan lets you use money now and repay with interest.",
      "EMI should fit safely inside monthly cashflow.",
      "High-interest debt can damage future goals."
    ],
    nextStep: "Before taking a loan, simulate EMI impact on savings and emergency fund.",
    title: "Loan and EMI"
  },
  mutual_fund: {
    keyPoints: [
      "A mutual fund pools money from many investors.",
      "A fund manager invests that money in stocks, bonds, or both.",
      "Returns can go up and down, so time horizon matters."
    ],
    nextStep: "Match fund type with goal duration and risk comfort.",
    title: "Mutual Fund"
  },
  sip: {
    keyPoints: [
      "A SIP invests a fixed amount regularly into a mutual fund.",
      "It builds discipline and reduces the pressure of timing the market.",
      "Returns are not guaranteed because market value changes."
    ],
    nextStep: "Start SIP only after essential expenses and emergency savings are protected.",
    title: "SIP"
  },
  upi: {
    keyPoints: [
      "UPI moves money directly between bank accounts using a UPI ID, phone number, or QR.",
      "You enter UPI PIN only to send money, not to receive money.",
      "Wrong approval on collect requests can send money out."
    ],
    nextStep: "Before entering UPI PIN, check amount, receiver, and whether you are paying or receiving.",
    title: "UPI"
  }
};

function detectConcept(message: string): FinancialConcept {
  const lower = message.toLowerCase();

  for (const [concept, keywords] of Object.entries(conceptKeywords)) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      return concept as FinancialConcept;
    }
  }

  return "upi";
}

function getOccupationGroup(profile?: LearnerProfile) {
  const text = `${profile?.occupation ?? ""} ${profile?.incomeType ?? ""}`.toLowerCase();

  if (/farmer|agri|agriculture/.test(text)) {
    return "farmer";
  }

  if (/student/.test(text)) {
    return "student";
  }

  if (/driver|delivery|gig|freelance/.test(text)) {
    return "gig";
  }

  if (/shop|business|merchant|kirana|vendor/.test(text)) {
    return "business";
  }

  if (/salary|salaried|employee/.test(text)) {
    return "salaried";
  }

  return "household";
}

function buildAnalogy(concept: FinancialConcept, profile?: LearnerProfile) {
  const group = getOccupationGroup(profile);
  const conceptName = lessons[concept].title;

  const analogies: Record<string, string> = {
    business: `${conceptName} is like managing a shop ledger: every entry must be checked, and small mistakes can affect month-end cash.`,
    farmer: `${conceptName} is like planning crop money across seasons: safety, timing, and risk matter before spending.`,
    gig: `${conceptName} is like planning fuel, phone, and daily earnings: small repeated habits decide monthly stability.`,
    household: `${conceptName} is like running a household ration plan: assign a purpose before money leaves.`,
    salaried: `${conceptName} is like salary budgeting: fixed inflow helps, but EMI, savings, and protection must be planned first.`,
    student: `${conceptName} is like managing exam preparation: small regular effort beats last-minute pressure.`
  };

  return analogies[group];
}

export function createFinancialLesson(
  message: string,
  profile?: LearnerProfile
): FinancialLesson {
  const concept = detectConcept(message);
  const base = lessons[concept];
  const warning =
    concept === "upi"
      ? "Never share OTP or UPI PIN. You do not need UPI PIN to receive money."
      : concept === "mutual_fund" || concept === "sip"
        ? "Market-linked investments can lose value in the short term."
        : undefined;

  return {
    ...base,
    analogy: buildAnalogy(concept, profile),
    concept,
    warning
  };
}

export function listFinancialLessons() {
  return Object.entries(lessons).map(([concept, lesson]) => ({
    concept: concept as FinancialConcept,
    title: lesson.title
  }));
}
