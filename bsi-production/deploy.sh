#!/bin/bash
# BSI Production Deployment Script
# Uploads all HTML files to R2 and deploys the bsi-home Worker
# Run from: /Users/AustinHumphrey/BSI/bsi-production

set -e

# Use global wrangler installation
WRANGLER="${WRANGLER:-/Users/AustinHumphrey/.npm-global/bin/wrangler}"

# R2 bucket name (must match wrangler.toml bucket_name)
BUCKET_NAME="blazesports-assets"

echo "=== BSI Production Deployment ==="
echo "Deploying to blazesportsintel.com"
echo "Using wrangler: $WRANGLER"
echo "R2 bucket: $BUCKET_NAME"
echo ""

# Navigate to bsi-production directory
cd "$(dirname "$0")"

# Step 1: Upload HTML files to R2
echo "Uploading HTML files to R2 bucket ($BUCKET_NAME)..."
echo ""

# Root pages
$WRANGLER r2 object put $BUCKET_NAME/origin/index.html --file index.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/index.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/tools.html --file tools.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/tools.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/login.html --file login.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/login.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/signup.html --file signup.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/signup.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/about.html --file about.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/about.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/scores.html --file scores.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/scores.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/analytics.html --file analytics.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/analytics.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/pricing.html --file pricing.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/pricing.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/dashboard.html --file dashboard.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/dashboard.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/404.html --file 404.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/404.html"

# League landing pages
$WRANGLER r2 object put $BUCKET_NAME/origin/mlb/index.html --file mlb/index.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/mlb/index.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/nfl/index.html --file nfl/index.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/nfl/index.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/nba/index.html --file nba/index.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/nba/index.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/nba/scores.html --file nba/scores.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/nba/scores.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/nba/standings.html --file nba/standings.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/nba/standings.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/nba/schedule.html --file nba/schedule.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/nba/schedule.html"

# NFL subpages
$WRANGLER r2 object put $BUCKET_NAME/origin/nfl/scores.html --file nfl/scores.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/nfl/scores.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/nfl/standings.html --file nfl/standings.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/nfl/standings.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/nfl/schedule.html --file nfl/schedule.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/nfl/schedule.html"

# College Baseball pages
echo ""
echo "College Baseball pages..."
$WRANGLER r2 object put $BUCKET_NAME/origin/college-baseball/index.html --file college-baseball/index.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/college-baseball/index.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/college-baseball/scores.html --file college-baseball/scores.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/college-baseball/scores.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/college-baseball/standings.html --file college-baseball/standings.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/college-baseball/standings.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/college-baseball/rankings.html --file college-baseball/rankings.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/college-baseball/rankings.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/college-baseball/teams.html --file college-baseball/teams.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/college-baseball/teams.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/college-baseball/players.html --file college-baseball/players.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/college-baseball/players.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/college-baseball/transfer-portal.html --file college-baseball/transfer-portal.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/college-baseball/transfer-portal.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/college-baseball/news.html --file college-baseball/news.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/college-baseball/news.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/college-baseball/team-detail.html --file college-baseball/team-detail.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/college-baseball/team-detail.html"

# College Football pages
echo ""
echo "College Football pages..."
$WRANGLER r2 object put $BUCKET_NAME/origin/college-football/index.html --file college-football/index.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/college-football/index.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/college-football/scores.html --file college-football/scores.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/college-football/scores.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/college-football/rankings.html --file college-football/rankings.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/college-football/rankings.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/college-football/standings.html --file college-football/standings.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/college-football/standings.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/college-football/teams.html --file college-football/teams.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/college-football/teams.html"

# MLB subpages
echo ""
echo "MLB pages..."
$WRANGLER r2 object put $BUCKET_NAME/origin/mlb/scores.html --file mlb/scores.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/mlb/scores.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/mlb/standings.html --file mlb/standings.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/mlb/standings.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/mlb/schedule.html --file mlb/schedule.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/mlb/schedule.html"

# NCAAB pages
echo ""
echo "NCAAB pages..."
$WRANGLER r2 object put $BUCKET_NAME/origin/ncaab/index.html --file ncaab/index.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/ncaab/index.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/ncaab/scores.html --file ncaab/scores.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/ncaab/scores.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/ncaab/standings.html --file ncaab/standings.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/ncaab/standings.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/ncaab/players.html --file ncaab/players.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/ncaab/players.html"

# Pro Tools
echo ""
echo "Pro Tools..."
$WRANGLER r2 object put $BUCKET_NAME/origin/tools/3d-showcase/index.html --file src/tools/3d-showcase/index.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/tools/3d-showcase/index.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/tools/draft-value/index.html --file src/tools/draft-value/index.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/tools/draft-value/index.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/tools/nil-valuation/index.html --file src/tools/nil-valuation/index.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/tools/nil-valuation/index.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/tools/pitch-arsenal/index.html --file src/tools/pitch-arsenal/index.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/tools/pitch-arsenal/index.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/tools/player-comparison/index.html --file src/tools/player-comparison/index.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/tools/player-comparison/index.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/tools/prospect-tracker/index.html --file src/tools/prospect-tracker/index.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/tools/prospect-tracker/index.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/tools/recruiting-tracker/index.html --file src/tools/recruiting-tracker/index.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/tools/recruiting-tracker/index.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/tools/schedule-strength/index.html --file src/tools/schedule-strength/index.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/tools/schedule-strength/index.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/tools/spray-chart/index.html --file src/tools/spray-chart/index.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/tools/spray-chart/index.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/tools/strike-zone/index.html --file src/tools/strike-zone/index.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/tools/strike-zone/index.html"

$WRANGLER r2 object put $BUCKET_NAME/origin/tools/vision-coach/index.html --file src/tools/vision-coach/index.html --content-type "text/html; charset=utf-8" --remote
echo "  ✓ origin/tools/vision-coach/index.html"

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
echo "  https://blazesportsintel.com/analytics"
echo ""
echo "  College Baseball:"
echo "    /college-baseball, /scores, /standings, /rankings, /teams, /players, /transfer-portal, /news"
echo ""
echo "  College Football:"
echo "    /college-football, /scores, /standings, /rankings, /teams"
echo ""
echo "  MLB:"
echo "    /mlb, /scores, /standings, /schedule"
echo ""
echo "  NFL:"
echo "    /nfl, /scores, /standings, /schedule"
echo ""
echo "  NBA:"
echo "    /nba, /scores, /standings, /schedule"
echo ""
echo "  NCAAB:"
echo "    /ncaab, /scores, /standings, /players"
echo ""
echo "  Pro Tools:"
echo "    /tools/3d-showcase"
echo "    /tools/draft-value"
echo "    /tools/nil-valuation"
echo "    /tools/pitch-arsenal"
echo "    /tools/player-comparison"
echo "    /tools/prospect-tracker"
echo "    /tools/recruiting-tracker"
echo "    /tools/schedule-strength"
echo "    /tools/spray-chart"
echo "    /tools/strike-zone"
echo "    /tools/vision-coach"
echo ""
