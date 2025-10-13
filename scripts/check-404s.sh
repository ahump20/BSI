#!/bin/bash
#
# 404 Broken Link Checker
# Scans all HTML files and checks for broken internal links
#
# Usage: ./scripts/check-404s.sh [domain]
# Example: ./scripts/check-404s.sh https://blazesportsintel.com
#

set -euo pipefail

DOMAIN="${1:-https://blazesportsintel.com}"
RESULTS_FILE="archive/2025-10-13/routes/404-check-$(date +%Y%m%d-%H%M%S).txt"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

TOTAL=0
BROKEN=0
declare -A CHECKED_URLS

echo "🔥 BlazeSportsIntel 404 Checker"
echo "==============================="
echo ""
echo "Domain: $DOMAIN"
echo "Results: $RESULTS_FILE"
echo ""

mkdir -p "$(dirname "$RESULTS_FILE")"

{
  echo "BlazeSportsIntel 404 Check Report"
  echo "=================================="
  echo ""
  echo "Generated: $(date '+%Y-%m-%d %H:%M:%S %Z')"
  echo "Domain: $DOMAIN"
  echo ""
  echo "---"
  echo ""
} > "$RESULTS_FILE"

# Function to check URL
check_url() {
  local url="$1"
  local source="$2"

  # Skip if already checked
  if [[ -n "${CHECKED_URLS[$url]:-}" ]]; then
    return
  fi

  CHECKED_URLS[$url]=1
  TOTAL=$((TOTAL + 1))

  # Perform HEAD request
  status=$(curl -s -o /dev/null -w "%{http_code}" -L "$url" 2>&1) || status="000"

  if [[ "$status" == "404" ]] || [[ "$status" == "000" ]]; then
    echo -e "${RED}✗${NC} $url (from $source) → $status"
    echo "✗ BROKEN: $url (from $source) → $status" >> "$RESULTS_FILE"
    BROKEN=$((BROKEN + 1))
  elif [[ "$status" =~ ^[45] ]]; then
    echo -e "${YELLOW}⚠${NC} $url (from $source) → $status"
    echo "⚠ WARN: $url (from $source) → $status" >> "$RESULTS_FILE"
  else
    echo -e "${GREEN}✓${NC} $url → $status"
  fi
}

# Extract URLs from HTML files
echo "Scanning HTML files for internal links..."
echo ""

find . -name "*.html" \
  -not -path "./node_modules/*" \
  -not -path "./BSI-archive/*" \
  -not -path "./backups/*" \
  -not -path "./archive/*" \
  -type f | while read -r file; do

  # Extract href and src attributes
  grep -oE 'href="[^"#]+"' "$file" 2>/dev/null | sed 's/href="//;s/"//' | while read -r link; do
    # Skip external links, anchors, mailto, tel, javascript
    if [[ "$link" =~ ^(http|https|mailto|tel|javascript|#) ]]; then
      continue
    fi

    # Convert relative links to absolute
    if [[ "$link" == /* ]]; then
      url="${DOMAIN}${link}"
    else
      url="${DOMAIN}/${link}"
    fi

    check_url "$url" "$file"
  done

  grep -oE 'src="[^"#]+"' "$file" 2>/dev/null | sed 's/src="//;s/"//' | while read -r link; do
    if [[ "$link" =~ ^(http|https|data:|javascript:) ]]; then
      continue
    fi

    if [[ "$link" == /* ]]; then
      url="${DOMAIN}${link}"
    else
      url="${DOMAIN}/${link}"
    fi

    check_url "$url" "$file"
  done
done

# Check common paths
echo ""
echo "Checking common paths..."
echo ""

COMMON_PATHS=(
  "/"
  "/about"
  "/contact"
  "/legal/privacy"
  "/legal/terms"
  "/legal/accessibility"
  "/api/v1/health"
  "/baseball/ncaab"
)

for path in "${COMMON_PATHS[@]}"; do
  check_url "${DOMAIN}${path}" "common-paths"
done

# Summary
echo ""
echo "==============================="
echo "Summary"
echo "==============================="
echo -e "Total URLs:     $TOTAL"
echo -e "${GREEN}Working:${NC}        $((TOTAL - BROKEN))"
echo -e "${RED}Broken:${NC}         $BROKEN"
echo ""

{
  echo ""
  echo "---"
  echo ""
  echo "Summary"
  echo "-------"
  echo "Total:   $TOTAL"
  echo "Working: $((TOTAL - BROKEN))"
  echo "Broken:  $BROKEN"
} >> "$RESULTS_FILE"

if [[ $BROKEN -gt 0 ]]; then
  echo -e "${RED}❌ Found $BROKEN broken links${NC}"
  echo "See full report: $RESULTS_FILE"
  exit 1
else
  echo -e "${GREEN}✅ No broken links found${NC}"
  exit 0
fi
