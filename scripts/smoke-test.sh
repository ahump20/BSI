#!/usr/bin/env bash
# BSI Production Smoke Test
# Verifies all critical routes and API endpoints return expected responses.
# Usage: ./scripts/smoke-test.sh

set -euo pipefail

DOMAIN="https://blazesportsintel.com"
PASS=0
FAIL=0
TOTAL=0

check() {
  local url="$1"
  local expected_code="${2:-200}"
  local label="${3:-$url}"
  TOTAL=$((TOTAL + 1))

  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$url" 2>/dev/null || echo "000")

  if [ "$code" = "$expected_code" ]; then
    echo "  [PASS] $label → $code"
    PASS=$((PASS + 1))
  else
    echo "  [FAIL] $label → $code (expected $expected_code)"
    FAIL=$((FAIL + 1))
  fi
}

check_json() {
  local url="$1"
  local label="${2:-$url}"
  TOTAL=$((TOTAL + 1))

  response=$(curl -s --max-time 15 "$url" 2>/dev/null || echo "")
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$url" 2>/dev/null || echo "000")

  if [ "$code" = "200" ] && echo "$response" | python3 -c "import sys,json; json.load(sys.stdin)" 2>/dev/null; then
    echo "  [PASS] $label → 200 (valid JSON)"
    PASS=$((PASS + 1))
  else
    echo "  [FAIL] $label → $code (expected 200 + JSON)"
    FAIL=$((FAIL + 1))
  fi
}

echo "=========================================="
echo " BSI Production Smoke Test"
echo "=========================================="
echo ""

echo "--- Page Routes ---"
check "$DOMAIN/" 200 "Homepage"
check "$DOMAIN/scores/" 200 "Scores"
check "$DOMAIN/college-baseball/" 200 "College Baseball"
check "$DOMAIN/college-baseball/savant/" 200 "Savant Explorer"
check "$DOMAIN/mlb/" 200 "MLB"
check "$DOMAIN/nfl/" 200 "NFL"
check "$DOMAIN/nba/" 200 "NBA"
check "$DOMAIN/cfb/" 200 "College Football"
check "$DOMAIN/about/" 200 "About"
check "$DOMAIN/intel/" 200 "Intel"
check "$DOMAIN/pricing/" 200 "Pricing"
check "$DOMAIN/search/" 200 "Search"

echo ""
echo "--- 404 Handling ---"
check "$DOMAIN/this-route-does-not-exist/" 404 "404 test"

echo ""
echo "--- API Endpoints ---"
check_json "$DOMAIN/api/savant/batting/leaderboard?limit=3" "Savant Batting"
check_json "$DOMAIN/api/savant/pitching/leaderboard?limit=3" "Savant Pitching"
check_json "$DOMAIN/api/savant/park-factors" "Park Factors"
check_json "$DOMAIN/api/savant/conference-strength" "Conference Strength"
check "$DOMAIN/health" 200 "Health"

echo ""
echo "--- MCP ---"
check_json "https://sabermetrics.blazesportsintel.com/v1/leaderboard?metric=woba&type=batting&limit=3" "MCP Leaderboard"
check "https://sabermetrics.blazesportsintel.com/health" 200 "MCP Health"

echo ""
echo "=========================================="
echo " Results: $PASS passed / $FAIL failed / $TOTAL total"
echo "=========================================="

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
