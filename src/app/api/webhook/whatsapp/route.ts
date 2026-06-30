import { NextResponse } from "next/server";

import { orchestrate } from "../../../../agents/masterOrchestrator";
import { connectToDatabase } from "@/lib/mongoose";
import { getOrCreateChannelUser } from "@/lib/voice-transaction";

type WhatsAppCloudMessage = {
  from?: string;
  id?: string;
  text?: {
    body?: string;
  };
  type?: string;
};

type IncomingWhatsAppText = {
  from: string;
  sessionId: string;
  messageId: string | null;
  text: string;
};

function getIncomingTextMessages(body: any): IncomingWhatsAppText[] {
  const entries = Array.isArray(body?.entry) ? body.entry : [];

  return entries.flatMap((entry: any) => {
    const changes = Array.isArray(entry?.changes) ? entry.changes : [];

    return changes.flatMap((change: any) => {
      const messages = Array.isArray(change?.value?.messages) ? change.value.messages : [];

      return messages
        .filter(
          (message: WhatsAppCloudMessage) =>
            message.type === "text" &&
            typeof message.from === "string" &&
            typeof message.text?.body === "string" &&
            message.text.body.trim().length > 0
        )
        .map((message: WhatsAppCloudMessage) => ({
          from: String(message.from),
          sessionId: `${message.from}@s.whatsapp.net`,
          messageId: message.id ? String(message.id) : null,
          text: String(message.text?.body).trim()
        }));
    });
  });
}

function getWhatsAppCloudConfig() {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const graphApiVersion = process.env.WHATSAPP_GRAPH_API_VERSION || "v22.0";

  if (!accessToken || !phoneNumberId) {
    throw new Error("Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID");
  }

  return {
    accessToken,
    phoneNumberId,
    graphApiVersion
  };
}

function getGraphMessagesUrl() {
  const { phoneNumberId, graphApiVersion } = getWhatsAppCloudConfig();
  return `https://graph.facebook.com/${graphApiVersion}/${phoneNumberId}/messages`;
}

function getGraphHeaders() {
  const { accessToken } = getWhatsAppCloudConfig();

  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json"
  };
}

async function markMessageAsRead(messageId: string | null) {
  if (!messageId) {
    return;
  }

  const response = await fetch(getGraphMessagesUrl(), {
    method: "POST",
    headers: getGraphHeaders(),
    body: JSON.stringify({
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId
    })
  });

  if (!response.ok) {
    const result = await response.text();
    console.warn(`[whatsapp webhook] read receipt failed (${response.status}): ${result}`);
  }
}

async function sendWhatsAppText(to: string, text: string) {
  if (process.env.WHATSAPP_DRY_RUN === "true") {
    console.log("[whatsapp webhook] dry run reply:", { to, text });
    return JSON.stringify({ dryRun: true });
  }

  const response = await fetch(getGraphMessagesUrl(), {
    method: "POST",
    headers: getGraphHeaders(),
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: {
        preview_url: false,
        body: text.slice(0, 4096)
      }
    })
  });

  const result = await response.text();

  if (!response.ok) {
    throw new Error(`WhatsApp send failed (${response.status}): ${result}`);
  }

  return result;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getHumanDelayMs() {
  const configuredDelay = Number(process.env.WHATSAPP_REPLY_DELAY_MS);

  if (Number.isFinite(configuredDelay) && configuredDelay > 0) {
    return configuredDelay;
  }

  return 1000 + Math.floor(Math.random() * 1001);
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const params = url.searchParams;

    const mode = params.get("hub.mode");
    const token = params.get("hub.verify_token");
    const challenge = params.get("hub.challenge");

    if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return new NextResponse(challenge ?? "", { status: 200 });
    }

    return new NextResponse("Forbidden", { status: 403 });
  } catch (err) {
    console.error("[whatsapp webhook] GET error", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = getIncomingTextMessages(body);
    const responses = [];

    for (const message of messages) {
      console.log("[whatsapp webhook] incoming Cloud API message:", {
        from: message.from,
        messageId: message.messageId
      });

      await connectToDatabase();

      const appUser = await getOrCreateChannelUser({
        channel: "whatsapp",
        externalUserId: message.sessionId
      });

      await markMessageAsRead(message.messageId);

      const agentResponse = await orchestrate(message.text, {
        appUserId: appUser._id,
        channel: "whatsapp",
        externalUserId: message.sessionId
      });

      await sleep(getHumanDelayMs());
      await sendWhatsAppText(message.from, agentResponse.text);

      responses.push({
        from: message.from,
        messageId: message.messageId,
        agentResponse
      });
    }

    return NextResponse.json({ ok: true, responses });
  } catch (err) {
    console.error("[whatsapp webhook] POST error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
