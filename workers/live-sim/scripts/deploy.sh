#!/bin/bash

# Automated deployment script for Live Game Win Probability Simulation

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 Deploying Live Sim Worker..."
echo "================================"
echo ""

cd "$PROJECT_DIR"

# Check if setup was run
if ! grep -q "database_id = \"[a-f0-9-]\{36\}\"" wrangler.toml 2>/dev/null; then
    echo "❌ Error: Resources not configured"
    echo ""
    echo "Run setup first:"
    echo "  ./scripts/setup.sh"
    echo ""
    exit 1
fi

# Pre-deployment checks
echo "🔍 Pre-deployment checks..."

# Check for required files
REQUIRED_FILES=(
    "src/index.ts"
    "src/types.ts"
    "src/baseball-sim.ts"
    "src/game-coordinator.ts"
    "wrangler.toml"
    "package.json"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing required file: $file"
        exit 1
    fi
done

echo "✅ All required files present"

# Check dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Type check
echo "🔍 Type checking..."
if ! npm run typecheck; then
    echo "❌ Type check failed"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✅ Type check passed"
echo ""

# Deployment environment
ENVIRONMENT=${1:-production}

echo "🌍 Deploying to: $ENVIRONMENT"
echo ""

if [ "$ENVIRONMENT" = "production" ]; then
    # Production deployment
    echo "⚠️  PRODUCTION DEPLOYMENT"
    echo ""
    read -p "Are you sure you want to deploy to production? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled"
        exit 0
    fi

    echo ""
    echo "Deploying to production..."
    wrangler deploy

elif [ "$ENVIRONMENT" = "staging" ]; then
    # Staging deployment (if you have a staging env)
    echo "Deploying to staging..."
    wrangler deploy --env staging

else
    echo "❌ Unknown environment: $ENVIRONMENT"
    echo "Usage: ./scripts/deploy.sh [production|staging]"
    exit 1
fi

# Get deployment URL
WORKER_URL=$(wrangler deployments list --name blazesports-live-sim 2>/dev/null | grep "https://" | head -1 | awk '{print $1}' || echo "")

if [ -z "$WORKER_URL" ]; then
    # Fallback: construct URL from account subdomain
    WORKER_URL="https://blazesports-live-sim.workers.dev"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment Successful!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Worker URL: $WORKER_URL"
echo ""
echo "Endpoints:"
echo "  • Health:     $WORKER_URL/health"
echo "  • Ingest:     $WORKER_URL/ingest"
echo "  • Live SSE:   $WORKER_URL/live/:gameId"
echo "  • Snapshot:   $WORKER_URL/snapshot/:gameId"
echo "  • Dashboard:  $WORKER_URL/dashboard.html"
echo ""
echo "Verify deployment:"
echo "  curl $WORKER_URL/health"
echo ""
echo "View live logs:"
echo "  wrangler tail"
echo ""
echo "Next steps:"
echo ""
echo "  1. Test with sample game:"
echo "     export WORKER_URL=$WORKER_URL"
echo "     export INGEST_SECRET=<your-secret>"
echo "     ./test-data/simulate-game.sh \$WORKER_URL 3"
echo ""
echo "  2. Integrate with existing ingest worker:"
echo "     See INTEGRATION.md"
echo ""
echo "  3. Embed dashboard on your site"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Health check
echo ""
echo "🏥 Running health check..."
sleep 2  # Give worker a moment to fully deploy

HEALTH_RESPONSE=$(curl -s "$WORKER_URL/health" || echo "")
if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    echo "✅ Health check passed"
    echo "$HEALTH_RESPONSE" | jq '.' 2>/dev/null || echo "$HEALTH_RESPONSE"
else
    echo "⚠️  Health check failed or timed out"
    echo "Check logs: wrangler tail"
fi

echo ""
echo "🎉 Deployment complete!"
