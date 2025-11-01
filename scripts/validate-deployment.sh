#!/usr/bin/env bash
set -euo pipefail

# Deployment Validation Script
# Validates build output and deployment readiness for Cloudflare Pages

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🔍 Validating Cloudflare Pages Deployment"
echo "=========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to print status
print_status() {
  local status=$1
  local message=$2

  if [ "$status" == "ok" ]; then
    echo -e "${GREEN}✓${NC} $message"
  elif [ "$status" == "warn" ]; then
    echo -e "${YELLOW}⚠${NC} $message"
    ((WARNINGS++))
  else
    echo -e "${RED}✗${NC} $message"
    ((ERRORS++))
  fi
}

cd "$PROJECT_ROOT"

echo "1. Checking Prerequisites"
echo "-------------------------"

# Check Node.js
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v)
  print_status "ok" "Node.js installed: $NODE_VERSION"
else
  print_status "error" "Node.js not found"
fi

# Check npm
if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm -v)
  print_status "ok" "npm installed: $NPM_VERSION"
else
  print_status "error" "npm not found"
fi

# Check wrangler
if command -v wrangler &> /dev/null; then
  WRANGLER_VERSION=$(wrangler --version 2>&1 | head -n1 || echo "unknown")
  print_status "ok" "Wrangler installed: $WRANGLER_VERSION"
else
  print_status "warn" "Wrangler not found (optional for local deployment)"
fi

echo ""
echo "2. Checking Configuration Files"
echo "--------------------------------"

# Check package.json
if [ -f "package.json" ]; then
  print_status "ok" "package.json exists"

  # Check for build script
  if grep -q '"build"' package.json; then
    BUILD_SCRIPT=$(cat package.json | jq -r '.scripts.build')
    print_status "ok" "Build script found: $BUILD_SCRIPT"
  else
    print_status "error" "No build script in package.json"
  fi
else
  print_status "error" "package.json not found"
fi

# Check vite.config.js
if [ -f "vite.config.js" ]; then
  print_status "ok" "vite.config.js exists"

  # Check for copyCloudflareFiles plugin
  if grep -q "copyCloudflareFiles" vite.config.js; then
    print_status "ok" "Cloudflare files copy plugin configured"
  else
    print_status "warn" "_redirects and _headers may not be copied to dist/"
  fi
else
  print_status "warn" "vite.config.js not found"
fi

# Check _redirects
if [ -f "_redirects" ]; then
  print_status "ok" "_redirects file exists"
  REDIRECT_COUNT=$(grep -c "^[^#]" _redirects || echo 0)
  echo "   → $REDIRECT_COUNT redirect rules found"
else
  print_status "warn" "_redirects file not found (optional)"
fi

# Check _headers
if [ -f "_headers" ]; then
  print_status "ok" "_headers file exists"
else
  print_status "warn" "_headers file not found (optional)"
fi

# Check for Netlify files (should be removed)
if [ -f "netlify.toml" ]; then
  print_status "warn" "netlify.toml still exists (should be removed for Cloudflare-only deployment)"
fi

if [ -d ".netlify" ]; then
  print_status "warn" ".netlify directory exists (can be removed)"
fi

echo ""
echo "3. Checking Dependencies"
echo "------------------------"

if [ -f "package-lock.json" ]; then
  print_status "ok" "package-lock.json exists"
else
  print_status "warn" "package-lock.json not found (run npm install)"
fi

if [ -d "node_modules" ]; then
  print_status "ok" "node_modules directory exists"
else
  print_status "warn" "node_modules not found (run npm install)"
fi

echo ""
echo "4. Running Build Test"
echo "---------------------"

# Clean previous build
if [ -d "dist" ]; then
  echo "   → Cleaning previous build..."
  rm -rf dist
fi

# Run build
echo "   → Running npm run build..."
if npm run build > /tmp/build.log 2>&1; then
  print_status "ok" "Build succeeded"
else
  print_status "error" "Build failed (see /tmp/build.log)"
  cat /tmp/build.log
fi

echo ""
echo "5. Validating Build Output"
echo "--------------------------"

