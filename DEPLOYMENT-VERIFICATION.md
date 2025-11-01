# College Baseball API Deployment Verification Guide

## Overview

This guide provides step-by-step instructions for testing the college baseball APIs, monitoring performance, and verifying the deployment is working correctly.

**Last Updated:** October 31, 2025
**Status:** Production Deployment
**Base URL:** https://blazesportsintel.com

---

## Quick Start

### Prerequisites

```bash
# Ensure you have Node.js installed
node --version  # Should be v18 or higher

# Install dependencies if not already installed
npm install
```

### Running Tests

```bash
# Test local development server
npm run dev
node scripts/test-college-baseball-apis.js

# Test production deployment
node scripts/test-college-baseball-apis.js --production
```

---

## API Endpoints

### 1. Games API

**Endpoint:** `GET /api/college-baseball/games`

**Purpose:** Fetch live and scheduled college baseball games

**Query Parameters:**
- `date` (optional) - YYYY-MM-DD format (default: today)
- `conference` (optional) - SEC, ACC, Big12, Pac12, etc.
- `status` (optional) - live, scheduled, final, postponed
- `team` (optional) - Team ID for filtering

**Example Requests:**

```bash
# Get today's games
curl https://blazesportsintel.com/api/college-baseball/games

# Get games for specific date
curl https://blazesportsintel.com/api/college-baseball/games?date=2026-03-15

# Get SEC games only
curl https://blazesportsintel.com/api/college-baseball/games?conference=SEC

# Get live games only
curl https://blazesportsintel.com/api/college-baseball/games?status=live

# Combined filters
curl https://blazesportsintel.com/api/college-baseball/games?conference=SEC&status=live
```

**Expected Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "401234567",
      "status": "live",
      "time": "7:00 PM CT",
      "venue": "Alex Box Stadium",
      "tv": "SEC Network",
      "inning": 5,
      "inningHalf": "bottom",
      "homeTeam": {
        "id": "99",
        "name": "LSU Tigers",
        "shortName": "LSU",
        "conference": "SEC",
        "score": 4,
        "record": { "wins": 42, "losses": 15 }
      },
      "awayTeam": {
        "id": "2633",
        "name": "Tennessee Volunteers",
        "shortName": "TENN",
        "conference": "SEC",
        "score": 2,
        "record": { "wins": 45, "losses": 12 }
      }
    }
  ],
  "count": 1,
  "cached": false,
  "timestamp": "2025-10-31T19:45:00Z",
  "source": "live"
}
```

**Performance Targets:**
- Fresh data (not cached): < 2000ms
- Cached data: < 200ms
- Cache TTL: 30s (live), 5m (scheduled), 1h (final)

---

### 2. Box Score API

**Endpoint:** `GET /api/college-baseball/boxscore`

**Purpose:** Fetch detailed box score with batting/pitching stats

**Query Parameters:**
- `gameId` (required) - NCAA game ID

**Example Requests:**

```bash
# Get box score for specific game
curl https://blazesportsintel.com/api/college-baseball/boxscore?gameId=401234567
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "gameId": "401234567",
    "status": "final",
    "teams": {
      "away": { "name": "Tennessee", "id": "2633" },
      "home": { "name": "LSU", "id": "99" }
    },
    "lineScore": {
      "away": {
        "runs": [1, 0, 2, 0, 1, 0, 0, 0, 0],
        "R": 4,
        "H": 9,
        "E": 1
      },
      "home": {
        "runs": [2, 0, 0, 1, 3, 0, 0, 0],
        "R": 6,
        "H": 11,
        "E": 0
      }
    },
    "battingStats": {
      "away": [ /* array of player batting stats */ ],
      "home": [ /* array of player batting stats */ ]
    },
    "pitchingStats": {
      "away": [ /* array of pitcher stats */ ],
      "home": [ /* array of pitcher stats */ ]
    }
  },
  "cached": false,
  "timestamp": "2025-10-31T22:15:00Z"
}
```

**Performance Targets:**
- Fresh data: < 1500ms
- Cached data: < 150ms
- Cache TTL: 15s (live), 1h (final)

---

### 3. Standings API

**Endpoint:** `GET /api/college-baseball/standings`

**Purpose:** Fetch conference standings with RPI

**Query Parameters:**
- `conference` (required) - Conference abbreviation

**Example Requests:**

```bash
# Get SEC standings
curl https://blazesportsintel.com/api/college-baseball/standings?conference=SEC
```

**Performance Targets:**
- Fresh data: < 2000ms
- Cached data: < 200ms
- Cache TTL: 1h

---

### 4. Teams API

**Endpoint:** `GET /api/college-baseball/teams`

**Purpose:** Fetch team information and rosters

**Query Parameters:**
- `conference` (optional) - Filter by conference
- `search` (optional) - Search by team name

**Example Requests:**

```bash
# Get all teams
curl https://blazesportsintel.com/api/college-baseball/teams

