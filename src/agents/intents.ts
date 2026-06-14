export enum Intent {
  ACTION_PLAN = "action_plan",
  BUDGET_COACH = "budget_coach",
  FINANCIAL_EDUCATION = "financial_education",
  FINANCIAL_DNA = "financial_dna",
  GOVERNMENT_SCHEMES = "government_schemes",
  INVESTMENT_AGENT = "investment_agent",
  VOICE_LEDGER = "voice_ledger",
  FUTURE_SIMULATION = "future_simulation",
  COMMUNITY_INTELLIGENCE = "community_intelligence",
  SCAM_SHIELD = "scam_shield",
  UNKNOWN = "unknown",
}

export function isGreeting(message: string): boolean {
  return /^(hi|hello|hey|hola|namaste|start|help)\b/i.test((message || "").trim());
}

export function detectIntent(message: string): Intent {
  const m = (message || "").toLowerCase();

  if (/\b(action plan|next best action|what should i do next|working model|overall plan|my plan|coach me|summary of my money)\b/i.test(m)) {
    return Intent.ACTION_PLAN;
  }

  if (/\b(spent|spend|expense|paid|bought|purchase|earned|income|salary|received)\b/i.test(m)) {
    return Intent.VOICE_LEDGER;
  }

  if (/\b(budget|cashflow|cash flow|spending|money leak|save|saving|savings|subscription|emergency fund|balance)\b/i.test(m)) {
    return Intent.BUDGET_COACH;
  }

  if (/\b(what is|explain|teach|learn|meaning|how does|upi|sip|fd|fixed deposit|mutual fund|credit score|cibil|insurance|emi|loan)\b/i.test(m)) {
    return Intent.FINANCIAL_EDUCATION;
  }

  if (/\b(scheme|yojana|government benefit|govt benefit|jan dhan|pmjdy|pmjjby|pmsby|atal pension|apy|sukanya|pm kisan|kisan)\b/i.test(m)) {
    return Intent.GOVERNMENT_SCHEMES;
  }

  if (/\b(invest|investment|fd|rd|sip|mutual fund|stock|returns|portfolio|where should i put money)\b/i.test(m)) {
    return Intent.INVESTMENT_AGENT;
  }

  if (/\b(financial|finance|dna|net worth|assets|liabilit)/i.test(m)) {
    return Intent.FINANCIAL_DNA;
  }

  if (/\b(voice ledger|voice note|transcript|voice|call log)\b/i.test(m)) {
    return Intent.VOICE_LEDGER;
  }

  if (/\b(simulate|simulation|forecast|future|project|what if)\b/i.test(m)) {
    return Intent.FUTURE_SIMULATION;
  }

  if (/\b(community|join|suggestions|insights|trends)\b/i.test(m)) {
    return Intent.COMMUNITY_INTELLIGENCE;
  }

  if (/\b(scam|fraud|suspicious|phishing|protect)\b/i.test(m)) {
    return Intent.SCAM_SHIELD;
  }

  return Intent.UNKNOWN;
}
