#!/usr/bin/env bash
# Push portfolio API env vars to Vercel (run locally after: npm i -g vercel && vercel login)
# Usage: export the vars below, then: bash scripts/push-vercel-env.sh

set -euo pipefail

ENV_VARS=(
  ZERION_API_KEY
  ALCHEMY_API_KEY
  GOPLUS_API_KEY
  GOPLUS_API_SECRET
  DUNE_API_KEY
  GOLDRUSH_API_KEY
  CIRCLE_API_KEY
  NEXT_PUBLIC_CIRCLE_KIT_KEY
  NEXT_PUBLIC_REOWN_PROJECT_ID
  NEXT_PUBLIC_NETWORK
  NEXT_PUBLIC_APP_URL
)

for name in "${ENV_VARS[@]}"; do
  value="${!name:-}"
  if [[ -z "$value" ]]; then
    echo "Skip $name (not set in shell)"
    continue
  fi
  echo "$value" | vercel env add "$name" production preview development --force
  echo "Set $name"
done

echo "Done. Redeploy: vercel --prod"
