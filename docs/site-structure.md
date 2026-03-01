# BSI Site Architecture

Generated 2026-02-17 from the `ahump20/BSI` repo. Verify Cloudflare state with `wrangler` -- this document is the map, not the territory.

---

## Route Map

Every `page.tsx` under `app/`. Routes are static-exported (Next.js `output: 'export'`). Dynamic segments use `generateStaticParams()`.

### Homepage

| Route | Purpose |
|-------|---------|
| `/` | Landing page with hero scores strip, stats band, pricing preview, email capture |

### College Baseball (Flagship)

| Route | Purpose |
|-------|---------|
| `/college-baseball` | Sport hub |
| `/college-baseball/scores` | Live/recent scoreboard |
| `/college-baseball/standings` | Conference standings |
| `/college-baseball/rankings` | Top 25 rankings |
| `/college-baseball/games` | Games index |
| `/college-baseball/game/[gameId]` | Game detail |
| `/college-baseball/game/[gameId]/box-score` | Box score tab |
| `/college-baseball/game/[gameId]/play-by-play` | Play-by-play tab |
| `/college-baseball/game/[gameId]/recap` | Game recap tab |
| `/college-baseball/game/[gameId]/team-stats` | Team stats tab |
| `/college-baseball/game/[gameId]/live` | Live game view |
| `/college-baseball/teams` | Teams directory |
| `/college-baseball/teams/[teamId]` | Team detail |
| `/college-baseball/players` | Players directory |
| `/college-baseball/players/[playerId]` | Player detail |
| `/college-baseball/players/compare` | Player comparison tool |
| `/college-baseball/news` | News feed |
| `/college-baseball/transfer-portal` | Transfer portal tracker |
| `/college-baseball/transfer-portal/[playerId]` | Portal player detail |
| `/college-baseball/conferences` | Conference directory |
| `/college-baseball/conferences/[conferenceId]` | Conference detail |
| `/college-baseball/compare` | Team comparison index |
| `/college-baseball/compare/[team1]/[team2]` | Head-to-head team comparison |
| `/college-baseball/trends` | Team trend charts |
| `/college-baseball/daily/[date]` | Daily digest (date-keyed) |
| `/college-baseball/analytics` | Analytics hub |
| `/college-baseball/tournament` | Tournament hub |
| `/college-baseball/tournament/bubble` | Bubble watch |
| `/college-baseball/tournament/regionals` | Regional projections |
| `/college-baseball/tournament/cws` | College World Series |
| `/college-baseball/preseason` | Preseason hub |
| `/college-baseball/preseason/power-25` | Preseason power rankings |
| `/college-baseball/preseason/sec-preview` | SEC preview |
| `/college-baseball/preseason/lone-star-rivalry` | Lone Star rivalry preview |

### College Baseball Editorial (~50+ pages)

| Route pattern | Purpose |
|---------------|---------|
| `/college-baseball/editorial` | Editorial index |
| `/college-baseball/editorial/daily/[date]` | Daily editorial by date |
| `/college-baseball/editorial/[team]-2026` | Team season previews (Big 12, Big Ten, SEC schools) |
| `/college-baseball/editorial/big-12` | Big 12 conference preview |
| `/college-baseball/editorial/big-ten` | Big Ten conference preview |
| `/college-baseball/editorial/sec` | SEC conference preview |
| `/college-baseball/editorial/week-1-preview` | Week 1 preview |
| `/college-baseball/editorial/week-1-recap` | Week 1 recap |
| `/college-baseball/editorial/texas-week-1-recap` | Texas week 1 recap |
| `/college-baseball/editorial/texas-uc-davis-opener-2026` | Texas opener recap |
| `/college-baseball/editorial/national-opening-weekend` | National opening weekend |
| `/college-baseball/editorial/acc-opening-weekend` | ACC opening weekend |
| `/college-baseball/editorial/big-12-opening-weekend` | Big 12 opening weekend |
| `/college-baseball/editorial/sec-opening-weekend` | SEC opening weekend |

### MLB

