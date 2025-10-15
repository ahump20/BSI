#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: ./scripts/slo-smoke.sh [--skip-404] [--skip-screenshots] <base_url>

Runs the Phase 0/Phase 1 smoke checks:
  1. Route/spec integrity via scripts/route-map.ts
  2. Redirect consistency via scripts/check-301-consistency.sh
  3. Optional 404 sweep against the provided base URL
  4. Optional screenshot coverage report

Flags:
  --skip-404          Skip live 404 verification (no base URL required if skipped)
  --skip-screenshots  Skip screenshot coverage report

Examples:
  ./scripts/slo-smoke.sh https://staging.blazesportsintel.com
  ./scripts/slo-smoke.sh --skip-404 --skip-screenshots
USAGE
}

BASE_URL=""
RUN_404=true
RUN_SCREENSHOTS=true

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-404)
      RUN_404=false
      ;;
    --skip-screenshots)
      RUN_SCREENSHOTS=false
      ;;
    http://*|https://*)
      BASE_URL="$1"
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
  shift
done

if [[ "$RUN_404" == true && -z "$BASE_URL" ]]; then
  echo "Base URL is required when 404 checks are enabled." >&2
  usage >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v npx >/dev/null 2>&1; then
  echo "npx is required to run the smoke checks." >&2
  exit 1
fi

echo "🚦 Phase 0/1 Smoke Check"

echo "➡️  Step 1: Validating route map + specs"
if ! output="$(npx tsx --tsconfig tsconfig.json scripts/route-map.ts --check=all --format=paths 2>&1)"; then
  echo "$output"
  exit 1
fi

echo "➡️  Step 2: Verifying 301 redirect map"
./scripts/check-301-consistency.sh

if [[ "$RUN_404" == true ]]; then
  echo "➡️  Step 3: Sweeping for 404s"
  ./scripts/check-404s.sh "$BASE_URL" --static-only
else
  echo "➡️  Step 3: Skipped 404 sweep"
fi

if [[ "$RUN_SCREENSHOTS" == true ]]; then
  echo "➡️  Step 4: Screenshot coverage summary"
  npx tsx --tsconfig tsconfig.json scripts/screenshots.ts --missing-only
else
  echo "➡️  Step 4: Skipped screenshot coverage"
fi

echo "🏁 Smoke checks complete"
