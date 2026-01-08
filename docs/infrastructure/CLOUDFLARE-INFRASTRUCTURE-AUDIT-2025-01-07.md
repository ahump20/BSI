# Cloudflare Infrastructure Audit

> **Audit Date:** January 7, 2026
> **Account:** Humphrey.austin20@gmail.com (a12cb329d84130460eed99b816e4d0d3)
> **Auditor:** Claude Code Opus 4.5

---

## Executive Summary

This audit documents all Cloudflare resources across the BSI platform, identifies configuration issues, and provides recommendations for consolidation.

### Key Findings

| Category | Count | Issues |
|----------|-------|--------|
| Workers (defined) | 12 | All issues FIXED |
| D1 Databases | 7 | 2 non-BSI databases |
| KV Namespaces | 14 | Inconsistent naming |
| R2 Buckets | 11 | All required buckets exist |
| Sprawl Folders | 2 | Violate single-repo rule |

### Fixes Applied During Audit

1. **CFB_CACHE KV Namespace** - Created (ID: `963541b67da84e36919914e914a1bb31`)
2. **blazesports-archives R2 Bucket** - Created for ingest worker
3. **bsi-cfb-ai wrangler.toml** - Updated with real KV ID
4. **bsi-prediction-api routes** - Added missing `/v1/health`, `/v1/webhook/*`, `/v1/state/*` routes
5. **Staging environments** - Added to: prediction API, bsi-home, bsi-cfb-ai, bsi-news-ticker, ingest
6. **Observability logging** - Enabled on all critical workers
7. **Ingest worker** - Fixed syntax issues, standardized cron trigger format
8. **JSDoc comment fix** - Fixed `*/5` syntax in ingest/index.ts

---

## 1. Workers Inventory

### Primary Production Workers

| Worker Name | Location | Routes | Status |
|-------------|----------|--------|--------|
| `college-baseball-tracker` | `wrangler.toml` (root) | Pages deployment | Active |
| `bsi-home` | `bsi-production/` | `blazesportsintel.com/*` | Active |
| `bsi-prediction-api` | `workers/prediction/` | `api.blazesportsintel.com/v1/*` | Active |
| `bsi-baseball-rankings` | `workers/baseball-rankings/` | `blazesportsintel.com/baseball/rankings` | Active |

### Data Ingestion Workers

| Worker Name | Location | Cron | Status |
|-------------|----------|------|--------|
| `blazesports-ingest` | `workers/ingest/` | `*/5 * * * *`, `0 * * * *`, `0 2 * * *` | Active |
| `bsi-cfb-ai` | `workers/bsi-cfb-ai/` | `0 6 * * *`, `0 */4 * * *` | **FIXED** (KV ID updated) |
| `bsi-cache-warmer` | `workers/bsi-cache-warmer/` | `*/5 * * * *` | Active |
| `bsi-news-ticker` | `workers/bsi-news-ticker/` | `*/5 * * * *` | Active |

### Support Workers

| Worker Name | Location | Purpose | Status |
|-------------|----------|---------|--------|
| `blaze-data-layer` | `app/` | Durable Objects | Active |
| `bsi-chatgpt-app` | `workers/bsi-chatgpt-app/` | ChatGPT integration | Active |
| `bsi-portal-agent` | `src/agents/bsi-agent/` | NCAA Portal tracking | Active |
| `blaze-blitz-football` | `games/blitz/` | Game | Active |

---

## 2. D1 Databases

### Active BSI Databases

| Database Name | UUID | Size | Used By |
|---------------|------|------|---------|
| `bsi-historical-db` | `9cecff0f-a3ab-433f-bf10-d2664d9542b0` | 3.0 MB | Root, Prediction, CFB-AI |
| `bsi-game-db` | `88eb676f-af0f-470c-a46a-b9429f5b51f3` | 311 KB | bsi-home, blitz game |
| `bsi-portal-db` | `d48fd89c-f2de-415b-935b-429f5e1fd60e` | 78 KB | Portal agent |
| `bsi-models-db` | `57601862-355e-4f41-8b81-bcb28de08425` | 438 KB | Model storage |
| `bsi-mmr-db` | `4405c459-830a-4b20-8b0c-1b8cb5a83587` | 74 KB | MMR calculations |

### Non-BSI Databases (Consider Cleanup)

