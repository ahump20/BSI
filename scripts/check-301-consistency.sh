#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v npx >/dev/null 2>&1; then
  echo "npx is required to run this check. Install Node.js tooling and try again." >&2
  exit 1
fi

echo "🔍 Validating 301 redirect map against product/ux/IA.md"

if ! output="$(npx tsx --tsconfig tsconfig.json scripts/route-map.ts --check=redirects --format=paths)"; then
  echo "$output"
  exit 1
fi

echo "✅ Redirect map is consistent with IA.md"
