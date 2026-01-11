# BSI Cloudflare Integration Audit

**Date:** 2026-01-09
**Domain:** blazesportsintel.com
**Account:** Humphrey.austin20@gmail.com (a12cb329d84130460eed99b816e4d0d3)

---

## Executive Summary

All major routes are operational. The redeployment of `bsi-home` resolved routing issues for college baseball pages. The infrastructure has some consolidation opportunities but is fundamentally sound.

**Key Findings:**
- 18 Workers deployed (8 active, 10 auxiliary)
- 7 D1 databases (1 primary, 2 supporting, 4 orphaned/non-BSI)
- 15 KV namespaces (2 bound to main worker, 13 auxiliary)
- 11 R2 buckets (2 active, 9 specialized storage)

---

## 1. Workers Inventory

### Primary Production Workers

| Worker | Purpose | Routes | Status |
|--------|---------|--------|--------|
| `bsi-home` | Main site serving | `blazesportsintel.com/*` | **ACTIVE** |
| `bsi-prediction-api` | Prediction API | `api.blazesportsintel.com/v1/*` | **ACTIVE** |
| `bsi-skills-api` | Skills API | `blazesportsintel.com/api/skills*` | **ACTIVE** |
| `bsi-baseball-rankings` | Rankings widget | `blazesportsintel.com/baseball/rankings` | **ACTIVE** |

### Background/Scheduled Workers

| Worker | Purpose | Handlers | Status |
|--------|---------|----------|--------|
| `blazesports-ingest` | Data ingestion | scheduled, fetch | **ACTIVE** |
| `bsi-cache-warmer` | Cache warming | scheduled, fetch | **ACTIVE** |
| `bsi-college-data-sync` | NCAA data sync | scheduled, fetch | **ACTIVE** |
| `bsi-news-ticker` | News aggregation | scheduled, queue, fetch | **ACTIVE** |
| `espn-data-cache` | ESPN data caching | scheduled, fetch | **ACTIVE** |
| `bsi-cfb-ai` | College football AI | scheduled, fetch | **ACTIVE** |

### Auxiliary Workers (No Routes)

| Worker | Purpose | Status |
|--------|---------|--------|
| `blaze-sports-api` | Legacy API (Aug 2025) | **REVIEW** |
| `bsi-mcp-server` | MCP interface | ACTIVE |
| `bsi-chatgpt-app` | ChatGPT integration | ACTIVE |
| `bsi-portal-agent` | Portal agent | ACTIVE |
| `bsi-mmr-ledger` | MMR tracking | ACTIVE |

### Potentially Orphaned Workers

| Worker | Created | Last Modified | Recommendation |
|--------|---------|---------------|----------------|
| `blazesportsintel-com` | 2026-01-08 | 2026-01-08 | **DELETE** - duplicate of bsi-home |
| `customer-worker-1` | 2025-12-28 | 2025-12-28 | **DELETE** - test worker |
| `blaze-ai-search-nlweb` | 2025-12-28 | 2025-12-28 | **REVIEW** - unclear purpose |

---

## 2. D1 Databases

### Active Databases

| Database | Tables | Size | Bound To |
|----------|--------|------|----------|
| `bsi-game-db` | 55 | 1.35 MB | bsi-home (DB binding) |
| `bsi-models-db` | 24 | 438 KB | bsi-prediction-api |
| `bsi-historical-db` | 67 | 3.2 MB | Internal reference |

### Orphaned/Empty Databases

| Database | Tables | Created | Recommendation |
|----------|--------|---------|----------------|
| `bsi-portal-db` | 0 | 2025-12-27 | **DELETE** - never used |
| `bsi-mmr-db` | 0 | 2025-12-12 | **DELETE** - never used |
| `satx-nightlife-db` | 0 | 2025-12-15 | Non-BSI project |
| `blaze-reading-compass` | 0 | 2025-12-15 | Non-BSI project |

### Database Schema Summary (bsi-game-db)

**Core Tables:**
- `users`, `sessions`, `subscriptions` - Authentication
- `contacts`, `leads` - CRM
- `college_baseball_teams`, `college_baseball_rankings`, `college_baseball_games` - NCAA Baseball
- `college_baseball_records`, `college_baseball_history` - Historical data
- `football_teams`, `football_transfer_portal`, `football_games` - NCAA Football
- `transfer_portal`, `transfer_portal_activity`, `transfer_portal_watchlist` - Portal tracking
- `notification_subscribers`, `notification_log` - Notifications
- `team_page_analytics`, `preview_metrics`, `recap_metrics` - Analytics

**Game Tables:**
- `backyard_*`, `blitz_*`, `hoops_*` - Mini-games

---

## 3. KV Namespaces

### Bound to bsi-home

| Namespace | Binding | Purpose |
|-----------|---------|---------|
| `blazesports-cache` | SESSIONS | Session storage |
| `BSI_ANALYTICS_EVENTS` | ANALYTICS_KV | Analytics fallback |

### Other BSI Namespaces

| Namespace | Likely Bound To | Status |
|-----------|-----------------|--------|
| `bsi-ticker-cache` | bsi-news-ticker | ACTIVE |
| `CFB_CACHE` | bsi-cfb-ai | ACTIVE |
| `PREDICTION_CACHE` | bsi-prediction-api | ACTIVE |
| `BSI_CHATGPT_CACHE` | bsi-chatgpt-app | ACTIVE |
| `BSI_PORTAL_CACHE` | bsi-portal-agent | ACTIVE |
| `BSI_PREVIEW_CACHE` | Unknown | **REVIEW** |
| `SPORTS_CACHE` | blaze-sports-api | **REVIEW** |
| `CACHE` | Generic | **REVIEW** |
| `BLAZE_KV` | Legacy | **REVIEW** |