if [ -d "dist" ]; then
  print_status "ok" "dist/ directory created"

  # Check for HTML files
  HTML_COUNT=$(find dist -name "*.html" | wc -l)
  if [ "$HTML_COUNT" -gt 0 ]; then
    print_status "ok" "Found $HTML_COUNT HTML files"
    find dist -name "*.html" -exec basename {} \; | sed 's/^/   → /'
  else
    print_status "error" "No HTML files found in dist/"
  fi

  # Check for JS files
  JS_COUNT=$(find dist -name "*.js" | wc -l)
  if [ "$JS_COUNT" -gt 0 ]; then
    print_status "ok" "Found $JS_COUNT JavaScript files"
  else
    print_status "warn" "No JavaScript files found"
  fi

  # Check for CSS files
  CSS_COUNT=$(find dist -name "*.css" | wc -l)
  if [ "$CSS_COUNT" -gt 0 ]; then
    print_status "ok" "Found $CSS_COUNT CSS files"
  else
    print_status "warn" "No CSS files found"
  fi

  # Check for _redirects
  if [ -f "dist/_redirects" ]; then
    print_status "ok" "_redirects copied to dist/"
  else
    print_status "warn" "_redirects NOT in dist/ (Cloudflare may not apply redirects)"
  fi

  # Check for _headers
  if [ -f "dist/_headers" ]; then
    print_status "ok" "_headers copied to dist/"
  else
    print_status "warn" "_headers NOT in dist/ (Custom headers may not apply)"
  fi

  # Check dist size
  DIST_SIZE=$(du -sh dist | cut -f1)
  print_status "ok" "Build size: $DIST_SIZE"

else
  print_status "error" "dist/ directory not created"
fi

echo ""
echo "6. Checking GitHub Actions Workflow"
echo "------------------------------------"

if [ -f ".github/workflows/deploy-pages.yml" ]; then
  print_status "ok" "GitHub Actions workflow exists"

  # Check for required secrets in workflow
  if grep -q "CLOUDFLARE_API_TOKEN" .github/workflows/deploy-pages.yml; then
    print_status "ok" "Workflow uses CLOUDFLARE_API_TOKEN"
  else
    print_status "error" "Workflow missing CLOUDFLARE_API_TOKEN"
  fi

  if grep -q "CLOUDFLARE_ACCOUNT_ID" .github/workflows/deploy-pages.yml; then
    print_status "ok" "Workflow uses CLOUDFLARE_ACCOUNT_ID"
  else
    print_status "error" "Workflow missing CLOUDFLARE_ACCOUNT_ID"
  fi

else
  print_status "error" "GitHub Actions workflow not found"
fi

echo ""
echo "7. Security Check"
echo "-----------------"

# Check for exposed secrets
if grep -r -i "sk-" . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git 2>/dev/null; then
  print_status "error" "Potential API keys found in code"
else
  print_status "ok" "No obvious API keys in code"
fi

# Check .gitignore
if [ -f ".gitignore" ]; then
  print_status "ok" ".gitignore exists"

  if grep -q ".env" .gitignore; then
    print_status "ok" ".env files ignored"
  else
    print_status "warn" ".env not in .gitignore"
  fi

  if grep -q "dist/" .gitignore; then
    print_status "ok" "dist/ ignored"
  else
    print_status "warn" "dist/ not in .gitignore (build artifacts should not be committed)"
  fi
else
  print_status "warn" ".gitignore not found"
fi

echo ""
echo "=========================================="
echo "Validation Summary"
echo "=========================================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✓ All checks passed!${NC}"
  echo ""
  echo "Ready to deploy to Cloudflare Pages!"
  echo ""
  echo "Next steps:"
  echo "  1. Run: ./scripts/init-cloudflare-ci.sh"
  echo "  2. Create Cloudflare Pages project: wrangler pages project create bsi-main"
  echo "  3. Push to main branch or open a PR"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠ Validation completed with $WARNINGS warnings${NC}"
  echo ""
  echo "Warnings detected but deployment should work."
  echo "Review warnings above and fix if necessary."
  exit 0
else
  echo -e "${RED}✗ Validation failed with $ERRORS errors and $WARNINGS warnings${NC}"
  echo ""
  echo "Fix errors above before deploying."
  exit 1
fi
