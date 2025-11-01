#!/usr/bin/env bash
set -euo pipefail

# Quick Deploy Script for Cloudflare Pages
# Automates the entire deployment process

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Cloudflare Pages Quick Deploy${NC}"
echo "=================================="
echo ""

cd "$PROJECT_ROOT"

# Step 1: Validate prerequisites
echo -e "${BLUE}Step 1: Checking prerequisites${NC}"
if ! command -v node &> /dev/null; then
  echo -e "${RED}✗ Node.js not found. Please install Node.js 20+${NC}"
  exit 1
fi

if ! command -v npm &> /dev/null; then
  echo -e "${RED}✗ npm not found. Please install npm${NC}"
  exit 1
fi

if ! command -v wrangler &> /dev/null; then
  echo -e "${YELLOW}⚠ Wrangler not found. Installing...${NC}"
  npm install -g wrangler
fi

echo -e "${GREEN}✓ Prerequisites satisfied${NC}"
echo ""

# Step 2: Install dependencies
echo -e "${BLUE}Step 2: Installing dependencies${NC}"
if [ ! -d "node_modules" ]; then
  npm install
  echo -e "${GREEN}✓ Dependencies installed${NC}"
else
  echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi
echo ""

# Step 3: Run validation
echo -e "${BLUE}Step 3: Validating deployment${NC}"
if [ -f "$SCRIPT_DIR/validate-deployment.sh" ]; then
  if bash "$SCRIPT_DIR/validate-deployment.sh"; then
    echo -e "${GREEN}✓ Validation passed${NC}"
  else
    echo -e "${RED}✗ Validation failed${NC}"
    echo ""
    echo "Fix errors and try again."
    exit 1
  fi
else
  echo -e "${YELLOW}⚠ Validation script not found, skipping...${NC}"
fi
echo ""

# Step 4: Check for Cloudflare authentication
echo -e "${BLUE}Step 4: Checking Cloudflare authentication${NC}"

if wrangler whoami &> /dev/null; then
  USER=$(wrangler whoami 2>&1 | grep "logged in" || echo "")
  if [ -n "$USER" ]; then
    echo -e "${GREEN}✓ Authenticated with Cloudflare${NC}"
    echo "   $USER"
  else
    echo -e "${YELLOW}⚠ Not authenticated. Running login...${NC}"
    wrangler login
  fi
else
  echo -e "${YELLOW}⚠ Not authenticated. Running login...${NC}"
  wrangler login
fi
echo ""

# Step 5: Prompt for deployment details
echo -e "${BLUE}Step 5: Deployment configuration${NC}"

# Check if project name is already configured
if grep -q "CLOUDFLARE_PAGES_PROJECT" .env 2>/dev/null; then
  PROJECT_NAME=$(grep "CLOUDFLARE_PAGES_PROJECT" .env | cut -d'=' -f2 | tr -d '"' | tr -d "'")
  echo "Using project name from .env: $PROJECT_NAME"
else
  read -p "Enter Cloudflare Pages project name (default: bsi-main): " PROJECT_NAME
  PROJECT_NAME=${PROJECT_NAME:-bsi-main}
fi

echo "Project: $PROJECT_NAME"
echo ""

# Step 6: Build the project
echo -e "${BLUE}Step 6: Building project${NC}"
npm run build

if [ ! -d "dist" ]; then
  echo -e "${RED}✗ Build failed - dist/ directory not created${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Build completed${NC}"
echo ""

# Step 7: Deploy to Cloudflare Pages
echo -e "${BLUE}Step 7: Deploying to Cloudflare Pages${NC}"

# Check if project exists
if wrangler pages project list 2>&1 | grep -q "$PROJECT_NAME"; then
  echo "Project '$PROJECT_NAME' exists, deploying update..."
else
  echo "Project '$PROJECT_NAME' not found, creating..."
  wrangler pages project create "$PROJECT_NAME" --production-branch=main || true
fi

# Deploy
echo ""
echo "Deploying to Cloudflare Pages..."
if wrangler pages deploy dist --project-name="$PROJECT_NAME"; then
  echo ""
  echo -e "${GREEN}✓ Deployment successful!${NC}"
else
  echo ""
  echo -e "${RED}✗ Deployment failed${NC}"
  exit 1
fi

echo ""
echo "=================================="
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "=================================="
echo ""

# Get deployment URL
DEPLOYMENT_URL=$(wrangler pages deployment list --project-name="$PROJECT_NAME" 2>/dev/null | head -n 3 | tail -n 1 | awk '{print $4}' || echo "")

if [ -n "$DEPLOYMENT_URL" ]; then
  echo "Preview URL: $DEPLOYMENT_URL"
else
  echo "View your deployment at: https://$PROJECT_NAME.pages.dev"
fi

echo ""
echo "Production URL: https://blazesportsintel.com (once custom domain is configured)"
echo ""

# Next steps
echo "Next steps:"
echo "  1. Configure custom domain in Cloudflare Pages dashboard"
echo "  2. Set up GitHub Actions for automatic deployments"
echo "  3. Add environment variables if needed"
echo "  4. Monitor analytics in Cloudflare dashboard"
echo ""

# Offer to open in browser
read -p "Open in browser? (y/N): " OPEN_BROWSER
if [[ "$OPEN_BROWSER" =~ ^[Yy]$ ]]; then
  if [ -n "$DEPLOYMENT_URL" ]; then
    open "$DEPLOYMENT_URL" 2>/dev/null || xdg-open "$DEPLOYMENT_URL" 2>/dev/null || echo "Open manually: $DEPLOYMENT_URL"
  else
    open "https://$PROJECT_NAME.pages.dev" 2>/dev/null || xdg-open "https://$PROJECT_NAME.pages.dev" 2>/dev/null || echo "Open manually: https://$PROJECT_NAME.pages.dev"
  fi
fi

echo ""
echo "Deployment logs saved to: $(pwd)/deployment.log"
