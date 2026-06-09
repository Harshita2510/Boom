require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const express = require("express");

const app = express();

const PORT = process.env.WHATSAPP_SERVER_PORT || 4000;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const GRAPH_API_VERSION = process.env.WHATSAPP_GRAPH_API_VERSION || "v22.0";

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "boom-whatsapp-webhook" });
});

app.get("/webhook/whatsapp", async (req, res) => {
  try {
    // Forward verification GET to Next API route
    const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const query = req.url.includes("?") ? req.url.split("?")[1] : "";
    const target = `${base.replace(/\/$/, "")}/api/webhook/whatsapp${query ? "?" + query : ""}`;

    console.log("Proxying GET verification to Next API:", target);

    const upstream = await fetch(target, {
      method: "GET",
      headers: {
        // help bypass ngrok free-tier browser warning when testing from a browser
        "ngrok-skip-browser-warning": "1",
        "user-agent": req.get("user-agent") || "",
      }
    });

    const text = await upstream.text();
    res.status(upstream.status).send(text);
  } catch (err) {
    console.error("Error proxying GET /webhook/whatsapp to Next API", err);
    res.sendStatus(500);
  }
});

app.post("/webhook/whatsapp", async (req, res) => {
  try {
    // Forward incoming webhook POST to Next API so Next handles logging/processing
    const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const target = `${base.replace(/\/$/, "")}/api/webhook/whatsapp`;

    console.log("Proxying POST webhook to Next API:", target);

    const upstream = await fetch(target, {
      method: "POST",
      headers: {
        "Content-Type": req.get("content-type") || "application/json",
        "ngrok-skip-browser-warning": "1",
        "user-agent": req.get("user-agent") || "",
      },
      body: JSON.stringify(req.body)
    });

    // return Next's status/text back to caller
    const text = await upstream.text();
    res.status(upstream.status).send(text);
  } catch (err) {
    console.error("Error proxying POST /webhook/whatsapp to Next API", err);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log(`Boom WhatsApp webhook server running on port ${PORT}`);
  console.log(`Webhook path: /webhook/whatsapp`);
});
