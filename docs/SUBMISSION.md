# SAHAYA — Hack2Skill Submission Text

Copy-paste each section into the matching Hack2Skill form field.

---

## Project name

**SAHAYA — Voice-first community needs intelligence**

---

## Tagline (under 100 characters)

ASHA worker voice notes → structured community needs → matched volunteers → photo-verified resolutions.

---

## Problem statement track

**Smart Resource Allocation** (Open Innovation)

> Local social groups and NGOs collect a lot of important information about community needs through paper surveys and field reports. However, this valuable data is often scattered across different places, making it hard to see the biggest problems clearly.

SAHAYA addresses the **upstream bottleneck**: the data is not just scattered — it is often never reported in the first place because the reporting tools assume English literacy. We replace forms with WhatsApp voice notes.

---

## SDGs addressed (primary)

- **SDG 1** No Poverty
- **SDG 3** Good Health and Well-being
- **SDG 5** Gender Equality
- **SDG 10** Reduced Inequalities
- **SDG 11** Sustainable Cities and Communities

---

## Project description

India has 1.04 million ASHA workers — frontline community health activists, almost all women, who walk villages every day and observe far more community needs than they can ever report. Existing tools are paper forms or English smartphone apps that assume a literacy and digital fluency they may not have. Meanwhile, NGOs and local-government volunteers, with skills and time to help, have no live signal of what is needed where.

SAHAYA fixes the gap with a single insight: **don't build an app**. Build it on WhatsApp, where 500 million Indians already are. ASHA workers send 20-second voice notes in Tamil, Hindi, or English (or a code-mix). One Gemini 2.0 Flash call detects the language, transcribes, and extracts every distinct community need — type, urgency, location, beneficiary count. The closest qualified volunteer gets a WhatsApp dispatch within seconds. When the volunteer fixes the issue, they send a photo; Gemini Vision verifies it matches the original need, and the resolution is logged on a public Google Maps heatmap.

The system is built end-to-end on six Google products: Gemini 2.0 (multimodal language and vision), Cloud Firestore (real-time database with privacy-first security rules), Firebase Authentication, Firebase Hosting, Firebase Storage, and Cloud Run (the Node.js + TypeScript backend), plus Google Maps Platform (geocoding + heatmap). The reporter's phone number never leaves a private collection — public-facing data carries only an opaque `publicId` and at most a first name.

We seeded the system with 47 realistic community needs across five villages around Coimbatore (Pollachi, Sulur, Annur, Mettupalayam, Karamadai) — broken tube wells, child malnutrition, snake bites, antenatal care lapses, drainage failures, school dropout, mosquito fogging needs. 31 of those have a "verified" resolution with a photo. The dashboard shows a live heatmap, a KPI strip (today's needs, resolved count, average time-to-resolve, active languages), a live activity feed of every report and resolution, and a category breakdown. Every datum on the public side has a verified photo and a citizen-readable status.

The unexpected design decision that makes the solution scale: **WhatsApp IS the app**. ASHA workers will not download a new app, and most rural Indians will not either. By living entirely inside WhatsApp — for both intake (voice notes) and dispatch (text + photo) — SAHAYA inherits 500 million users on day one and adds zero onboarding cost per new ASHA worker.

---

## Tech stack

Gemini 2.0 Flash · Cloud Firestore · Firebase Authentication · Firebase Hosting · Firebase Storage · Cloud Run · Google Maps Platform · Next.js 15 · React 19 · Tailwind 3 · TypeScript · WhatsApp via Twilio

---

## Demo links

- **Live dashboard**: `https://<your-project-id>.web.app` (replace with your Firebase Hosting URL after deploy)
- **GitHub repo**: https://github.com/Mithran-MV/SAHAYA
- **3-min video**: `<your YouTube unlisted link>` (replace after recording)

---

## Team

**Mithran MV** — Coimbatore Institute of Technology — solo entry

---

## What was hard / what we are proud of

The hardest part was the **privacy architecture**. A naive build would have a public dashboard reading directly from a `needs` collection that contains the reporter's phone number. We instead designed a two-tier model: PII (phone, full name) lives only in `asha_workers` and `volunteers`, both of which are completely backend-only. The public `needs` collection carries only an opaque `publicId` and a first name. Firestore security rules enforce this at the platform level — no client can ever read a phone number, regardless of bugs in the frontend.

The most rewarding moment was getting the Tamil voice note → structured JSON pipeline working in a single Gemini call with `responseMimeType: 'application/json'`. The same single API does language detection, transcription, and multi-need extraction; we never have to chain models. That keeps the system fast (~0.8s per voice note end-to-end) and cheap (well within the Gemini free tier).

---

## Future scope

- Onboard a real partner ASHA cohort in 1 panchayat (50–100 workers) and run for 30 days
- Apply for Twilio WhatsApp Business API approval (current submission uses sandbox)
- Add caste / age / gender disaggregation in dashboard for equity audits
- Vertex AI Vector Search for semantic clustering of similar needs ("all 200 voice notes about water in Pollachi this month")
- IndexedDB-backed offline mode for ASHA workers in connectivity dead zones
- Integration with NHM dashboards and Ayushman Bharat APIs as a structured upstream feed
- Multilingual expansion: Telugu, Kannada, Malayalam, Bengali (already supported by Gemini; just needs prompt validation)

---

## Public ethics statement

SAHAYA is designed for **dignity-first transparency**. The dashboard is public because community-need data should be a public utility, not a government silo. But individual reporters are anonymized so that ASHA workers cannot be retaliated against for surfacing inconvenient truths. The voice note text (which may contain identifying details about the affected person) is included in the public record because the reporter chose to speak it; we recommend operational deployments add an automatic redaction pass for personal names before public publish — this is a tractable extension and is on our roadmap.

---

## Acknowledgements

The 1.04 million ASHA workers of India, whose work this project is built to amplify.
The GDG on Campus — Coimbatore Institute of Technology community.
The Google Solution Challenge organizers and the Hack2Skill team.