# Get SEC teams
curl https://blazesportsintel.com/api/college-baseball/teams?conference=SEC

# Search for teams
curl https://blazesportsintel.com/api/college-baseball/teams?search=tigers
```

---

## Cloudflare Configuration

### Cloudflare Pages

**Project:** `blazesportsintel`

**Deployment Settings:**
```toml
name = "college-baseball-tracker"
pages_build_output_dir = "dist"
compatibility_date = "2025-01-01"
```

**KV Namespaces:**
```toml
[[kv_namespaces]]
binding = "CACHE"
id = "a53c3726fc3044be82e79d2d1e371d26"
```

**Environment Variables:**
- `ENVIRONMENT` = "production"

### Checking Deployment Status

```bash
# Check if Wrangler is installed
wrangler --version

# View deployments
wrangler pages deployment list --project-name=blazesportsintel

# View recent deployment logs
wrangler pages deployment tail --project-name=blazesportsintel

# View KV namespace
wrangler kv:namespace list

# View cached items (sample)
wrangler kv:key list --namespace-id=a53c3726fc3044be82e79d2d1e371d26 --preview
```

---

## Testing Checklist

### Functional Tests

- [ ] **Games API - Basic Request**
  ```bash
  curl https://blazesportsintel.com/api/college-baseball/games
  ```
  Expected: HTTP 200, `success: true`

- [ ] **Games API - Date Filter**
  ```bash
  curl https://blazesportsintel.com/api/college-baseball/games?date=2026-03-15
  ```
  Expected: HTTP 200, filtered results

- [ ] **Games API - Conference Filter**
  ```bash
  curl https://blazesportsintel.com/api/college-baseball/games?conference=SEC
  ```
  Expected: HTTP 200, SEC games only

- [ ] **Games API - Status Filter**
  ```bash
  curl https://blazesportsintel.com/api/college-baseball/games?status=live
  ```
  Expected: HTTP 200, live games only

- [ ] **Box Score API - Valid GameID**
  ```bash
  curl https://blazesportsintel.com/api/college-baseball/boxscore?gameId=401234567
  ```
  Expected: HTTP 200 or 500 (if game not found)

- [ ] **Box Score API - Missing GameID**
  ```bash
  curl https://blazesportsintel.com/api/college-baseball/boxscore
  ```
  Expected: HTTP 400, error message

- [ ] **CORS Headers**
  ```bash
  curl -I https://blazesportsintel.com/api/college-baseball/games
  ```
  Expected: `Access-Control-Allow-Origin: *`

- [ ] **Cache Headers**
  ```bash
  curl -I https://blazesportsintel.com/api/college-baseball/games
  ```
  Expected: `Cache-Control: public, max-age=30, stale-while-revalidate=15`

### Performance Tests

- [ ] **Response Time - Games API (Uncached)**
  - Target: < 2000ms
  - Command: `time curl https://blazesportsintel.com/api/college-baseball/games`

- [ ] **Response Time - Games API (Cached)**
  - Target: < 200ms
  - Command: Run same curl twice, measure second request

- [ ] **Response Time - Box Score API**
  - Target: < 1500ms
  - Command: `time curl https://blazesportsintel.com/api/college-baseball/boxscore?gameId=401234567`

- [ ] **Cache Hit Rate**
  - Target: > 80% for repeated requests
  - Check Cloudflare Analytics

### Frontend Tests

- [ ] **Demo Page Loads**
  ```bash
  curl -I https://blazesportsintel.com/college-baseball-demo.html
  ```
  Expected: HTTP 200

- [ ] **Service Worker Registers**
  - Visit page in browser
  - Open DevTools → Application → Service Workers
  - Verify `/college-baseball-sw.js` is active

- [ ] **API Integration Works**
  - Visit `https://blazesportsintel.com/college-baseball-demo.html`
  - Open browser console
  - Verify: `[College Baseball Demo] Initialized with real NCAA API`
  - Verify: `[API] Loaded X games`

