#!/usr/bin/env bash

# ============================================================================
# Scouting Intel Copilot - Week 1 Test Script
# ============================================================================
# This script tests all backend endpoints for the AI Copilot feature.
#
# Usage:
#   chmod +x scripts/test-copilot.sh
#   ./scripts/test-copilot.sh
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
echo -e "${BLUE}║   🧪 Blaze Sports Intel - Copilot API Tests                      ║${NC}"
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

    echo -e "${YELLOW}Testing: ${name}${NC}"
    echo -e "  URL: ${url}"

    if [ "$method" = "POST" ]; then
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
echo -e "${YELLOW}Test 1: Health Check Endpoint${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_endpoint \
    "Health Check" \
    "${BASE_URL}/api/copilot/health" \
    200

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Test 2: Status Endpoint${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_endpoint \
    "Status Info" \
    "${BASE_URL}/api/copilot/status" \
    200

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Test 3: Unimplemented Route (Expected 501)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

test_endpoint \
    "Search Route (Not Yet Implemented)" \
    "${BASE_URL}/api/copilot/search" \
    501 \
    POST

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Test 4: CORS Preflight${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}Testing: CORS Preflight${NC}"
echo -e "  URL: ${BASE_URL}/api/copilot/health"
response=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS \
    -H "Origin: https://example.com" \
    -H "Access-Control-Request-Method: GET" \
    "${BASE_URL}/api/copilot/health" 2>&1)

if [ "$response" = "200" ] || [ "$response" = "204" ]; then
    echo -e "  ${GREEN}✓ CORS preflight successful (${response})${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "  ${RED}✗ CORS preflight failed (status: ${response})${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

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
    echo -e "${GREEN}✓ All tests passed! Week 1 backend is fully operational.${NC}"
    echo ""
    echo "📋 Next Steps:"
    echo "  - Week 2: Implement semantic search endpoint"
    echo "  - Week 3: Create /copilot.html frontend UI"
    echo "  - Week 4: Add Babylon.js 3D visualization"
    echo "  - Week 5: Hero animations and polish"
    exit 0
fi
