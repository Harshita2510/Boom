import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { orchestrate } from "../../../agents/masterOrchestrator";
import { getDatabase } from "../../../lib/mongodb";
import { getOrCreateCurrentAppUser } from "@/lib/current-app-user";
import { connectToDatabase } from "@/lib/mongoose";
import { FinancialDNAModel } from "@/models";

function toObjectId(id: string) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

function serializeConversation(conversation: any) {
  return {
    id: String(conversation._id),
    createdAt: conversation.createdAt,
    messages: Array.isArray(conversation.messages) ? conversation.messages : [],
    title: conversation.title || getConversationTitle(conversation.messages),
    updatedAt: conversation.updatedAt
  };
}

function getConversationTitle(messages: any[] = []) {
  const firstUserMessage = messages.find((message) => message?.role === "user")?.text;

  if (!firstUserMessage) {
    return "New chat";
  }

  const text = String(firstUserMessage).trim();
  return text.length > 52 ? `${text.slice(0, 52)}...` : text;
}

async function getAuthorizedUser() {
  await connectToDatabase();
  const appUser = await getOrCreateCurrentAppUser();

  if (!appUser) {
    return { error: "Please sign in before using chat.", status: 401 } as const;
  }

  const financialDNA = await FinancialDNAModel.exists({ userId: appUser._id });

  if (!financialDNA) {
    return {
      error:
        "Complete Financial DNA first. Then ArthSaathi can unlock the rest of the assistant.",
      status: 403
    } as const;
  }

  return { appUser, appUserId: String(appUser._id) } as const;
}

export async function GET(req: Request) {
  try {
    const auth = await getAuthorizedUser();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const db = await getDatabase();
    const conversations = db.collection("conversations");

    if (id) {
      const objectId = toObjectId(id);
      const conversation = await conversations.findOne({
        _id: objectId ?? id,
        appUserId: auth.appUserId
      } as any);

      if (!conversation) {
        return NextResponse.json({ error: "Chat not found" }, { status: 404 });
      }

      return NextResponse.json({ conversation: serializeConversation(conversation) });
    }

    const history = await conversations
      .find({ appUserId: auth.appUserId })
      .sort({ updatedAt: -1 })
      .limit(40)
      .toArray();

    return NextResponse.json({
      conversations: history.map(serializeConversation)
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, conversationId } = body;

    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    const auth = await getAuthorizedUser();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const db = await getDatabase();
    const conversations = db.collection("conversations");
    const userMsg = {
      role: "user",
      text: String(message),
      timestamp: new Date()
    } as any;

    let convoDoc: any = null;

    if (conversationId) {
      const objectId = toObjectId(String(conversationId));
      const query = {
        _id: objectId ?? String(conversationId),
        appUserId: auth.appUserId
      } as any;

      const result = await conversations.findOneAndUpdate(
        query,
        {
          $push: { messages: userMsg },
          $set: { updatedAt: new Date() }
        },
        { returnDocument: "after" }
      );

      convoDoc = result?.value || (await conversations.findOne(query));
    }

    if (!convoDoc) {
      const r = await conversations.insertOne({
        appUserId: auth.appUserId,
        createdAt: new Date(),
        messages: [userMsg],
        title: getConversationTitle([userMsg]),
        updatedAt: new Date()
      });
      convoDoc = await conversations.findOne({ _id: r.insertedId });
    }

    if (!convoDoc) {
      return NextResponse.json({ error: "Failed to create or find conversation" }, { status: 500 });
    }

    const agentResponse = await orchestrate(String(message), {
      appUserId: auth.appUser._id,
      channel: "chat"
    });

    const agentMsg = {
      role: "agent",
      agent: agentResponse.agent,
      intent: agentResponse.intent,
      text: agentResponse.text,
      data: agentResponse.data || null,
      timestamp: new Date()
    } as any;

    await conversations.updateOne(
      { _id: convoDoc._id, appUserId: auth.appUserId },
      {
        $push: { messages: agentMsg },
        $set: {
          title: convoDoc.title || getConversationTitle([userMsg]),
          updatedAt: new Date()
        }
      }
    );

    const updated = await conversations.findOne({
      _id: convoDoc._id,
      appUserId: auth.appUserId
    });

    return NextResponse.json(
      {
        agentResponse,
        conversation: updated ? serializeConversation(updated) : null,
        conversationId: String(convoDoc._id)
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await getAuthorizedUser();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing chat id" }, { status: 400 });
    }

    const objectId = toObjectId(id);
    const db = await getDatabase();
    const result = await db.collection("conversations").deleteOne({
      _id: objectId ?? id,
      appUserId: auth.appUserId
    } as any);

    if (!result.deletedCount) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
