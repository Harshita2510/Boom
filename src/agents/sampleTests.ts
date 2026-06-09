import { orchestrate } from "./masterOrchestrator";

async function runSamples() {
  const samples = [
    "What's my net worth and spending score?",
    "Spent 200 on petrol.",
    "Earned 500 from deliveries.",
    "What if I save 1000 more every month?",
    "What are people in my community talking about?",
    "Congratulations! Click here to claim ₹50,000.",
  ];

  for (const s of samples) {
    const res = await orchestrate(s);
    console.log("INPUT:", s);
    console.log("OUTPUT:", JSON.stringify(res, null, 2));
    console.log("---");
  }
}

runSamples().catch((e) => console.error(e));
