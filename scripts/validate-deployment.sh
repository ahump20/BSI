#!/bin/bash
# Blaze Sports Intel - Analytics Page Deployment Validator
# Validates that all analytics resources are accessible and functioning correctly

set -eo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PRODUCTION_URL="https://blazesportsintel.com"
ANALYTICS_PATH="/analytics/"
JS_PATH="/js/"

echo "═══════════════════════════════════════════════════════════════════════════════"
echo "🔥 Blaze Sports Intel - Analytics Deployment Validation"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test HTTP endpoint
test_endpoint() {
    local url=$1
    local expected_content=$2
    local description=$3

    echo -n "Testing: $description... "

    # Get HTTP status and content
    http_status=$(curl -s -o /dev/null -w "%{http_code}" "$url")

    # Disable pipefail temporarily to avoid SIGPIPE from head
    set +o pipefail
    content=$(curl -s "$url" 2>/dev/null | head -c 5000 2>/dev/null)
    set -o pipefail

    if [ "$http_status" = "200" ] && [[ "$content" == *"$expected_content"* ]]; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP: $http_status)"
        echo "   URL: $url"
        echo "   Expected content containing: $expected_content"
        echo "   Got: ${content:0:100}..."
        ((TESTS_FAILED++))
        return 1
    fi
}

# Function to test file size
test_file_size() {
    local url=$1
    local max_size=$2
    local description=$3

    echo -n "Testing: $description... "

    size=$(curl -s "$url" | wc -c | tr -d ' ')

    if [ "$size" -gt 0 ] && [ "$size" -lt "$max_size" ]; then
        echo -e "${GREEN}✓ PASS${NC} (${size} bytes)"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (${size} bytes, max: ${max_size})"
        ((TESTS_FAILED++))
        return 1
    fi
}

echo "1. CORE PAGE VALIDATION"
echo "───────────────────────────────────────────────────────────────────────────────"

# Test analytics page loads
test_endpoint "${PRODUCTION_URL}${ANALYTICS_PATH}" 'id="root"' "Analytics page HTML"

# Test React root element exists
test_endpoint "${PRODUCTION_URL}${ANALYTICS_PATH}" 'React' "React framework loaded"

echo ""
echo "2. JAVASCRIPT BUNDLE VALIDATION"
echo "───────────────────────────────────────────────────────────────────────────────"

# Test main bundle
test_endpoint "${PRODUCTION_URL}${JS_PATH}analytics.min.js" "FEATURE_FLAGS" "Main bundle (analytics.min.js)"
test_file_size "${PRODUCTION_URL}${JS_PATH}analytics.min.js" 150000 "Main bundle size check"

# Test lazy-loaded modules
test_endpoint "${PRODUCTION_URL}${JS_PATH}analytics-monte-carlo.min.js" "MonteCarloView" "Monte Carlo module"
test_endpoint "${PRODUCTION_URL}${JS_PATH}analytics-realtime.min.js" "WebSocketManager" "Real-time module"
test_endpoint "${PRODUCTION_URL}${JS_PATH}analytics-advanced.min.js" "StatcastVisualization" "Advanced module"
test_endpoint "${PRODUCTION_URL}${JS_PATH}analytics-charts.min.js" "BrowserCapabilities" "Charts module"
test_endpoint "${PRODUCTION_URL}${JS_PATH}analytics-3d.min.js" "Stadium3DVisualization" "3D visualization module"

echo ""
echo "3. SUPPORT FILES VALIDATION"
echo "───────────────────────────────────────────────────────────────────────────────"

# Test component files
test_endpoint "${PRODUCTION_URL}${JS_PATH}data-freshness-component.js" "Data Freshness" "Data freshness component"
test_endpoint "${PRODUCTION_URL}${JS_PATH}error-handler.js" "Error Handling" "Error handler"
test_endpoint "${PRODUCTION_URL}${JS_PATH}loading-skeletons.js" "Loading Skeleton" "Loading skeletons"
test_endpoint "${PRODUCTION_URL}${JS_PATH}feedback-widget.js" "Feedback Widget" "Feedback widget"

echo ""
echo "4. HTTP HEADERS VALIDATION"
echo "───────────────────────────────────────────────────────────────────────────────"

# Check caching headers
echo -n "Testing: Cache-Control header... "
cache_header=$(curl -sI "${PRODUCTION_URL}${JS_PATH}analytics.min.js" | grep -i "cache-control" | head -1)
if [[ "$cache_header" == *"max-age"* ]]; then
    echo -e "${GREEN}✓ PASS${NC} ($cache_header)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((TESTS_FAILED++))
fi

# Check compression
echo -n "Testing: Content compression... "
content_encoding=$(curl -sI -H "Accept-Encoding: gzip" "${PRODUCTION_URL}${JS_PATH}analytics.min.js" | grep -i "content-encoding" | head -1)
if [[ "$content_encoding" == *"gzip"* ]] || [[ "$content_encoding" == *"br"* ]]; then
    echo -e "${GREEN}✓ PASS${NC} ($content_encoding)"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠ WARNING${NC} (Compression may not be active)"
fi

# Check ETag
echo -n "Testing: ETag header... "
etag_header=$(curl -sI "${PRODUCTION_URL}${JS_PATH}analytics.min.js" | grep -i "etag" | head -1)
if [[ "$etag_header" == *"etag"* ]]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((TESTS_FAILED++))
fi

echo ""
echo "5. PERFORMANCE METRICS"
echo "───────────────────────────────────────────────────────────────────────────────"

# Test page load time
echo -n "Testing: Page load time... "
load_time=$( { time curl -s -o /dev/null "${PRODUCTION_URL}${ANALYTICS_PATH}" ; } 2>&1 | grep real | awk '{print $2}')
echo -e "${GREEN}✓${NC} $load_time"

# Test bundle sizes
echo ""
echo "Bundle size breakdown:"
for module in "analytics.min.js" "analytics-monte-carlo.min.js" "analytics-realtime.min.js" "analytics-advanced.min.js" "analytics-charts.min.js" "analytics-3d.min.js"; do
    set +o pipefail
    size=$(curl -s "${PRODUCTION_URL}${JS_PATH}${module}" 2>/dev/null | wc -c 2>/dev/null | tr -d ' ')
    set -o pipefail
    size_kb=$((size / 1024))
    echo "   ${module}: ${size_kb}KB"
done

echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo "VALIDATION RESULTS"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
echo -e "Tests Passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Tests Failed: ${RED}${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED${NC} - Deployment is healthy!"
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC} - Please review failures above"
    exit 1
fi
