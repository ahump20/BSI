#!/bin/bash
# BSI College Baseball Smoke Tests
# Usage: ./scripts/smoke-cbb.sh [local|staging|prod]
#
# Tests all CBB API endpoints and verifies basic functionality.
# Run after deployment to verify workers are healthy.

set -e

# Configuration
ENV="${1:-local}"
case "$ENV" in
  local)
    BASE_URL="http://localhost:8791"
    ;;
  staging)
    BASE_URL="https://bsi-cbb-gateway-staging.blazesportsintel.workers.dev"
    ;;
  prod|production)
    BASE_URL="https://api.blazesportsintel.com"
    ;;
  *)
    echo "Usage: $0 [local|staging|prod]"
    exit 1
    ;;
esac

echo "=========================================="
echo "BSI College Baseball Smoke Tests"
echo "Environment: $ENV"
echo "Base URL: $BASE_URL"
echo "=========================================="
echo ""

PASSED=0
FAILED=0

# Test helper function
test_endpoint() {
  local name="$1"
  local endpoint="$2"
  local expected_status="${3:-200}"

  printf "Testing %-30s ... " "$name"

  response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint" 2>/dev/null)
  status=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$status" -eq "$expected_status" ]; then
    echo "PASS ($status)"
    ((PASSED++))
    return 0
  else
    echo "FAIL (expected $expected_status, got $status)"
    echo "   Response: $(echo "$body" | head -c 200)"
    ((FAILED++))
    return 1
  fi
}

# Test helper for JSON validation
test_json_endpoint() {
  local name="$1"
  local endpoint="$2"
  local json_key="$3"

  printf "Testing %-30s ... " "$name"

  response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint" 2>/dev/null)
  status=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$status" -eq 200 ]; then
    if echo "$body" | grep -q "\"$json_key\""; then
      echo "PASS (has $json_key)"
      ((PASSED++))
      return 0
    else
      echo "FAIL (missing $json_key in response)"
      ((FAILED++))
      return 1
    fi
  else
    echo "FAIL (HTTP $status)"
    ((FAILED++))
    return 1
  fi
}

echo "--- Health & Status ---"
test_json_endpoint "Health check" "/cbb/health" "status"

echo ""
echo "--- Scores Endpoints ---"
test_json_endpoint "Live scores" "/cbb/scores/live" "data"
test_json_endpoint "Scores by date" "/cbb/scores/2025-03-01" "data"

echo ""
echo "--- Teams Endpoints ---"
test_json_endpoint "All teams" "/cbb/teams" "teams"
test_endpoint "Team by ID (404)" "/cbb/teams/nonexistent-team" 404

echo ""
echo "--- Standings Endpoint ---"
test_json_endpoint "Standings" "/cbb/standings" "standings"
test_json_endpoint "Standings by conf" "/cbb/standings?conference=SEC" "standings"

echo ""
echo "--- Players Endpoints ---"
test_json_endpoint "Search players" "/cbb/players?q=Smith" "players"
test_endpoint "Player by ID (404)" "/cbb/players/nonexistent-player" 404

echo ""
echo "--- Games Endpoints ---"
test_endpoint "Game by ID (404)" "/cbb/games/nonexistent-game" 404

echo ""
echo "--- NIL Endpoints ---"
test_json_endpoint "NIL deals" "/cbb/nil/deals" "deals"
test_json_endpoint "NIL market" "/cbb/nil/market" "market"

echo ""
echo "=========================================="
echo "Results: $PASSED passed, $FAILED failed"
echo "=========================================="

if [ "$FAILED" -gt 0 ]; then
  exit 1
fi

echo ""
echo "All smoke tests passed!"
