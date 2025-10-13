#!/bin/bash
#
# Redirect Consistency Validator
# Validates all redirects from RedirectMap.csv against deployed site
#
# Usage: ./scripts/check-301-consistency.sh [domain]
# Example: ./scripts/check-301-consistency.sh https://blazesportsintel.com
#

set -euo pipefail

DOMAIN="${1:-https://blazesportsintel.com}"
REDIRECT_MAP="product/ux/RedirectMap.csv"
RESULTS_FILE="archive/2025-10-13/routes/redirect-validation-$(date +%Y%m%d-%H%M%S).txt"

# Colors
RED='\033[0:31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL=0
PASSED=0
FAILED=0
WARNINGS=0

echo "🔥 BlazeSportsIntel Redirect Validator"
echo "======================================"
echo ""
echo "Domain: $DOMAIN"
echo "Redirect Map: $REDIRECT_MAP"
echo "Results: $RESULTS_FILE"
echo ""

# Ensure results directory exists
mkdir -p "$(dirname "$RESULTS_FILE")"

# Initialize results file
{
  echo "BlazeSportsIntel Redirect Validation Report"
  echo "==========================================="
  echo ""
  echo "Generated: $(date '+%Y-%m-%d %H:%M:%S %Z')"
  echo "Domain: $DOMAIN"
  echo ""
  echo "---"
  echo ""
} > "$RESULTS_FILE"

# Skip header line and process CSV
tail -n +2 "$REDIRECT_MAP" | while IFS=',' read -r legacy_path new_path status_code reason; do
  TOTAL=$((TOTAL + 1))

  # Clean paths (remove quotes if present)
  legacy_path=$(echo "$legacy_path" | tr -d '"')
  new_path=$(echo "$new_path" | tr -d '"')
  status_code=$(echo "$status_code" | tr -d '"')
  reason=$(echo "$reason" | tr -d '"')

  # Test URL
  test_url="${DOMAIN}${legacy_path}"

  # Perform HEAD request and capture response
  response=$(curl -s -o /dev/null -w "%{http_code}|%{redirect_url}" -L "$test_url" 2>&1) || true

  actual_status=$(echo "$response" | cut -d'|' -f1)
  actual_redirect=$(echo "$response" | cut -d'|' -f2)

  # Normalize redirect URL (remove domain for comparison)
  if [[ "$actual_redirect" == "$DOMAIN"* ]]; then
    actual_redirect="${actual_redirect#$DOMAIN}"
  fi

  # Validate
  if [[ "$status_code" == "200" ]]; then
    # Expecting 200 OK (no redirect)
    if [[ "$actual_status" == "200" ]]; then
      echo -e "${GREEN}✓${NC} $legacy_path → 200 OK"
      echo "✓ PASS: $legacy_path → 200 OK" >> "$RESULTS_FILE"
      PASSED=$((PASSED + 1))
    else
      echo -e "${RED}✗${NC} $legacy_path → Expected 200, got $actual_status"
      echo "✗ FAIL: $legacy_path → Expected 200, got $actual_status" >> "$RESULTS_FILE"
      FAILED=$((FAILED + 1))
    fi
  elif [[ "$status_code" == "301" ]] || [[ "$status_code" == "302" ]]; then
    # Expecting redirect
    if [[ "$actual_status" =~ ^(301|302|307|308)$ ]]; then
      if [[ "$actual_redirect" == "$new_path" ]] || [[ "$actual_redirect" == "${DOMAIN}${new_path}" ]]; then
        echo -e "${GREEN}✓${NC} $legacy_path → $actual_status → $new_path"
        echo "✓ PASS: $legacy_path → $actual_status → $new_path" >> "$RESULTS_FILE"
        PASSED=$((PASSED + 1))
      else
        echo -e "${YELLOW}⚠${NC} $legacy_path → $actual_status → $actual_redirect (expected $new_path)"
        echo "⚠ WARN: $legacy_path → $actual_status → $actual_redirect (expected $new_path)" >> "$RESULTS_FILE"
        WARNINGS=$((WARNINGS + 1))
      fi
    else
      echo -e "${RED}✗${NC} $legacy_path → Expected $status_code, got $actual_status"
      echo "✗ FAIL: $legacy_path → Expected $status_code, got $actual_status" >> "$RESULTS_FILE"
      FAILED=$((FAILED + 1))
    fi
  elif [[ "$status_code" == "410" ]]; then
    # Expecting 410 Gone
    if [[ "$actual_status" == "410" ]] || [[ "$actual_status" == "404" ]]; then
      echo -e "${GREEN}✓${NC} $legacy_path → $actual_status (Gone)"
      echo "✓ PASS: $legacy_path → $actual_status (Gone)" >> "$RESULTS_FILE"
      PASSED=$((PASSED + 1))
    else
      echo -e "${RED}✗${NC} $legacy_path → Expected 410/404, got $actual_status"
      echo "✗ FAIL: $legacy_path → Expected 410/404, got $actual_status" >> "$RESULTS_FILE"
      FAILED=$((FAILED + 1))
    fi
  else
    echo -e "${YELLOW}⚠${NC} $legacy_path → Unknown status code $status_code"
    echo "⚠ WARN: $legacy_path → Unknown status code $status_code" >> "$RESULTS_FILE"
    WARNINGS=$((WARNINGS + 1))
  fi
done

# Summary
echo ""
echo "======================================"
echo "Summary"
echo "======================================"
echo -e "Total Tests:    $TOTAL"
echo -e "${GREEN}Passed:${NC}         $PASSED"
echo -e "${RED}Failed:${NC}         $FAILED"
echo -e "${YELLOW}Warnings:${NC}       $WARNINGS"
echo ""

# Append summary to results file
{
  echo ""
  echo "---"
  echo ""
  echo "Summary"
  echo "-------"
  echo "Total:    $TOTAL"
  echo "Passed:   $PASSED"
  echo "Failed:   $FAILED"
  echo "Warnings: $WARNINGS"
} >> "$RESULTS_FILE"

# Exit with failure if any tests failed
if [[ $FAILED -gt 0 ]]; then
  echo -e "${RED}❌ Validation FAILED${NC}"
  echo "See full report: $RESULTS_FILE"
  exit 1
else
  echo -e "${GREEN}✅ Validation PASSED${NC}"
  if [[ $WARNINGS -gt 0 ]]; then
    echo -e "${YELLOW}⚠ $WARNINGS warnings (review recommended)${NC}"
  fi
  exit 0
fi