- [ ] **Offline Mode Works**
  - Load page once with network
  - Enable offline mode in DevTools
  - Reload page
  - Verify cached games display

---

## Monitoring & Analytics

### Cloudflare Analytics

**Access:** Cloudflare Dashboard → Pages → blazesportsintel → Analytics

**Key Metrics to Monitor:**

1. **Request Volume**
   - Total requests per hour/day
   - Requests per endpoint
   - Geographic distribution

2. **Performance**
   - Average response time
   - P95 response time
   - P99 response time

3. **Cache Performance**
   - Cache hit rate (target: > 80%)
   - Cache miss rate
   - Edge cache vs origin

4. **Errors**
   - 4xx errors (client errors)
   - 5xx errors (server errors)
   - Error rate percentage

### Custom Monitoring Script

Create a monitoring cron job to check API health:

```bash
#!/bin/bash
# monitor-apis.sh

LOG_FILE="/var/log/college-baseball-api-monitor.log"
SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

check_endpoint() {
  URL=$1
  NAME=$2

  RESPONSE=$(curl -s -w "\n%{http_code}" "$URL")
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-1)

  if [ "$HTTP_CODE" != "200" ]; then
    echo "$(date): ERROR - $NAME returned $HTTP_CODE" >> "$LOG_FILE"
    # Send alert to Slack
    curl -X POST -H 'Content-type: application/json' \
      --data "{\"text\":\"⚠️ API Alert: $NAME returned HTTP $HTTP_CODE\"}" \
      "$SLACK_WEBHOOK"
  else
    echo "$(date): OK - $NAME" >> "$LOG_FILE"
  fi
}

# Check endpoints
check_endpoint "https://blazesportsintel.com/api/college-baseball/games" "Games API"
check_endpoint "https://blazesportsintel.com/api/college-baseball/standings?conference=SEC" "Standings API"
```

**Setup Cron:**
```bash
# Run every 5 minutes
*/5 * * * * /path/to/monitor-apis.sh
```

### Performance Benchmarks

Run periodic benchmarks to track performance over time:

```bash
# Create benchmark script
cat > benchmark-apis.sh << 'EOF'
#!/bin/bash

echo "Running API Benchmarks - $(date)"
echo "================================="

# Benchmark Games API
echo -n "Games API: "
curl -o /dev/null -s -w "%{time_total}s\n" \
  https://blazesportsintel.com/api/college-baseball/games

# Benchmark Box Score API
echo -n "Box Score API: "
curl -o /dev/null -s -w "%{time_total}s\n" \
  "https://blazesportsintel.com/api/college-baseball/boxscore?gameId=401234567"

# Benchmark Standings API
echo -n "Standings API: "
curl -o /dev/null -s -w "%{time_total}s\n" \
  "https://blazesportsintel.com/api/college-baseball/standings?conference=SEC"

echo "================================="
EOF

chmod +x benchmark-apis.sh
./benchmark-apis.sh
```

---

## Troubleshooting

### Issue: API Returns 500 Error

**Possible Causes:**
1. ESPN API is down
2. Invalid game ID
3. Data parsing error

**Diagnosis:**
```bash
# Check Cloudflare logs
wrangler pages deployment tail --project-name=blazesportsintel

# Test ESPN API directly
curl https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard
```

**Resolution:**
- Check `_ncaa-adapter.js` fallback logic
- Verify ESPN API endpoint is correct
- Check for breaking changes in ESPN API response format

### Issue: Slow Response Times

**Possible Causes:**
1. Cache not working
2. ESPN API slow
3. Network latency

**Diagnosis:**
```bash
# Check cache headers
curl -I https://blazesportsintel.com/api/college-baseball/games

# Test multiple times to see if caching works
time curl https://blazesportsintel.com/api/college-baseball/games # First request
time curl https://blazesportsintel.com/api/college-baseball/games # Second request (should be faster)

# Check KV cache
wrangler kv:key list --namespace-id=a53c3726fc3044be82e79d2d1e371d26
```

**Resolution:**
- Verify KV namespace is bound correctly in `wrangler.toml`
- Check cache TTL values in API functions
- Consider increasing cache duration for non-live games

### Issue: CORS Errors in Browser

**Possible Causes:**
1. Missing CORS headers
2. Incorrect headers for OPTIONS requests

