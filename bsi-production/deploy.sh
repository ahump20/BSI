#!/bin/bash
# BSI Home Page Deployment Script
# Uploads assets to R2 and deploys Worker

set -e

echo "🔥 BSI Home Page Deployment"
echo "=========================="

# Check for wrangler
if ! command -v wrangler &> /dev/null; then
    echo "❌ wrangler not found. Install with: npm install -g wrangler"
    exit 1
fi

# Upload images to R2
echo ""
echo "📸 Uploading images to R2..."

# Upload JPGs
for img in images/*.jpg; do
    if [ -f "$img" ]; then
        filename=$(basename "$img")
        echo "  → Uploading $filename..."
        wrangler r2 object put "blazesports-assets/origin/images/$filename" --file="$img" --content-type="image/jpeg"
    fi
done

# Upload PNGs (logos)
for img in images/*.png; do
    if [ -f "$img" ]; then
        filename=$(basename "$img")
        echo "  → Uploading $filename..."
        wrangler r2 object put "blazesports-assets/origin/images/$filename" --file="$img" --content-type="image/png"
    fi
done

# Upload index.html to R2
echo ""
echo "📄 Uploading index.html to R2..."
wrangler r2 object put "blazesports-assets/origin/index.html" --file="index.html" --content-type="text/html"

# Upload PWA manifest
echo ""
echo "📱 Uploading PWA manifest to R2..."
wrangler r2 object put "blazesports-assets/origin/manifest.json" --file="manifest.json" --content-type="application/manifest+json"

# Upload service worker
echo ""
echo "⚡ Uploading service worker to R2..."
wrangler r2 object put "blazesports-assets/origin/sw.js" --file="sw.js" --content-type="application/javascript"

# Deploy Worker
echo ""
echo "🚀 Deploying Worker..."
wrangler deploy

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Your site is now live at:"
echo "  → https://bsi-home.<your-subdomain>.workers.dev"
echo ""
echo "To use your custom domain (blazesportsintel.com):"
echo "  1. Go to Cloudflare Dashboard → Workers & Pages → bsi-home"
echo "  2. Click 'Triggers' tab"
echo "  3. Add Custom Domain → blazesportsintel.com"
echo ""
