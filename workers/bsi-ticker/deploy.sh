#!/bin/bash
# BSI Ticker Deployment Script
# Run this from the workers/bsi-ticker directory

set -e

echo "🎯 BSI Live Sports Ticker Deployment"
echo "====================================="

# Check for wrangler
if ! command -v wrangler &> /dev/null; then
    echo "Installing wrangler..."
    npm install -g wrangler
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create KV namespace if needed
echo "🗄️ Setting up KV namespace..."
KV_OUTPUT=$(wrangler kv:namespace create BSI_TICKER_CACHE 2>&1 || true)
if echo "$KV_OUTPUT" | grep -q "id ="; then
    KV_ID=$(echo "$KV_OUTPUT" | grep "id =" | awk -F'"' '{print $2}')
    echo "   Created KV namespace: $KV_ID"
    echo "   ⚠️  Update wrangler.jsonc with this ID"
else
    echo "   KV namespace may already exist, continuing..."
fi

# Create D1 database if needed
echo "💾 Setting up D1 database..."
D1_OUTPUT=$(wrangler d1 create bsi-ticker-db 2>&1 || true)
if echo "$D1_OUTPUT" | grep -q "database_id"; then
    D1_ID=$(echo "$D1_OUTPUT" | grep "database_id" | awk -F'"' '{print $2}')
    echo "   Created D1 database: $D1_ID"
    echo "   ⚠️  Update wrangler.jsonc with this ID"
else
    echo "   D1 database may already exist, continuing..."
fi

# Run D1 migrations
echo "📊 Running D1 migrations..."
wrangler d1 execute bsi-ticker-db --file=./schema.sql --remote || echo "   Migration may have already run"

# Create queues if needed
echo "📬 Setting up queues..."
wrangler queues create bsi-ticker-events 2>&1 || echo "   Queue may already exist"
wrangler queues create bsi-ticker-dlq 2>&1 || echo "   DLQ may already exist"

# Check for API_SECRET
echo "🔐 Checking API secret..."
if ! wrangler secret list | grep -q "API_SECRET"; then
    echo "   API_SECRET not found. Setting..."
    echo "   Enter a secure API secret:"
    wrangler secret put API_SECRET
fi

# Deploy
echo "🚀 Deploying worker..."
wrangler deploy

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Endpoints:"
echo "  • WebSocket: wss://bsi-ticker.<your-subdomain>.workers.dev/ws"
echo "  • Items API: https://bsi-ticker.<your-subdomain>.workers.dev/items"
echo "  • Health:    https://bsi-ticker.<your-subdomain>.workers.dev/health"
echo ""
echo "Next steps:"
echo "  1. Set up custom domain: ticker.blazesportsintel.com"
echo "  2. Update frontend to connect to ticker WebSocket"
echo "  3. Configure data ingestion pipelines"
