#!/usr/bin/env bash
# Build the Next.js dashboard and deploy to Firebase Hosting.
set -euo pipefail

: "${FIREBASE_PROJECT_ID:?FIREBASE_PROJECT_ID required}"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${REPO_ROOT}/web"

if [[ ! -f .env.local ]]; then
  echo "❌ web/.env.local not found. Copy from web/.env.local.example first."
  exit 1
fi

echo "▶ [1/2] Building Next.js static export…"
npm run build

cd "${REPO_ROOT}"
echo "▶ [2/2] Deploying to Firebase Hosting…"
firebase deploy \
  --only hosting \
  --project "${FIREBASE_PROJECT_ID}"

echo "✅ Dashboard deployed."
firebase hosting:channel:list --project "${FIREBASE_PROJECT_ID}" 2>/dev/null | head -5 || true
