#!/bin/bash
# Test deployment of enhanced Garrido Code pages
# Usage: ./test-deployment.sh

set -euo pipefail

BASE_URL="https://5a92c5fc.blazesportsintel.pages.dev/garrido"

echo "🔥 Testing Garrido Code Enhanced Graphics Deployment"
echo "=================================================="
echo ""

# Test pages
PAGES=(
    "index.html"
    "chaos.html"
    "respect.html"
    "teach.html"
    "failure.html"
    "poetry.html"
    "team.html"
    "architecture.html"
    "flow.html"
    "memory.html"
    "legacy.html"
    "enhanced-graphics-engine.js"
)

SUCCESS=0
FAILED=0

for PAGE in "${PAGES[@]}"; do
    URL="${BASE_URL}/${PAGE}"
    echo -n "Testing $PAGE... "

    if curl -s -f -o /dev/null -w "%{http_code}" "$URL" | grep -q "200"; then
        echo "✅ OK"
        ((SUCCESS++))
    else
        echo "❌ FAILED"
        ((FAILED++))
    fi
done

echo ""
echo "=================================================="
echo "Results: ✅ $SUCCESS passed | ❌ $FAILED failed"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "🎉 All pages deployed successfully!"
    echo ""
    echo "View live site:"
    echo "  ${BASE_URL}"
    echo ""
    echo "Enable debug mode (FPS counter):"
    echo "  ${BASE_URL}/chaos?debug"
else
    echo "⚠️  Some pages failed to deploy"
    exit 1
fi
