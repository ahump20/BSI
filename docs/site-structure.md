# BSI Site Structure

> Last updated: 2026-02-17
> Source: `github.com/ahump20/BSI`
> Production: `blazesportsintel.com` (Cloudflare Pages + Workers)

---

## Route Map

### Frontend Pages (126 total)

#### Root & Marketing
| Route | Status |
|-------|--------|
| `/` | Live |
| `/about` | Live |
| `/contact` | Live |
| `/coverage` | Live |
| `/for-coaches` | Live |
| `/for-scouts` | Live |
| `/pricing` | Live |
| `/privacy` | Live |
| `/terms` | Live |

#### Auth & Dashboard
| Route | Status |
|-------|--------|
| `/auth/login` | Live (stub — 501 backend) |
| `/auth/signup` | Live (stub — 501 backend) |
| `/checkout` | Live |
| `/checkout/return` | Live |
| `/dashboard` | Live |
| `/dashboard/admin` | Live |
| `/dashboard/intel` | Live |
| `/settings` | Live |

#### Cross-Sport Tools
| Route | Status |
|-------|--------|
| `/scores` | Live — cross-sport scoreboard hub |
| `/search` | Live |
| `/analytics` | Live |
| `/intel` | Live |
| `/transfer-portal` | Live |
| `/fanbase` | Live |
| `/fanbase/compare` | Live |
| `/vision-ai` | Live |
| `/nil-valuation` | Live |
| `/nil-valuation/methodology` | Live |
| `/nil-valuation/tools` | Live |

#### College Baseball (flagship — 48 pages)

**Core:**
| Route | Status |
|-------|--------|
| `/college-baseball` | Live |
| `/college-baseball/scores` | Live |
| `/college-baseball/standings` | Live |
| `/college-baseball/rankings` | Live |
| `/college-baseball/games` | Live |
| `/college-baseball/news` | Live |
| `/college-baseball/players` | Live |
| `/college-baseball/players/[playerId]` | Live (dynamic) |
| `/college-baseball/teams` | Live |
| `/college-baseball/teams/[teamId]` | Live (dynamic) |
| `/college-baseball/conferences` | Live |
| `/college-baseball/conferences/[conferenceId]` | Live (dynamic) |
| `/college-baseball/transfer-portal` | Live |
| `/college-baseball/transfer-portal/[playerId]` | Live (dynamic) |
| `/college-baseball/analytics` | Live — HAV-F leaderboard |
| `/college-baseball/compare` | Live |
| `/college-baseball/compare/[team1]/[team2]` | Live (dynamic) |

**Game Detail:**
| Route | Status |
|-------|--------|
| `/college-baseball/game/[gameId]` | Live (dynamic) |
| `/college-baseball/game/[gameId]/box-score` | Live (dynamic) |
| `/college-baseball/game/[gameId]/play-by-play` | Live (dynamic) |
| `/college-baseball/game/[gameId]/recap` | Live (dynamic) |
| `/college-baseball/game/[gameId]/team-stats` | Live (dynamic) |

**Preseason:**
| Route | Status |
|-------|--------|
| `/college-baseball/preseason` | Live |
| `/college-baseball/preseason/power-25` | Live |
| `/college-baseball/preseason/sec-preview` | Live |
| `/college-baseball/preseason/lone-star-rivalry` | Live |

**Editorial — SEC 2026 Previews (built):**
Alabama, Arkansas, Auburn, Florida, Georgia, Kentucky, LSU, Mississippi State, Missouri, Oklahoma, Ole Miss, South Carolina, Tennessee, Texas, Texas A&M, Vanderbilt

**Editorial — Declared in Sitemap Only (no page.tsx yet):**
Big 12 (13 teams), Big Ten (14 teams), Pac-12/other (4 teams) — ~31 additional team preview paths

**Editorial — Features:**
| Route | Status |
|-------|--------|
| `/college-baseball/editorial/national-opening-weekend` | Live |
| `/college-baseball/editorial/acc-opening-weekend` | Live |
| `/college-baseball/editorial/big-12-opening-weekend` | Live |
| `/college-baseball/editorial/sec-opening-weekend` | Live |
| `/college-baseball/editorial/week-1-preview` | Live |
| `/college-baseball/editorial/texas-uc-davis-opener-2026` | Live |

