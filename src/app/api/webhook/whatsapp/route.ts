import { NextResponse } from "next/server";
import { orchestrate } from "../../../../agents/masterOrchestrator";

type WhatsAppMessage = {
  from?: string;
  id?: string;
  text?: {
    body?: string;
  };
  type?: string;
};

function getIncomingTextMessages(body: any) {
  const entries = Array.isArray(body?.entry) ? body.entry : [];

  return entries.flatMap((entry: any) => {
    const changes = Array.isArray(entry?.changes) ? entry.changes : [];

    return changes.flatMap((change: any) => {
      const messages = Array.isArray(change?.value?.messages) ? change.value.messages : [];

      return messages
        .filter((message: WhatsAppMessage) => message.type === "text" && message.from && message.text?.body)
        .map((message: WhatsAppMessage) => ({
          from: String(message.from),
          messageId: message.id ? String(message.id) : null,
          text: String(message.text?.body),
        }));
    });
  });
}

async function sendWhatsAppText(to: string, text: string) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const graphApiVersion = process.env.WHATSAPP_GRAPH_API_VERSION || "v25.0";

  if (!accessToken || !phoneNumberId) {
    throw new Error("Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID");
  }

  const response = await fetch(`https://graph.facebook.com/${graphApiVersion}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: {
        preview_url: false,
        body: text.slice(0, 4096),
      },
    }),
  });

  const result = await response.text();

  if (!response.ok) {
    throw new Error(`WhatsApp send failed (${response.status}): ${result}`);
  }

  return result;
}

// GET /api/webhook/whatsapp
// - Accepts hub.mode, hub.verify_token, hub.challenge (and variants)
// - If mode === 'subscribe' and verify_token matches env, return challenge (200)
// - Otherwise return 403
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const params = url.searchParams;

    const mode = params.get("hub.mode") || params.get("hub_mode") || params.get("mode");
    const token = params.get("hub.verify_token") || params.get("hub_verify_token") || params.get("verify_token");
    const challenge = params.get("hub.challenge") || params.get("hub_challenge") || params.get("challenge");

    console.log("[whatsapp webhook] GET verification request:", { mode, token, challenge });

    if (String(mode) === "subscribe" && String(token) === String(process.env.WHATSAPP_VERIFY_TOKEN)) {
      console.log("[whatsapp webhook] verification success");
      return new NextResponse(challenge ?? "", { status: 200 });
    }

    console.warn("[whatsapp webhook] verification failed", { mode, token });
    return new NextResponse("Forbidden", { status: 403 });
  } catch (err) {
    console.error("[whatsapp webhook] GET error", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    let body: any = null;
    try {
      body = await req.json();
    } catch (e) {
      // If body is not JSON, attempt to read text
      try {
        const text = await req.text();
        body = text;
      } catch (e2) {
        body = null;
      }
    }

    console.log("[whatsapp webhook] Incoming POST body:", JSON.stringify(body, null, 2));

    const messages = getIncomingTextMessages(body);

    for (const message of messages) {
      console.log("[whatsapp webhook] Processing text message:", message);
      const agentResponse = await orchestrate(message.text, {
        channel: "whatsapp",
        externalUserId: message.from
      });
      let reply = agentResponse.text;

      try {
        await sendWhatsAppText(message.from, reply);
        console.log("[whatsapp webhook] Sent agent reply:", {
          to: message.from,
          agent: agentResponse.agent,
          intent: agentResponse.intent,
        });
      } catch (sendError) {
        console.error("[whatsapp webhook] Reply send failed:", {
          to: message.from,
          error: sendError
        });
      }
    }

    return new NextResponse(null, { status: 200 });
  } catch (err) {
    console.error("[whatsapp webhook] POST error", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
