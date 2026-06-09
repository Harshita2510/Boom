export enum Intent {
  FINANCIAL_DNA = "financial_dna",
  VOICE_LEDGER = "voice_ledger",
  FUTURE_SIMULATION = "future_simulation",
  COMMUNITY_INTELLIGENCE = "community_intelligence",
  SCAM_SHIELD = "scam_shield",
  UNKNOWN = "unknown",
}

export function detectIntent(message: string): Intent {
  const m = (message || "").toLowerCase();

  if (/\b(financial|finance|dna|net worth|budget|expenses|assets|liabilit)/i.test(m)) {
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
