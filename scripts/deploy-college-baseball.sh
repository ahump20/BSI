#!/bin/bash

###############################################################################
# College Baseball Demo - Production Deployment Script
#
# This script automates the deployment process for the college baseball
# demo upgrade to production.
#
# Usage:
#   ./scripts/deploy-college-baseball.sh [--dry-run] [--skip-tests]
#
# Requirements:
#   - Node.js v18+
#   - wrangler CLI
#   - Git repository
#   - Cloudflare account access
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Deployment configuration
PROJECT_NAME="blazesportsintel"
BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)
DRY_RUN=false
SKIP_TESTS=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [--dry-run] [--skip-tests]"
      echo ""
      echo "Options:"
      echo "  --dry-run     Run all checks but don't actually deploy"
      echo "  --skip-tests  Skip running the test suite"
      echo "  -h, --help    Show this help message"
      exit 0
      ;;
  esac
done

###############################################################################
# Helper Functions
###############################################################################

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

check_command() {
  if ! command -v $1 &> /dev/null; then
    log_error "$1 is not installed"
    exit 1
  fi
}

###############################################################################
# Pre-flight Checks
###############################################################################

log_info "Starting College Baseball Demo Deployment"
echo ""

log_info "Running pre-flight checks..."

# Check required commands
check_command node
check_command git
check_command wrangler

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  log_error "Node.js version 18 or higher required (found: $(node -v))"
  exit 1
fi
log_success "Node.js version OK: $(node -v)"

# Check Git status
if [[ -n $(git status -s) ]]; then
  log_warning "You have uncommitted changes:"
  git status -s
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Deployment cancelled"
    exit 0
  fi
fi

# Check branch
log_info "Current branch: $BRANCH_NAME"

# Check if wrangler is authenticated
if ! wrangler whoami &> /dev/null; then
  log_error "Wrangler not authenticated. Run: wrangler login"
  exit 1
fi
log_success "Wrangler authenticated"

echo ""

###############################################################################
# Run Tests
###############################################################################

if [ "$SKIP_TESTS" = false ]; then
  log_info "Running test suite..."

  if [ -f "scripts/test-college-baseball-apis.js" ]; then
    # Run tests in production mode
    if node scripts/test-college-baseball-apis.js --production; then
      log_success "All tests passed!"
    else
      log_error "Tests failed!"
      read -p "Deploy anyway? (y/n) " -n 1 -r
      echo
      if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelled"
        exit 1
      fi
    fi
  else
    log_warning "Test script not found, skipping tests"
  fi
else
  log_warning "Skipping tests (--skip-tests flag)"
fi

echo ""

###############################################################################
# Build
###############################################################################

log_info "Building project..."

# Check if package.json exists
if [ -f "package.json" ]; then
  # Install dependencies if node_modules doesn't exist
  if [ ! -d "node_modules" ]; then
    log_info "Installing dependencies..."
    npm install
  fi

  # Run build if script exists
  if grep -q '"build"' package.json; then
    npm run build
    log_success "Build completed"
  else
    log_warning "No build script found in package.json"
  fi
else
  log_warning "No package.json found, skipping build"
fi

echo ""

###############################################################################
# Deployment
###############################################################################

if [ "$DRY_RUN" = true ]; then
  log_warning "DRY RUN MODE - No actual deployment will occur"
  log_info "Would deploy to: $PROJECT_NAME"
  log_info "From branch: $BRANCH_NAME"
  echo ""
  log_success "Dry run completed successfully!"
  exit 0
fi

log_info "Deploying to Cloudflare Pages..."

# Deploy to Cloudflare Pages
DEPLOY_OUTPUT=$(wrangler pages deploy dist --project-name=$PROJECT_NAME 2>&1)
DEPLOY_STATUS=$?

if [ $DEPLOY_STATUS -eq 0 ]; then
  log_success "Deployment completed!"

  # Extract deployment URL from output
  DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -o 'https://[^[:space:]]*' | head -1)

  if [ -n "$DEPLOY_URL" ]; then
    echo ""
    log_success "Deployment URL: $DEPLOY_URL"
  fi
else
  log_error "Deployment failed!"
  echo "$DEPLOY_OUTPUT"
  exit 1
fi

echo ""

###############################################################################
# Post-Deployment Verification
###############################################################################

log_info "Running post-deployment verification..."

# Wait a few seconds for deployment to propagate
sleep 5

# Test production API
log_info "Testing production API endpoints..."

# Test Games API
GAMES_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://blazesportsintel.com/api/college-baseball/games")
if [ "$GAMES_STATUS" = "200" ]; then
  log_success "Games API: OK (HTTP $GAMES_STATUS)"
else
  log_error "Games API: FAILED (HTTP $GAMES_STATUS)"
fi

# Test Demo Page
DEMO_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://blazesportsintel.com/college-baseball-demo.html")
if [ "$DEMO_STATUS" = "200" ]; then
  log_success "Demo Page: OK (HTTP $DEMO_STATUS)"
else
  log_error "Demo Page: FAILED (HTTP $DEMO_STATUS)"
fi

# Test API Status Dashboard
STATUS_DASH=$(curl -s -o /dev/null -w "%{http_code}" "https://blazesportsintel.com/api-status.html")
if [ "$STATUS_DASH" = "200" ]; then
  log_success "API Status Dashboard: OK (HTTP $STATUS_DASH)"
else
  log_error "API Status Dashboard: FAILED (HTTP $STATUS_DASH)"
fi

echo ""

###############################################################################
# Summary
###############################################################################

log_success "Deployment Summary:"
echo ""
echo "  Project:  $PROJECT_NAME"
echo "  Branch:   $BRANCH_NAME"
echo "  Status:   DEPLOYED ✓"
echo ""
echo "  URLs:"
echo "    Demo:      https://blazesportsintel.com/college-baseball-demo.html"
echo "    Dashboard: https://blazesportsintel.com/api-status.html"
echo "    API:       https://blazesportsintel.com/api/college-baseball/"
echo ""

log_info "Next steps:"
echo "  1. Check API status dashboard: https://blazesportsintel.com/api-status.html"
echo "  2. Run full test suite: node scripts/test-college-baseball-apis.js --production"
echo "  3. Monitor Cloudflare Analytics: https://dash.cloudflare.com"
echo "  4. Review deployment logs: wrangler pages deployment tail"
echo ""

log_success "Deployment completed successfully!"
