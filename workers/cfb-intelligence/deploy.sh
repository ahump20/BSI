#!/bin/bash

# College Football Intelligence Engine - Deployment Script
# This script automates the deployment of the CFB Intelligence Worker to Cloudflare

set -e  # Exit on error

echo "=================================================="
echo "College Football Intelligence Engine - Deployment"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}Error: wrangler CLI is not installed${NC}"
    echo "Install it with: npm install -g wrangler"
    exit 1
fi

echo -e "${GREEN}✓ Wrangler CLI found${NC}"

# Check if logged in to Cloudflare
if ! wrangler whoami &> /dev/null; then
    echo -e "${RED}Error: Not logged in to Cloudflare${NC}"
    echo "Run: wrangler login"
    exit 1
fi

echo -e "${GREEN}✓ Authenticated with Cloudflare${NC}"
echo ""

# Step 1: Create D1 Database
echo "Step 1: Creating D1 Database..."
if wrangler d1 list | grep -q "blaze-cfb"; then
    echo -e "${YELLOW}⚠ Database 'blaze-cfb' already exists, skipping...${NC}"
else
    echo "Creating database..."
    wrangler d1 create blaze-cfb
    echo ""
    echo -e "${YELLOW}⚠ Please update wrangler.toml with the database_id from above${NC}"
    read -p "Press enter to continue after updating wrangler.toml..."
fi

# Step 2: Initialize Database Schema
echo ""
echo "Step 2: Initializing Database Schema..."
wrangler d1 execute blaze-cfb --file=schema.sql
echo -e "${GREEN}✓ Schema initialized${NC}"

# Step 3: Create KV Namespace
echo ""
echo "Step 3: Creating KV Namespace..."
if wrangler kv:namespace list | grep -q "CFB_CACHE"; then
    echo -e "${YELLOW}⚠ KV namespace 'CFB_CACHE' already exists, skipping...${NC}"
else
    echo "Creating production namespace..."
    wrangler kv:namespace create "CFB_CACHE"
    echo ""
    echo "Creating preview namespace..."
    wrangler kv:namespace create "CFB_CACHE" --preview
    echo ""
    echo -e "${YELLOW}⚠ Please update wrangler.toml with the KV namespace IDs from above${NC}"
    read -p "Press enter to continue after updating wrangler.toml..."
fi

# Step 4: Create R2 Bucket
echo ""
echo "Step 4: Creating R2 Bucket..."
if wrangler r2 bucket list | grep -q "blaze-game-archives"; then
    echo -e "${YELLOW}⚠ R2 bucket 'blaze-game-archives' already exists, skipping...${NC}"
else
    echo "Creating R2 bucket..."
    wrangler r2 bucket create blaze-game-archives
    echo -e "${GREEN}✓ R2 bucket created${NC}"
fi

# Step 5: Set Secrets (Optional)
echo ""
echo "Step 5: Setting up API secrets (optional)..."
read -p "Do you want to set up API keys now? (y/n): " setup_secrets

if [ "$setup_secrets" = "y" ]; then
    echo ""
    read -p "Enter NCAA API Key (or press enter to skip): " ncaa_key
    if [ -n "$ncaa_key" ]; then
        echo "$ncaa_key" | wrangler secret put NCAA_API_KEY
    fi

    read -p "Enter ESPN API Key (or press enter to skip): " espn_key
    if [ -n "$espn_key" ]; then
        echo "$espn_key" | wrangler secret put ESPN_API_KEY
    fi

    read -p "Enter SportsRadar API Key (or press enter to skip): " sr_key
    if [ -n "$sr_key" ]; then
        echo "$sr_key" | wrangler secret put SPORTSRADAR_API_KEY
    fi

    echo -e "${GREEN}✓ Secrets configured${NC}"
else
    echo -e "${YELLOW}⚠ Skipping secret configuration (can set later with 'wrangler secret put')${NC}"
fi

# Step 6: Deploy Worker
echo ""
echo "Step 6: Deploying Worker..."
wrangler deploy

echo ""
echo -e "${GREEN}✓ Worker deployed successfully!${NC}"

# Step 7: Test Deployment
echo ""
echo "Step 7: Testing Deployment..."
WORKER_URL=$(wrangler deployments list --json 2>/dev/null | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "https://blaze-cfb-intelligence.workers.dev")

echo "Testing health endpoint..."
if curl -s -f "${WORKER_URL}/health" > /dev/null; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${YELLOW}⚠ Health check failed (this may be normal if URL is not yet propagated)${NC}"
fi

echo ""
echo "=================================================="
echo "Deployment Complete!"
echo "=================================================="
echo ""
echo "Worker URL: ${WORKER_URL}"
echo ""
echo "Available Endpoints:"
echo "  - ${WORKER_URL}/health"
echo "  - ${WORKER_URL}/cfb/games/live"
echo "  - ${WORKER_URL}/cfb/games/upsets"
echo "  - ${WORKER_URL}/cfb/team/{teamId}"
echo "  - ${WORKER_URL}/cfb/recruiting/impact"
echo ""
echo "Monitoring:"
echo "  - Logs: wrangler tail"
echo "  - D1 Info: wrangler d1 info blaze-cfb"
echo "  - KV List: wrangler kv:namespace list"
echo "  - R2 List: wrangler r2 bucket list"
echo ""
echo "Next Steps:"
echo "  1. Integrate real data sources in index.ts"
echo "  2. Add LiveGamesWidget component to your frontend"
echo "  3. Set up monitoring and alerts"
echo "  4. Configure rate limiting and authentication"
echo ""
echo -e "${GREEN}Happy coding!${NC}"
