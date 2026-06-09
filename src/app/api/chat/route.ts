import { NextResponse } from "next/server";
import { getDatabase } from "../../../lib/mongodb";
import { orchestrate } from "../../../agents/masterOrchestrator";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, conversationId } = body;
    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    const db = await getDatabase();
    const conversations = db.collection("conversations");

    const userMsg = {
      role: "user",
      text: String(message),
      timestamp: new Date(),
    } as any;

    let convoDoc: any = null;

    if (conversationId) {
      // try to convert to ObjectId when possible
      let query: any = { _id: conversationId };
      try {
        query = { _id: new ObjectId(String(conversationId)) };
      } catch (e) {
        // keep as-is if it cannot be converted
        query = { _id: conversationId };
      }

      const result = await conversations.findOneAndUpdate(
        query,
        { $push: { messages: userMsg }, $set: { updatedAt: new Date() } },
        { returnDocument: "after" }
      );

      convoDoc = result?.value || (await conversations.findOne(query));
    }

    if (!convoDoc) {
      const r = await conversations.insertOne({
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [userMsg],
      });
      convoDoc = await conversations.findOne({ _id: r.insertedId });
    }

    if (!convoDoc) {
      return NextResponse.json({ error: "Failed to create or find conversation" }, { status: 500 });
    }

    // Call orchestrator
    const agentResponse = await orchestrate(String(message));

    const agentMsg = {
      role: "agent",
      agent: agentResponse.agent,
      intent: agentResponse.intent,
      text: agentResponse.text,
      data: agentResponse.data || null,
      timestamp: new Date(),
    } as any;

    await conversations.updateOne({ _id: convoDoc._id }, { $push: { messages: agentMsg }, $set: { updatedAt: new Date() } });

    const updated = await conversations.findOne({ _id: convoDoc._id });

    return NextResponse.json({ conversationId: String(convoDoc._id), conversation: updated, agentResponse }, { status: 200 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