| Route | Purpose |
|-------|---------|
| `/mlb` | Sport hub |
| `/mlb/scores` | Scoreboard |
| `/mlb/standings` | Standings |
| `/mlb/games` | Games index |
| `/mlb/game/[gameId]` | Game detail |
| `/mlb/game/[gameId]/box-score` | Box score |
| `/mlb/game/[gameId]/play-by-play` | Play-by-play |
| `/mlb/game/[gameId]/recap` | Game recap |
| `/mlb/game/[gameId]/team-stats` | Team stats |
| `/mlb/news` | News |
| `/mlb/teams` | Teams directory |
| `/mlb/teams/[teamId]` | Team detail |
| `/mlb/players` | Players directory |
| `/mlb/players/[playerId]` | Player detail |
| `/mlb/stats` | Stats page |
| `/mlb/abs` | ABS Challenge Tracker |

### NFL

| Route | Purpose |
|-------|---------|
| `/nfl` | Sport hub |
| `/nfl/scores` | Scoreboard |
| `/nfl/standings` | Standings |
| `/nfl/games` | Games index |
| `/nfl/news` | News |
| `/nfl/teams` | Teams directory |
| `/nfl/teams/[teamId]` | Team detail |
| `/nfl/players` | Players directory |
| `/nfl/players/[playerId]` | Player detail |

### NBA

| Route | Purpose |
|-------|---------|
| `/nba` | Sport hub |
| `/nba/scores` | Scoreboard |
| `/nba/standings` | Standings |
| `/nba/games` | Games index |
| `/nba/news` | News |
| `/nba/teams` | Teams directory |
| `/nba/teams/[teamId]` | Team detail |
| `/nba/players` | Players directory |
| `/nba/players/[playerId]` | Player detail |

### CFB (College Football)

| Route | Purpose |
|-------|---------|
| `/cfb` | Sport hub |
| `/cfb/scores` | Scoreboard |
| `/cfb/standings` | Conference standings |
| `/cfb/transfer-portal` | Transfer portal tracker |
| `/cfb/articles` | Articles index |
| `/cfb/articles/[slug]` | Article detail |

### Analytics & Models

| Route | Purpose |
|-------|---------|
| `/analytics` | Analytics hub |
| `/analytics/mmi` | Momentum & Morale Index page |
| `/models` | Models overview |
| `/models/win-probability` | Win probability model |
| `/models/monte-carlo` | Monte Carlo simulations |
| `/models/data-quality` | Data quality / source transparency |

### Intel

| Route | Purpose |
|-------|---------|
| `/intel` | Intel hub |
| `/intel/game-briefs` | Game briefs index |
| `/intel/game-briefs/[slug]` | Game brief detail |
| `/intel/team-dossiers` | Team dossiers index |
| `/intel/team-dossiers/[slug]` | Team dossier detail |
| `/intel/weekly-brief` | Weekly intelligence brief |

### NIL Valuation

| Route | Purpose |
|-------|---------|
| `/nil-valuation` | NIL analytics hub |
| `/nil-valuation/methodology` | NIL methodology |
| `/nil-valuation/tools` | NIL tools |

### Vision AI

| Route | Purpose |
|-------|---------|
| `/vision-ai` | Computer vision analytics page |
| `/vision-ai-intelligence` | Real-time pose estimation tool |

### Arcade

| Route | Purpose |
|-------|---------|
| `/arcade` | Arcade hub (manifest-driven game grid with category filtering) |
| `/arcade/games` | Games catalog |
| `/arcade/games/blitz` | Blitz game |
| `/arcade/games/downtown-doggies` | Downtown Doggies game |
| `/arcade/games/hotdog-dash` | Hotdog Dash game |
| `/arcade/games/leadership-capital` | Leadership Capital game |
| `/arcade/games/sandlot-sluggers` | Sandlot Sluggers game |
| `/arcade/wc3-dashboard` | BlazeCraft WC3-style dashboard |

### Utility

