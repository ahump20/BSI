#!/usr/bin/env bash
set -euo pipefail

# BSI Post-Deploy Smoke Test
# Runs 9 checks against production after a deploy.
# Exit 0 = all pass, Exit 1 = at least one failure.

BASE="${BSI_BASE_URL:-https://blazesportsintel.com}"
FAILURES=0

echo "========================================="
echo " BSI Post-Deploy Smoke Test"
echo " Target: $BASE"
echo "========================================="
echo ""

# ── 1. Root returns 200 ──────────────────────────────────────────────
echo -n "[1/9] Root 200 check... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$BASE/")
if [ "$STATUS" = "200" ]; then
  echo "OK ($STATUS)"
else
  echo "FAIL ($STATUS)"
  FAILURES=$((FAILURES + 1))
fi

# ── 2. 404 handling — non-existent route returns 404 ─────────────────
echo -n "[2/9] 404 handling... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE/this-page-does-not-exist-smoke-test/")
if [ "$STATUS" = "404" ]; then
  echo "OK ($STATUS)"
else
  echo "FAIL (expected 404, got $STATUS)"
  FAILURES=$((FAILURES + 1))
fi

# ── 3. Deep route — college baseball editorial ───────────────────────
echo -n "[3/9] Deep route check... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$BASE/college-baseball/editorial/")
if [ "$STATUS" = "200" ]; then
  echo "OK ($STATUS)"
else
  echo "FAIL ($STATUS)"
  FAILURES=$((FAILURES + 1))
fi

# ── 4. API health endpoint ───────────────────────────────────────────
echo -n "[4/9] API health... "
HEALTH_BODY=$(curl -s --max-time 10 "$BASE/api/health")
HEALTH_STATUS=$(echo "$HEALTH_BODY" | grep -o '"status":"ok"' || true)
if [ -n "$HEALTH_STATUS" ]; then
  echo "OK"
else
  echo "FAIL (response: ${HEALTH_BODY:0:100})"
  FAILURES=$((FAILURES + 1))
fi

# ── 5. Homepage Heritage slogan — verifies branded text in static HTML ───────
echo -n "[5/9] Homepage Heritage slogan... "
HOME_HTML=$(curl -s --max-time 15 "$BASE/")
if echo "$HOME_HTML" | grep -q "Born to Blaze the Path Beaten Less"; then
  echo "OK"
else
  echo "FAIL (slogan missing)"
  FAILURES=$((FAILURES + 1))
fi

# ── 6. Homepage renders in app shell (sidebar layout) ────────────────
echo -n "[6/9] Homepage app shell... "
if echo "$HOME_HTML" | grep -q "Blaze Sports Intel"; then
  echo "OK"
else
  echo "FAIL (homepage content missing)"
  FAILURES=$((FAILURES + 1))
fi

# ── 7. College baseball page served correctly ────────────────────────
# Note: Footer content ("Start Here", "Ecosystem") renders client-side
# via React and is NOT present in the static HTML skeleton that curl
# receives. This check verifies the correct static file was served
# (200 status + page title present), not that client-side rendering works.
echo -n "[7/9] College baseball page... "
CBB_HTML=$(curl -s -w '\n%{http_code}' --max-time 15 "$BASE/college-baseball/")
CBB_STATUS="${CBB_HTML##*$'\n'}"
CBB_HTML="${CBB_HTML%$'\n'*}"
if [ "$CBB_STATUS" = "200" ] && echo "$CBB_HTML" | grep -q "College Baseball" && echo "$CBB_HTML" | grep -q "Blaze Sports Intel"; then
  echo "OK ($CBB_STATUS)"
else
  echo "FAIL (status=$CBB_STATUS, page title or brand missing)"
  FAILURES=$((FAILURES + 1))
fi

# ── 8. Cache headers — static assets should have cache-control ───────
echo -n "[8/9] Cache headers... "
CACHE_HEADER=$(curl -s -I --max-time 10 "$BASE/" | grep -i "cache-control" || true)
if [ -n "$CACHE_HEADER" ]; then
  echo "OK ($(echo "$CACHE_HEADER" | tr -d '\r'))"
else
  echo "WARN (no cache-control header found — non-blocking)"
  # Don't fail on this — Cloudflare Pages may not always set it on HTML
fi

# ── 9. Scores page should never leak object placeholders ─────────────
echo -n "[9/9] Scores object placeholder check... "
SCORES_HTML=$(curl -s --max-time 15 "$BASE/scores")
if echo "$SCORES_HTML" | grep -Fq "[object Object]"; then
  echo "FAIL ([object Object] found on /scores)"
  FAILURES=$((FAILURES + 1))
else
  echo "OK"
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
