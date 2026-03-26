---
name: cloudflare
description: BSI-specific Cloudflare infrastructure context for the cloudflare-skills plugin
type: plugin-settings
plugin: cloudflare-skills
enabled: true
---

# BSI Cloudflare Infrastructure Context

This file injects BSI's architecture into every cloudflare-skills plugin skill.
Source of truth: `~/.claude/projects/-Users-AustinHumphrey/memory/infrastructure.md`

## Account & Auth

- Account ID: `a12cb329d84130460eed99b816e4d0d3`
- Auth: Wrangler OAuth at `~/.wrangler/config/default.toml`
- MCP server priority (use in order, fall through on failure):
  1. `mcp__plugin_cloudflare_*` — locally configured plugin servers
  2. `mcp__cloudflare-mcp-*` — standalone local MCP servers
  3. `mcp__claude_ai_Cloudflare_*` — cloud-hosted MCP servers
  4. REST API via `curl` with OAuth token — last resort

## Architecture

**Apex worker pattern:** `blazesportsintel-worker-prod` (Hono router) is the single entry point for `blazesportsintel.com/*`. API routes handled by Hono handlers. All other requests proxy to `blazesportsintel.pages.dev` (static export). Pages never receives direct traffic.

**Game detail fallback:** Dynamic game IDs (e.g., `/college-baseball/game/12345/`) have no static pages. When Pages 404s, the Worker serves a placeholder shell (`/game/placeholder/`). Client-side JS reads the real ID from `window.location` and fetches data dynamically.

**Scheduled handler:** Main worker cron runs every minute (`handleScheduled`), warming short-term memory for scores and rankings across all sports.

**Satellite workers:** 18 independent workers in `workers/*/`, each with own `wrangler.toml`, deployed separately.

## Workers (23 deployed)

**Site & API (Hono):**
`blazesportsintel-worker-prod` (routes blazesportsintel.com) · `blazesportsintel-worker` (dev)

**Ingest:**
`bsi-cbb-ingest` · `bsi-sportradar-ingest` (cron */2 min game hours, */15 off-hours) · `bsi-portal-sync`

**College Baseball API (separate repo `~/college-baseball-api/`):**
`cbb-api` · `cbb-api-sync` · `college-baseball-mcp` (JSON-RPC at `sabermetrics.blazesportsintel.com`)

**Analytics & Compute:**
`bsi-analytics-events` · `bsi-savant-compute` (cron 6h — wOBA, FIP, wRC+) · `bsi-cbb-analytics` (cron daily 6 AM CT — park factors, conference strength)

**Real-time & AI:**
`bsi-live-scores` (WebSocket via DO `LiveScoresBroadcaster`) · `bsi-intelligence-stream` (SSE via Anthropic) · `bsi-college-baseball-daily` (dual cron 5 AM + 11 PM CT) · `bsi-social-intel` (cron — social feed)

**Operations:**
`bsi-error-tracker` (tail consumer) · `bsi-synthetic-monitor` (cron 5 min)

**BlazeCraft:**
`blaze-field-site` · `blaze-field-site-prod` (routes blazecraft.app) · `blaze-field-do`

**Games:**
`mini-games-api`

**Other (separate repo `~/moltworker/`):**
`moltbot-sandbox`

## Naming Conventions

| Resource | Pattern | Example |
|----------|---------|---------|
| Worker | `bsi-{domain}-{function}` | `bsi-scores-live` |
| KV | `BSI_{DOMAIN}_{PURPOSE}` | `BSI_SCORES_CACHE` |
| D1 | `bsi-{domain}-db` | `bsi-analytics-db` |
| R2 | `bsi-{domain}-assets` | `bsi-media-assets` |

## Deploy Patterns

- **Satellite:** `wrangler deploy --config workers/{name}/wrangler.toml`
- **Main worker:** `npm run deploy:worker` (uses `--env production`)
- **Pages:** `npm run deploy:production` (build -> stage to `/var/tmp/bsi-deploy-out` -> wrangler pages deploy)
- **Full:** `npm run deploy:all` (pre-deploy-check + deploy:safe + worker)
- **Wrangler 4.71.0+ required**

## Gotchas

- **iCloud Drive:** git operations may hang. Check for stale `.git/index.lock`.
- **Pages deploy:** timeout on 15K+ files — retry; second deploy instant (hash dedup).
- **Staging path:** `/var/tmp/bsi-deploy-out` — NOT `/tmp/` (iCloud evicts).
- **Dual analytics crons:** `bsi-savant-compute` + `bsi-cbb-analytics` both write advanced metrics to same tables. Check both when debugging.
- **Config format:** BSI uses `wrangler.toml` throughout — NOT `wrangler.jsonc`.

## KV TTLs

- Live scores: 15-30s
- Standings: 60s
- Final games: 5 min
- Rosters: 1 hr

## Durable Objects (5)

| DO Class | Worker | Purpose |
|----------|--------|---------|
| `CacheObject` | `blazesportsintel-worker-prod` | Coordinated in-memory cache |
| `PortalPoller` | `blazesportsintel-worker-prod` | Alarm-based transfer portal polling (stub) |
| `LiveScoresBroadcaster` | `bsi-live-scores` | WebSocket score push |
| `RateLimiterDO` | `cbb-api` (separate repo) | API rate limiting |
| `GameRoom` | `blaze-field-do` | BlazeCraft multiplayer |

## D1 Databases (8)

`bsi-prod-db` (19.5 MB, main) · `bsi-events-db` (6.2 MB, analytics) · `bsi-historical-db` (4.6 MB, archives) · `bsi-game-db` (3.4 MB, live games) · `cbb-api-db` (3.0 MB, college baseball API) · `bsi-fanbase-db` (197 KB, fan sentiment) · `humphrey-dna-db` (64 KB, DNA archive) · `blazecraft-leaderboards` (45 KB, games)

## KV Namespaces (12)

**Core:** `BSI_PROD_CACHE` · `BSI_KEYS` (API key -> tier) · `RATE_LIMIT` (mini-games-api) · `BSI_DEV_CACHE`
**Worker-specific:** `BSI_SPORTRADAR_CACHE` · `BSI_ERROR_LOG` · `BSI_MONITOR_KV` · `BSI_AI_CACHE` · `PREDICTION_CACHE`
**College Baseball MCP:** `RATE_LIMIT_KV` · `TEAM_STATS_KV`
**Other:** `portfolio-contacts`

## R2 Buckets (18)

**Data:** `blaze-sports-data-lake` · `blazesports-archives` · `bsi-embeddings` · `blaze-nil-archive`
**Assets:** `bsi-web-assets` · `blazesports-assets` · `bsi-blazecraft-assets` · `blazecraft-artifacts` · `blazecraft-replays` · `blaze-field-assets` · `bsi-game-assets` · `bsi-sandlot-sluggers-assets`
**Media:** `blaze-intelligence` · `blaze-intelligence-videos` · `blaze-vision-clips` · `blaze-vision-videos` · `podcasts`
**Other:** `blaze-youth-data`
