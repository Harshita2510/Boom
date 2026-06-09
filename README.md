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

## WhatsApp Cloud API Webhook

The WhatsApp webhook backend is a separate Express server.

```bash
npm run dev:whatsapp
```

Default local URL:

```text
http://localhost:4000/webhook/whatsapp
```

Local verification test:

```text
http://localhost:4000/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=boom_test
```

Replace `YOUR_VERIFY_TOKEN` with the exact value from `.env.local`.

For Meta webhook verification, expose it with an HTTPS tunnel such as ngrok and
use the generated forwarding URL:

```bash
ngrok http 4000
```

Example callback URL format:

```text
https://abc123.ngrok-free.app/webhook/whatsapp
```

Required environment variables:

```bash
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_GRAPH_API_VERSION=v22.0
WHATSAPP_SERVER_PORT=4000
```
