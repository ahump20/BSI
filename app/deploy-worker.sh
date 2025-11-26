#!/bin/bash

# Blaze Intelligence Data Layer Deployment Script
# This script deploys the Cloudflare Worker with all necessary configurations

set -e

echo "🚀 Deploying Blaze Intelligence Data Layer Worker..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "⚠️ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Check if logged in to Cloudflare
echo "📝 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "🔐 Please log in to Cloudflare:"
    wrangler login
fi

# Create KV namespace if it doesn't exist
echo "📦 Setting up KV namespace for caching..."
KV_ID=$(wrangler kv:namespace create "BLAZE_CACHE" --preview 2>/dev/null | grep -oP 'id = "\K[^"]+' || true)
if [ -n "$KV_ID" ]; then
    echo "✅ KV namespace created with ID: $KV_ID"
    # Update wrangler.toml with the KV ID
    sed -i.bak "s/your-kv-namespace-id/$KV_ID/g" wrangler.toml
fi

# Create D1 database (optional)
echo "🗄️ Setting up D1 database..."
if wrangler d1 create blaze-analytics 2>/dev/null; then
    echo "✅ D1 database created"
    # Initialize database schema
    cat > schema.sql << EOF
CREATE TABLE IF NOT EXISTS kpi_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    predictions_today INTEGER,
    active_clients INTEGER,
    avg_response_sec REAL,
    alerts_processed INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    league TEXT NOT NULL,
    wins INTEGER,
    losses INTEGER,
    rating REAL
);

CREATE TABLE IF NOT EXISTS leaderboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    avatar TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
EOF
    
    wrangler d1 execute blaze-analytics --file=schema.sql
    echo "✅ Database schema initialized"
fi

# Set secrets (if not already set)
echo "🔑 Configuring secrets..."
if [ -n "$NOTION_TOKEN" ]; then
    echo "$NOTION_TOKEN" | wrangler secret put NOTION_TOKEN
    echo "✅ NOTION_TOKEN configured"
fi

if [ -n "$NOTION_DATABASE_ID" ]; then
    echo "$NOTION_DATABASE_ID" | wrangler secret put NOTION_DATABASE_ID
    echo "✅ NOTION_DATABASE_ID configured"
fi

# Deploy the worker
echo "🚀 Deploying worker to Cloudflare..."
wrangler deploy

# Get the worker URL
WORKER_URL=$(wrangler deployments list | grep -oP 'https://[^\s]+' | head -1)
if [ -z "$WORKER_URL" ]; then
    WORKER_URL="https://blaze-data-layer.YOUR-SUBDOMAIN.workers.dev"
fi

echo "✅ Worker deployed successfully!"
echo "📍 Worker URL: $WORKER_URL"

# Test the deployment
echo "🧪 Testing deployment..."
if curl -s "$WORKER_URL/health" | grep -q "ok"; then
    echo "✅ Health check passed!"
else
    echo "⚠️ Health check failed. Please check the worker logs."
fi

# Update the frontend files with the worker URL
echo "📝 Updating frontend configuration..."
find . -name "*.ts" -o -name "*.js" | xargs sed -i.bak "s|https://blaze-worker.humphrey-austin20.workers.dev|$WORKER_URL|g"

echo "
🎉 Deployment Complete!
========================
Worker URL: $WORKER_URL
Health Check: $WORKER_URL/health
KPI Endpoint: $WORKER_URL/kpi
Teams Endpoint: $WORKER_URL/teams/MLB
Leaderboard: $WORKER_URL/multiplayer/leaderboard

Next steps:
1. Test the analytics dashboard: open app/analytics.html
2. Test the multiplayer leaderboard: open app/multiplayer.html
3. Monitor logs: wrangler tail
"

# Clean up
rm -f *.bak schema.sql