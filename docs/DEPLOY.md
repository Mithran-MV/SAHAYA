# SAHAYA — Deployment Runbook

Backend → Cloud Run. Web → Vercel. Estimated time: 15 minutes.

## Prerequisites

```bash
# install gcloud (macOS)
brew install --cask google-cloud-sdk

# install Vercel CLI
npm install -g vercel

# verify
gcloud --version
vercel --version
```

You also need:
- A Google Cloud project with **billing enabled** (free tier covers everything we use)
- All three API keys from [SETUP.md](./SETUP.md) already in `backend/.env`

---

## Step 1 — Authenticate

```bash
gcloud auth login
gcloud auth application-default login
vercel login
```

```bash
export PROJECT_ID="<your-gcp-project-id>"   # find this in GCP Console
gcloud config set project "$PROJECT_ID"
```

---

## Step 2 — Enable required APIs

Run once per project:

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  geocoding-backend.googleapis.com \
  maps-backend.googleapis.com \
  --project "$PROJECT_ID"
```

---

## Step 3 — Deploy backend to Cloud Run

```bash
set -a; source backend/.env; set +a
export PROJECT_ID         # set if you haven't already
./scripts/deploy-backend.sh
```

The script prints the Cloud Run URL at the end. **Copy it** — you'll need it for Twilio + the dashboard.

Example URL: `https://sahaya-backend-xxxxxx-el.a.run.app`

> The deploy script sets `--min-instances=1` to keep the in-memory store warm between requests. This costs ~$3/month at idle but means real WhatsApp data persists during the demo session.

---

## Step 4 — Configure the Twilio webhook

1. Twilio Console → Messaging → Try it out → WhatsApp Sandbox.
2. **Sandbox settings**:
   - **When a message comes in**: `https://<cloud-run-url>/whatsapp`
   - **HTTP method**: `POST`
3. Save.

---

## Step 5 — Deploy the web dashboard to Vercel

```bash
cd web
# First time only:
vercel link               # creates .vercel/project.json, scoped to your account
# Set env vars on Vercel:
vercel env add NEXT_PUBLIC_API_URL production
# (paste the Cloud Run URL from step 3)
vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY production
# (paste your Maps web key)
vercel deploy --prod
```

Or just push to GitHub with the Vercel GitHub integration enabled — Vercel auto-deploys.

You'll get a URL like `https://sahaya-mithran-mv.vercel.app`. **This is the URL you submit to Hack2Skill.**

---

## Step 6 — Re-deploy with Maps key bound to your Vercel domain

After step 5, go back to [GCP Console → Credentials](https://console.cloud.google.com/google/maps-apis/credentials), open your Maps web key, and add the Vercel domain (e.g. `*.vercel.app/*` or your custom domain) to the HTTP referrer allowlist. Otherwise the heatmap will silently fail in production.

---

## All-in-one deploy script

```bash
./scripts/deploy-all.sh
```

Runs steps 3 and 5 in order. Assumes you've authenticated already and have `vercel link` done.

---

## Smoke tests after deploy

```bash
# 1. Backend health
curl -s https://<cloud-run-url>/health | jq
# Should return: {"status":"ok",...,"integrations":{"gemini":true,"maps":true,"twilio":true},
#                 "store":{"counts":{"needs":48,...}}}

# 2. API
curl -s "https://<cloud-run-url>/api/stats" | jq

# 3. Dashboard
open https://<your-vercel-url>

# 4. Send a WhatsApp voice note from your sandbox-joined phone to +1 415 523 8886.
# You should see an ack message within ~3 seconds and a new card on the dashboard within 5s.
```

---

## Rollback

Cloud Run keeps revisions — to roll back the backend:

```bash
gcloud run services update-traffic sahaya-backend \
  --to-revisions=<previous-revision-name>=100 \
  --region=asia-south1
```

Vercel keeps deployments — roll back from the Vercel dashboard → Deployments → Promote to Production on a prior deploy.

---

## Troubleshooting

### Cloud Run service starts but `/health` shows `gemini: false`
Env var `GEMINI_API_KEY` wasn't passed to the service. Re-run `./scripts/deploy-backend.sh`.

### Cloud Run gets 429 from Gemini ("Quota exceeded ... limit: 0, model: gemini-2.0-flash")
You're using a project where Gemini 2.0 Flash has been removed from the free tier. SAHAYA already pins to `gemini-2.5-flash` (which still has free tier). If you see this error, the model in `backend/src/pipeline/extractNeeds.ts` was reverted somehow — check for `GEMINI_MODEL = 'gemini-2.5-flash'`.

### Twilio webhook returns 502
Tail Cloud Run logs:
```bash
gcloud run services logs tail sahaya-backend --region asia-south1
```
Most common cause: missing `GEMINI_API_KEY` or `TWILIO_AUTH_TOKEN` env var. Verify in Cloud Run console → Edit & deploy → Variables.

### Dashboard shows "NEXT_PUBLIC_API_URL is not configured"
You set the env var on Vercel but forgot to redeploy. Run `vercel deploy --prod` again.

### Maps doesn't render in production but works locally
The Maps key isn't authorized for your Vercel domain. Step 6.

### Demo data disappears after a while
Cloud Run scaled to zero. Add `--min-instances=1` (already in the deploy script). If you deployed without it, redeploy.
