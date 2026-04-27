# SAHAYA

> **Voice-first community needs intelligence.**
> Turning ASHA worker voice notes in Tamil, Hindi, and English into NGO action — over WhatsApp.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Built with Gemini](https://img.shields.io/badge/Built%20with-Gemini%202.0-4285F4)](https://ai.google.dev)
[![Cloud Run](https://img.shields.io/badge/Deployed%20on-Cloud%20Run-4285F4)](https://cloud.google.com/run)

Submission for **Google Solution Challenge 2026** via GDG on Campus — Coimbatore Institute of Technology.

---

## The problem

India has **1.04 million ASHA workers** — frontline community health activists, mostly women, who walk villages every day and witness 30+ unmet community needs: a child with a rash, a dry tube well, a grandmother who hasn't eaten in two days. Today they can report 2 of those 30, because the reporting tools are paper forms and Hindi/English smartphone apps that they cannot read.

NGOs and local-government volunteers, meanwhile, sit hours away with skills and willingness to help — but no live signal of what's needed where.

## The idea

Build the entire intake and dispatch loop on **WhatsApp**, the one app every Indian phone already has.

1. **ASHA worker speaks** a 20-second voice note in her own language.
2. **Gemini 2.0** transcribes and extracts structured needs: type, urgency, location, count.
3. **Public dashboard** surfaces hotspots in real time, on a Google Maps heatmap.
4. **Closest qualified volunteer** is matched and pinged on WhatsApp automatically.
5. **Volunteer fixes it**, sends a photo. **Gemini Vision** verifies the photo matches the original problem. Resolution logged.

No new app to install. Works in three Indian languages on day one. Closed loop, with proof.

## SDG alignment

- **SDG 1** No Poverty
- **SDG 3** Good Health and Well-being
- **SDG 5** Gender Equality (ASHA workforce is 100% women)
- **SDG 10** Reduced Inequalities
- **SDG 11** Sustainable Cities and Communities

## Tech stack

| Layer | Technology |
|---|---|
| AI — voice, language, vision | **Gemini 2.0 Flash** |
| Database | **Cloud Firestore** |
| Auth | **Firebase Authentication** |
| Backend | **Cloud Run** (Node.js 22 + TypeScript) |
| Web hosting | **Firebase Hosting** |
| Maps + geocoding | **Google Maps Platform** |
| Messaging | WhatsApp via Twilio |
| Frontend | Next.js 15 + Tailwind |

**Six Google products** integrated end-to-end.

## Repository layout

```
SAHAYA/
├── backend/         Cloud Run service: Twilio webhook + Gemini pipeline
├── web/             Next.js public dashboard
├── scripts/         Demo seed data, deployment helpers
├── docs/            Architecture, SDG mapping, video script
└── .github/         CI workflows
```

## Quickstart

> Setup instructions land in [docs/SETUP.md](docs/SETUP.md) at the end of Phase 1.

## Status

Active build for Solution Challenge 2026 submission.

## License

MIT — see [LICENSE](LICENSE).