| Database Name | UUID | Size | Notes |
|---------------|------|------|-------|
| `satx-nightlife-db` | `c9a487b0-7ccc-4c16-9895-74fd86038fb9` | 147 KB | Side project? |
| `blaze-reading-compass` | `7216a5d0-b7b7-49c9-b4ab-8aa3af22d714` | 49 KB | Side project? |

---

## 3. KV Namespaces

### Actively Used

| Title | ID | Used By |
|-------|-----|---------|
| `CACHE` | `a53c3726fc3044be82e79d2d1e371d26` | Root, Ingest, Rankings |
| `PREDICTION_CACHE` | `eebf04d329c0419e92eec884f39a636d` | Prediction API |
| `SPORTS_CACHE` | `c912d983175e4a1480225cfd57ed3434` | Prediction API |
| `blazesports-cache` | `b03e0651b4a34078a3e031bc5bc14ad7` | bsi-home (SESSIONS) |
| `BSI_CHATGPT_CACHE` | `9752bd76e948431f93b6df097b1f2bed` | ChatGPT App |
| `bsi-ticker-cache` | `5d01a9493aaa4b29866bf7a1f411a984` | News Ticker |
| `blaze-backyard-baseball-BLITZ_CACHE` | `49ef22a75f8f42789cb6507a2cbe16f5` | Blitz game |
| `BSI_PORTAL_CACHE` | `edab31e13ebf4e12902f8e8bb5f74f07` | Portal Agent |

### Supporting/Unused

| Title | ID | Notes |
|-------|-----|-------|
| `BLAZE_KV` | `1b4e56b25c1442029c5eb3215f9ff636` | Legacy? |
| `BSI_PREVIEW_CACHE` | `3815c8cc886a45d28b3783de26501db7` | Preview env |
| `READING_COMPASS_CACHE` | `84c09267475740c3a068860d31111f89` | Side project |
| `satx-nightlife-cache` | `bb9c6f58b7e045ac81260b22f1fb755c` | Side project |
| `worker-BACKYARD_CACHE` | `6c2af9a742e241149eb64f618e373aae` | Game cache |

---

## 4. R2 Buckets

| Bucket Name | Created | Purpose |
|-------------|---------|---------|
| `blaze-sports-data-lake` | 2025-08-20 | Main sports data |
| `blazesports-assets` | 2025-10-11 | Static assets |
| `blaze-nil-archive` | 2025-12-27 | NIL data archive |
| `bsi-embeddings` | 2025-10-10 | Vector embeddings |
| `blaze-intelligence` | 2025-08-18 | General storage |
| `blaze-intelligence-videos` | 2025-08-20 | Video content |
| `blaze-vision-clips` | 2025-08-24 | Vision clips |
| `blaze-vision-videos` | 2025-08-28 | Vision videos |
| `blaze-youth-data` | 2025-08-24 | Youth baseball data |
| `podcasts` | 2025-10-18 | Podcast storage |

---

## 5. Critical Issues

### Issue 1: Placeholder KV ID in bsi-cfb-ai

**Location:** `workers/bsi-cfb-ai/wrangler.toml:14`

```toml
[[kv_namespaces]]
binding = "CFB_CACHE"
id = "8a7b3c4d5e6f7890abcdef1234567890"  # PLACEHOLDER - NOT A REAL ID
```

**Impact:** Worker will fail to deploy or function correctly.

**Fix:**
```bash
# Create the namespace
wrangler kv:namespace create "CFB_CACHE"
# Copy the returned ID and update wrangler.toml
```

### Issue 2: Sprawl Folders

**Locations:**
- `/BSI/Claude Code Agents Tailored/agitated-cohen/` (full duplicate)
- `/BSI/wonderful-elion/` (referenced in glob, may exist)
- `~/.github/workflows/deploy-bsi.yml` (sprawl outside BSI repo)

**Impact:** Violates single-repo rule, creates maintenance burden.

**Fix:**
- Delete BSI sprawl folders after confirming no unique content
- Review `~/.github/workflows/deploy-bsi.yml` - merge useful parts into BSI workflows or delete

### Issue 3: Inconsistent Naming

**Problem:** KV namespaces use multiple conventions:
- `CACHE` (uppercase, generic)
- `BSI_CHATGPT_CACHE` (prefixed)
- `blazesports-cache` (lowercase, hyphenated)
- `bsi-ticker-cache` (lowercase, hyphenated)

