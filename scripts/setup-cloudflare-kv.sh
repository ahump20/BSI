#!/bin/bash

# Setup Cloudflare KV Namespace for Texas Longhorns MCP Caching
# This script creates the KV namespace and configures wrangler.toml

set -e

echo "🔧 Cloudflare KV Setup for Blaze Sports Intel"
echo "=============================================="
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    pnpm add -g wrangler
fi

# Check if logged in to Cloudflare
echo "📋 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "🔐 Please log in to Cloudflare:"
    wrangler login
fi

echo ""
echo "📦 Creating KV namespace for Longhorns cache..."

# Create production KV namespace
KV_PROD_OUTPUT=$(wrangler kv:namespace create "LONGHORNS_CACHE")
KV_PROD_ID=$(echo "$KV_PROD_OUTPUT" | grep -oP 'id = "\K[^"]+' || echo "")

if [ -z "$KV_PROD_ID" ]; then
    echo "❌ Failed to create production KV namespace"
    exit 1
fi

echo "✅ Production KV namespace created: $KV_PROD_ID"

# Create preview KV namespace
echo "📦 Creating preview KV namespace..."
KV_PREVIEW_OUTPUT=$(wrangler kv:namespace create "LONGHORNS_CACHE" --preview)
KV_PREVIEW_ID=$(echo "$KV_PREVIEW_OUTPUT" | grep -oP 'id = "\K[^"]+' || echo "")

if [ -z "$KV_PREVIEW_ID" ]; then
    echo "⚠️  Warning: Failed to create preview KV namespace"
    KV_PREVIEW_ID="$KV_PROD_ID"
fi

echo "✅ Preview KV namespace created: $KV_PREVIEW_ID"

# Update wrangler.toml
echo ""
echo "📝 Updating wrangler.toml configuration..."

WRANGLER_FILE="apps/api-worker/wrangler.toml"

# Replace placeholder IDs with actual IDs
if [ -f "$WRANGLER_FILE" ]; then
    sed -i "s/YOUR_KV_NAMESPACE_ID/$KV_PROD_ID/g" "$WRANGLER_FILE"
    sed -i "s/YOUR_KV_PREVIEW_ID/$KV_PREVIEW_ID/g" "$WRANGLER_FILE"
    echo "✅ Updated $WRANGLER_FILE"
else
    echo "⚠️  Warning: $WRANGLER_FILE not found"
fi

# Seed initial MCP data into KV
echo ""
echo "📊 Seeding initial MCP data into KV..."

# Baseball data
wrangler kv:key put --namespace-id="$KV_PROD_ID" \
    "longhorns:mcp:baseball" \
    "$(cat mcp/texas-longhorns/feeds/baseball.json)" \
    --metadata='{"sport":"baseball","updated":"'$(date -Iseconds)'"}'

echo "✅ Baseball data seeded"

# Football data
wrangler kv:key put --namespace-id="$KV_PROD_ID" \
    "longhorns:mcp:football" \
    "$(cat mcp/texas-longhorns/feeds/football.json)" \
    --metadata='{"sport":"football","updated":"'$(date -Iseconds)'"}'

echo "✅ Football data seeded"

# Basketball data
wrangler kv:key put --namespace-id="$KV_PROD_ID" \
    "longhorns:mcp:basketball" \
    "$(cat mcp/texas-longhorns/feeds/basketball.json)" \
    --metadata='{"sport":"basketball","updated":"'$(date -Iseconds)'"}'

echo "✅ Basketball data seeded"

# Track & Field data
wrangler kv:key put --namespace-id="$KV_PROD_ID" \
    "longhorns:mcp:track-field" \
    "$(cat mcp/texas-longhorns/feeds/track-field.json)" \
    --metadata='{"sport":"track-field","updated":"'$(date -Iseconds)'"}'

echo "✅ Track & Field data seeded"

# Create all sports combined
ALL_DATA=$(jq -n \
    --slurpfile baseball mcp/texas-longhorns/feeds/baseball.json \
    --slurpfile football mcp/texas-longhorns/feeds/football.json \
    --slurpfile basketball mcp/texas-longhorns/feeds/basketball.json \
    --slurpfile trackfield mcp/texas-longhorns/feeds/track-field.json \
    '{baseball: $baseball[0], football: $football[0], basketball: $basketball[0], trackField: $trackfield[0]}')

wrangler kv:key put --namespace-id="$KV_PROD_ID" \
    "longhorns:mcp:all" \
    "$ALL_DATA" \
    --metadata='{"sport":"all","updated":"'$(date -Iseconds)'"}'

echo "✅ All sports data seeded"

echo ""
echo "✅ Cloudflare KV Setup Complete!"
echo ""
echo "📌 Next steps:"
echo "   1. KV Namespace ID: $KV_PROD_ID"
echo "   2. Preview ID: $KV_PREVIEW_ID"
echo "   3. Updated: $WRANGLER_FILE"
echo "   4. Seeded: All Texas Longhorns MCP data"
echo ""
echo "🚀 You can now deploy your Workers with:"
echo "   pnpm build && wrangler pages deploy apps/web/.open-next"
echo ""
