#!/bin/bash
# BSI Production Deployment Script
# Uploads all HTML files to R2 and deploys the bsi-home Worker
# Run from: /Users/AustinHumphrey/BSI/bsi-production

set -e

# Use global wrangler installation
WRANGLER="${WRANGLER:-/Users/AustinHumphrey/.npm-global/bin/wrangler}"

echo "=== BSI Production Deployment ==="
echo "Deploying to blazesportsintel.com"
echo "Using wrangler: $WRANGLER"
echo ""

# Navigate to bsi-production directory
cd "$(dirname "$0")"

# Step 1: Upload HTML files to R2
echo "Uploading HTML files to R2 bucket (blazesports-assets)..."
echo ""

# Root pages
$WRANGLER r2 object put blazesports-assets/origin/index.html --file index.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/index.html"

$WRANGLER r2 object put blazesports-assets/origin/tools.html --file tools.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/tools.html"

$WRANGLER r2 object put blazesports-assets/origin/login.html --file login.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/login.html"

$WRANGLER r2 object put blazesports-assets/origin/signup.html --file signup.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/signup.html"

$WRANGLER r2 object put blazesports-assets/origin/about.html --file about.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/about.html"

$WRANGLER r2 object put blazesports-assets/origin/scores.html --file scores.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/scores.html"

# League landing pages
$WRANGLER r2 object put blazesports-assets/origin/mlb/index.html --file mlb/index.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/mlb/index.html"

$WRANGLER r2 object put blazesports-assets/origin/nfl/index.html --file nfl/index.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/nfl/index.html"

$WRANGLER r2 object put blazesports-assets/origin/nba/index.html --file nba/index.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/nba/index.html"

$WRANGLER r2 object put blazesports-assets/origin/college-baseball/index.html --file college-baseball/index.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/college-baseball/index.html"

echo ""
echo "All HTML files uploaded to R2."
echo ""

# Step 2: Deploy Worker
echo "Deploying bsi-home worker..."
$WRANGLER deploy
echo ""
echo "  ✓ Worker deployed"

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Live URLs:"
echo "  https://blazesportsintel.com/"
echo "  https://blazesportsintel.com/tools"
echo "  https://blazesportsintel.com/login"
echo "  https://blazesportsintel.com/signup"
echo "  https://blazesportsintel.com/about"
echo "  https://blazesportsintel.com/scores"
echo "  https://blazesportsintel.com/mlb"
echo "  https://blazesportsintel.com/nfl"
echo "  https://blazesportsintel.com/nba"
echo "  https://blazesportsintel.com/college-baseball"
echo ""
