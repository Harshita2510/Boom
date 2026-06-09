import { AgentResponse, SimulationResult } from "./types";
import { Intent } from "./intents";

export async function handleFutureSimulation(message: string): Promise<AgentResponse<SimulationResult>> {
  // simple parsing
  const m = message.toLowerCase();
  const saveMatch = m.match(/save\s*(\d+[.,]?\d*)/i);
  const monthsMatch = m.match(/(\d+)\s*months?|in\s*(\d+)\s*months?/i);

  const currentBalance = 10000; // mock
  let additional = 0;
  if (saveMatch && saveMatch[1]) {
    additional = parseFloat(String(saveMatch[1]).replace(/,/g, ""));
  }

  const months = monthsMatch ? parseInt(monthsMatch[1] || monthsMatch[2]) : 12;

  const projected = currentBalance + additional * months;

  const result: SimulationResult = {
    months,
    currentBalance,
    projectedBalance: projected,
    recommendation: additional >= 1000 ? "On track" : "Increase monthly saving to reach goal faster",
  };

  const response: AgentResponse<SimulationResult> = {
    agent: "future_simulation",
    intent: Intent.FUTURE_SIMULATION,
    text: `Future Simulation result for ${message}`,
    data: result,
  };

  return response;
}
