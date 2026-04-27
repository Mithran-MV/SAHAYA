# SAHAYA — Setup Guide

You need 3 things. All free tier. Total time: ~15 minutes.

> Tip: Open all 3 tabs first, then go through them. You can do them in any order.

---

## 1. Gemini API key (2 min)

For voice transcription, multilingual extraction, and Vision photo verification.

1. Open <https://aistudio.google.com/apikey>
2. Sign in with the Google account you'll use for this project.
3. Click **Create API key**. Pick **Create API key in new project** (or pick an existing GCP project — same result).
4. Copy the key (starts with `AIza...`).
5. Paste it into `backend/.env` as `GEMINI_API_KEY=...`

> The free tier gives you ~10 RPM and 1M tokens/day on Gemini 2.5 Flash. More than enough for the demo. (We deliberately avoid `gemini-2.0-flash` because Google removed its free tier for new projects in 2025.)

---

## 2. Google Maps API key (5 min)

For geocoding ("kallur ward 4" → lat/lng) and the public heatmap.

1. Open <https://console.cloud.google.com/google/maps-apis/credentials>.
2. Pick the same project that AI Studio created in step 1 (it shows up in the picker).
3. Click **+ Create credentials → API key**.
4. Copy the key. Click **Edit API key** to restrict it:
   - **API restrictions → Restrict key**, select:
     - Maps JavaScript API
     - Geocoding API
   - **Application restrictions → HTTP referrers** (for the web key only): add `localhost:3000/*` and your eventual Vercel domain (e.g. `*.vercel.app/*`).
5. Save.
6. Now enable those APIs in this project:
   - <https://console.cloud.google.com/apis/library/maps-backend.googleapis.com> → **Enable**
   - <https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com> → **Enable**
7. Paste the key into:
   - `backend/.env` as `GOOGLE_MAPS_API_KEY=AIza...`
   - `web/.env.local` as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...`

> Free tier gives you $200/month of Maps usage — way more than the demo needs.

---

## 3. Twilio WhatsApp Sandbox (8 min)

For sending and receiving WhatsApp messages.

1. Sign up at <https://www.twilio.com/try-twilio>. Free trial — no credit card needed for the sandbox.
2. After confirming email + phone, you land on the Twilio Console.
3. In the left nav: **Messaging → Try it out → Send a WhatsApp message**.
4. You'll see a sandbox number like `+1 415 523 8886` and a join code like `join unusual-fox`.
5. **From your phone**, send the join code to that number on WhatsApp. You'll get a confirmation reply. You're in the sandbox.
6. Note these from the Twilio Console:
   - **Account SID** (starts with `AC...`)
   - **Auth Token** (click the eye icon to reveal)
7. Paste into `backend/.env`:
   ```
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
   ```
8. **Webhook URL** (we'll fill this in once the backend is on Cloud Run, see [DEPLOY.md](DEPLOY.md)):
   - Twilio Console → **Messaging → Sandbox settings**
   - "When a message comes in" → `https://<your-cloud-run-url>/whatsapp`
   - HTTP POST.

> Anyone you want to test from must first send the `join <code>` text to the sandbox number. This is a Twilio sandbox limitation — fine for the demo + judging. Production needs WhatsApp Business API approval.

> If you bought a Twilio number (e.g. `+19785708054`), it's for SMS only. WhatsApp Sandbox always uses `+14155238886` as the FROM number until your Business API is approved.

---

## Final check

After all three are done, your `backend/.env` should look like:

```dotenv
PORT=8080
NODE_ENV=development
LOG_LEVEL=info
PUBLIC_BASE_URL=http://localhost:8080

GEMINI_API_KEY=AIza...
GOOGLE_MAPS_API_KEY=AIza...

TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=xxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

And `web/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
```

Then run:

```bash
# Terminal 1
cd backend && npm install && npm run dev

# Terminal 2
cd web && npm install && npm run dev
```

Open <http://localhost:3000>. You should see the dashboard alive with 47 demo needs.

Smoke-test from a third terminal:

```bash
curl -s http://localhost:8080/health | jq
# integrations: gemini=true, maps=true, twilio=true should all be true
```

That's the green light to proceed to [DEPLOY.md](DEPLOY.md).
