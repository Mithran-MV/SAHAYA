# SAHAYA — Deployment Runbook

End-to-end deployment of SAHAYA to Google Cloud + Firebase. Estimated time: 25 minutes.

## Prerequisites

```bash
# install gcloud (macOS)
brew install --cask google-cloud-sdk

# install Firebase CLI
npm install -g firebase-tools

# verify
gcloud --version
firebase --version
```

You also need:
- A Google Cloud project with **billing enabled** (free tier covers everything we use)
- The same project linked to a Firebase project — these are the same GCP project under the hood
- All four API keys from [docs/SETUP.md](./SETUP.md) already in `backend/.env`

---

## Step 1 — Authenticate

```bash
gcloud auth login
gcloud auth application-default login
firebase login
```

```bash
export FIREBASE_PROJECT_ID="your-project-id"
gcloud config set project "$FIREBASE_PROJECT_ID"
firebase use "$FIREBASE_PROJECT_ID"
```

---

## Step 2 — Enable required APIs

Run once per project:

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  firestore.googleapis.com \
  firebasestorage.googleapis.com \
  geocoding-backend.googleapis.com \
  maps-backend.googleapis.com \
  places-backend.googleapis.com \
  --project "$FIREBASE_PROJECT_ID"
```

---

## Step 3 — Grant the Cloud Run service account access to Firestore + Storage

Cloud Run uses the Compute Engine default service account by default.

```bash
PROJECT_NUMBER=$(gcloud projects describe "$FIREBASE_PROJECT_ID" --format='value(projectNumber)')
SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud projects add-iam-policy-binding "$FIREBASE_PROJECT_ID" \
  --member="serviceAccount:${SA}" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding "$FIREBASE_PROJECT_ID" \
  --member="serviceAccount:${SA}" \
  --role="roles/storage.objectAdmin"
```

---

## Step 4 — Deploy Firestore rules + indexes

```bash
./scripts/deploy-firestore.sh
```

Or manually:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

---

## Step 5 — Deploy backend to Cloud Run

Make sure the env vars are exported in your shell (they come from `backend/.env`):

```bash
set -a; source backend/.env; set +a
./scripts/deploy-backend.sh
```

The script prints the Cloud Run URL at the end. **Copy it** — you'll need it for Twilio.

Example URL: `https://sahaya-backend-xxxxxx-el.a.run.app`

---

## Step 6 — Configure the Twilio webhook

1. Go to <https://console.twilio.com/> → Messaging → Try it out → WhatsApp Sandbox.
2. Under **Sandbox settings**, set:
   - **When a message comes in**: `https://<cloud-run-url>/whatsapp`
   - **HTTP method**: `POST`
3. Save.

---

## Step 7 — Seed the demo dataset

```bash
cd backend
npm run seed:wipe
```

This populates 47 needs, 10 volunteers, 5 ASHA workers, and 31 verified resolutions across 5 villages. Use this **before** recording the video so the dashboard looks alive.

---

## Step 8 — Deploy the web dashboard

Make sure `web/.env.local` is filled in (Firebase web SDK config + Maps key).

```bash
./scripts/deploy-web.sh
```

The script prints the Firebase Hosting URL — usually `https://<project-id>.web.app`. **This is the URL you submit to Hack2Skill.**

---

## All-in-one (after first-time setup is done)

```bash
./scripts/deploy-all.sh
```

Runs steps 4, 5, and 8 in order.

---

## Smoke tests after deploy

```bash
# 1. Backend health
curl -s https://<cloud-run-url>/health | jq

# Should return: {"status":"ok",...,"integrations":{"gemini":true,"firebase":true,...}}

# 2. Dashboard
open https://<project-id>.web.app

# 3. Send a WhatsApp voice note from your sandbox-joined phone to the Twilio number.
# You should see an ack message within ~3 seconds and a new card on the dashboard.
```

---

## Rollback

Cloud Run keeps revisions — to roll back:

```bash
gcloud run services update-traffic sahaya-backend \
  --to-revisions=<previous-revision-name>=100 \
  --region=asia-south1
```

Firebase Hosting also keeps versions — roll back from the Firebase console → Hosting → Release history.

---

## Troubleshooting

### "Permission denied on resource project"
Re-run step 1, then step 3.

### Cloud Build fails
Make sure `cloudbuild.googleapis.com` is enabled (step 2) and the user running deploy has the `Cloud Build Editor` role.

### Cloud Run service starts but `/health` shows `firebase: false`
The Cloud Run service account is missing Firestore role. Re-run step 3.

### Twilio webhook returns 502
Check Cloud Run logs:
```bash
gcloud run services logs tail sahaya-backend --region asia-south1
```
Most common cause: missing env var. Verify in Cloud Run console → Edit & deploy → Variables.
