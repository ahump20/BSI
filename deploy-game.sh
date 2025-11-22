#!/usr/bin/env bash
# Diamond Sluggers - Deployment Script
# Deploys mobile baseball game to Cloudflare Pages

set -euo pipefail

echo "🎮 Diamond Sluggers Deployment"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Wrangler CLI not found${NC}"
    echo "Install with: npm install -g wrangler"
    exit 1
fi

# Check if logged in to Cloudflare
echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Cloudflare${NC}"
    echo "Logging in..."
    wrangler login
fi

# Pre-deployment checks
echo ""
echo "📋 Running pre-deployment checks..."

# Check if game files exist
if [ ! -f "public/game/index.html" ]; then
    echo -e "${RED}❌ Game files not found in public/game/${NC}"
    exit 1
fi

if [ ! -f "public/game/manifest.json" ]; then
    echo -e "${RED}❌ PWA manifest not found${NC}"
    exit 1
fi

if [ ! -f "public/game/sw.js" ]; then
    echo -e "${RED}❌ Service worker not found${NC}"
    exit 1
fi

# Check JavaScript files
required_files=(
    "public/game/js/main.js"
    "public/game/js/characters.js"
    "public/game/js/stadiums.js"
    "public/game/js/game-engine.js"
    "public/game/js/storage-manager.js"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Missing required file: $file${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ All required files present${NC}"

# Create icons directory if it doesn't exist
mkdir -p public/game/icons

# Check if icons exist (warn but don't fail)
if [ ! -f "public/game/icons/icon-192.png" ]; then
    echo -e "${YELLOW}⚠️  PWA icons not found. You should generate icons before production deployment.${NC}"
    echo "   Use an online PWA icon generator or create manually."
fi

# Validate JSON files
echo ""
echo "🔍 Validating JSON files..."

if ! python3 -m json.tool public/game/manifest.json > /dev/null 2>&1; then
    echo -e "${RED}❌ Invalid JSON in manifest.json${NC}"
    exit 1
fi

echo -e "${GREEN}✅ JSON files valid${NC}"

# Check JavaScript syntax (basic)
echo ""
echo "🔍 Checking JavaScript syntax..."
for file in "${required_files[@]}"; do
    if ! node -c "$file" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Syntax warning in $file${NC}"
    fi
done

# Calculate total size
echo ""
echo "📦 Calculating bundle size..."
game_size=$(du -sh public/game | awk '{print $1}')
echo "Total game size: $game_size"

if [ "${game_size%%[A-Z]*}" -gt 200 ]; then
    echo -e "${YELLOW}⚠️  Warning: Game size exceeds 200MB recommendation${NC}"
fi

# Deployment prompt
echo ""
echo -e "${YELLOW}Ready to deploy to Cloudflare Pages${NC}"
echo "Domain: blazesportsintel.com/game"
echo ""
read -p "Continue with deployment? (y/N) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 0
fi

# Deploy to Cloudflare Pages
echo ""
echo "🚀 Deploying to Cloudflare Pages..."

# Deploy with wrangler
wrangler pages deploy public \
    --project-name=blazesportsintel \
    --branch=main \
    --commit-dirty=true

# Check deployment status
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    echo "🎮 Diamond Sluggers is now live at:"
    echo "   https://blazesportsintel.com/game"
    echo ""
    echo "📱 Test the game:"
    echo "   1. Open URL on mobile device"
    echo "   2. Install as PWA (Add to Home Screen)"
    echo "   3. Test offline mode"
    echo "   4. Verify touch controls"
    echo ""
    echo "📊 Monitor deployment:"
    echo "   https://dash.cloudflare.com/"
    echo ""

    # Open URL in browser (optional)
    read -p "Open game in browser? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            open "https://blazesportsintel.com/game"
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            xdg-open "https://blazesportsintel.com/game"
        fi
    fi

    # Post-deployment checklist
    echo ""
    echo "📋 Post-deployment checklist:"
    echo "  [ ] Test on iOS Safari"
    echo "  [ ] Test on Android Chrome"
    echo "  [ ] Verify PWA installation"
    echo "  [ ] Test offline mode"
    echo "  [ ] Check character unlocking"
    echo "  [ ] Verify save/load system"
    echo "  [ ] Test on 4G connection"
    echo "  [ ] Run Lighthouse audit"
    echo ""

else
    echo ""
    echo -e "${RED}❌ Deployment failed${NC}"
    echo "Check the error messages above for details"
    exit 1
fi

# Create deployment log
echo ""
echo "📝 Creating deployment log..."
cat > deployment-log.txt <<EOF
Diamond Sluggers Deployment Log
================================
Date: $(date)
Version: 1.0.0
Deployed by: $(whoami)
Game size: $game_size
Status: Success

Files deployed:
- Game HTML and assets
- JavaScript modules
- PWA manifest and service worker
- Character and stadium data

Deployment URL: https://blazesportsintel.com/game

Next steps:
1. Test on mobile devices
2. Monitor analytics
3. Gather user feedback
EOF

echo -e "${GREEN}✅ Deployment log saved to deployment-log.txt${NC}"
echo ""
echo "🎉 Deployment complete! Play ball!"
