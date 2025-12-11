#!/bin/bash
# BSI Tools Deployment Script
# Builds React tools and uploads to R2, then deploys worker

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BSI_ROOT="$(dirname "$SCRIPT_DIR")"
TOOLS_DIR="$BSI_ROOT/src/tools"
DIST_DIR="$BSI_ROOT/dist/tools"
R2_BUCKET="blazesports-assets"

echo "🔥 BSI Tools Deployment"
echo "========================"

# Check for wrangler
if ! command -v wrangler &> /dev/null; then
    echo "❌ wrangler not found. Install with: npm install -g wrangler"
    exit 1
fi

# Build tools
echo ""
echo "📦 Building tools..."
cd "$TOOLS_DIR"
npm run build:all

# Upload to R2
echo ""
echo "☁️  Uploading to R2..."

# Team Archetype Builder
echo "  → team-archetype-builder/index.html"
wrangler r2 object put "$R2_BUCKET/origin/tools/team-archetype-builder/index.html" \
    --file "$DIST_DIR/team-archetype-builder/index.html" \
    --content-type "text/html"

for asset in "$DIST_DIR/team-archetype-builder/assets"/*; do
    filename=$(basename "$asset")
    echo "  → team-archetype-builder/assets/$filename"
    if [[ "$filename" == *.js ]]; then
        wrangler r2 object put "$R2_BUCKET/origin/tools/team-archetype-builder/assets/$filename" \
            --file "$asset" \
            --content-type "application/javascript"
    elif [[ "$filename" == *.css ]]; then
        wrangler r2 object put "$R2_BUCKET/origin/tools/team-archetype-builder/assets/$filename" \
            --file "$asset" \
            --content-type "text/css"
    fi
done

# Composition Optimizer
echo "  → composition-optimizer/index.html"
wrangler r2 object put "$R2_BUCKET/origin/tools/composition-optimizer/index.html" \
    --file "$DIST_DIR/composition-optimizer/index.html" \
    --content-type "text/html"

for asset in "$DIST_DIR/composition-optimizer/assets"/*; do
    filename=$(basename "$asset")
    echo "  → composition-optimizer/assets/$filename"
    if [[ "$filename" == *.js ]]; then
        wrangler r2 object put "$R2_BUCKET/origin/tools/composition-optimizer/assets/$filename" \
            --file "$asset" \
            --content-type "application/javascript"
    elif [[ "$filename" == *.css ]]; then
        wrangler r2 object put "$R2_BUCKET/origin/tools/composition-optimizer/assets/$filename" \
            --file "$asset" \
            --content-type "text/css"
    fi
done

# Deploy worker
echo ""
echo "🚀 Deploying worker..."
cd "$BSI_ROOT"
wrangler deploy

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Tools available at:"
echo "  → https://blazesportsintel.com/tools/team-archetype-builder"
echo "  → https://blazesportsintel.com/tools/composition-optimizer"
