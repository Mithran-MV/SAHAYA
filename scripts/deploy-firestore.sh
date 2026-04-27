#!/usr/bin/env bash
# Deploy Firestore security rules + indexes.
set -euo pipefail

: "${FIREBASE_PROJECT_ID:?FIREBASE_PROJECT_ID required}"

cd "$(dirname "$0")/.."

echo "▶ Deploying Firestore rules + indexes to ${FIREBASE_PROJECT_ID}…"
firebase deploy \
  --only firestore:rules,firestore:indexes \
  --project "${FIREBASE_PROJECT_ID}"

echo "✅ Firestore rules + indexes deployed."
