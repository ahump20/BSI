#!/usr/bin/env bash
# build-safe.sh — Builds Next.js outside iCloud Drive to prevent file eviction.
#
# iCloud's storage optimization can evict .next/ files mid-build when generating
# 1500+ static pages. This script copies the project to /var/tmp, builds there,
# then copies the output back.

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

# Sync source files — use -L to follow iCloud deferred file references
rsync -aL \
  --exclude='.next' \
  --exclude='node_modules' \
  --exclude='out' \
  --exclude='.git' \
  "$PROJECT_DIR/" "$BUILD_DIR/"

# Hard-link node_modules (Turbopack rejects symlinks)
# On re-runs, stale hard-linked node_modules may resist rm -rf — nuke it first
perl -e 'use File::Path qw(remove_tree); remove_tree("'"$BUILD_DIR/node_modules"'")' 2>/dev/null || true
rm -rf "$BUILD_DIR/node_modules" 2>/dev/null || true
cp -al "$PROJECT_DIR/node_modules" "$BUILD_DIR/node_modules"
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
