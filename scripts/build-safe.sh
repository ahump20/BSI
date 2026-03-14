#!/usr/bin/env bash
# build-safe.sh — Builds Next.js with iCloud-safe precautions.
#
# Previous approach: rsync everything to /var/tmp/bsi-build-staging.
# That fails because: (1) cp -al hard-links corrupt across macOS APFS volumes,
# (2) Turbopack rejects symlinked node_modules pointing outside the filesystem root,
# (3) rsync -L follows iCloud placeholders that get evicted mid-copy.
#
# Current approach: build in-place with a clean .next directory. The build completes
# in ~36 seconds — fast enough that iCloud doesn't evict .next/ files mid-build.
# If iCloud eviction does occur, retry once (second build reuses Turbopack cache).

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="$PROJECT_DIR/out"

# Clean stale .next to prevent Turbopack invariant errors
echo "→ Cleaning .next build cache"
rm -rf "$PROJECT_DIR/.next"

echo "→ Building from $PROJECT_DIR"
cd "$PROJECT_DIR"

# Build — retry once if iCloud evicts files mid-build
if ! npx next build 2>&1; then
  echo "→ First build attempt failed, retrying..."
  rm -rf "$PROJECT_DIR/.next"
  npx next build
fi

# Post-build: generate sitemap + ensure Pages control files land at out root
node "$PROJECT_DIR/scripts/generate-sitemap.mjs" 2>/dev/null || true
for cf_file in _headers _redirects _routes.json; do
  if [ -f "$PROJECT_DIR/public/$cf_file" ]; then
    cp "$PROJECT_DIR/public/$cf_file" "$OUT_DIR/$cf_file"
  fi
done

echo "✓ Build complete — output at $OUT_DIR"
