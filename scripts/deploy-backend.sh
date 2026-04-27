#!/usr/bin/env bash
# Deploy SAHAYA backend to Cloud Run.
#
# Required env (export, or `set -a; source backend/.env; set +a` first):
#   FIREBASE_PROJECT_ID
#   GEMINI_API_KEY
#   GOOGLE_MAPS_API_KEY
#   TWILIO_ACCOUNT_SID
#   TWILIO_AUTH_TOKEN
# Optional:
#   REGION (default: asia-south1)
#   SERVICE (default: sahaya-backend)
#   TWILIO_WHATSAPP_FROM (default: whatsapp:+14155238886)
#   FIREBASE_STORAGE_BUCKET
set -euo pipefail

: "${FIREBASE_PROJECT_ID:?FIREBASE_PROJECT_ID required}"
: "${GEMINI_API_KEY:?GEMINI_API_KEY required}"
: "${GOOGLE_MAPS_API_KEY:?GOOGLE_MAPS_API_KEY required}"
: "${TWILIO_ACCOUNT_SID:?TWILIO_ACCOUNT_SID required}"
: "${TWILIO_AUTH_TOKEN:?TWILIO_AUTH_TOKEN required}"

REGION="${REGION:-asia-south1}"
SERVICE="${SERVICE:-sahaya-backend}"
TWILIO_WHATSAPP_FROM="${TWILIO_WHATSAPP_FROM:-whatsapp:+14155238886}"
IMAGE="gcr.io/${FIREBASE_PROJECT_ID}/${SERVICE}:latest"

cd "$(dirname "$0")/.."

ENV_VARS="NODE_ENV=production"
ENV_VARS+=",FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}"
ENV_VARS+=",GEMINI_API_KEY=${GEMINI_API_KEY}"
ENV_VARS+=",GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY}"
ENV_VARS+=",TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}"
ENV_VARS+=",TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}"
ENV_VARS+=",TWILIO_WHATSAPP_FROM=${TWILIO_WHATSAPP_FROM}"
if [[ -n "${FIREBASE_STORAGE_BUCKET:-}" ]]; then
  ENV_VARS+=",FIREBASE_STORAGE_BUCKET=${FIREBASE_STORAGE_BUCKET}"
fi

echo "▶ [1/3] Building image via Cloud Build…"
gcloud builds submit ./backend \
  --tag "${IMAGE}" \
  --project "${FIREBASE_PROJECT_ID}"

echo "▶ [2/3] Deploying Cloud Run service…"
gcloud run deploy "${SERVICE}" \
  --image "${IMAGE}" \
  --region "${REGION}" \
  --project "${FIREBASE_PROJECT_ID}" \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --concurrency 50 \
  --min-instances 0 \
  --max-instances 5 \
  --timeout 60 \
  --port 8080 \
  --set-env-vars "${ENV_VARS}"

URL=$(gcloud run services describe "${SERVICE}" \
  --region "${REGION}" \
  --project "${FIREBASE_PROJECT_ID}" \
  --format "value(status.url)")

echo ""
echo "✅ Backend deployed."
echo "   URL: ${URL}"
echo "   Twilio webhook target: ${URL}/whatsapp"
echo ""
echo "▶ [3/3] Smoke test…"
curl -fsS "${URL}/health" | python3 -m json.tool || echo "(health check failed — check IAM bindings)"
