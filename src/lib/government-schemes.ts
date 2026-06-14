export type SchemeCategory =
  | "banking"
  | "insurance"
  | "pension"
  | "savings"
  | "farmer";

export type SchemeRecommendation = {
  category: SchemeCategory;
  eligibilityHint: string;
  fitReason: string;
  name: string;
  nextStep: string;
  priority: "high" | "medium" | "low";
  safetyNote: string;
};

type SchemeProfile = {
  dependents?: number;
  financialGoals?: string[];
  incomeType?: string;
  occupation?: string;
  riskAppetite?: string;
};

const schemes: SchemeRecommendation[] = [
  {
    category: "banking",
    eligibilityHint:
      "Useful for users who need a basic bank account and formal financial access.",
    fitReason:
      "A bank account is the base layer for receiving benefits, saving safely, and building transaction history.",
    name: "Pradhan Mantri Jan Dhan Yojana",
    nextStep: "Check with a nearby bank or official PMJDY channel for account opening and documents.",
    priority: "high",
    safetyNote:
      "Do not pay agents for fake guaranteed benefits. Use official bank channels."
  },
  {
    category: "insurance",
    eligibilityHint:
      "Life insurance style protection may matter if family members depend on your income.",
    fitReason:
      "Dependents increase the need for basic life-risk protection before risky investments.",
    name: "Pradhan Mantri Jeevan Jyoti Bima Yojana",
    nextStep: "Ask your bank about PMJJBY enrollment and premium debit rules.",
    priority: "high",
    safetyNote:
      "Verify premium and claim details with your bank before enrolling."
  },
  {
    category: "insurance",
    eligibilityHint:
      "Accident insurance can be useful for workers who travel, drive, deliver, or do physical work.",
    fitReason:
      "Accident cover protects against sudden shocks that can break a household budget.",
    name: "Pradhan Mantri Suraksha Bima Yojana",
    nextStep: "Ask your bank about PMSBY enrollment and renewal.",
    priority: "high",
    safetyNote:
      "Enroll only through bank/official channels; avoid links asking for OTP or UPI PIN."
  },
  {
    category: "pension",
    eligibilityHint:
      "Pension planning is useful for informal, freelance, business, or gig income earners.",
    fitReason:
      "Irregular income users need retirement planning because employer pension support may be absent.",
    name: "Atal Pension Yojana",
    nextStep: "Check APY eligibility and contribution amount with your bank.",
    priority: "medium",
    safetyNote:
      "Confirm age, contribution, and exit rules before committing."
  },
  {
    category: "savings",
    eligibilityHint:
      "Long-term savings option for eligible girl child education/marriage planning.",
    fitReason:
      "If your goals include daughter education or long-term child planning, this may be relevant.",
    name: "Sukanya Samriddhi Yojana",
    nextStep: "Check eligibility at India Post or an authorized bank.",
    priority: "medium",
    safetyNote:
      "Interest rates and rules can change; verify current terms before depositing."
  },
  {
    category: "farmer",
    eligibilityHint:
      "May be relevant for eligible farmer households subject to official land/beneficiary rules.",
    fitReason:
      "Farmer households face seasonal income shocks, so direct benefit and support schemes can matter.",
    name: "PM-Kisan",
    nextStep: "Check eligibility and beneficiary status through official PM-Kisan channels.",
    priority: "medium",
    safetyNote:
      "Beware fake PM-Kisan KYC links asking OTP, UPI PIN, or payment."
  }
];

function profileText(profile?: SchemeProfile) {
  return `${profile?.occupation ?? ""} ${profile?.incomeType ?? ""} ${
    profile?.financialGoals?.join(" ") ?? ""
  }`.toLowerCase();
}

export function recommendGovernmentSchemes(
  profile?: SchemeProfile
): SchemeRecommendation[] {
  const text = profileText(profile);
  const dependents = profile?.dependents ?? 0;
  const scored = schemes.map((scheme) => {
    let score = scheme.priority === "high" ? 3 : 2;

    if (scheme.name.includes("Jan Dhan")) {
      score += 1;
    }

    if (dependents > 0 && scheme.category === "insurance") {
      score += 2;
    }

    if (
      /(driver|delivery|gig|farmer|labour|worker|field|freelance)/.test(text) &&
      scheme.name.includes("Suraksha")
    ) {
      score += 2;
    }

    if (
      /(business|freelance|gig|farmer|self|informal)/.test(text) &&
      scheme.name.includes("Atal")
    ) {
      score += 2;
    }

    if (/(girl|daughter|education|child)/.test(text) && scheme.name.includes("Sukanya")) {
      score += 3;
    }

    if (/(farmer|agri|crop|kisan)/.test(text) && scheme.name.includes("PM-Kisan")) {
      score += 4;
    }

    return { scheme, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ scheme }, index) => ({
      ...scheme,
      priority: index < 2 ? "high" : scheme.priority
    }));
}

export function formatSchemeReply(recommendations: SchemeRecommendation[]) {
  return recommendations
    .map(
      (scheme, index) =>
        `${index + 1}. ${scheme.name}: ${scheme.fitReason} Next: ${scheme.nextStep}`
    )
    .join("\n");
}
