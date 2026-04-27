# SAHAYA — Architecture

> Detailed architecture diagram lands at end of Phase 6. This file currently captures the high-level flow.

## End-to-end flow

```
┌─────────────┐    voice/photo     ┌───────────────┐
│ ASHA worker │ ─────────────────▶ │  WhatsApp     │
│  (rural)    │                    │  (Twilio API) │
└─────────────┘                    └──────┬────────┘
                                          │ webhook
                                          ▼
                              ┌────────────────────────┐
                              │  Cloud Run backend     │
                              │  (Node.js + TS)        │
                              └────────────┬───────────┘
                                           │
                  ┌────────────────────────┼────────────────────────┐
                  │                        │                        │
                  ▼                        ▼                        ▼
         ┌────────────────┐      ┌──────────────────┐    ┌─────────────────┐
         │  Gemini 2.0    │      │  Firestore       │    │  Maps Geocoding │
         │  (voice→JSON,  │      │  (needs,         │    │  (location hint │
         │   vision verify)│     │   volunteers,    │    │   → lat/lng)    │
         └────────────────┘      │   resolutions)   │    └─────────────────┘
                                 └────────┬─────────┘
                                          │ realtime
                                          ▼
                                ┌──────────────────────┐
                                │  Next.js dashboard   │
                                │  (Firebase Hosting)  │
                                │  — Google Maps       │
                                │    heatmap, stats    │
                                └──────────────────────┘
```

## Data model (Firestore)

Detailed in Phase 3.

## Why this architecture

- **WhatsApp as the client**: zero install friction; ASHA workers already use it daily.
- **Cloud Run** over Cloud Functions: better cold-start behavior for the Twilio webhook + room to scale.
- **Firestore** over SQL: real-time listeners power the dashboard with no polling code; security rules give us per-role access without a custom auth layer.
- **Gemini multimodal in one API**: voice, language, and vision in a single dependency reduces moving parts.