| Route | Purpose |
|-------|---------|
| `/scores` | Cross-sport live scoreboard |
| `/search` | Site-wide search |
| `/dashboard` | User dashboard |
| `/dashboard/admin` | Admin dashboard |
| `/dashboard/intel` | Intel dashboard |
| `/fanbase` | Fan engagement hub |
| `/fanbase/compare` | Fanbase comparison |
| `/transfer-portal` | Cross-sport transfer portal |
| `/coverage` | Redirects to `/analytics` |
| `/data-sources` | Data source transparency |
| `/glossary` | Analytics glossary |
| `/pricing` | Pricing page |
| `/checkout` | Stripe checkout |
| `/checkout/return` | Checkout return |
| `/auth/login` | Login (stub -- 501) |
| `/auth/signup` | Signup (stub -- 501) |
| `/contact` | Contact form |
| `/settings` | User settings |
| `/about` | About BSI |
| `/about/methodology` | Methodology |
| `/about/partnerships` | Partnerships |
| `/for-coaches` | Landing page for coaches |
| `/for-scouts` | Landing page for scouts |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/baseball/rankings` | Redirects to `/college-baseball/rankings` |

---

## API Routes

All routes served by the Hono worker at `workers/index.ts` (deployed as `blazesportsintel-worker-prod`). Method is GET unless noted.

### Health & Operations

| Route | Method | Description |
|-------|--------|-------------|
| `/health` | GET | Health check |
| `/api/health` | GET | Health check (aliased) |
| `/api/admin/health` | GET | Admin health check (detailed) |
| `/api/admin/errors` | GET | Recent error log |
| `/api/health/providers` | GET | External data provider status (cron-tracked) |
| `/api/model-health` | GET | ML model health status |

### College Baseball

| Route | Method | Description |
|-------|--------|-------------|
| `/api/college-baseball/scores` | GET | Scores (filterable by date) |
| `/api/college-baseball/standings` | GET | Standings (filterable by conference) |
| `/api/college-baseball/rankings` | GET | Top 25 rankings |
| `/api/college-baseball/schedule` | GET | Schedule (date range) |
| `/api/college-baseball/trending` | GET | Trending teams/games |
| `/api/college-baseball/news` | GET | News feed |
| `/api/college-baseball/news/enhanced` | GET | Enhanced news (enriched) |
| `/api/college-baseball/players` | GET | Players list (paginated) |
| `/api/college-baseball/transfer-portal` | GET | Transfer portal data |
| `/api/college-baseball/daily` | GET | Daily digest bundle |
| `/api/college-baseball/teams/:teamId` | GET | Team detail |
| `/api/college-baseball/players/compare/:p1/:p2` | GET | Player comparison |
| `/api/college-baseball/players/:playerId` | GET | Player detail |
| `/api/college-baseball/game/:gameId` | GET | Game detail |
| `/api/college-baseball/games/:gameId` | GET | Game detail (alias) |
| `/api/college-baseball/trends/:teamId` | GET | Team trend data |
| `/api/college-baseball/editorial/list` | GET | Editorial index |
| `/api/college-baseball/editorial/daily/:date` | GET | Editorial by date |
| `/api/college-baseball/scores/ws` | GET | WebSocket redirect (returns 501, points to bsi-live-scores worker) |

### CFB

| Route | Method | Description |
|-------|--------|-------------|
| `/api/cfb/transfer-portal` | GET | CFB transfer portal |
| `/api/cfb/scores` | GET | CFB scores |
| `/api/cfb/standings` | GET | CFB standings |
| `/api/cfb/news` | GET | CFB news |
| `/api/ncaa/scores?sport=football` | GET | NCAA football scores (alias) |
| `/api/ncaa/standings?sport=football` | GET | NCAA football standings (alias) |
| `/api/college-football/articles` | GET | CFB articles list |
| `/api/college-football/articles/:slug` | GET | CFB article by slug |

### MLB

| Route | Method | Description |
|-------|--------|-------------|
| `/api/mlb/scores` | GET | MLB scores |
| `/api/mlb/standings` | GET | MLB standings |
| `/api/mlb/news` | GET | MLB news |
| `/api/mlb/teams` | GET | MLB teams list |
| `/api/mlb/game/:gameId` | GET | MLB game detail |
| `/api/mlb/players/:playerId` | GET | MLB player detail |
| `/api/mlb/teams/:teamId` | GET | MLB team detail |

### NFL

| Route | Method | Description |
|-------|--------|-------------|
| `/api/nfl/scores` | GET | NFL scores |
| `/api/nfl/standings` | GET | NFL standings |
| `/api/nfl/news` | GET | NFL news |
| `/api/nfl/teams` | GET | NFL teams list |
| `/api/nfl/players` | GET | NFL players list |
| `/api/nfl/leaders` | GET | NFL stat leaders |
| `/api/nfl/game/:gameId` | GET | NFL game detail |
| `/api/nfl/players/:playerId` | GET | NFL player detail |
| `/api/nfl/teams/:teamId` | GET | NFL team detail |

### NBA

| Route | Method | Description |
|-------|--------|-------------|
| `/api/nba/scores` | GET | NBA scores |
| `/api/nba/scoreboard` | GET | NBA scoreboard (alias) |
| `/api/nba/standings` | GET | NBA standings |
| `/api/nba/news` | GET | NBA news |
| `/api/nba/teams` | GET | NBA teams list |
| `/api/nba/game/:gameId` | GET | NBA game detail |
| `/api/nba/players/:playerId` | GET | NBA player detail |
| `/api/nba/teams/:teamId` | GET | NBA team detail |

### Analytics: HAV-F (Hit Approach Value Factor)

| Route | Method | Description |
|-------|--------|-------------|
| `/api/analytics/havf/leaderboard` | GET | HAV-F leaderboard (filterable by league, team, position, conference, season) |
| `/api/analytics/havf/player/:id` | GET | HAV-F for specific player |
| `/api/analytics/havf/compare/:p1/:p2` | GET | HAV-F player comparison |
| `/api/analytics/havf/compute` | POST | Batch HAV-F computation |

### Analytics: MMI (Momentum & Morale Index)

| Route | Method | Description |
|-------|--------|-------------|
| `/api/analytics/mmi/live/:gameId` | GET | Live MMI for in-progress game |
| `/api/analytics/mmi/game/:gameId` | GET | MMI for completed game |
| `/api/analytics/mmi/trending` | GET | Trending MMI swings |

### Computer Vision

| Route | Method | Description |
|-------|--------|-------------|
| `/api/cv/pitcher/:playerId/mechanics` | GET | Pitcher mechanics analysis |
| `/api/cv/pitcher/:playerId/mechanics/history` | GET | Mechanics history (date range) |
| `/api/cv/alerts/injury-risk` | GET | Injury risk alerts |
| `/api/cv/adoption` | GET | CV adoption metrics |

### Cross-cutting

| Route | Method | Description |
|-------|--------|-------------|
| `/api/scores/cached` | GET | Cron-warmed cached scores (`?sport=mlb\|nfl\|nba\|cfb\|ncaa`) |
| `/api/search` | GET | Site-wide search |
| `/api/news/:sport` | GET | ESPN news proxy by sport key |
| `/api/intel/news` | GET | Aggregated intel news across sports |
| `/api/teams/:league` | GET | Generic teams list by league |
| `/api/games/assets/*` | GET | R2 game asset serving |
| `/api/multiplayer/leaderboard` | GET | Arcade leaderboard read |
| `/api/multiplayer/leaderboard` | POST | Arcade leaderboard submit |

### MCP Protocol

| Route | Method | Description |
|-------|--------|-------------|
| `/mcp` | ALL | Model Context Protocol server (13 tools: scores, standings, rankings, team, game, player, schedule for college baseball + MLB + NFL + NBA) |

### Submissions & Capture

| Route | Method | Description |
|-------|--------|-------------|
| `/api/contact` | POST | Contact form submission |
| `/api/lead` | POST | Lead capture (email + org + consent) |
| `/api/leads` | POST | Lead capture (alias) |
| `/api/feedback` | POST | User feedback |
| `/api/predictions` | POST | Prediction submission |
| `/api/predictions/accuracy` | GET | Prediction accuracy metrics |
| `/api/analytics/event` | POST | Client-side analytics event |
| `/_csp/report` | POST | CSP violation reports |

### Auth (Stubs)

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/login` | ALL | Returns 501 -- not yet implemented |
| `/api/auth/signup` | ALL | Returns 501 -- not yet implemented |

### WebSocket

| Route | Method | Description |
|-------|--------|-------------|
| `/ws` | GET (Upgrade) | WebSocket connection for live updates |
| `live.blazesportsintel.com/*` | WebSocket | Dedicated live scores (bsi-live-scores worker, Durable Object) |

### Fallback

All unmatched routes proxy to Cloudflare Pages (`blazesportsintel.pages.dev`) via `proxyToPages()`.

---

## Pages Functions

Cloudflare Pages Functions under `functions/api/`. These serve as fallbacks when the hybrid Worker doesn't intercept the route (e.g., Pages-only preview deploys).

| Route | File | Purpose |
|-------|------|---------|
| `/api/health` | `health.ts` | Lightweight health check fallback |
| `/api/hero-scores` | `hero-scores.ts` | Hero strip aggregator -- returns liveNow/nextUp/recentFinal across in-season sports |
| `/api/live-scores` | `live-scores.ts` | Empty-but-structured fallback when Worker unavailable |
| `/api/lead` | `lead.ts` | Lead capture (KV storage, 90-day TTL, consent required) |
| `/api/newsletter` | `newsletter.ts` | Newsletter subscription (KV storage) |
| `/api/agent-health` | `agent-health.ts` | Agent pulse check |
| `/api/semantic-health` | `semantic-health.ts` | Admin-only KV/R2 audit (paginated list, bearer token required) |
| `/api/ai/game-analysis` | `ai/game-analysis.ts` | AI game analysis proxy (Claude or Gemini) |
| `/api/mlb/abs` | `mlb/abs.ts` | ABS Challenge Tracker data (D1 + KV) |
| `/api/mlb/leaderboards/:category` | `mlb/leaderboards/[category].ts` | MLB leaderboard fallback |
| `_middleware.ts` | `_middleware.ts` | Shared middleware |
| `_utils.ts` | `_utils.ts` | Shared utilities (ok, err, preflight, cache helpers) |

---

## Workers Inventory

15 workers in-repo (14 listed in CLAUDE.md as deployed, plus `bsi-college-baseball-daily`).

### Site & API

| Worker | Purpose | Cron | Key Bindings |
|--------|---------|------|--------------|
| `blazesportsintel-worker-prod` | Apex Hono router -- handles all `/api/*`, `/ws`, `/mcp`, proxies static to Pages | `*/1 * * * *` (every minute, scores cache warming) | KV (`BSI_PROD_CACHE`), D1 (`bsi-prod-db`), KV (`BSI_ERROR_LOG`), R2 (`bsi-game-assets`), DO (`CacheObject`, `PortalPoller`), Analytics Engine (`bsi_ops_events`) |
| `blazesportsintel-worker` | Dev/default environment of the above | Same | Same (with `BSI_DEV_CACHE` preview KV) |
| `blazesportsintel-worker-canary` | Canary environment | -- | -- |

### Ingest Pipeline

| Worker | Purpose | Cron | Key Bindings |
|--------|---------|------|--------------|
| `bsi-cbb-ingest` | Pre-caches college baseball scores, standings, rankings into KV | `*/2 * * * *` (scores), `*/15 * * * *` (standings/rankings) | KV (`BSI_PROD_CACHE`) |
| `bsi-sportradar-ingest` | Polls Sportradar MLB v8 API, archives raw payloads to R2, writes normalized pitch events to D1, computes ABS aggregates to KV | `*/2 * * * *` (game hours), `*/15 * * * *` (off-hours) | KV (`BSI_SPORTRADAR_CACHE`), D1 (`bsi-game-db`), R2 (`blaze-sports-data-lake`) |
| `bsi-portal-sync` | Fetches college baseball transfer portal data, writes to KV | `*/30 * * * *` | KV (`BSI_PROD_CACHE`) |
| `bsi-college-baseball-daily` | Assembles daily digest bundles (pregame slate + recap), generates Claude API matchup takes, archives to KV + R2 | `0 11 * * *` (5am CT), `0 5 * * *` (11pm CT) | KV (`BSI_PROD_CACHE`), R2 (`blaze-sports-data-lake`) |
| `bsi-prediction-api` | Prediction model serving | -- | -- |

### Live Scores

| Worker | Purpose | Cron | Key Bindings |
|--------|---------|------|--------------|
| `bsi-live-scores` | WebSocket Durable Object worker for real-time college baseball scores. Clients connect via WebSocket, receive delta-only broadcasts every 15s. | None (event-driven) | DO (`LiveScoresBroadcaster`). Route: `live.blazesportsintel.com/*` |

### Operations

| Worker | Purpose | Cron | Key Bindings |
|--------|---------|------|--------------|
| `bsi-error-tracker` | Tail consumer -- captures logs from production worker, stores errors in KV | None (tail consumer) | KV (`BSI_ERROR_LOG`) |
| `bsi-synthetic-monitor` | Cron-based uptime checks on critical endpoints | `*/5 * * * *` | KV (`BSI_MONITOR_KV`) |
| `bsi-news-ticker` | News ticker data | -- | -- |
| `bsi-ticker` | Ticker data | -- | -- |

### BlazeCraft (blazecraft.app)

| Worker | Purpose | Cron | Key Bindings |
|--------|---------|------|--------------|
| `blaze-field-site` | Serves static assets from R2 for blazecraft.app | None | R2 (`blaze-field-assets`). Route: `blazecraft.app/*` |
| `blaze-field-do` | Durable Object for real-time multiplayer game rooms | None | DO (`GameRoom`) |

### Games

| Worker | Purpose | Cron | Key Bindings |
|--------|---------|------|--------------|
| `mini-games-api` | Arcade leaderboard API for browser games | None | D1 (`blazecraft-leaderboards`), KV (`RATE_LIMIT`). Route: `blazecraft.app/api/mini-games/*` |

---

## Data Flow

```
External APIs
  Highlightly Pro (api.highlightly.net) ──── primary, all baseball + football
  SportsDataIO (api.sportsdata.io)  ─────── NFL, NBA, MLB, CFB, CBB
  ESPN Site API (site.api.espn.com)  ─────── college baseball fallback
  Sportradar MLB v8  ────────────────────── pitch-level MLB data
  Claude / Gemini API  ──────────────────── AI game analysis + daily digest takes
       │
       ▼
  Cloudflare Workers
  ├── bsi-cbb-ingest ──────────────── cron-fetches CBB → KV
  ├── bsi-sportradar-ingest ───────── cron-fetches MLB → D1 + R2 + KV
  ├── bsi-portal-sync ─────────────── cron-fetches portal → KV
  ├── bsi-college-baseball-daily ──── cron-assembles digest → KV + R2
  ├── bsi-live-scores ─────────────── WebSocket DO → real-time clients
  └── blazesportsintel-worker-prod ── cron-warms scores → KV
       │
       ▼
  Storage Layer
  ├── KV  ─── hot cache (scores, standings, rankings, portal, digests)
  ├── D1  ─── structured data (games, pitches, predictions, models, analytics)
  └── R2  ─── raw payloads, archives, assets, media
       │
       ▼
  Pages Functions (functions/api/*)
  └── Fallback handlers for preview deploys + supplemental routes
       │
       ▼
  Static Next.js UI (app/)
  └── Client-side fetches from /api/* or WebSocket from live.blazesportsintel.com
```

Every API response includes `meta: { source, fetched_at, timezone: 'America/Chicago' }`.

---

## Storage Layer

### D1 Databases (5)

| Name | Size | Purpose | Bound Workers |
|------|------|---------|---------------|
| `bsi-historical-db` | 4.5 MB | Historical archives | -- |
| `bsi-game-db` | 3.3 MB | Live/recent game data, normalized pitch events | `bsi-sportradar-ingest` |
| `bsi-prod-db` | 344 KB | Production data (main worker: predictions, models, CV, HAV-F, MMI, contacts, CSP reports) | `blazesportsintel-worker-prod` |
| `bsi-fanbase-db` | 197 KB | Fan sentiment analytics | -- |
| `blazecraft-leaderboards` | 45 KB | Arcade leaderboards | `mini-games-api` |

### D1 Migrations (18 files, 018-037)

| Migration | Purpose |
|-----------|---------|
| `018_dataset_identity.sql` | Dataset identity tracking |
| `019_dataset_identity_harden.sql` | Dataset identity hardening |
| `020_leaderboard.sql` | Leaderboard tables |
| `021_model_health.sql` | Model health tracking |
| `022_predictions.sql` | Prediction storage |
| `023_cv_intelligence.sql` | Computer vision tables |
| `024_cv_seed_data.sql` | CV seed data |
| `025_sportradar_ingest.sql` | Sportradar pitch/game tables |
| `030_trends_snapshots.sql` | Trend snapshot tables |
| `031_editorials.sql` | Editorial content tables |
| `032_contact_submissions.sql` | Contact form submissions |
| `033_csp_reports.sql` | CSP violation reports |
| `034_havf_metric.sql` | HAV-F metric tables |
| `035_mmi_metric.sql` | MMI metric tables |
| `036_arcade_enhanced.sql` | Enhanced arcade tables |
| `037_search_index_fts5.sql` | FTS5 full-text search index |

### KV Namespaces (9)

| Name | ID Suffix | Bound Workers |
|------|-----------|---------------|
| `BSI_PROD_CACHE` | `...dbfee` | Main worker, cbb-ingest, portal-sync, daily |
| `BSI_DEV_CACHE` | `...5e2b` (preview_id) | Main worker (dev) |
| `BSI_SPORTRADAR_CACHE` | `...1033` | sportradar-ingest |
| `BSI_ERROR_LOG` | `...c9c6` | Main worker, error-tracker |
| `BSI_MONITOR_KV` | `...2eba` | synthetic-monitor |
| `RATE_LIMIT` | `...4cdb` | mini-games-api |
| `PREDICTION_CACHE` | -- | bsi-prediction-api |
| `bsi-ticker-cache` | -- | bsi-ticker |
| `portfolio-contacts` | -- | Portfolio site |

### R2 Buckets (18)

**Data:**
- `blaze-sports-data-lake` -- raw API payloads, daily digests
- `blazesports-archives` -- historical archives
- `bsi-embeddings` -- vector embeddings
- `blaze-nil-archive` -- NIL data archive

**Assets:**
- `bsi-web-assets` -- site static assets
- `blazesports-assets` -- general platform assets
- `bsi-blazecraft-assets` -- BlazeCraft assets
- `blazecraft-artifacts` -- BlazeCraft build artifacts
- `blazecraft-replays` -- BlazeCraft game replays
- `blaze-field-assets` -- BlazeCraft site assets (served by blaze-field-site worker)
- `bsi-game-assets` -- game assets (served via `/api/games/assets/*`)
- `bsi-sandlot-sluggers-assets` -- Sandlot Sluggers game assets

**Media:**
- `blaze-intelligence` -- intelligence reports
- `blaze-intelligence-videos` -- intelligence videos
- `blaze-vision-clips` -- CV analysis clips
- `blaze-vision-videos` -- CV analysis videos
- `podcasts` -- podcast storage

**Other:**
- `blaze-youth-data` -- youth sports data

---

## Middleware Stack

The main worker applies middleware in this order on every request:

1. **www redirect** -- `www.blazesportsintel.com` 301s to `blazesportsintel.com`
2. **Trailing slash** -- page paths without trailing slash get 301 redirect (skips `/api/*`, `/_csp/`, `/_next/`, `/ws`, `/health`, `/mcp`, file extensions)
3. **CORS** -- Origin validation against `PROD_ORIGINS` + `DEV_ORIGINS`, preflight handling
4. **Security headers** -- HSTS, X-Frame-Options DENY, CSP, Referrer-Policy, Permissions-Policy
5. **Rate limiting** -- `/api/*` routes: 120 req/min per IP (GET), 10 req/min per IP (POST)
6. **Ghost redirects** -- legacy `.html` paths and deprecated routes redirect to canonical URLs

---

## Recent Additions (This Session)

### Phase 1: Site Stability Fixes
- `AnimatedCounter` SSR fix (client-only rendering)
- `StatsBand` worker count correction
- Rankings page error state handling
- Scores hub per-sport loading states
- ESPN college baseball fallback in cron handler

### Phase 2: WebSocket Live Scores
- `bsi-live-scores` worker with Durable Object (`LiveScoresBroadcaster`)
- Production config: `live.blazesportsintel.com` route
- CSP `connect-src` updated to allow `wss://live.blazesportsintel.com`
- `useLiveScores` hook wired to `LiveScoresPanel` for NCAA
- `ConnectionIndicator` component for WebSocket status
- Deploy script for the live-scores worker

### Phase 3: HAV-F Analytics
- `lib/analytics/havf.ts` -- computation engine (Hit Approach Value Factor)
- `migrations/034_havf_metric.sql` -- D1 schema
- Worker handlers: leaderboard, player, compare, compute (`workers/handlers/analytics.ts`)
- Worker routes: `/api/analytics/havf/*`
- Analytics page route: `/analytics` (hub)

### Phase 4: MMI Analytics
- `lib/analytics/mmi.ts` -- computation engine (Momentum & Morale Index)
- `migrations/035_mmi_metric.sql` -- D1 schema
- Worker handlers: live, game, trending (`workers/handlers/analytics.ts`)
- Worker routes: `/api/analytics/mmi/*`
- Page route: `/analytics/mmi`

### Phase 5: External Repos
- Cloned Sandlot-Sluggers, public-espn-api, lone-star-legends into `external/`

### Phase 6: Arcade Refactor
- Manifest-driven game grid with category filtering
- `migrations/036_arcade_enhanced.sql` -- enhanced arcade tables
- Arcade hub (`/arcade`) renders from game manifest with category tabs

---

## Gap Analysis

What is coded but not yet deployed or fully wired:

1. **MMI enrichment in WebSocket broadcasts** -- `workers/bsi-live-scores/index.ts` has the `pollAndBroadcast` loop but does not compute MMI for live game payloads. The MMI computation engine exists in `lib/analytics/mmi.ts` but is not imported or called in the live-scores worker.

2. **D1 migrations 034-037 need to be applied** -- four migration files exist on disk but must be run against the target databases:
   ```bash
   wrangler d1 execute bsi-prod-db --file=migrations/034_havf_metric.sql
   wrangler d1 execute bsi-prod-db --file=migrations/035_mmi_metric.sql
   wrangler d1 execute bsi-prod-db --file=migrations/036_arcade_enhanced.sql
   wrangler d1 execute bsi-prod-db --file=migrations/037_search_index_fts5.sql
   ```

3. **bsi-live-scores worker secret** -- `RAPIDAPI_KEY` must be set via `wrangler secret put RAPIDAPI_KEY --config workers/bsi-live-scores/wrangler.toml` before the worker can poll Highlightly.

4. **Multi-sport WebSocket support** -- `bsi-live-scores` currently only handles NCAA college baseball. No polling or broadcasting for MLB, NFL, NBA, or CFB.

5. **Auth stubs** -- `/api/auth/login` and `/api/auth/signup` return 501. No authentication system is wired.

6. **FTS5 search index** -- migration 037 creates the full-text search index, but the search handler (`workers/handlers/search.ts`) may not yet query it.

7. **bsi-college-baseball-daily worker** -- present in-repo with wrangler.toml but not listed in the CLAUDE.md deployed workers inventory. Needs verification of deployment status.