#### MLB (16 pages)
| Route | Status |
|-------|--------|
| `/mlb` | Live |
| `/mlb/scores` | Live |
| `/mlb/standings` | Live |
| `/mlb/games` | Live |
| `/mlb/news` | Live |
| `/mlb/players` | Live |
| `/mlb/players/[playerId]` | Live (dynamic) |
| `/mlb/teams/[teamId]` | Live (dynamic) |
| `/mlb/stats` | Live |
| `/mlb/abs` | Live |
| `/mlb/game/[gameId]` | Live (dynamic) |
| `/mlb/game/[gameId]/box-score` | Live (dynamic) |
| `/mlb/game/[gameId]/play-by-play` | Live (dynamic) |
| `/mlb/game/[gameId]/recap` | Live (dynamic) |
| `/mlb/game/[gameId]/team-stats` | Live (dynamic) |

#### NFL (9 pages)
| Route | Status |
|-------|--------|
| `/nfl` | Live |
| `/nfl/scores` | Live |
| `/nfl/standings` | Live |
| `/nfl/games` | Live |
| `/nfl/news` | Live |
| `/nfl/players` | Live |
| `/nfl/players/[playerId]` | Live (dynamic) |
| `/nfl/teams` | Live |
| `/nfl/teams/[teamId]` | Live (dynamic) |

#### NBA (9 pages)
| Route | Status |
|-------|--------|
| `/nba` | Live |
| `/nba/scores` | Live |
| `/nba/standings` | Live |
| `/nba/games` | Live |
| `/nba/news` | Live |
| `/nba/players` | Live |
| `/nba/players/[playerId]` | Live (dynamic) |
| `/nba/teams` | Live |
| `/nba/teams/[teamId]` | Live (dynamic) |

#### CFB — College Football (6 pages)
| Route | Status |
|-------|--------|
| `/cfb` | Live |
| `/cfb/scores` | Live |
| `/cfb/standings` | Live |
| `/cfb/articles` | Live |
| `/cfb/articles/[slug]` | Live (dynamic) |
| `/cfb/transfer-portal` | Live |

#### Arcade (7 pages)
| Route | Status |
|-------|--------|
| `/arcade` | Live |
| `/arcade/games` | Live |
| `/arcade/games/blitz` | Live |
| `/arcade/games/downtown-doggies` | Live |
| `/arcade/games/hotdog-dash` | Live |
| `/arcade/games/leadership-capital` | Live |
| `/arcade/games/sandlot-sluggers` | Live |
| `/arcade/wc3-dashboard` | Live |

---

## API Routes (Worker — Hono)

### College Baseball
```
GET /api/college-baseball/scores
GET /api/college-baseball/standings
GET /api/college-baseball/rankings
GET /api/college-baseball/schedule
GET /api/college-baseball/trending
GET /api/college-baseball/news
GET /api/college-baseball/news/enhanced
GET /api/college-baseball/players
GET /api/college-baseball/transfer-portal
GET /api/college-baseball/daily
GET /api/college-baseball/teams/:teamId
GET /api/college-baseball/players/compare/:p1/:p2
GET /api/college-baseball/players/:playerId
GET /api/college-baseball/game/:gameId
GET /api/college-baseball/games/:gameId              (alias)
GET /api/college-baseball/trends/:teamId
GET /api/college-baseball/havf                        (HAV-F leaderboard)
GET /api/college-baseball/havf/:playerId              (player HAV-F)
GET /api/college-baseball/mmi                         (Momentum Magnitude Index)
GET /api/college-baseball/editorial/list
GET /api/college-baseball/editorial/daily/:date
```

### MLB
```
GET /api/mlb/scores
GET /api/mlb/standings
GET /api/mlb/news
GET /api/mlb/teams
GET /api/mlb/game/:gameId
GET /api/mlb/players/:playerId
GET /api/mlb/teams/:teamId
```

### NFL
```
GET /api/nfl/scores
GET /api/nfl/standings
GET /api/nfl/news
GET /api/nfl/teams
GET /api/nfl/players
GET /api/nfl/leaders
GET /api/nfl/game/:gameId
GET /api/nfl/players/:playerId
GET /api/nfl/teams/:teamId
```

### NBA
```
GET /api/nba/scores
GET /api/nba/scoreboard                               (alias for scores)
GET /api/nba/standings
GET /api/nba/news
GET /api/nba/teams
GET /api/nba/game/:gameId
GET /api/nba/players/:playerId
GET /api/nba/teams/:teamId
```

### CFB
```
GET /api/cfb/transfer-portal
GET /api/cfb/scores
GET /api/cfb/standings
GET /api/cfb/news
GET /api/college-football/articles
GET /api/college-football/articles/:slug
```

### CV Intelligence
```
GET /api/cv/pitcher/:playerId/mechanics/history
GET /api/cv/pitcher/:playerId/mechanics
GET /api/cv/alerts/injury-risk
GET /api/cv/adoption
```

