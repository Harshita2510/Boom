import { AgentResponse, Transaction } from "./types";
import { Intent } from "./intents";

let TRANSACTION_STORE: Transaction[] = [];

export async function handleVoiceLedger(message: string): Promise<AgentResponse<{ transactions: Transaction[] }>> {
  const m = message.toLowerCase();

  // simple extraction rules
  const expenseMatch = m.match(/spent\s*(\d+[.,]?\d*)\s*(?:rs|₹|inr)?\s*(?:on)?\s*(.*)/i);
  const incomeMatch = m.match(/earned\s*(\d+[.,]?\d*)\s*(?:rs|₹|inr)?\s*(?:from)?\s*(.*)/i);

  if (expenseMatch && expenseMatch[1]) {
    const amt = parseFloat(String(expenseMatch[1]).replace(/,/g, ""));
    const note = expenseMatch[2] ? expenseMatch[2].trim() : undefined;
    const tx: Transaction = { amount: amt, currency: "INR", category: note || "general", type: "expense", timestamp: new Date().toISOString(), note };
    TRANSACTION_STORE.push(tx);
  }

  if (incomeMatch && incomeMatch[1]) {
    const amt = parseFloat(String(incomeMatch[1]).replace(/,/g, ""));
    const note = incomeMatch[2] ? incomeMatch[2].trim() : undefined;
    const tx: Transaction = { amount: amt, currency: "INR", category: note || "income", type: "income", timestamp: new Date().toISOString(), note };
    TRANSACTION_STORE.push(tx);
  }

  const response = {
    agent: "voice_ledger",
    intent: Intent.VOICE_LEDGER,
    text: `Voice Ledger: ${TRANSACTION_STORE.length} transactions recorded.`,
    data: { transactions: TRANSACTION_STORE },
  };

  return response;
}
