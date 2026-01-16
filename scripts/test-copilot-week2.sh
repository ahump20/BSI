#!/usr/bin/env bash

# ============================================================================
# Scouting Intel Copilot - Week 2 Test Script
# ============================================================================
# Tests semantic search and RAG functionality
#
# Usage:
#   chmod +x scripts/test-copilot-week2.sh
#   ./scripts/test-copilot-week2.sh
# ============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BASE_URL="${1:-https://blazesportsintel.com}"

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🧪 Blaze Sports Intel - Copilot Week 2 Tests                   ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Testing against: ${YELLOW}${BASE_URL}${NC}"
echo ""

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# ============================================================================
# Helper Functions
# ============================================================================

test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    local method="${4:-GET}"
    local data="${5:-}"

    echo -e "${YELLOW}Testing: ${name}${NC}"
    echo -e "  URL: ${url}"

    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -d "$data" \
            "${url}" 2>&1)
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            "${url}" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" "${url}" 2>&1)
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "$expected_status" ]; then
        echo -e "  ${GREEN}✓ Status: ${http_code}${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo ""
        return 0
    else
        echo -e "  ${RED}✗ Status: ${http_code} (expected ${expected_status})${NC}"
        echo "$body"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo ""
        return 1
    fi
}

# ============================================================================
# Test Cases
# ============================================================================

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Test 1: Status Endpoint (Should show Week 2 features)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_endpoint \
    "Status Info" \
    "${BASE_URL}/api/copilot/status" \
    200

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Test 2: Generate Embeddings for All Games${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_endpoint \
    "Embed All Games" \
    "${BASE_URL}/api/copilot/embed" \
    200 \
    POST \
    '{"all": true}'

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Test 3: Semantic Search - Cardinals Query${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_endpoint \
    "Search: Cardinals recent games" \
    "${BASE_URL}/api/copilot/search" \
    200 \
    POST \
    '{"query": "Cardinals recent games", "limit": 5}'

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Test 4: Semantic Search - NFL Query${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_endpoint \
    "Search: NFL games this week" \
    "${BASE_URL}/api/copilot/search" \
    200 \
    POST \
    '{"query": "NFL games this week", "limit": 5}'

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Test 5: Semantic Search - College Football Query${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_endpoint \
    "Search: Texas Longhorns championship run" \
    "${BASE_URL}/api/copilot/search" \
    200 \
    POST \
    '{"query": "Texas Longhorns championship run", "limit": 5}'

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Test 6: Search with Sport Filter${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_endpoint \
    "Search: High scoring games (MLB only)" \
    "${BASE_URL}/api/copilot/search" \
    200 \
    POST \
    '{"query": "high scoring games", "sport": "MLB", "limit": 3}'

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Test 7: Invalid Search Request (No Query)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_endpoint \
    "Search: Missing query field (Expected 400)" \
    "${BASE_URL}/api/copilot/search" \
    400 \
    POST \
    '{"limit": 5}'

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Test 8: Invalid Embed Request (No Parameters)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_endpoint \
    "Embed: Missing parameters (Expected 400)" \
    "${BASE_URL}/api/copilot/embed" \
    400 \
    POST \
    '{}'

# ============================================================================
# Test Summary
# ============================================================================

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Test Summary                                                    ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))

echo -e "  Total Tests: ${TOTAL_TESTS}"
echo -e "  ${GREEN}✓ Passed: ${TESTS_PASSED}${NC}"

if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "  ${RED}✗ Failed: ${TESTS_FAILED}${NC}"
    echo ""
    echo -e "${RED}⚠️  Some tests failed. Check the output above for details.${NC}"
    exit 1
else
    echo -e "  ${RED}✗ Failed: ${TESTS_FAILED}${NC}"
    echo ""
    echo -e "${GREEN}✓ All tests passed! Week 2 semantic search is fully operational.${NC}"
    echo ""
    echo "📋 Next Steps:"
    echo "  - Week 3: Create /copilot.html frontend with glassmorphism UI"
    echo "  - Week 3: Connect search interface to semantic search API"
    echo "  - Week 4: Add Babylon.js 3D visualization"
    echo "  - Week 5: Hero animations and polish"
    exit 0
fi
