#!/usr/bin/env bash
# Deploy everything: backend (Cloud Run) -> web (Vercel).
# See docs/DEPLOY.md for first-time setup.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${REPO_ROOT}"

if [[ -f backend/.env ]]; then
  echo "▶ Loading backend/.env…"
  set -a
  # shellcheck disable=SC1091
  source backend/.env
  set +a
fi

PROJECT_ID="${PROJECT_ID:-${GOOGLE_CLOUD_PROJECT:-}}"
: "${PROJECT_ID:?PROJECT_ID required (export it or set GOOGLE_CLOUD_PROJECT)}"

echo "════════════════════════════════════════"
echo "  SAHAYA — full deploy"
echo "  Project:   ${PROJECT_ID}"
echo "════════════════════════════════════════"

./scripts/deploy-backend.sh
echo ""
./scripts/deploy-web.sh

echo ""
echo "════════════════════════════════════════"
echo "  ✅ Deploy complete."
echo "  Don't forget: configure Twilio webhook → <cloud-run-url>/whatsapp"
echo "════════════════════════════════════════"
