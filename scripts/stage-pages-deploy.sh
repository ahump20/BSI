#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="${BSI_OUT_DIR:-$PROJECT_DIR/out}"
STAGE_DIR="${BSI_DEPLOY_STAGE_DIR:-/var/tmp/bsi-deploy-out}"

if [ ! -d "$OUT_DIR" ]; then
  echo "✘ Build output not found at $OUT_DIR"
  echo "  Run: npm run build"
  exit 1
fi

TOTAL_FILES=$(find "$OUT_DIR" -type f | wc -l | tr -d ' ')
DS_STORE_FILES=$(find "$OUT_DIR" -name '.DS_Store' | wc -l | tr -d ' ')

echo "→ Staging Pages deploy from $OUT_DIR to $STAGE_DIR"
echo "  source files: $TOTAL_FILES"
echo "  stripping: $DS_STORE_FILES .DS_Store"

rm -rf "$STAGE_DIR"
mkdir -p "$STAGE_DIR"

# NOTE: .txt files are Next.js RSC (React Server Component) payloads required
# for client-side navigation and Suspense hydration. They MUST be deployed.
# Stripping them causes blank pages on routes that rely on Suspense boundaries.
rsync -a --delete \
  --exclude='.DS_Store' \
  "$OUT_DIR/" "$STAGE_DIR/"

STAGED_FILES=$(find "$STAGE_DIR" -type f | wc -l | tr -d ' ')

for required_file in _headers _redirects _routes.json; do
  if [ -e "$OUT_DIR/$required_file" ] && [ ! -e "$STAGE_DIR/$required_file" ]; then
    echo "✘ Missing required deploy file in staged output: $required_file"
    exit 1
  fi
done

if [ -d "$OUT_DIR/functions" ] && [ ! -d "$STAGE_DIR/functions" ]; then
  echo "✘ Missing functions directory in staged deploy output"
  exit 1
fi

echo "✓ Pages deploy staging ready at $STAGE_DIR"
echo "  staged files: $STAGED_FILES"
