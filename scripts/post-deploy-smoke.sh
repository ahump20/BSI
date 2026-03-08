#!/usr/bin/env bash
set -euo pipefail

# BSI Post-Deploy Smoke Test
# Runs 5 checks against production after a deploy.
# Exit 0 = all pass, Exit 1 = at least one failure.

BASE="${BSI_BASE_URL:-https://blazesportsintel.com}"
FAILURES=0

echo "========================================="
echo " BSI Post-Deploy Smoke Test"
echo " Target: $BASE"
echo "========================================="
echo ""

# ── 1. Root returns 200 ──────────────────────────────────────────────
echo -n "[1/5] Root 200 check... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$BASE/")
if [ "$STATUS" = "200" ]; then
  echo "OK ($STATUS)"
else
  echo "FAIL ($STATUS)"
  FAILURES=$((FAILURES + 1))
fi

# ── 2. 404 handling — non-existent route returns 404 ─────────────────
echo -n "[2/5] 404 handling... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE/this-page-does-not-exist-smoke-test/")
if [ "$STATUS" = "404" ]; then
  echo "OK ($STATUS)"
else
  echo "FAIL (expected 404, got $STATUS)"
  FAILURES=$((FAILURES + 1))
fi

# ── 3. Deep route — college baseball editorial ───────────────────────
echo -n "[3/5] Deep route check... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$BASE/college-baseball/editorial/")
if [ "$STATUS" = "200" ]; then
  echo "OK ($STATUS)"
else
  echo "FAIL ($STATUS)"
  FAILURES=$((FAILURES + 1))
fi

# ── 4. API health endpoint ───────────────────────────────────────────
echo -n "[4/5] API health... "
HEALTH_BODY=$(curl -s --max-time 10 "$BASE/api/health")
HEALTH_STATUS=$(echo "$HEALTH_BODY" | grep -o '"status":"ok"' || true)
if [ -n "$HEALTH_STATUS" ]; then
  echo "OK"
else
  echo "FAIL (response: ${HEALTH_BODY:0:100})"
  FAILURES=$((FAILURES + 1))
fi

# ── 5. Cache headers — static assets should have cache-control ───────
echo -n "[5/5] Cache headers... "
CACHE_HEADER=$(curl -s -I --max-time 10 "$BASE/" | grep -i "cache-control" || true)
if [ -n "$CACHE_HEADER" ]; then
  echo "OK ($(echo "$CACHE_HEADER" | tr -d '\r'))"
else
  echo "WARN (no cache-control header found — non-blocking)"
  # Don't fail on this — Cloudflare Pages may not always set it on HTML
fi

# ── Summary ──────────────────────────────────────────────────────────
echo ""
echo "========================================="
if [ "$FAILURES" -eq 0 ]; then
  echo " All checks passed."
  echo "========================================="
  exit 0
else
  echo " $FAILURES check(s) failed."
  echo "========================================="
  exit 1
fi
