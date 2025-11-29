# BSI API Connectivity Guide

This guide documents how to set up, configure, and troubleshoot API connectivity for the Blaze Sports Intel platform.

**Last Updated:** November 29, 2025

---

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Provider Architecture](#provider-architecture)
- [Environment Configuration](#environment-configuration)
- [Provider Setup](#provider-setup)
- [Failover & Circuit Breaker](#failover--circuit-breaker)
- [Rate Limiting](#rate-limiting)
- [Caching Strategy](#caching-strategy)
- [Testing Connectivity](#testing-connectivity)
- [Troubleshooting](#troubleshooting)

---

## Overview

BSI uses a **multi-provider architecture** with automatic failover to ensure reliable sports data delivery. The system supports:

- **6 Data Providers** with configurable priorities
- **Automatic Failover** with circuit breaker pattern
- **Rate Limiting** per provider (requests/minute and daily limits)
- **Tiered Caching** (KV → R2 → D1 → In-memory)
- **9 Sports** covered (MLB, NFL, NBA, NHL, NCAAF, NCAAB, WCBB, WNBA, College Baseball)

### Key Files

| File | Purpose |
|------|---------|
| `lib/adapters/enhanced-provider-manager.ts` | Main provider orchestration |
| `lib/adapters/espn-unified-adapter.ts` | ESPN API adapter (all sports) |
| `lib/adapters/sports-data-io.ts` | SportsDataIO adapter (primary) |
| `lib/adapters/ncaa-api-adapter.ts` | NCAA.com API adapter |
| `lib/adapters/ncaa-enhanced-adapter.ts` | Enhanced NCAA adapter |
| `lib/adapters/cfbd-adapter.ts` | College Football Data API |
| `lib/adapters/balldontlie-adapter.ts` | BALLDONTLIE multi-sport API |
| `lib/cache/tiered-cache.ts` | Caching implementation |
| `lib/api/client.ts` | Frontend API client |

---

## Quick Start

### 1. Copy Environment File

```bash
cp .env.example .env
```

### 2. Configure Required API Keys

At minimum, configure these in your `.env`:

```bash
# Primary provider (recommended)
SPORTSDATAIO_API_KEY=your_key_here

# Cloudflare bindings (required for production)
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
```

### 3. Start Development Server

```bash
npm run dev
```

### 4. Test Connectivity

```bash
# Health check
curl http://localhost:3000/api/health

# Test live scores
curl http://localhost:3000/api/live-scores?sport=mlb
```

---

## Provider Architecture

### Provider Priority

Providers are organized in a priority-based failover chain:

```
Priority 1 (Primary, Paid/Reliable):
├── SportsDataIO    → mlb, nfl, nba, nhl, ncaaf, ncaab
└── CFBD            → ncaaf (specialized)

Priority 2 (Secondary, Free with Good Coverage):
├── BALLDONTLIE     → ncaaf, ncaab, nfl, nba, mlb, nhl, wnba
├── NCAA Enhanced   → ncaaf, ncaab, wcbb, cbb
└── NCAA API        → cbb, ncaaf, ncaab, wcbb

Priority 3 (Tertiary, Fallback):
└── ESPN Unified    → All 9 sports (rate limited)
```

### Sport Coverage Matrix

| Sport | SportsDataIO | CFBD | BALLDONTLIE | NCAA | ESPN |
|-------|--------------|------|-------------|------|------|
| MLB | ✅ | ❌ | ✅ | ❌ | ✅ |
| NFL | ✅ | ❌ | ✅ | ❌ | ✅ |
| NBA | ✅ | ❌ | ✅ | ❌ | ✅ |
| NHL | ✅ | ❌ | ✅ | ❌ | ✅ |
| NCAAF | ✅ | ✅ | ✅ | ✅ | ✅ |
| NCAAB | ✅ | ❌ | ✅ | ✅ | ✅ |
| WCBB | ❌ | ❌ | ❌ | ✅ | ✅ |
| WNBA | ❌ | ❌ | ✅ | ❌ | ✅ |
| CBB | ❌ | ❌ | ❌ | ✅ | ✅ |

---

## Environment Configuration

### Required Variables

```bash
# ==================== SPORTS DATA APIs ====================
# Primary provider (recommended for production)
SPORTSDATAIO_API_KEY=your_api_key_here

# College Football Data API (free tier: 1000 calls/month)
CFBD_API_KEY=your_cfbd_key_here

# BALLDONTLIE API (free tier available)
BALLDONTLIE_API_KEY=your_balldontlie_key_here

# NCAA API configuration (optional, uses free endpoints)
NCAA_API_URL=https://your-ncaa-api-deployment.workers.dev
NCAA_API_KEY=optional_key_if_self_hosted

# ==================== CLOUDFLARE ====================
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_ZONE_ID=your_zone_id

# ==================== APPLICATION ====================
NEXT_PUBLIC_API_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
WRANGLER_URL=http://localhost:8787
```

### Optional Variables

```bash
# Individual sport API keys (if using direct APIs)
MLB_API_KEY=your_mlb_key
NFL_API_KEY=your_nfl_key
NBA_API_KEY=your_nba_key

# AI/ML services for Copilot features
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
```

### API Key Sources

| Provider | URL | Free Tier |
|----------|-----|-----------|
| SportsDataIO | https://sportsdata.io | Trial available |
| CFBD | https://collegefootballdata.com | 1,000 calls/month |
| BALLDONTLIE | https://www.balldontlie.io | Available |
| ESPN | N/A (unofficial) | Unlimited* |
| NCAA | N/A (self-host) | Unlimited |

*ESPN API is unofficial and may have undocumented rate limits.

---

## Provider Setup

### SportsDataIO (Primary)

```bash
# 1. Sign up at https://sportsdata.io
# 2. Get your API key from the dashboard
# 3. Add to .env:
SPORTSDATAIO_API_KEY=your_key_here
```

**Rate Limits:** 100 req/min, 10,000 req/day

### College Football Data (CFBD)

```bash
# 1. Sign up at https://collegefootballdata.com
# 2. Get your API key
# 3. Add to .env:
CFBD_API_KEY=your_key_here
```

**Rate Limits:** 100 req/min, 1,000 req/day (free tier)

### BALLDONTLIE

```bash
# 1. Sign up at https://www.balldontlie.io
# 2. Get your API key
# 3. Add to .env:
BALLDONTLIE_API_KEY=your_key_here
```

**Rate Limits:** 60 req/min, 1,000 req/day (free tier)

### ESPN (Fallback)

ESPN API requires no authentication but is rate-limited.

**Rate Limits:** 30 req/min (self-imposed to avoid blocks)

### NCAA API (Self-Hosted)

The NCAA adapter uses patterns from `henrygd/ncaa-api`:

```bash
# Deploy your own NCAA API worker:
cd workers/ncaa-api
wrangler deploy

# Add the URL to .env:
NCAA_API_URL=https://your-ncaa-api.your-domain.workers.dev
```

---

## Failover & Circuit Breaker

### How Failover Works

1. Request comes in for sport data (e.g., `getGames('ncaaf')`)
2. Enhanced Provider Manager checks providers by priority
3. For each provider:
   - Check if circuit breaker is open → Skip if yes
   - Check if rate limited → Skip if yes
   - Attempt fetch → On success, return data
   - On failure, record failure and try next provider
4. If all providers fail, throw error

### Circuit Breaker Configuration

```typescript
const CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 3,      // Opens after 3 failures
  resetTimeoutMs: 60000,    // Closes after 60 seconds
  halfOpenRequests: 1,      // Allows 1 test request
};
```

### Circuit Breaker States

| State | Description |
|-------|-------------|
| **Closed** | Normal operation, requests flow through |
| **Open** | Provider is unhealthy, requests skip this provider |
| **Half-Open** | After timeout, allows 1 test request |

### Manual Circuit Reset

```typescript
// In your code:
const manager = new EnhancedProviderManager(env);
manager.resetProvider('espn'); // Manually reset circuit

// Via API:
POST /api/admin/reset-provider?name=espn
```

---

## Rate Limiting

### Per-Provider Limits

| Provider | Requests/Min | Daily Limit |
|----------|--------------|-------------|
| SportsDataIO | 100 | 10,000 |
| CFBD | 100 | 1,000 |
| BALLDONTLIE | 60 | 1,000 |
| NCAA | 60 | Unlimited |
| NCAA API | 60 | Unlimited |
| ESPN | 30 | Unlimited |

### Rate Limit Behavior

When a provider reaches its rate limit:
1. Provider is skipped for current request
2. Next provider in priority order is tried
3. Rate limit resets after the window expires (1 minute)
4. Daily limits reset at midnight (server time)

### Monitoring Rate Limits

```typescript
// Get provider health status
const manager = new EnhancedProviderManager(env);
const health = manager.getProviderHealth();

// Returns:
[
  {
    name: 'sportsDataIO',
    isHealthy: true,
    failures: 0,
    circuitOpen: false,
    requestsToday: 150,
    dailyLimit: 10000
  },
  // ... other providers
]
```

---

## Caching Strategy

### Cache Tiers

```
1. KV Namespace (Edge, 5-minute TTL)
   └── Fast, globally distributed
2. R2 Bucket (Durable JSON archive)
   └── Persistent storage for historical data
3. D1 Database (Normalized cache table)
   └── Structured queries, relationships
4. In-Memory Map (Fallback)
   └── Last resort when all else fails
```

### TTL by Data Type

| Data Type | Cache TTL | Stale OK |
|-----------|-----------|----------|
| Live Scores | 15s | 60s |
| Scheduled Games | 5m | 10m |
| Final Scores | 1h | 24h |
| Standings | 5m | 15m |
| Player Stats | 10m | 30m |
| Team Stats | 5m | 15m |
| Rankings | 30m | 1h |
| Historical | 24h | 1 week |
| News | 5m | 30m |
| Odds | 1m | 3m |

### Cache Invalidation

```bash
# Bust cache for specific endpoint
curl "https://blazesportsintel.com/api/mlb/scores?bustCache=true"

# Clear all cache (admin only)
POST /api/admin/clear-cache
Authorization: Bearer <admin_token>
```

---

## Testing Connectivity

### Health Check Endpoint

```bash
curl http://localhost:3000/api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-29T12:00:00Z",
  "services": {
    "database": "operational",
    "cache": "operational",
    "mlbApi": "operational",
    "nflApi": "operational",
    "nbaApi": "operational",
    "aiCopilot": "operational"
  },
  "version": "1.0.0"
}
```

### Copilot Health Check

```bash
curl http://localhost:3000/api/copilot/health
```

This checks:
- D1 Database connectivity
- KV Namespace read/write
- R2 Bucket accessibility
- Vectorize Index queries
- Workers AI (Embeddings & LLM)

### Provider Health API

```bash
curl http://localhost:3000/api/providers/health
```

Returns detailed status of each data provider.

### Test Individual Sports

```bash
# MLB
curl "http://localhost:3000/api/mlb/scores?date=2025-11-29"

# NFL
curl "http://localhost:3000/api/nfl/scores?week=12"

# NBA
curl "http://localhost:3000/api/nba/scores"

# College Baseball
curl "http://localhost:3000/api/college-baseball/games"

# Live Scores (all sports)
curl "http://localhost:3000/api/live-scores?sport=all"
```

---

## Troubleshooting

### Common Issues

#### 1. "All providers failed for {sport}"

**Cause:** All configured providers are unavailable or rate limited.

**Solutions:**
- Check API keys are correctly configured
- Verify network connectivity
- Check provider status pages
- Wait for rate limits to reset
- Manually reset circuit breakers

```bash
# Check provider health
curl http://localhost:3000/api/providers/health

# Reset circuit breaker
curl -X POST "http://localhost:3000/api/admin/reset-provider?name=espn"
```

#### 2. "SportsDataIO adapter not configured"

**Cause:** Missing `SPORTSDATAIO_API_KEY` environment variable.

**Solution:**
```bash
# Add to .env
SPORTSDATAIO_API_KEY=your_key_here

# Restart server
npm run dev
```

#### 3. "CFBD only supports college football"

**Cause:** Attempting to use CFBD adapter for non-football sports.

**Solution:** This is expected behavior. CFBD is specialized for college football. Other sports will automatically failover to other providers.

#### 4. Rate Limit Exceeded (429 Response)

**Cause:** Too many requests to a single provider.

**Solutions:**
- Wait for rate limit window to reset (usually 1 minute)
- Use caching to reduce API calls
- Upgrade to higher tier API plans
- Implement request queuing

#### 5. Circuit Breaker Open

**Cause:** Provider experienced 3+ consecutive failures.

**Solutions:**
- Wait 60 seconds for automatic reset
- Check provider's status page
- Manually reset: `manager.resetProvider('providerName')`

#### 6. Stale Data Returned

**Cause:** Cache serving old data.

**Solutions:**
```bash
# Bust cache for specific request
curl "http://localhost:3000/api/mlb/scores?bustCache=true"

# Clear entire cache
curl -X POST http://localhost:3000/api/admin/clear-cache
```

### Debug Logging

Enable verbose logging in development:

```bash
# .env
DEBUG=true
VERBOSE_LOGGING=true
LOG_LEVEL=debug
```

Logs will show:
- Provider selection decisions
- Cache hits/misses
- Rate limit status
- Circuit breaker state changes

### Provider Status Pages

Check external provider status:

| Provider | Status Page |
|----------|-------------|
| SportsDataIO | https://status.sportsdata.io |
| CFBD | https://twitter.com/CFB_Data |
| ESPN | N/A (unofficial) |

---

## Best Practices

### 1. Always Configure Multiple Providers

Don't rely on a single data source. Configure at least 2-3 providers for redundancy.

### 2. Use Caching Aggressively

For live scores, even 15-30 second caching significantly reduces API load.

### 3. Monitor Provider Health

Regularly check `/api/providers/health` to identify issues early.

### 4. Respect Rate Limits

The system enforces rate limits, but plan your data needs accordingly.

### 5. Use Specific Sport Endpoints

Instead of fetching all sports, request only what you need:

```typescript
// Good - specific request
const games = await manager.getGames('ncaaf', { week: 13 });

// Avoid - fetching everything
const allGames = await manager.getLiveGames(); // Hits all providers
```

### 6. Handle Errors Gracefully

Always wrap API calls in try/catch:

```typescript
try {
  const scores = await mlbApi.getScores(date);
  return scores;
} catch (error) {
  console.error('Failed to fetch MLB scores:', error);
  // Return cached data or show error state
  return getCachedScores('mlb', date);
}
```

---

## Support

For issues with API connectivity:

1. Check this guide's troubleshooting section
2. Review logs for specific error messages
3. File an issue: https://github.com/ahump20/BSI/issues
4. Contact: ahump20@outlook.com

---

## Related Documentation

- [API.md](./API.md) - Full API reference
- [API_ENDPOINTS_INVENTORY.md](./API_ENDPOINTS_INVENTORY.md) - Complete endpoint list
- [API_UPGRADE_RESEARCH.md](./API_UPGRADE_RESEARCH.md) - Research and future plans
- [CLAUDE.md](../CLAUDE.md) - Project rules and structure
