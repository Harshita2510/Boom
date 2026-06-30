# Boom (ArthSaathi)

A modern full-stack web application scaffold built with Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui conventions, Clerk Authentication, MongoDB Atlas, and Cloudinary.

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Project Shape

- `src/app` - App Router routes, layouts, and route groups.
- `src/components` - Shared UI and layout components.
- `src/config` - Application constants and navigation config.
- `src/lib` - Server/client integration helpers.
- `src/types` - Shared TypeScript types.

## Environment

Fill `.env.local` with Clerk, MongoDB Atlas, and Cloudinary credentials before using the integrations.

## Scripts

```bash
npm run dev
npm run dev:whatsapp
npm run build
npm run lint
npm run typecheck
npm run format
```

## WhatsApp Cloud API Sandbox Webhook

The WhatsApp webhook is handled by the Next.js API route.

```bash
npm run dev
```

Default local URL:

```text
http://localhost:3000/api/webhook/whatsapp
```

Local health check:

```text
http://localhost:3000/api/webhook/whatsapp
```

For a free WhatsApp demo, use Meta's WhatsApp Cloud API sandbox/test setup and
expose this app with an HTTPS tunnel such as ngrok:

```bash
ngrok http 3000
```

Example callback URL format:

```text
https://abc123.ngrok-free.app/api/webhook/whatsapp
```

Required environment variables:

```bash
WHATSAPP_VERIFY_TOKEN=choose_any_random_string
WHATSAPP_ACCESS_TOKEN=from_meta_whatsapp_getting_started
WHATSAPP_PHONE_NUMBER_ID=from_meta_whatsapp_getting_started
WHATSAPP_GRAPH_API_VERSION=v22.0
WHATSAPP_REPLY_DELAY_MS=1500
```

Meta sandbox setup:

1. Create a Meta Developer app and add WhatsApp.
2. In WhatsApp > API Setup, copy the temporary access token into `WHATSAPP_ACCESS_TOKEN`.
3. Copy the test phone number id into `WHATSAPP_PHONE_NUMBER_ID`.
4. Add your own phone number as an allowed test recipient.
5. Set webhook callback URL to `/api/webhook/whatsapp`.
6. Use the same `WHATSAPP_VERIFY_TOKEN` value in Meta webhook verification.
7. Subscribe the webhook to `messages`.