### System & Admin
```
GET  /health
GET  /api/health
GET  /api/admin/health
GET  /api/admin/errors
GET  /api/intel/news
GET  /api/search
GET  /api/model-health
GET  /api/news/:sport
ALL  /mcp
GET  /ws
```

### User Actions
```
POST /api/predictions
GET  /api/predictions/accuracy
POST /api/analytics/event
POST /api/feedback
POST /api/contact
POST /api/lead
POST /api/leads                                       (alias)
POST /_csp/report
```

### Games & Leaderboard
```
GET  /api/games/assets/*
GET  /api/multiplayer/leaderboard
POST /api/multiplayer/leaderboard
GET  /api/teams/:league
```

---

## Pages Functions (Cloudflare Pages)

| Endpoint | File | Purpose |
|----------|------|---------|
| `/api/*` | `functions/api/_middleware.ts` | Shared middleware |
| `/api/health` | `functions/api/health.ts` | Health check |
| `/api/agent-health` | `functions/api/agent-health.ts` | Agent health |
| `/api/lead` | `functions/api/lead.ts` | Lead capture |
| `/api/live-scores` | `functions/api/live-scores.ts` | Live scores proxy |
| `/api/hero-scores` | `functions/api/hero-scores.ts` | Featured scores |
| `/api/newsletter` | `functions/api/newsletter.ts` | Newsletter signup |
| `/api/semantic-health` | `functions/api/semantic-health.ts` | AI system health |
| `/api/ai/game-analysis` | `functions/api/ai/game-analysis.ts` | AI game analysis |
| `/api/mlb/leaderboards/[category]` | `functions/api/mlb/leaderboards/[category].ts` | MLB leaderboards |

> Note: In production, the apex Worker intercepts `/api/*` requests before they reach Pages Functions. Pages Functions serve as fallback when the Worker is unavailable.

---

## Data Flow

```
External APIs
  Highlightly Pro (primary — college baseball, football)
  ESPN Site API (free fallback — college baseball, all pro sports)
  SportsDataIO (NFL, NBA, MLB, CFB, CBB)
      │
      ▼
Cloudflare Workers (fetch, transform, cache)
  blazesportsintel-worker-prod (Hono apex router)
  bsi-cbb-ingest (cron: scores every 2min, standings/rankings every 15min)
  bsi-college-baseball-daily (cron: 5 AM CT + 11 PM CT)
  bsi-portal-sync (cron: every 30min)
  bsi-live-scores (WebSocket Durable Object — real-time)
      │
      ▼
Storage Layer
  KV: BSI_PROD_CACHE (hot cache), BSI_SPORTRADAR_CACHE, BSI_ERROR_LOG, BSI_MONITOR_KV
  D1: bsi-prod-db, bsi-game-db, bsi-historical-db, bsi-fanbase-db, blazecraft-leaderboards
  R2: blaze-sports-data-lake, bsi-web-assets, media buckets
      │
      ▼
Cloudflare Pages (static Next.js export)
  Client-side fetches → /api/* → Worker → cached data
  useSportData hook (polling with configurable refresh interval)
  useLiveScores hook (WebSocket + polling fallback for college baseball)
```

---

## Workers (14 deployed + 1 new)

| Worker | Directory | Schedule | Purpose |
|--------|-----------|----------|---------|
| `blazesportsintel-worker-prod` | `workers/` | Request-driven | Apex Hono router — all API routes |
| `blazesportsintel-worker` | `workers/` | Request-driven | Dev/staging variant |
| `blazesportsintel-worker-canary` | `workers/` | Request-driven | Canary variant |
| `bsi-cbb-ingest` | `workers/bsi-cbb-ingest/` | `*/2 * * * *` (scores), `*/15 * * * *` (standings) | Pre-caches college baseball data |
| `bsi-college-baseball-daily` | `workers/bsi-college-baseball-daily/` | `0 11 * * *`, `0 5 * * *` | Daily digest with Claude API analysis |
| `bsi-portal-sync` | `workers/bsi-portal-sync/` | `*/30 * * * *` | Transfer portal sync |
| `bsi-sportradar-ingest` | `workers/sportradar-ingest/` | Cron | Sportradar data pipeline |
| `bsi-error-tracker` | `workers/error-tracker/` | Tail consumer | Error logging from production |
| `bsi-synthetic-monitor` | `workers/synthetic-monitor/` | `*/5 * * * *` | Uptime monitoring |
| `bsi-news-ticker` | `workers/bsi-news-ticker/` | Scheduled | News ticker updates |
| `bsi-prediction-api` | — | Request-driven | Predictions API |
| `blaze-field-site` | `workers/blaze-field-*/` | Request-driven | BlazeCraft game site |
| `blaze-field-do` | `workers/blaze-field-*/` | Request-driven | BlazeCraft Durable Object |
| `mini-games-api` | `workers/mini-games-api/` | Request-driven | Arcade leaderboard |
| `bsi-live-scores` | `workers/bsi-live-scores/` | Request-driven (WebSocket) | Real-time score broadcasting |

