# SAHAYA — Public Dashboard

Next.js 15 + Tailwind + Firebase Web SDK. Real-time transparency dashboard reading anonymized `needs` from Firestore and rendering a live Google Maps heatmap, KPI strip, activity feed, and category breakdown.

## Quickstart

```bash
cp .env.local.example .env.local   # fill in Firebase + Maps web keys
npm install
npm run dev                        # http://localhost:3000
```

Without `.env.local`, the dashboard falls back to `public/demo.json` so the UI is always demo-able.

## Build (static export for Firebase Hosting)

```bash
npm run build
# output: ./out
```

Then from the repo root:

```bash
firebase deploy --only hosting
```

## What you'll see

- **Hero**: live tag, mission line, intro
- **KPI strip**: total needs, resolved, avg time-to-resolve, languages active
- **Map**: Google Maps heatmap of all geocoded needs, urgency-weighted gradient
- **Activity feed**: live-updating cards with status, quote, location, verified photo
- **Category breakdown**: bar visualization of need types

## Data source

Reads `needs` collection from Firestore via `onSnapshot` (real-time). No backend round-trip from the browser.

## Stack

- Next.js 15 (App Router, static export)
- React 19
- Tailwind 3
- `@vis.gl/react-google-maps` (Google's official React wrapper)
- `firebase` web SDK 11
- `lucide-react` icons
