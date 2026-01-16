#!/usr/bin/env bash
#
# BLAZE SPORTS INTEL - ANALYTICS DASHBOARD QUERY
#
# Query production metrics from Cloudflare Analytics Engine
# Usage: ./scripts/view-analytics.sh [time_range]
#
# Examples:
#   ./scripts/view-analytics.sh 1h     # Last hour
#   ./scripts/view-analytics.sh 24h    # Last 24 hours
#   ./scripts/view-analytics.sh 7d     # Last 7 days
#   ./scripts/view-analytics.sh        # Default: last 24 hours
#
# @version 1.0.0
# @created 2025-10-11

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DATASET="bsi-analytics"
WRANGLER="${WRANGLER:-~/.npm-global/bin/wrangler}"

# Parse time range argument
TIME_RANGE="${1:-24h}"

# Convert time range to start date
calculate_start_date() {
    local range=$1
    local unit="${range: -1}"
    local value="${range:0:-1}"

    case "$unit" in
        h) # Hours
            date -u -v-"${value}H" +"%Y-%m-%d %H:00:00" 2>/dev/null || date -u -d "$value hours ago" +"%Y-%m-%d %H:00:00"
            ;;
        d) # Days
            date -u -v-"${value}d" +"%Y-%m-%d 00:00:00" 2>/dev/null || date -u -d "$value days ago" +"%Y-%m-%d 00:00:00"
            ;;
        *)
            echo "Invalid time range. Use format: 1h, 24h, 7d" >&2
            exit 1
            ;;
    esac
}

START_DATE=$(calculate_start_date "$TIME_RANGE")
END_DATE=$(date -u +"%Y-%m-%d %H:%M:%S")

echo -e "${BLUE}${NC}"
echo -e "${BLUE}   Blaze Sports Intel - Analytics Dashboard${NC}"
echo -e "${BLUE}${NC}"
echo ""
echo -e "${YELLOW}=Ê Time Range:${NC} $TIME_RANGE ($START_DATE to $END_DATE)"
echo -e "${YELLOW}=Â Dataset:${NC} $DATASET"
echo ""

# Check if wrangler is installed
if ! command -v "$WRANGLER" &> /dev/null; then
    echo -e "${RED}L Error: Wrangler not found at $WRANGLER${NC}"
    echo "Install with: npm install -g wrangler@latest"
    exit 1
fi

# === QUERY 1: Overall Performance Metrics ===
echo -e "${GREEN} Overall Performance Metrics ${NC}"
echo ""

QUERY_OVERALL="
SELECT
  COUNT(*) AS total_requests,
  SUM(double1) AS total_duration_ms,
  AVG(double1) AS avg_duration_ms,
  MIN(double1) AS min_duration_ms,
  MAX(double1) AS max_duration_ms,
  SUM(double2) AS successful_requests,
  SUM(double3) AS server_errors,
  SUM(double4) AS client_errors,
  SUM(double5) AS cache_hits,
  SUM(double6) AS error_count,
  ROUND(100.0 * SUM(double2) / NULLIF(COUNT(*), 0), 2) AS success_rate_pct,
  ROUND(100.0 * SUM(double5) / NULLIF(COUNT(*), 0), 2) AS cache_hit_rate_pct
FROM bsi-analytics
WHERE timestamp >= '$START_DATE' AND timestamp <= '$END_DATE'
"

echo "Running query..."
$WRANGLER analytics query "$DATASET" \
  --start-date "$START_DATE" \
  --end-date "$END_DATE" \
  --json \
  2>/dev/null || {
    echo -e "${RED}L Failed to query analytics${NC}"
    echo "Make sure you're authenticated: wrangler login"
    exit 1
  }

echo ""

# === QUERY 2: Performance by Sport ===
echo -e "${GREEN} Performance by Sport ${NC}"
echo ""

QUERY_BY_SPORT="
SELECT
  index1 AS sport,
  COUNT(*) AS requests,
  AVG(double1) AS avg_duration_ms,
  SUM(double2) AS successes,
  SUM(double3 + double4) AS errors,
  ROUND(100.0 * SUM(double5) / NULLIF(COUNT(*), 0), 2) AS cache_hit_rate_pct
FROM bsi-analytics
WHERE timestamp >= '$START_DATE' AND timestamp <= '$END_DATE'
GROUP BY sport
ORDER BY requests DESC
"

echo "Running query..."
# Note: Actual GraphQL query implementation would go here
# For now, show what would be queried
echo "Query: Performance metrics grouped by sport (NFL, MLB, NBA, CFB, CBB)"
echo ""

# === QUERY 3: Top 10 Slowest Endpoints ===
echo -e "${GREEN} Top 10 Slowest Endpoints ${NC}"
echo ""

QUERY_SLOWEST="
SELECT
  blob2 AS endpoint,
  index1 AS sport,
  COUNT(*) AS requests,
  AVG(double1) AS avg_duration_ms,
  MAX(double1) AS max_duration_ms
FROM bsi-analytics
WHERE timestamp >= '$START_DATE' AND timestamp <= '$END_DATE'
GROUP BY endpoint, sport
ORDER BY avg_duration_ms DESC
LIMIT 10
"

echo "Query: Top 10 slowest API endpoints by average response time"
echo ""

# === QUERY 4: Error Analysis ===
echo -e "${GREEN} Error Analysis ${NC}"
echo ""

QUERY_ERRORS="
SELECT
  blob7 AS error_message,
  blob2 AS endpoint,
  COUNT(*) AS error_count,
  blob8 AS latest_timestamp
FROM bsi-analytics
WHERE timestamp >= '$START_DATE'
  AND timestamp <= '$END_DATE'
  AND blob7 != 'none'
GROUP BY error_message, endpoint
ORDER BY error_count DESC
LIMIT 20
"

echo "Query: Error frequency analysis (top 20 errors)"
echo ""

# === QUERY 5: Cache Performance ===
echo -e "${GREEN} Cache Performance ${NC}"
echo ""

QUERY_CACHE="
SELECT
  blob6 AS cache_status,
  index1 AS sport,
  COUNT(*) AS requests,
  AVG(double1) AS avg_duration_ms
FROM bsi-analytics
WHERE timestamp >= '$START_DATE' AND timestamp <= '$END_DATE'
GROUP BY cache_status, sport
ORDER BY sport, cache_status
"

echo "Query: Cache hit/miss rates by sport"
echo ""

# Summary
echo -e "${BLUE}${NC}"
echo -e "${YELLOW}=Ý Note:${NC} Full GraphQL Analytics API integration coming soon"
echo -e "${YELLOW}=Ö Docs:${NC} https://developers.cloudflare.com/analytics/graphql-api/"
echo ""
echo -e "${GREEN} Analytics queries prepared${NC}"
echo -e "${BLUE}${NC}"
