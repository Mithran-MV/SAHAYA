#!/usr/bin/env bash
# Deploy everything: Firestore rules -> backend -> web.
# Run after first-time setup (see docs/DEPLOY.md).
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

: "${FIREBASE_PROJECT_ID:?FIREBASE_PROJECT_ID required (set in backend/.env or export it)}"

echo "════════════════════════════════════════"
echo "  SAHAYA — full deploy"
echo "  Project: ${FIREBASE_PROJECT_ID}"
echo "════════════════════════════════════════"

./scripts/deploy-firestore.sh
echo ""
./scripts/deploy-backend.sh
echo ""
./scripts/deploy-web.sh

echo ""
echo "════════════════════════════════════════"
echo "  ✅ Deploy complete."
echo "════════════════════════════════════════"