---

## Proprietary Analytics

### HAV-F (Hits / At-Bats / Velocity / Fielding)

Composite player evaluation metric. Engine at `lib/analytics/havf.ts`.

- **H (Hits)**: Contact quality — BABIP, ISO, line-drive proxy. Weight: 0.30
- **A (At-Bats)**: Plate discipline — BB%, K%, selectivity. Weight: 0.25
- **V (Velocity)**: Power impact — exit velo proxy via ISO + SLG. Weight: 0.25
- **F (Fielding)**: Defense — fielding pct, range, assists. Weight: 0.20

Scale: 0-100 (50 = D1 average). Z-score normalization against D1 population benchmarks.

API: `GET /api/college-baseball/havf` (leaderboard), `GET /api/college-baseball/havf/:playerId` (individual)
UI: `components/analytics/HAVFCard.tsx`, page at `/college-baseball/analytics`

### MMI (Momentum Magnitude Index)

Real-time in-game momentum tracking. Engine at `lib/analytics/mmi.ts`.

Formula: `z(LI)*0.35 + z(Pressure)*0.20 + z(Fatigue)*0.20 + z(Execution)*0.15 + z(Bio)*0.10`

- **Leverage Index** (35%): Inning, score differential, runners, outs
- **Pressure** (20%): Run differential trend, scoring position context
- **Fatigue** (20%): Pitch count + late-inning factor
- **Execution** (15%): Situational effectiveness
- **Bio** (10%): Environmental factors

Scale: 0-100 (mean 50, stdDev 15). Categories: Routine (<40), Moderate (40-55), High Difficulty (55-70), Elite Pressure (70+).

API: `GET /api/college-baseball/mmi`
UI: `components/analytics/MomentumGauge.tsx`

---

## Infrastructure

### D1 Databases (5)
| Name | Size | Purpose |
|------|------|---------|
| `bsi-historical-db` | 4.5 MB | Historical archives |
| `bsi-game-db` | 3.3 MB | Live/recent game data |
| `bsi-prod-db` | 344 KB | Production data |
| `bsi-fanbase-db` | 197 KB | Fan sentiment |
| `blazecraft-leaderboards` | 45 KB | Arcade leaderboards |

### KV Namespaces (9)
| Name | Bound To | TTL Strategy |
|------|----------|-------------|
| `BSI_PROD_CACHE` | Apex worker | Live scores: 15-30s, Standings: 60s, Finals: 5min, Rosters: 1hr |
| `BSI_SPORTRADAR_CACHE` | Sportradar ingest | Match ingest frequency |
| `BSI_ERROR_LOG` | Error tracker | Tail consumer writes |
| `BSI_MONITOR_KV` | Synthetic monitor | 5-minute intervals |
| `RATE_LIMIT` | Apex worker | Per-IP rate limiting |
| `BSI_DEV_CACHE` | Apex worker (preview) | Dev environment |
| `PREDICTION_CACHE` | Prediction API | Match predictions TTL |
| `bsi-ticker-cache` | News ticker | Ticker refresh interval |
| `portfolio-contacts` | — | Contact storage |

### R2 Buckets (18)
**Data:** `blaze-sports-data-lake`, `blazesports-archives`, `bsi-embeddings`, `blaze-nil-archive`
**Assets:** `bsi-web-assets`, `blazesports-assets`, `bsi-blazecraft-assets`, `blazecraft-artifacts`, `blazecraft-replays`, `blaze-field-assets`, `bsi-game-assets`, `bsi-sandlot-sluggers-assets`
**Media:** `blaze-intelligence`, `blaze-intelligence-videos`, `blaze-vision-clips`, `blaze-vision-videos`, `podcasts`
**Other:** `blaze-youth-data`

---

## Known Gaps

1. **Sitemap vs. Built Pages**: ~31 editorial team preview paths declared in sitemap (Big 12, Big Ten, Pac-12) have no `page.tsx` files yet
2. **Legacy Path**: `/vision-AI-Intelligence` duplicates `/vision-ai` — redirect candidate
3. **Auth Stubs**: `/api/auth/login` and `/api/auth/signup` return 501
4. **MLB Teams Index**: `/mlb/teams` page may be missing (only `/mlb/teams/[teamId]` confirmed)
5. **Pages Functions Overlap**: Several endpoints exist in both `functions/api/` and `workers/index.ts` — Worker intercepts first in production
