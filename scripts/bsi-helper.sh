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
    if [ -z "$SPORTSDATAIO_API_KEY" ]; then
      echo "Error: SPORTSDATAIO_API_KEY environment variable is not set."
      echo "Set it with: export SPORTSDATAIO_API_KEY=your_key"
      exit 1
    fi
    echo "Testing SportsDataIO..."
    curl -s "https://api.sportsdata.io/v3/mlb/scores/json/AreAnyGamesInProgress" -H "Ocp-Apim-Subscription-Key: $SPORTSDATAIO_API_KEY" | head -20
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