### Non-BSI Namespaces

- `blaze-backyard-baseball-BLITZ_CACHE`
- `worker-BACKYARD_CACHE`
- `READING_COMPASS_CACHE`
- `satx-nightlife-cache`

---

## 4. R2 Buckets

### Active Production

| Bucket | Purpose | Created |
|--------|---------|---------|
| `blazesports-assets` | Site HTML/CSS/JS | 2025-10-11 |
| `blazesports-archives` | Backup storage | 2026-01-08 |

### Specialized Storage

| Bucket | Purpose | Created |
|--------|---------|---------|
| `blaze-sports-data-lake` | Raw data | 2025-08-20 |
| `blaze-nil-archive` | NIL data | 2025-12-27 |
| `blaze-vision-videos` | Full videos | 2025-08-28 |
| `blaze-vision-clips` | Short clips | 2025-08-24 |
| `blaze-youth-data` | Youth baseball | 2025-08-24 |
| `bsi-embeddings` | AI vectors | 2025-10-10 |
| `podcasts` | Audio content | 2025-10-18 |

### Legacy

| Bucket | Purpose | Recommendation |
|--------|---------|----------------|
| `blaze-intelligence` | Old assets | **REVIEW** - may have useful content |
| `blaze-intelligence-videos` | Old videos | **REVIEW** - consolidate with blaze-vision-videos |

---

## 5. Route Health Check

### Page Routes (All 200 OK)

```
/ .......................... 200
/about ..................... 200
/pricing ................... 200
/scores .................... 200
/tools ..................... 200
/college-baseball .......... 200
/college-baseball/rankings . 200
/college-baseball/scores ... 200
/college-baseball/news ..... 200
/college-baseball/teams .... 200
/college-baseball/standings  200
/college-baseball/transfer-portal 200
/mlb ....................... 200
/nfl ....................... 200
/nba ....................... 200
/login ..................... 200
/signup .................... 200
/dashboard ................. 200
```

### API Routes (All 200 OK)

```
/api/health ................ 200 (1547ms)
/api/mlb/scores ............ 200 (368ms)
/api/nfl/scores ............ 200 (221ms)
/api/nba/scores ............ 200 (388ms)
/api/college-baseball/rankings 200 (148ms)
/api/college-baseball/scores 200
/api/college-baseball/news . 200
```

---

## 6. Integration Architecture

```
                    blazesportsintel.com
                           |
                    [Cloudflare Edge]
                           |
              +------------+------------+
              |                         |
         [bsi-home]              [bsi-prediction-api]
              |                         |
    +---------+---------+         api.blazesportsintel.com/v1/*
    |         |         |
  Pages     APIs      R2
    |         |         |
    |    /api/*     [blazesports-assets]
    |         |
    |    +----+----+
    |    |         |
    |  ESPN   SportsDataIO
    |         |
    +----+----+
         |
   [bsi-game-db D1]
         |
   [SESSIONS KV]
```

### Data Flow

1. **Page Requests**: bsi-home -> R2 (blazesports-assets)
2. **API Requests**: bsi-home -> External APIs (ESPN, SportsDataIO)
3. **Auth/Sessions**: bsi-home -> D1 (bsi-game-db) + KV (SESSIONS)
4. **Analytics**: bsi-home -> Analytics Engine + KV fallback
5. **Background Jobs**:
   - blazesports-ingest -> D1
   - bsi-cache-warmer -> KV
   - bsi-college-data-sync -> D1
   - espn-data-cache -> KV

---

## 7. Recommendations

### Immediate Actions

1. **Delete `blazesportsintel-com` worker** - Duplicate of bsi-home, created same day
2. **Delete `customer-worker-1` worker** - Test worker
3. **Delete empty D1 databases**: `bsi-portal-db`, `bsi-mmr-db`

### Short-term Consolidation

1. **Merge `blaze-sports-api` into `bsi-home`** - Legacy worker from Aug 2025, functionality likely duplicated
2. **Review `bsi-baseball-rankings`** - Has specific routes, check if still needed or can be merged
3. **Audit KV namespaces** - `BSI_PREVIEW_CACHE`, `SPORTS_CACHE`, `CACHE`, `BLAZE_KV` need review

### Performance Optimization

1. **/api/health endpoint is slow (1547ms)** - Review what it's checking
2. **Consider edge caching** for static API responses (rankings, standings)

### Data Consolidation

1. **Review `bsi-models-db` and `bsi-historical-db`** - Rich data, ensure they're being utilized
2. **Migrate useful data from R2 `blaze-intelligence`** to `blazesports-assets`

---

## 8. Resource Cleanup Commands

```bash
# Delete orphaned workers
npx wrangler delete blazesportsintel-com
npx wrangler delete customer-worker-1

# Delete empty D1 databases
npx wrangler d1 delete bsi-portal-db
npx wrangler d1 delete bsi-mmr-db

# Review before deleting (check if data exists)
npx wrangler kv namespace list
# Then delete orphaned KV namespaces as needed
```

---

## Conclusion

The BSI infrastructure is healthy and well-organized around `bsi-home` as the primary worker serving `blazesportsintel.com`. There are some orphaned resources from rapid development that can be cleaned up, but no critical issues or security concerns were identified.

**Total Monthly Cost Estimate:**
- Workers: Free tier (likely under 100k requests/day)
- D1: Free tier (under 5GB)
- KV: Free tier (under 1GB)
- R2: ~$0.015/GB/month storage

The architecture is sound for current scale and ready for growth.
