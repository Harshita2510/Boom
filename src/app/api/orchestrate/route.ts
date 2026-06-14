import { NextResponse } from "next/server";
import { orchestrate } from "../../../agents/masterOrchestrator";
import type { AgentResponse } from "../../../agents/types";
import { getOrCreateCurrentAppUser } from "@/lib/current-app-user";
import { connectToDatabase } from "@/lib/mongoose";

type OrchestrateRequest = {
  userId?: string;
  message: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, message } = body as OrchestrateRequest;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Missing or invalid 'message'" }, { status: 400 });
    }

    await connectToDatabase();
    const appUser = await getOrCreateCurrentAppUser();

    // Call the Master Orchestrator
    const agentResponse = (await orchestrate(message, {
      appUserId: appUser?._id,
      channel: "web"
    })) as AgentResponse;

    // Optionally attach userId for client correlation
    const result = { userId: userId || null, agentResponse };

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error("/api/orchestrate error:", err);
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