**Diagnosis:**
```bash
# Check CORS headers
curl -X OPTIONS -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: GET" \
  -I https://blazesportsintel.com/api/college-baseball/games
```

**Resolution:**
- Verify CORS headers in `games.js`, `boxscore.js`, etc.
- Ensure OPTIONS method is handled
- Check that `Access-Control-Allow-Origin: *` is set

### Issue: Service Worker Not Registering

**Possible Causes:**
1. HTTP instead of HTTPS
2. Incorrect path
3. Browser cache

**Diagnosis:**
- Open DevTools → Console
- Look for service worker registration errors
- Check Application → Service Workers tab

**Resolution:**
```javascript
// Verify service worker path in college-baseball-demo.html
navigator.serviceWorker.register('/college-baseball-sw.js')
```
- Clear browser cache
- Ensure running on HTTPS (or localhost for dev)

### Issue: No Games Showing (Off-Season)

**Expected Behavior:**
- During off-season (October - January), no live games
- API should return empty array with `count: 0`
- Frontend should show season-aware message

**Verification:**
```bash
curl https://blazesportsintel.com/api/college-baseball/games
# Should return: {"success": true, "data": [], "count": 0}
```

**Not an Error:** This is correct behavior during off-season!

---

## Data Sources

### Primary: ESPN College Baseball API

**Base URL:** `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball`

**Endpoints:**
- `/scoreboard` - Live scores and games
- `/summary?event={gameId}` - Box scores
- `/teams` - Team information
- `/standings` - Conference standings

**Rate Limits:** None documented, but be respectful

**Reliability:** High (ESPN's official API)

### Secondary: D1Baseball (Scraping)

**Note:** Currently not implemented, planned for Phase 2

### Tertiary: NCAA Stats (Official)

**Note:** Currently not implemented, planned for Phase 2

---

## Cache Strategy

### Cloudflare KV Cache

**Namespace:** `college-baseball-cache`
**ID:** `a53c3726fc3044be82e79d2d1e371d26`

**Cache Keys Format:**
```
college-baseball:games:{date}:{conference}:{status}:{team}
college-baseball:boxscore:{gameId}
college-baseball:standings:{conference}
college-baseball:teams:{filters}
```

**TTL Values:**
| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| Live games | 30s | Frequent updates needed |
| Scheduled games | 5m | Infrequent changes |
| Final games | 1h | Static data |
| Box scores (live) | 15s | Active game updates |
| Box scores (final) | 1h | Historical data |
| Standings | 1h | Daily updates sufficient |
| Teams | 24h | Rarely changes |

### Service Worker Cache

**Cache Name:** `college-baseball-v1`

**Cached Resources:**
- `/college-baseball-demo.html`
- `/college-baseball/games/`
- `/college-baseball-sw.js`
- API responses (as backup)

**Strategy:**
- Network-first for API calls
- Cache-first for static assets

---

## Deployment Commands

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run type checking
npm run typecheck

# Run tests
npm test
```

### Production Deployment

```bash
# Build for production
npm run build

# Deploy to Cloudflare Pages
npm run deploy

# Or manually with wrangler
wrangler pages deploy dist --project-name=blazesportsintel
```

### Rollback

```bash
# List recent deployments
wrangler pages deployment list --project-name=blazesportsintel

# Rollback to specific deployment
wrangler pages deployment rollback <DEPLOYMENT_ID> --project-name=blazesportsintel
```

---

## Security Considerations

### API Security

- ✅ CORS properly configured
- ✅ No sensitive data exposed
- ✅ Rate limiting via Cloudflare
- ⏳ API key authentication (future)

### Data Privacy

- No PII collected
- No user tracking
- Anonymous API calls
- GDPR compliant

### Content Security

- All data from trusted sources (ESPN, NCAA)
- No user-generated content
- XSS protection via sanitization

---

## Support & Contact

**Issues:** File on GitHub repository
**Urgent:** Contact development team
**Documentation:** See `COLLEGE-BASEBALL-DEMO-UPGRADE.md`

---

## Changelog

### v2.0.0 (2025-10-31)
- Upgraded demo page to use real APIs
- Added service worker for offline support
- Integrated with Cloudflare Functions
- Comprehensive testing and monitoring

### v1.0.0 (2025-10-16)
- Initial static demo
- Sample data only
- No API integration

---

**Last Verified:** October 31, 2025
**Next Review:** When season starts (February 2026)
