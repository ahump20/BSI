#!/usr/bin/env bash
#===============================================================================
# BSI Cloudflare Pages Rollback Script
#===============================================================================
# Purpose: Quick rollback to last known good deployment
# Usage: ./scripts/rollback.sh [deployment-id]
#
# If deployment-id is not provided, shows recent deployments and prompts
#===============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="college-baseball-tracker"
LAST_KNOWN_GOOD="ec0c6db6"  # Last verified working deployment (2025-11-20)

#===============================================================================
# Functions
#===============================================================================

print_header() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  BSI Cloudflare Pages Rollback Tool${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

check_wrangler() {
  if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ ERROR: wrangler CLI not found${NC}"
    echo ""
    echo "Install wrangler:"
    echo "  npm install -g wrangler"
    echo ""
    exit 1
  fi
}

list_deployments() {
  echo -e "${YELLOW}📋 Recent Deployments:${NC}"
  echo ""

  wrangler pages deployment list --project-name "$PROJECT_NAME" 2>/dev/null || {
    echo -e "${RED}❌ Failed to list deployments${NC}"
    echo ""
    echo "Make sure you're authenticated:"
    echo "  wrangler login"
    echo ""
    exit 1
  }
}

get_current_deployment() {
  echo -e "${BLUE}🔍 Checking current deployment...${NC}"

  # Get current deployment URL
  CURRENT_URL="https://$PROJECT_NAME.pages.dev"

  # Test if it's responding
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$CURRENT_URL" 2>/dev/null || echo "000")

  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Current deployment is responding (HTTP $HTTP_CODE)${NC}"
  else
    echo -e "${RED}⚠️  Current deployment issue (HTTP $HTTP_CODE)${NC}"
  fi

  echo ""
}

test_deployment() {
  local deployment_id=$1
  local test_url="https://${deployment_id}.${PROJECT_NAME}.pages.dev"

  echo -e "${BLUE}🧪 Testing deployment: $deployment_id${NC}"
  echo "   URL: $test_url"
  echo ""

  # Test homepage
  echo -n "   Testing homepage... "
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$test_url/" 2>/dev/null || echo "000")

  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ HTTP $HTTP_CODE${NC}"
  else
    echo -e "${RED}❌ HTTP $HTTP_CODE${NC}"
    return 1
  fi

  # Test API endpoint
  echo -n "   Testing /api/live-games... "
  API_RESPONSE=$(curl -s "$test_url/api/live-games" 2>/dev/null || echo '{"success": false}')
  API_SUCCESS=$(echo "$API_RESPONSE" | jq -r '.success // "false"' 2>/dev/null || echo "false")

  if [ "$API_SUCCESS" = "true" ]; then
    echo -e "${GREEN}✅ API working${NC}"
  else
    echo -e "${RED}❌ API failed${NC}"
    return 1
  fi

  echo ""
  return 0
}

rollback_to_deployment() {
  local deployment_id=$1

  echo -e "${YELLOW}🔄 Rolling back to deployment: $deployment_id${NC}"
  echo ""

  # Test the target deployment first
  if ! test_deployment "$deployment_id"; then
    echo -e "${RED}❌ Target deployment failed health checks!${NC}"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo "Rollback cancelled."
      exit 1
    fi
  fi

  echo -e "${BLUE}📝 Rollback Method:${NC}"
  echo ""
  echo "Since Cloudflare Pages doesn't support direct deployment promotion,"
  echo "the recommended rollback method is:"
  echo ""
  echo "1. Find the git commit for this deployment"
  echo "2. Create a new deployment from that commit"
  echo ""

  # Try to find the git commit
  echo -e "${BLUE}🔍 Searching for git commit...${NC}"

  # Check git log for the deployment ID
  GIT_COMMIT=$(git log --all --oneline --grep="$deployment_id" 2>/dev/null | head -1 | awk '{print $1}' || echo "")

  if [ -n "$GIT_COMMIT" ]; then
    echo -e "${GREEN}✅ Found commit: $GIT_COMMIT${NC}"
    echo ""
    git log -1 --pretty=format:"%h - %s (%ci)" "$GIT_COMMIT"
    echo ""
    echo ""

    echo -e "${YELLOW}🚀 Rollback Options:${NC}"
    echo ""
    echo "Option 1: Revert and push (creates new commit)"
    echo "  git revert HEAD --no-edit"
    echo "  git push origin main"
    echo ""
    echo "Option 2: Reset to commit (rewrites history - use with caution)"
    echo "  git reset --hard $GIT_COMMIT"
    echo "  git push origin main --force"
    echo ""
    echo "Option 3: Manual deployment from commit"
    echo "  git checkout $GIT_COMMIT"
    echo "  npm run build"
    echo "  wrangler pages deploy dist --project-name $PROJECT_NAME --branch main"
    echo ""

    read -p "Execute Option 3 (manual deployment)? (y/N): " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
      echo -e "${BLUE}📦 Checking out commit $GIT_COMMIT...${NC}"
      git checkout "$GIT_COMMIT"

      echo -e "${BLUE}🔨 Building...${NC}"
      npm run build

      echo -e "${BLUE}🚀 Deploying...${NC}"
      wrangler pages deploy dist --project-name "$PROJECT_NAME" --branch main --commit-dirty=true

      echo ""
      echo -e "${GREEN}✅ Rollback deployment complete!${NC}"
      echo ""
      echo "Verify the deployment at:"
      echo "  https://$PROJECT_NAME.pages.dev"
      echo ""

      # Return to previous branch
      git checkout -
    fi
  else
    echo -e "${YELLOW}⚠️  Could not find git commit for deployment $deployment_id${NC}"
    echo ""
    echo "Manual rollback required. Check git history:"
    echo "  git log --oneline --all | grep -i $deployment_id"
    echo ""
  fi
}

show_last_known_good() {
  echo -e "${GREEN}📌 Last Known Good Deployment:${NC}"
  echo ""
  echo "   ID:  $LAST_KNOWN_GOOD"
  echo "   URL: https://${LAST_KNOWN_GOOD}.${PROJECT_NAME}.pages.dev"
  echo "   Verified: 2025-11-20"
  echo "   Status: ✅ All endpoints working"
  echo ""
  echo "Key features verified:"
  echo "   ✅ Homepage (HTTP 200)"
  echo "   ✅ /api/live-games (ESPN real-time data)"
  echo "   ✅ /api/health (health check)"
  echo "   ✅ /api/nba-standings"
  echo "   ✅ /api/nfl?view=standings"
  echo ""
}

#===============================================================================
# Main Script
#===============================================================================

print_header

check_wrangler

# Parse arguments
if [ $# -eq 0 ]; then
  # No arguments - show menu
  show_last_known_good

  get_current_deployment

  list_deployments

  echo ""
  echo -e "${YELLOW}Options:${NC}"
  echo "  1. Rollback to last known good ($LAST_KNOWN_GOOD)"
  echo "  2. Rollback to specific deployment (enter ID)"
  echo "  3. Just show deployment info (no rollback)"
  echo "  4. Exit"
  echo ""
  read -p "Choose option (1-4): " -n 1 -r
  echo ""
  echo ""

  case $REPLY in
    1)
      rollback_to_deployment "$LAST_KNOWN_GOOD"
      ;;
    2)
      read -p "Enter deployment ID: " DEPLOYMENT_ID
      rollback_to_deployment "$DEPLOYMENT_ID"
      ;;
    3)
      echo "No rollback performed."
      exit 0
      ;;
    4)
      echo "Exiting."
      exit 0
      ;;
    *)
      echo "Invalid option."
      exit 1
      ;;
  esac

else
  # Deployment ID provided as argument
  DEPLOYMENT_ID=$1
  rollback_to_deployment "$DEPLOYMENT_ID"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Rollback Complete${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
