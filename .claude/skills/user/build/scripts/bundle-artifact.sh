#!/usr/bin/env bash
set -euo pipefail

# bundle-artifact.sh — Bundles a Vite + React project into a single self-contained HTML file
# Usage: bash bundle-artifact.sh [project-dir]
#
# Defaults to current directory if no argument provided.
# Output: <project-dir>/bundle.html

PROJECT_DIR="${1:-.}"
PROJECT_DIR="$(cd "$PROJECT_DIR" && pwd)"

if [ ! -f "$PROJECT_DIR/package.json" ]; then
  echo "ERROR: No package.json found in $PROJECT_DIR"
  exit 1
fi

if [ ! -f "$PROJECT_DIR/vite.config.ts" ] && [ ! -f "$PROJECT_DIR/vite.config.js" ]; then
  echo "ERROR: No vite config found in $PROJECT_DIR — is this a Vite project?"
  exit 1
fi

echo "==> Bundling artifact from: $PROJECT_DIR"

cd "$PROJECT_DIR"

# Step 1: Build with Vite (produces dist/ with HTML + JS + CSS chunks)
echo "    [1/4] Building with Vite..."
npm run build

DIST_DIR="$PROJECT_DIR/dist"
if [ ! -d "$DIST_DIR" ]; then
  echo "ERROR: Vite build did not produce dist/ directory"
  exit 1
fi

# Step 2: Install inlining tool if missing
if ! command -v npx &> /dev/null; then
  echo "ERROR: npx not found"
  exit 1
fi

# Step 3: Inline all assets into single HTML
echo "    [2/4] Installing inline tools..."
npm install -D vite-plugin-singlefile 2>/dev/null || true

# Check if vite-plugin-singlefile is available
if [ -d "$PROJECT_DIR/node_modules/vite-plugin-singlefile" ]; then
  echo "    [3/4] Rebuilding with single-file plugin..."

  # Create a temporary vite config that uses singlefile plugin
  VITE_CONFIG_FILE=""
  if [ -f "$PROJECT_DIR/vite.config.ts" ]; then
    VITE_CONFIG_FILE="$PROJECT_DIR/vite.config.ts"
  else
    VITE_CONFIG_FILE="$PROJECT_DIR/vite.config.js"
  fi

  # Backup original config
  cp "$VITE_CONFIG_FILE" "${VITE_CONFIG_FILE}.bak"

  # Create single-file config
  cat > "$PROJECT_DIR/vite.bundle.config.ts" << 'BUNDLE_VITE_EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import path from 'path'

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist-bundle',
    sourcemap: false,
    cssCodeSplit: false,
  },
})
BUNDLE_VITE_EOF

  npx vite build --config vite.bundle.config.ts

  if [ -f "$PROJECT_DIR/dist-bundle/index.html" ]; then
    cp "$PROJECT_DIR/dist-bundle/index.html" "$PROJECT_DIR/bundle.html"
    rm -rf "$PROJECT_DIR/dist-bundle"
    rm -f "$PROJECT_DIR/vite.bundle.config.ts"
    # Restore original config
    mv "${VITE_CONFIG_FILE}.bak" "$VITE_CONFIG_FILE"
  else
    echo "ERROR: Single-file build did not produce index.html"
    mv "${VITE_CONFIG_FILE}.bak" "$VITE_CONFIG_FILE"
    rm -f "$PROJECT_DIR/vite.bundle.config.ts"
    exit 1
  fi
else
  # Fallback: manual inline using sed + base64
  echo "    [3/4] Inlining assets manually..."

  INDEX_HTML="$DIST_DIR/index.html"
  BUNDLE_HTML="$PROJECT_DIR/bundle.html"
  cp "$INDEX_HTML" "$BUNDLE_HTML"

  # Inline CSS files
  for css_file in "$DIST_DIR"/assets/*.css; do
    if [ -f "$css_file" ]; then
      css_basename=$(basename "$css_file")
      css_content=$(cat "$css_file")
      # Replace link tag with inline style
      python3 -c "
import re, sys
html = open('$BUNDLE_HTML').read()
css = open('$css_file').read()
# Replace the link tag referencing this CSS
pattern = r'<link[^>]*href=[\"'\''][^\"'\'']*/?' + re.escape('$css_basename') + r'[\"'\''][^>]*/?\s*>'
replacement = '<style>' + css + '</style>'
html = re.sub(pattern, replacement, html)
open('$BUNDLE_HTML', 'w').write(html)
" 2>/dev/null || true
    fi
  done

  # Inline JS files
  for js_file in "$DIST_DIR"/assets/*.js; do
    if [ -f "$js_file" ]; then
      js_basename=$(basename "$js_file")
      python3 -c "
import re, sys
html = open('$BUNDLE_HTML').read()
js = open('$js_file').read()
# Replace the script tag referencing this JS
pattern = r'<script[^>]*src=[\"'\''][^\"'\'']*/?' + re.escape('$js_basename') + r'[\"'\''][^>]*>\s*</script>'
replacement = '<script type=\"module\">' + js + '</script>'
html = re.sub(pattern, replacement, html)
open('$BUNDLE_HTML', 'w').write(html)
" 2>/dev/null || true
    fi
  done
fi

echo "    [4/4] Verifying bundle..."

if [ ! -f "$PROJECT_DIR/bundle.html" ]; then
  echo "ERROR: bundle.html was not created"
  exit 1
fi

BUNDLE_SIZE=$(wc -c < "$PROJECT_DIR/bundle.html" | tr -d ' ')
BUNDLE_SIZE_KB=$((BUNDLE_SIZE / 1024))

echo ""
echo "==> Bundle created: $PROJECT_DIR/bundle.html"
echo "    Size: ${BUNDLE_SIZE_KB} KB"
echo "    Open in browser: open $PROJECT_DIR/bundle.html"
