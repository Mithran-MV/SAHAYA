#!/usr/bin/env bash
# Deploy SAHAYA backend to Cloud Run.
#
# Required env (export, or `set -a; source backend/.env; set +a` first):
#   GEMINI_API_KEY
#   GOOGLE_MAPS_API_KEY
#   TWILIO_ACCOUNT_SID
#   TWILIO_AUTH_TOKEN
# Plus one of:
#   PROJECT_ID  (preferred)
#   GOOGLE_CLOUD_PROJECT
# Optional:
#   REGION  (default: asia-south1)
#   SERVICE  (default: sahaya-backend)
#   TWILIO_WHATSAPP_FROM  (default: whatsapp:+14155238886)
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-${GOOGLE_CLOUD_PROJECT:-}}"
: "${PROJECT_ID:?PROJECT_ID required (your GCP project ID)}"
: "${GEMINI_API_KEY:?GEMINI_API_KEY required}"
: "${GOOGLE_MAPS_API_KEY:?GOOGLE_MAPS_API_KEY required}"
: "${TWILIO_ACCOUNT_SID:?TWILIO_ACCOUNT_SID required}"
: "${TWILIO_AUTH_TOKEN:?TWILIO_AUTH_TOKEN required}"

REGION="${REGION:-asia-south1}"
SERVICE="${SERVICE:-sahaya-backend}"
TWILIO_WHATSAPP_FROM="${TWILIO_WHATSAPP_FROM:-whatsapp:+14155238886}"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE}:latest"

cd "$(dirname "$0")/.."

ENV_VARS="NODE_ENV=production"
ENV_VARS+=",GEMINI_API_KEY=${GEMINI_API_KEY}"
ENV_VARS+=",GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY}"
ENV_VARS+=",TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}"
ENV_VARS+=",TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}"
ENV_VARS+=",TWILIO_WHATSAPP_FROM=${TWILIO_WHATSAPP_FROM}"

echo "▶ [1/3] Building image via Cloud Build…"
gcloud builds submit ./backend \
  --tag "${IMAGE}" \
  --project "${PROJECT_ID}"

echo "▶ [2/3] Deploying Cloud Run service…"
gcloud run deploy "${SERVICE}" \
  --image "${IMAGE}" \
  --region "${REGION}" \
  --project "${PROJECT_ID}" \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --concurrency 50 \
  --min-instances 1 \
  --max-instances 5 \
  --timeout 60 \
  --port 8080 \
  --set-env-vars "${ENV_VARS}"

URL=$(gcloud run services describe "${SERVICE}" \
  --region "${REGION}" \
  --project "${PROJECT_ID}" \
  --format "value(status.url)")

# Re-deploy with PUBLIC_BASE_URL pointing at the just-issued Cloud Run URL so
# /media/<id> proxy URLs returned to the dashboard are absolute.
echo "▶ [3/3] Updating PUBLIC_BASE_URL=${URL} on the deployed service…"
gcloud run services update "${SERVICE}" \
  --region "${REGION}" \
  --project "${PROJECT_ID}" \
  --update-env-vars "PUBLIC_BASE_URL=${URL}" >/dev/null

echo ""
echo "✅ Backend deployed."
echo "   URL: ${URL}"
echo "   Twilio webhook target: ${URL}/whatsapp"
echo "   Set NEXT_PUBLIC_API_URL=${URL} on Vercel before deploying the web."
echo ""
echo "▶ Smoke test…"
curl -fsS "${URL}/health" | python3 -m json.tool || echo "(health check failed — re-run if first request bootstraps)"