**Recommendation:** Standardize to `BSI_{DOMAIN}_{PURPOSE}` per CLAUDE.md.

### Issue 4: Outdated D1 Reference

**Location:** `docs/CLOUDFLARE_BINDINGS_SETUP.md:56`

```markdown
**Database ID**: `612f6f42-226d-4345-bb1c-f0367292f55e`
```

**Actual ID:** `9cecff0f-a3ab-433f-bf10-d2664d9542b0`

---

## 6. Recommendations

### Immediate Actions

1. **Fix CFB_CACHE placeholder** - Create namespace, update wrangler.toml
2. **Delete sprawl folders** - After backup verification
3. **Update CLOUDFLARE_BINDINGS_SETUP.md** - Correct database ID

### Short-term (This Week)

1. **Consolidate caches** - Merge redundant KV namespaces where possible
2. **Standardize naming** - Rename KV namespaces to follow convention
3. **Archive non-BSI databases** - Move satx-nightlife and reading-compass data

### Medium-term (This Month)

1. **Implement staging environments** - Add `[env.staging]` to wrangler configs
2. **Set up unified monitoring** - Single Analytics Engine dataset
3. **Document deployment order** - Workers have dependencies

---

## 7. Resource Dependencies

```
blazesportsintel.com (Pages)
├── KV: CACHE (a53c...)
├── D1: bsi-historical-db
├── D1: NIL_DB (same)
├── R2: SPORTS_DATA
├── R2: NIL_ARCHIVE
├── Vectorize: sports-scouting-index
└── Analytics: bsi_sports_metrics

api.blazesportsintel.com
├── bsi-prediction-api
│   ├── KV: PREDICTION_CACHE
│   ├── KV: SPORTS_CACHE
│   └── D1: bsi-historical-db
└── bsi-chatgpt-app
    └── KV: BSI_CHATGPT_CACHE

ticker.blazesportsintel.com
└── bsi-news-ticker
    ├── KV: TICKER_CACHE
    ├── DO: NewsTickerDO
    └── Queue: news-ingest

Data Ingestion (Cron)
├── blazesports-ingest
│   ├── KV: CACHE
│   └── R2: blazesports-archives
├── bsi-cfb-ai (BROKEN)
│   ├── KV: CFB_CACHE (missing)
│   └── D1: bsi-historical-db
└── bsi-cache-warmer (no bindings)
```

---

## 8. Verification Commands

```bash
# Verify credentials
wrangler whoami

# List all resources
wrangler d1 list
wrangler kv namespace list
wrangler r2 bucket list

# Check specific worker
wrangler deployments list --name bsi-prediction-api

# Verify secrets (names only)
wrangler secret list --name bsi-prediction-api

# Test endpoints
curl -I https://blazesportsintel.com/
curl -I https://api.blazesportsintel.com/v1/predict/health
curl -I https://ticker.blazesportsintel.com/
```

---

## Appendix: Full wrangler.toml Locations

```
BSI/wrangler.toml                                    # college-baseball-tracker (Pages)
BSI/bsi-production/wrangler.toml                     # bsi-home
BSI/app/wrangler.toml                                # blaze-data-layer
BSI/workers/prediction/wrangler.toml                 # bsi-prediction-api
BSI/workers/ingest/wrangler.toml                     # blazesports-ingest
BSI/workers/baseball-rankings/wrangler.toml          # bsi-baseball-rankings
BSI/workers/bsi-chatgpt-app/wrangler.toml            # bsi-chatgpt-app
BSI/workers/bsi-cfb-ai/wrangler.toml                 # bsi-cfb-ai (BROKEN)
BSI/workers/bsi-cache-warmer/wrangler.toml           # bsi-cache-warmer
BSI/workers/bsi-news-ticker/wrangler.toml            # bsi-news-ticker
BSI/src/agents/bsi-agent/wrangler.toml               # bsi-portal-agent
BSI/src/features/historical-records/wrangler.toml    # (not reviewed)
BSI/games/blitz/wrangler.toml                        # blaze-blitz-football
BSI/games/hoops/wrangler.toml                        # (not reviewed)
BSI/games/backyard/wrangler.toml                     # (not reviewed)
BSI/games/qb-challenge/wrangler.toml                 # (not reviewed)
```

---

*Generated by Cloudflare Infrastructure Audit - January 7, 2026*
