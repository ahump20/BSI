#!/usr/bin/env bash
# build-safe.sh — Builds Next.js outside iCloud Drive to prevent file eviction.
#
# iCloud's storage optimization can evict .next/ files mid-build when generating
# 1500+ static pages. This script copies the project to /var/tmp, builds there,
# then copies the output back.
#
# Because the repo root is ~/ (home directory), we use an include-list approach
# to only sync BSI source directories. This keeps the rsync under 30 seconds
# instead of 10+ minutes copying screenshots, game repos, etc.

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="/var/tmp/bsi-build-staging"
OUT_DIR="$PROJECT_DIR/out"

echo "→ Preparing build staging at $BUILD_DIR"
# Perl remove_tree handles hard-linked node_modules that rm -rf can't delete
# (iCloud + cp -al creates cross-device hard links that confuse rm on macOS)
perl -e 'use File::Path qw(remove_tree); remove_tree("'"$BUILD_DIR"'")' 2>/dev/null || true
rm -rf "$BUILD_DIR" 2>/dev/null || true
mkdir -p "$BUILD_DIR"

# Clear stale .next from prior builds (prevents Turbopack invariant errors)
rm -rf "$BUILD_DIR/.next" 2>/dev/null || true

# Sync only BSI source directories + root config files.
# Uses --include/--exclude filters: include what we need, exclude everything else.
# -L follows iCloud deferred file references.
rsync -aL \
  --include='/app/***' \
  --include='/components/***' \
  --include='/lib/***' \
  --include='/workers/***' \
  --include='/functions/***' \
  --include='/scripts/***' \
  --include='/tests/***' \
  --include='/games/***' \
  --include='/docs/***' \
  --include='/public/***' \
  --include='/external/***' \
  --include='/migrations/***' \
  --include='/styles/***' \
  --include='package.json' \
  --include='package-lock.json' \
  --include='tsconfig.json' \
  --include='tsconfig.*.json' \
  --include='next.config.*' \
  --include='next-env.d.ts' \
  --include='tailwind.config.*' \
  --include='postcss.config.*' \
  --include='wrangler.toml' \
  --include='vitest.config.*' \
  --include='playwright.config.*' \
  --include='.gitignore' \
  --include='_headers' \
  --include='_redirects' \
  --include='_routes.json' \
  --exclude='*' \
  "$PROJECT_DIR/" "$BUILD_DIR/"

# Link node_modules — hard-link preferred, fall back to rsync (handles iCloud eviction)
# On re-runs, stale hard-linked node_modules may resist rm -rf — nuke it first
perl -e 'use File::Path qw(remove_tree); remove_tree("'"$BUILD_DIR/node_modules"'")' 2>/dev/null || true
rm -rf "$BUILD_DIR/node_modules" 2>/dev/null || true
if ! cp -al "$PROJECT_DIR/node_modules" "$BUILD_DIR/node_modules" 2>/dev/null; then
  echo "→ Hard-link failed, using rsync for node_modules"
  rsync -aL "$PROJECT_DIR/node_modules/" "$BUILD_DIR/node_modules/"
fi
# Remove .ignored dir if Turbopack left one — causes build failures on reuse
rm -rf "$BUILD_DIR/node_modules/.ignored" 2>/dev/null || true

echo "→ Building from $BUILD_DIR"
cd "$BUILD_DIR"
./node_modules/.bin/next build

# Post-build: copy functions into output, generate sitemap
rm -rf "$BUILD_DIR/out/functions"
cp -R "$BUILD_DIR/functions" "$BUILD_DIR/out/functions"
node "$BUILD_DIR/scripts/generate-sitemap.mjs" 2>/dev/null || true

# Copy output back to project
echo "→ Copying build output to $OUT_DIR"
rm -rf "$OUT_DIR"
cp -R "$BUILD_DIR/out" "$OUT_DIR"

echo "✓ Build complete — output at $OUT_DIR"
