#!/bin/bash
# BSI Helper Script - Quick commands for common operations

case "$1" in
  deploy)
    echo "Deploying to Cloudflare Pages..."
    npx wrangler pages deploy ./public --project-name=blazesportsintel --commit-dirty=true
    ;;
  status)
    echo "=== Git Status ==="
    git status --short
    echo ""
    echo "=== Recent Deployments ==="
    npx wrangler pages deployment list --project-name=blazesportsintel | head -6
    ;;
  d1)
    shift
    npx wrangler d1 execute bsi-game-db --command "$*"
    ;;
  kv)
    npx wrangler kv namespace list
    ;;
  test-apis)
    echo "Testing SportsDataIO..."
    curl -s "https://api.sportsdata.io/v3/mlb/scores/json/AreAnyGamesInProgress" -H "Ocp-Apim-Subscription-Key: 6ca2adb39404482da5406f0a6cd7aa37" | head -20
    ;;
  *)
    echo "BSI Helper Commands:"
    echo "  deploy     - Deploy to Cloudflare Pages"
    echo "  status     - Show git & deployment status"  
    echo "  d1 <sql>   - Execute D1 query"
    echo "  kv         - List KV namespaces"
    echo "  test-apis  - Test sports data APIs"
    ;;
esac
