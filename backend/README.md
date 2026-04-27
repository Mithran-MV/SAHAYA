# SAHAYA Backend

Cloud Run service that receives Twilio WhatsApp webhooks, runs the Gemini multimodal pipeline (voice → structured need, photo → verification), and writes to Firestore.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness + integration status |
| `POST` | `/whatsapp` | Twilio inbound webhook (voice / photo / text) |
| `GET` | `/` | Service info |

## Local dev

```bash
cp .env.example .env   # fill in keys (see SETUP.md)
npm install
npm run dev            # tsx watch on http://localhost:8080
```

Smoke test:

```bash
npm run smoke
```

## Build

```bash
npm run typecheck
npm run build          # → dist/
npm start
```

## Docker

```bash
docker build -t sahaya-backend .
docker run -p 8080:8080 --env-file .env sahaya-backend
```

## Stack

- Node 22 + TypeScript (CommonJS, strict)
- Express 4 + Helmet + CORS + pino-http
- `@google/genai` for Gemini 2.0 multimodal
- `firebase-admin` for Firestore
- `twilio` for WhatsApp messaging
- `@googlemaps/google-maps-services-js` for geocoding

## Environment

See [.env.example](./.env.example). All keys live in `.env` (gitignored). On Cloud Run, set them as service env vars.
