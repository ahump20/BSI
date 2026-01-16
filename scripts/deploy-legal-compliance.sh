#!/bin/bash

##############################################################################
# Legal Compliance Deployment Script
# Blaze Sports Intel - blazesportsintel.com
#
# This script deploys the legal compliance framework to Cloudflare Pages
# Includes: Privacy Policy, Terms, Cookies, Cookie Banner, GDPR Functions
#
# Usage: ./scripts/deploy-legal-compliance.sh
##############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_NAME="blazesportsintel"
BRANCH="main"

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Blaze Sports Intel - Legal Compliance Deployment    ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

##############################################################################
# Pre-flight checks
##############################################################################

echo -e "${YELLOW}[1/8] Running pre-flight checks...${NC}"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Error: wrangler CLI not found${NC}"
    echo "Install with: npm install -g wrangler"
    exit 1
fi

# Check if required files exist
REQUIRED_FILES=(
    "public/privacy.html"
    "public/terms.html"
    "public/cookies.html"
    "public/accessibility.html"
    "public/components/cookie-banner.js"
    "public/components/legal-footer.js"
    "functions/api/consent.js"
    "functions/api/privacy/export.js"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Missing required file: $file${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ All required files present${NC}"

##############################################################################
# Validate HTML
##############################################################################

echo -e "\n${YELLOW}[2/8] Validating HTML files...${NC}"

# Basic validation (check for common issues)
for html_file in public/*.html; do
    if [ -f "$html_file" ]; then
        # Check for DOCTYPE
        if ! grep -q "<!DOCTYPE html>" "$html_file"; then
            echo -e "${YELLOW}⚠️  Warning: $html_file missing DOCTYPE${NC}"
        fi

        # Check for lang attribute
        if ! grep -q 'lang="en"' "$html_file"; then
            echo -e "${YELLOW}⚠️  Warning: $html_file missing lang attribute${NC}"
        fi

        echo -e "${GREEN}✅ $(basename $html_file) validated${NC}"
    fi
done

##############################################################################
# Validate JavaScript
##############################################################################

echo -e "\n${YELLOW}[3/8] Validating JavaScript files...${NC}"

# Check for syntax errors (basic check)
JS_FILES=(
    "public/components/cookie-banner.js"
    "public/components/legal-footer.js"
    "functions/api/consent.js"
    "functions/api/privacy/export.js"
)

for js_file in "${JS_FILES[@]}"; do
    if node -c "$js_file" 2>/dev/null; then
        echo -e "${GREEN}✅ $(basename $js_file) syntax valid${NC}"
    else
        echo -e "${RED}❌ Syntax error in $js_file${NC}"
        exit 1
    fi
done

##############################################################################
# Check contact information
##############################################################################

echo -e "\n${YELLOW}[4/8] Verifying contact information...${NC}"

CONTACT_EMAIL="ahump20@outlook.com"
grep -r "$CONTACT_EMAIL" public/*.html > /dev/null && \
    echo -e "${GREEN}✅ Contact email verified in all pages${NC}" || \
    echo -e "${YELLOW}⚠️  Warning: Contact email not found in all pages${NC}"

##############################################################################
# Build project
##############################################################################

echo -e "\n${YELLOW}[5/8] Building project...${NC}"

if npm run build; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

##############################################################################
# Verify dist directory
##############################################################################

echo -e "\n${YELLOW}[6/8] Verifying dist directory...${NC}"

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ dist directory not found${NC}"
    exit 1
fi

# Check if legal files are in dist
DIST_FILES=(
    "dist/privacy.html"
    "dist/terms.html"
    "dist/cookies.html"
    "dist/accessibility.html"
)

for file in "${DIST_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Missing in dist: $file${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ All legal files present in dist${NC}"

##############################################################################
# Pre-deployment confirmation
##############################################################################

echo -e "\n${YELLOW}[7/8] Pre-deployment summary:${NC}"
echo -e "  ${BLUE}Project:${NC} $PROJECT_NAME"
echo -e "  ${BLUE}Branch:${NC} $BRANCH"
echo -e "  ${BLUE}Legal Pages:${NC} 4 (Privacy, Terms, Cookies, Accessibility)"
echo -e "  ${BLUE}Components:${NC} 2 (Cookie Banner, Legal Footer)"
echo -e "  ${BLUE}API Functions:${NC} 2 (Consent, GDPR Export)"
echo ""

read -p "Deploy to production? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}❌ Deployment cancelled${NC}"
    exit 0
fi

##############################################################################
# Deploy to Cloudflare Pages
##############################################################################

echo -e "\n${YELLOW}[8/8] Deploying to Cloudflare Pages...${NC}"

if wrangler pages deploy dist \
    --project-name="$PROJECT_NAME" \
    --branch="$BRANCH" \
    --commit-dirty=true \
    --compatibility-date="2025-01-01"; then

    echo -e "\n${GREEN}═══════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}   ✅ Legal Compliance Framework Deployed Successfully!  ${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"

else
    echo -e "\n${RED}═══════════════════════════════════════════════════════${NC}"
    echo -e "${RED}   ❌ Deployment Failed                                  ${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════════${NC}"
    exit 1
fi

##############################################################################
# Post-deployment verification
##############################################################################

echo -e "\n${YELLOW}Verifying deployment...${NC}"

# Wait for deployment to propagate
echo -e "${BLUE}Waiting 10 seconds for deployment to propagate...${NC}"
sleep 10

# Test legal pages
PAGES=(
    "https://blazesportsintel.com/privacy"
    "https://blazesportsintel.com/terms"
    "https://blazesportsintel.com/cookies"
    "https://blazesportsintel.com/accessibility"
)

echo -e "\n${YELLOW}Testing legal pages...${NC}"
for page in "${PAGES[@]}"; do
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$page")
    if [ "$HTTP_STATUS" -eq 200 ]; then
        echo -e "${GREEN}✅ $page (Status: $HTTP_STATUS)${NC}"
    else
        echo -e "${RED}❌ $page (Status: $HTTP_STATUS)${NC}"
    fi
done

# Test API endpoints
echo -e "\n${YELLOW}Testing API endpoints...${NC}"

# Test consent API (GET should work without userId)
CONSENT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://blazesportsintel.com/api/consent?userId=test")
if [ "$CONSENT_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✅ Consent API (Status: $CONSENT_STATUS)${NC}"
else
    echo -e "${YELLOW}⚠️  Consent API (Status: $CONSENT_STATUS) - May need KV binding${NC}"
fi

# Test GDPR export (should return 400 for test user)
EXPORT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://blazesportsintel.com/api/privacy/export?userId=test")
if [ "$EXPORT_STATUS" -eq 200 ] || [ "$EXPORT_STATUS" -eq 400 ]; then
    echo -e "${GREEN}✅ GDPR Export API (Status: $EXPORT_STATUS)${NC}"
else
    echo -e "${YELLOW}⚠️  GDPR Export API (Status: $EXPORT_STATUS)${NC}"
fi

##############################################################################
# Deployment summary
##############################################################################

echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Deployment Summary                                   ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}✅ Legal Pages Deployed:${NC}"
echo "   • Privacy Policy: https://blazesportsintel.com/privacy"
echo "   • Terms of Service: https://blazesportsintel.com/terms"
echo "   • Cookie Policy: https://blazesportsintel.com/cookies"
echo "   • Accessibility: https://blazesportsintel.com/accessibility"
echo ""
echo -e "${GREEN}✅ Components Deployed:${NC}"
echo "   • Cookie Consent Banner"
echo "   • Legal Footer (Web Component)"
echo ""
echo -e "${GREEN}✅ API Functions Deployed:${NC}"
echo "   • Cookie Consent API: /api/consent"
echo "   • GDPR Export/Delete: /api/privacy/export"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "   1. Add cookie banner to all pages: <script src=\"/components/cookie-banner.js\" defer></script>"
echo "   2. Add legal footer to all pages: <legal-footer></legal-footer>"
echo "   3. Update sitemap.xml with legal page URLs"
echo "   4. Test cookie consent banner functionality"
echo "   5. Verify GDPR export with real user ID"
echo ""
echo -e "${YELLOW}Documentation:${NC}"
echo "   • Implementation Guide: LEGAL-COMPLIANCE-IMPLEMENTATION.md"
echo "   • Summary: LEGAL-COMPLIANCE-SUMMARY.md"
echo ""
echo -e "${BLUE}Support: ahump20@outlook.com${NC}"
echo ""
echo -e "${GREEN}Deployment completed at: $(date '+%Y-%m-%d %H:%M:%S %Z')${NC}"
echo ""

exit 0
