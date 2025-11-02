#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Deployment Script - Run AFTER configuring bindings in Cloudflare dashboard
# =============================================================================
# This script automates the remaining deployment steps once the manual
# binding configuration is complete in the Cloudflare dashboard.
#
# Prerequisites:
# - Bindings must be configured in dashboard (see BINDING-CONFIGURATION.md)
# - Local build must be complete (npm run build)
#
# Usage:
#   ./scripts/deploy-after-bindings.sh
# =============================================================================

echo "🔍 Verifying prerequisites..."

# Check if dist directory exists
if [ ! -d "dist" ]; then
  echo "❌ Error: dist directory not found. Run 'npm run build' first."
  exit 1
fi

# Check if _functions directory exists
if [ ! -d "dist/_functions" ]; then
  echo "❌ Error: dist/_functions directory not found."
  exit 1
fi

# Check if backup exists
if [ ! -f "dist/_functions/api/scheduling/optimize.js.bak" ]; then
  echo "⚠️  Warning: optimize.js.bak not found. Optimization Function may already be restored."
else
  echo "✅ Found optimize.js.bak - will restore"
fi

echo ""
echo "📋 Step 1: Restoring optimization Function..."
if [ -f "dist/_functions/api/scheduling/optimize.js.bak" ]; then
  mv dist/_functions/api/scheduling/optimize.js.bak \
     dist/_functions/api/scheduling/optimize.js
  echo "✅ Restored optimize.js from backup"
else
  echo "ℹ️  optimize.js already in place"
fi

echo ""
echo "📋 Step 2: Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist \
  --project-name college-baseball-tracker \
  --branch main \
  --commit-dirty=true

echo ""
echo "📋 Step 3: Extracting deployment URL..."
DEPLOYMENT_URL=$(npx wrangler pages deployment list --project-name college-baseball-tracker 2>/dev/null | grep -oE 'https://[a-z0-9]+\.college-baseball-tracker\.pages\.dev' | head -1)

if [ -z "$DEPLOYMENT_URL" ]; then
  echo "⚠️  Could not extract deployment URL automatically"
  echo "   Please check: https://dash.cloudflare.com/pages/view/college-baseball-tracker"
  exit 0
fi

echo "✅ Deployment URL: $DEPLOYMENT_URL"

echo ""
echo "📋 Step 4: Testing simple endpoint..."
sleep 3  # Give CDN time to propagate
TEST_RESPONSE=$(curl -s "$DEPLOYMENT_URL/api/test" || echo "CURL_FAILED")

if echo "$TEST_RESPONSE" | grep -q "Pages Functions are working"; then
  echo "✅ Simple test endpoint working!"
else
  echo "❌ Simple test endpoint failed"
  echo "Response: $TEST_RESPONSE"
  echo ""
  echo "🔍 Troubleshooting:"
  echo "   1. Verify bindings are configured in dashboard:"
  echo "      https://dash.cloudflare.com/a12cb329d84130460eed99b816e4d0d3/pages/view/college-baseball-tracker"
  echo "   2. Check Settings > Functions > Bindings"
  echo "   3. Ensure KV, DB, and ANALYTICS bindings are set"
  exit 1
fi

echo ""
echo "📋 Step 5: Testing optimization endpoint..."
OPTIMIZE_URL="$DEPLOYMENT_URL/api/scheduling/optimize?teamId=texas&iterations=100"
OPTIMIZE_RESPONSE=$(curl -s "$OPTIMIZE_URL" || echo "CURL_FAILED")

if echo "$OPTIMIZE_RESPONSE" | grep -q '"status":"success"'; then
  echo "✅ Optimization endpoint working!"
  echo ""
  echo "Sample response:"
  echo "$OPTIMIZE_RESPONSE" | jq '.' 2>/dev/null || echo "$OPTIMIZE_RESPONSE"
else
  echo "❌ Optimization endpoint failed"
  echo "Response: $OPTIMIZE_RESPONSE"
  echo ""
  echo "This may indicate a binding configuration issue."
  exit 1
fi

echo ""
echo "🎉 Deployment complete and verified!"
echo ""
echo "📊 Production endpoints:"
echo "   Simple test:    $DEPLOYMENT_URL/api/test"
echo "   Optimization:   $DEPLOYMENT_URL/api/scheduling/optimize"
echo ""
echo "💡 Example usage:"
echo "   curl '$DEPLOYMENT_URL/api/scheduling/optimize?teamId=texas&iterations=1000'"
echo ""
echo "📈 Monitor your deployment:"
echo "   https://dash.cloudflare.com/a12cb329d84130460eed99b816e4d0d3/pages/view/college-baseball-tracker"
