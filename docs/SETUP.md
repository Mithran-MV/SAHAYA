# SAHAYA — Setup Guide

You need 4 things. All free tier. Total time: ~25 minutes.

> Tip: Open all 4 tabs first, then go through them. You can do them in any order.

---

## 1. Gemini API key (2 min)

For voice transcription, multilingual extraction, and Vision photo verification.

1. Open <https://aistudio.google.com/apikey>
2. Sign in with the Google account you'll use for this project.
3. Click **Create API key**. Pick **Create API key in new project** (or pick an existing GCP project — same result).
4. Copy the key (starts with `AIza...`).
5. Paste it into `backend/.env` as `GEMINI_API_KEY=...`

> The free tier of Gemini 2.0 Flash gives you ~15 RPM and 1M tokens/day. More than enough for the demo.

---

## 2. Firebase project (8 min)

For Firestore (database), Auth, and Hosting.

### 2a. Create the project

1. Open <https://console.firebase.google.com/>.
2. Click **Add project**.
3. Project name: `sahaya-prod` (or any name; the **Project ID** that gets generated is what matters — copy it).
4. Skip Google Analytics (not needed for hackathon, you can add later).
5. Wait ~30 seconds for the project to provision.

### 2b. Enable Firestore

1. In the left sidebar: **Build → Firestore Database → Create database**.
2. Pick **Production mode** (we'll add real security rules in Phase 3).
3. Pick the location: **asia-south1 (Mumbai)** — closest to Coimbatore.
4. Click **Enable**.

### 2c. Enable Authentication

1. **Build → Authentication → Get started**.
2. **Sign-in method** tab → enable:
   - **Google** (used for dashboard admin login)
   - **Phone** (optional, for future ASHA worker app login)

### 2d. Enable Hosting

1. **Build → Hosting → Get started**.
2. Just click through — we'll deploy in Phase 8.

### 2e. Enable Storage

For volunteer-submitted resolution photos.

1. **Build → Storage → Get started**.
2. Pick **Production mode**.
3. Use the same location as Firestore (**asia-south1 / Mumbai**).
4. Note the bucket name shown at the top — usually `<project-id>.firebasestorage.app`.
5. If your bucket ends in `.appspot.com` (older projects), set `FIREBASE_STORAGE_BUCKET=<project-id>.appspot.com` in `backend/.env`. Otherwise leave it blank — the backend resolves it automatically.

### 2f. Download service account JSON

This is what the backend uses to authenticate to Firestore + Storage.

1. Click the gear icon (⚙) next to **Project Overview** → **Project settings**.
2. **Service accounts** tab → **Generate new private key** → confirm.
3. A JSON file downloads. Move it to:
   ```
   /Users/mithranmv/Desktop/gdg-s/SAHAYA/backend/service-account.json
   ```
4. In `backend/.env`, set:
   ```
   FIREBASE_PROJECT_ID=<your-project-id-from-step-2a>
   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
   ```

> The service account JSON is **already gitignored**. Do not commit it.

---

## 3. Google Maps API key (5 min)

For geocoding ("kallur ward 4" → lat/lng) and the public heatmap.

1. Open <https://console.cloud.google.com/google/maps-apis/credentials>.
2. Pick the same project Firebase created in step 2 (it shows up in the picker).
3. Click **+ Create credentials → API key**.
4. Copy the key. Click **Edit API key** to restrict it:
   - **API restrictions → Restrict key**, select:
     - Maps JavaScript API
     - Geocoding API
     - Places API
5. Save.
6. Now enable those APIs in this project:
   - <https://console.cloud.google.com/apis/library/maps-backend.googleapis.com> → **Enable**
   - <https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com> → **Enable**
   - <https://console.cloud.google.com/apis/library/places-backend.googleapis.com> → **Enable**
7. Paste the key into `backend/.env`:
   ```
   GOOGLE_MAPS_API_KEY=AIza...
   ```

> Free tier gives you $200/month of Maps usage — way more than the demo needs.

---

## 4. Twilio WhatsApp Sandbox (10 min)

For sending and receiving WhatsApp messages.

1. Sign up at <https://www.twilio.com/try-twilio>. Free trial — no credit card needed for the sandbox.
2. After confirming email + phone, you land on the Twilio Console.
3. In the left nav: **Messaging → Try it out → Send a WhatsApp message**.
4. You'll see a sandbox number like `+1 415 523 8886` and a join code like `join unusual-fox`.
5. **From your phone**, send the join code to that number on WhatsApp. You'll get a confirmation reply. You're in the sandbox.
6. Note these from the Twilio Console:
   - **Account SID** (starts with `AC...`)
   - **Auth Token** (click the eye icon to reveal)
   - **Sandbox WhatsApp number** (the `+1 415 ...`)
7. Paste into `backend/.env`:
   ```
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
   ```
8. **Webhook URL** (we'll fill this in in Phase 2 once the backend is running on ngrok or Cloud Run):
   - In Twilio Console → **Messaging → Sandbox settings**
   - Set "When a message comes in" to: `https://<your-public-url>/whatsapp`
   - HTTP POST.

> Anyone you want to test from must first send the `join <code>` text to the sandbox number. This is a Twilio sandbox limitation — fine for demo + judging.

---

## Final check

After all four are done, your `backend/.env` should look like:

```dotenv
PORT=8080
NODE_ENV=development
LOG_LEVEL=info

GEMINI_API_KEY=AIza...

FIREBASE_PROJECT_ID=sahaya-prod-xxxxx
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json

GOOGLE_MAPS_API_KEY=AIza...

TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=xxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

And `backend/service-account.json` should exist on disk.

Then run:

```bash
cd backend
npm run dev
# in another terminal:
npm run smoke
```

You should see all four integrations come back `true` in the `/health` response. That's the green light to proceed to Phase 2.
