# SAHAYA — Architecture

End-to-end flow and the design decisions behind it.

## End-to-end flow

```
ASHA worker
  │ 🎙️ voice note (Tamil/Hindi/English)
  ▼
WhatsApp (Twilio sandbox)
  │ webhook: POST /whatsapp
  ▼
Cloud Run backend (Node 22 + TS + Express)
  ├──► download Twilio media (Basic auth)
  ├──► Gemini 2.5 Flash multimodal call
  │      └─► {language, transcription, needs[]}
  ├──► Google Maps Geocoding (locationHint → lat/lng)
  ├──► persist Needs to in-memory store
  ├──► find nearest active volunteer with matching skill
  └──► Twilio outbound: WhatsApp dispatch ping
                                   │
                                   ▼
                              Volunteer
                                   │ 📷 photo of fixed problem
                                   ▼
                          Cloud Run /whatsapp
                                   │
                                   ├──► download photo (Twilio Basic auth)
                                   ├──► Gemini 2.5 Vision verify
                                   │      └─► {verified, confidence, reason}
                                   └──► save Resolution; mark Need verified

In parallel:
  Dashboard (Vercel) ──► poll GET /api/needs every 5s
                    ──► poll GET /api/stats every 5s
                    ──► render Google Maps heatmap + activity feed
                    ──► <img src="/media/<resolutionId>"> proxied through backend
```

## Why these choices

### Why no database
A hackathon demo is a 3-minute video plus a static dataset for the dashboard. We embed the seed dataset (47 needs, 10 volunteers, 5 ASHA workers, 28 resolutions) into the backend and load it into a single in-memory store at startup. Cloud Run with `min-instances=1` keeps it warm. Production deployments swap the store for Postgres or Cloud SQL — every other layer stays the same. See [DATA_MODEL.md](DATA_MODEL.md).

### Why Cloud Run (not Cloud Functions / App Engine)
Twilio webhooks come in as form-urlencoded POSTs with media URLs. We need to:
1. Download a 50-200KB audio blob inside the request lifetime
2. Make a 1-2s Gemini call
3. Make a 200ms geocoding call
4. Write to memory + dispatch to a volunteer

That's 3-4 seconds total. Cloud Functions cold-starts are too unpredictable; Cloud Run gives us a stable 60s timeout with `min-instances=1`.

### Why WhatsApp (not a custom app)
ASHA workers are not going to install a new app. WhatsApp is already on every Indian phone. The same is true for volunteers. Twilio handles the messaging plumbing; SAHAYA never touches a phone OS.

### Why polling (not WebSockets)
Cloud Run isn't a great fit for long-lived connections. The dashboard polls `/api/needs` and `/api/stats` every 5 seconds — perceived as real-time, costs nothing extra, and survives any Cloud Run scaling event without reconnect logic.

### Why Vercel (not Cloud Run for the web)
Next.js + Vercel is the most ergonomic deploy in the world. One CLI command, automatic CDN, env vars, preview URLs. We could host the static export on Cloud Run too — same result, more glue.

### Why Gemini 2.5 Flash (not 2.0 Flash, not 1.5 Pro)
- 2.5 Flash has free tier quota; 2.0 Flash had its free tier removed for new projects in 2025
- 2.5 Flash is multimodal (audio + vision in one call), multilingual (Tamil/Hindi/English/code-mix)
- Pro is overkill — 2.5 Flash hits all our accuracy needs in <1s

### Why one Gemini call (not two or three)
Splitting transcription, language detection, and need extraction would be three separate calls and three places for the model to disagree with itself. One JSON-mode call, one prompt, validated by Zod on the way out. Faster, cheaper, more consistent.

## Module boundaries

```
backend/src/
├── lib/                       Low-level utilities
│   ├── config.ts              Zod-validated env config
│   ├── logger.ts              pino
│   ├── twilio.ts              media download (inbound auth)
│   ├── twilioOutbound.ts      messages.create (outbound)
│   ├── maps.ts                Maps Geocoding client
│   ├── geo.ts                 Haversine
│   ├── store.ts               In-memory data store (singleton)
│   └── seedRunner.ts          Populates store from seedData on startup
├── domain/                    Business types + persistence interface
│   ├── types.ts               Zod schemas + TS interfaces
│   └── repo.ts                CRUD over store (the only file that mutates state)
├── pipeline/                  Orchestration / use-cases
│   ├── extractNeeds.ts        Gemini text+audio → ExtractionResult
│   ├── geocode.ts             Location hint → lat/lng
│   ├── processNeeds.ts        Geocode + persist
│   ├── dispatchVolunteer.ts   Match nearest + WA outbound
│   ├── verifyResolution.ts    Gemini Vision photo verify
│   └── volunteerCommands.ts   /v register, /v skills, /v claim, etc.
├── routes/                    HTTP layer
│   ├── health.ts              Liveness + integration status
│   ├── api.ts                 Public REST: /api/needs, /api/stats, /api/volunteers
│   ├── media.ts               Twilio media proxy
│   ├── whatsapp.ts            Twilio inbound webhook (audio / photo / commands)
│   └── test.ts                Dev-only /test/extract for text smoke tests
└── scripts/seedData.ts        Hand-written 47-need dataset (5 villages, TA/HI/EN)
```

Dependency direction: `routes/ → pipeline/ → domain/ → lib/`. Lower-numbered layers never import higher.

## Failure modes & graceful degradation

| Failure | Behaviour |
|---|---|
| `GEMINI_API_KEY` missing | `/whatsapp` returns a friendly TwiML pointing to `docs/SETUP.md` |
| `GOOGLE_MAPS_API_KEY` missing | `geocodeMany` returns all-null; needs are persisted with `location: null`; dashboard shows them in the activity feed but not on the heatmap |
| Twilio Auth Token missing | Outbound dispatch silently skipped; need still persisted; ack still sent (Twilio replies with the TwiML we return synchronously) |
| Gemini 429 (rate limit) | Single retry with the SDK's built-in backoff; on second failure, error logged + 500 returned to Twilio (Twilio retries up to 4 times, the 2nd attempt usually succeeds) |
| Cloud Run cold start mid-demo | Store re-seeds; demo data still appears; volunteer state from earlier session is lost. Mitigated by `min-instances=1`. |
| Maps API rejects request (HTTP referrer mismatch) | Heatmap silently doesn't render; activity feed and KPI strip continue to work |

## What we deliberately didn't build

- **Real authentication.** No Firebase Auth, no JWT, no OAuth. The only authenticated endpoint is `/whatsapp` (Twilio webhook signature could be verified for production — easy add). Public endpoints are read-only.
- **WhatsApp Business API.** Sandbox-only. Approval takes weeks; not blocking submission.
- **Vector search / RAG.** Vertex AI Vector Search would be useful for clustering similar needs (e.g. "all 200 voice notes about water in Pollachi") but isn't necessary for the demo.
- **Persistence.** `lib/store.ts` is in-memory by design. Production swap is a one-file change.
- **Tests.** Hackathon ship-mode. Code is small enough to read end-to-end.
