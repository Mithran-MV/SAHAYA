#!/usr/bin/env bash
# Build the Next.js dashboard and deploy to Vercel.
#
# Required:
#   - vercel CLI installed (`npm i -g vercel`)
#   - You ran `vercel login` and `cd web && vercel link` once
#   - Vercel env vars set:
#       NEXT_PUBLIC_API_URL=<your-cloud-run-url>
#       NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<your-maps-web-key>
#     Set them with: cd web && vercel env add <NAME> production
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${REPO_ROOT}/web"

if ! command -v vercel >/dev/null 2>&1; then
  echo "❌ vercel CLI not installed. Run: npm install -g vercel"
  exit 1
fi

if [[ ! -d .vercel ]]; then
  echo "❌ This web directory isn't linked to a Vercel project yet."
  echo "   Run once: cd web && vercel link"
  exit 1
fi

echo "▶ Deploying to Vercel (production)…"
vercel deploy --prod --yes

echo ""
echo "✅ Dashboard deployed."
echo "   Visit your Vercel project at https://vercel.com/dashboard for the URL."
