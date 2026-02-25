# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Blaze Sports Intel

## The Work

BSI covers what mainstream sports media overlook: the athletes, programs, and markets outside the East and West Coast spotlight. The gap between interest in college and amateur sports and access to meaningful analytics is the product — old-school scouting instinct fused with new-school sabermetrics, powered by AI tooling that makes the depth accessible. Major platforms paint a black-and-white picture — LeBron vs. MJ, Yankees or Dodgers, Cowboys or nothing — and BSI exists to leave that binary behind. The real game lives between the poles: what actual fans, players, and professionals care about but can't find covered at depth. BSI's coverage spans MLB, NFL, NBA, NCAA football, NCAA baseball, and NCAA basketball, built to go where prestige platforms won't and match their standard when it gets there.

**Source Code:**
- `github.com/ahump20/BSI` — Primary repo (site + workers)
- `github.com/Blaze-sports-Intel/blazecraft.git` — BlazeCraft system health UI

**Production (deployed):**
- `blazesportsintel.com` — Cloudflare Pages (static export) + Workers (backend logic)
- `blazecraft.app` — Cloudflare Pages (Warcraft 3: Frozen Throne–style system health dashboard)

**Owner:** Austin Humphrey — `Austin@BlazeSportsIntel.com`

## How to Think About This Codebase

The best coaching philosophy for this work comes from Augie Garrido: you control your preparation and your response. Not the outcome.

**Win the next pitch.** When you open this repo, read the code as it is — not as the docs say it should be. The current state of the codebase is the truth. Docs, comments, and this file are maps. The territory is always the code.

**Process is the product.** The discipline of how code gets written here — searching before creating, replacing rather than adding, deleting the old in the same commit as the new — isn't bureaucracy. It's how a solo founder keeps a 53-Worker platform from becoming unnavigable. Every shortcut in process becomes debt in clarity.

**Stay present.** When given a task, understand WHY it matters before deciding WHAT to build or HOW to build it. Jumping to implementation before grounding the purpose is like swinging before the pitch arrives.

**Compete with yourself.** The codebase should be better after every session. Not bigger — better. If you create something, ask: did I also remove what this replaces? If not, you added weight without adding strength.

## Architecture

GitHub holds the source. Cloudflare runs the product. The repos (`ahump20/BSI` and `Blaze-sports-Intel/blazecraft`) are where code is written and versioned. Deployment targets are Cloudflare Pages (static frontends) and Cloudflare Workers (all backend logic, APIs, data pipelines). No AWS, no Vercel, no external databases. This constraint is intentional — it forces simplicity and keeps the entire platform debuggable by one person.

To verify what's actually deployed, use `wrangler` or the Cloudflare MCP tools. The repo is the map; Cloudflare is the territory.

### Stack

- **Next.js 16** (static export, `output: 'export'`) + **React 19** + **TypeScript** + **Tailwind CSS 3**
- **Cloudflare Pages** (hosting) + **Workers** (Hono framework) + **D1** + **KV** + **R2**
- **Vitest** + **Playwright** for testing
- **Luxon** for dates — always `America/Chicago`
- **Stripe**, **Framer Motion**, **Recharts** as needed

### Static Export Constraint

Every dynamic route needs `generateStaticParams()`. No SSR. Data reaches the UI through Workers or client-side fetches. Components using hooks or browser APIs need `'use client'`.

### Data Flow

```
External APIs (Highlightly, SportsDataIO, ESPN)
  → Cloudflare Workers (fetch, transform, cache)
  → KV / D1 / R2 (storage layer)
  → Pages Functions (functions/api/*) or client-side fetches
  → Static Next.js UI
```

Workers are the only code that talks to external APIs. The static site never calls third-party APIs directly — it hits Pages Functions or Workers, which return cached/transformed data with `meta` attribution.

### Path Alias

`@/*` maps to project root: `@/lib/utils`, `@/components/Card`.

## Data Philosophy

All data is fetched dynamically. Never hardcode teams, players, scores, standings, schedules, or season data. If it comes from an API, it gets fetched from an API.

### Sources

| Source | Base URL | Auth | Role |
|--------|----------|------|------|
| **Highlightly Pro** | `api.highlightly.net` | `x-api-key` | Primary pipeline — use first for all baseball and football |
| **SportsDataIO** | `api.sportsdata.io` | `Ocp-Apim-Subscription-Key` | NFL, NBA, MLB, CFB, CBB, Golf, GRid |
| ESPN Site API | `site.api.espn.com` | None | College baseball only (BSI flagship) |

Highlightly Pro (via RapidAPI) is canonical. Wire new integrations there before falling back to other sources. SportsDataIO covers all major/college sports via `lib/adapters/sportsdataio.ts`. ESPN is retained only for college baseball where SportsDataIO lacks coverage.

### Every API Response Includes

Source attribution, fetch timestamp, timezone. The UI always shows "Last updated" and the data source. No anonymous data.

```typescript
meta: { source: string; fetched_at: string; timezone: 'America/Chicago' }
```

## Live Infrastructure

This is what actually exists in Cloudflare right now. Use `wrangler` or the Cloudflare MCP tools to verify current state — don't trust this list if something feels off.

### Workers (16 deployed)

**Site and API (Hono router + handler modules):**
`blazesportsintel-worker-prod` · `blazesportsintel-worker` · `blazesportsintel-worker-canary`

**Ingest pipeline:**
`bsi-cbb-ingest` · `bsi-sportradar-ingest` · `bsi-portal-sync` · `bsi-prediction-api`

**Analytics:**
`bsi-analytics-events` (behavioral events → D1) · `bsi-savant-compute` (cron every 6h — wOBA, FIP, wRC+)

**Operations:**
`bsi-error-tracker` (tail consumer) · `bsi-synthetic-monitor` (cron) · `bsi-news-ticker` · `bsi-ticker`

**BlazeCraft:**
`blaze-field-site` · `blaze-field-do`

**Games:**
`mini-games-api`

### D1 Databases (6)

| Name | Size | Purpose |
|------|------|---------|
| `bsi-historical-db` | 4.5 MB | Historical archives |
| `bsi-game-db` | 3.3 MB | Live/recent game data (sportradar-ingest) |
| `bsi-prod-db` | 3.8 MB | Production data (main worker + savant compute) |
| `bsi-events-db` | 284 KB | Behavioral analytics (bsi-analytics-events) |
| `bsi-fanbase-db` | 197 KB | Fan sentiment |
| `blazecraft-leaderboards` | 45 KB | Leaderboards (mini-games-api) |

### KV Namespaces (9)

**Bound to active workers:**
`BSI_PROD_CACHE` · `BSI_SPORTRADAR_CACHE` · `BSI_ERROR_LOG` · `BSI_MONITOR_KV` · `BSI_KEYS` (API key → tier lookup) · `RATE_LIMIT` · `BSI_DEV_CACHE` (preview_id)

**Other:**
`PREDICTION_CACHE` · `portfolio-contacts`

### R2 Buckets (18)

**Data:** `blaze-sports-data-lake` · `blazesports-archives` · `bsi-embeddings` · `blaze-nil-archive`

**Assets:** `bsi-web-assets` · `blazesports-assets` · `bsi-blazecraft-assets` · `blazecraft-artifacts` · `blazecraft-replays` · `blaze-field-assets` · `bsi-game-assets` · `bsi-sandlot-sluggers-assets`

**Media:** `blaze-intelligence` · `blaze-intelligence-videos` · `blaze-vision-clips` · `blaze-vision-videos` · `podcasts`

**Other:** `blaze-youth-data`

## Directory Structure

```
app/                    # Next.js App Router pages
  college-baseball/     # Flagship — games, scores, standings, teams, rankings, news
  mlb/ nfl/ nba/ cfb/   # Other sports
  nil-valuation/        # NIL analytics
  arcade/               # Browser games
  scores/               # Cross-sport scoreboard
components/             # Shared React components
lib/                    # Core logic (api/, utils/, hooks/, tokens/, analytics/)
workers/                # Main Hono worker (blazesportsintel-worker-prod)
  index.ts              # Route declarations + middleware (382 lines)
  handlers/             # Handler functions by sport/domain
  shared/               # Types, helpers, constants, cors, rate-limit, proxy
  wrangler.toml         # Bindings, routes, environments
workers/bsi-cbb-ingest/ # College baseball ingest pipeline
workers/bsi-savant-compute/ # Cron: advanced metrics (wOBA, FIP, wRC+)
workers/sportradar-ingest/ # Sportradar data pipeline
workers/mini-games-api/ # Arcade leaderboard API
workers/blaze-field-*/  # BlazeCraft game workers
workers/error-tracker/  # Tail consumer for error logging
workers/synthetic-monitor/ # Cron-based uptime checks
functions/              # Cloudflare Pages Functions
games/                  # Browser arcade games
external/               # Standalone projects (Sandlot-Sluggers)
scripts/                # Build/deploy/data scripts
tests/                  # Test suites (511 passing)
docs/                   # Infrastructure and operations docs
```

## Commands

```bash
npm run dev              # Next.js dev server
npm run dev:worker       # Worker dev server (wrangler)
npm run dev:hybrid       # Both in parallel
npm run build            # Static export to out/
npm run test             # Vitest (watch)
npm run test:all         # Full test suite (API + integration + validation)
npm run test:routes      # Playwright route tests
npm run test:a11y        # Playwright accessibility tests
npm run typecheck        # tsc --noEmit
npm run lint             # ESLint

# Single test file
vitest run tests/api/some-file.test.ts

# Deploy
npm run deploy:production  # Cloudflare Pages (main)
npm run deploy:worker      # Default worker
npm run deploy:hybrid      # Both

# Deploy a specific worker
wrangler deploy --config workers/bsi-news-ticker/wrangler.toml
```

## Conventions

| Resource | Pattern | Example |
|----------|---------|---------|
| Worker | `bsi-{domain}-{function}` | `bsi-scores-live` |
| KV | `BSI_{DOMAIN}_{PURPOSE}` | `BSI_SCORES_CACHE` |
| D1 | `bsi-{domain}-db` | `bsi-analytics-db` |
| R2 | `bsi-{domain}-assets` | `bsi-media-assets` |
| Files | kebab-case | `game-stats.ts` |
| Functions | camelCase, verb-first | `fetchStandings()` |
| Types | PascalCase | `GameData` |
| Constants | SCREAMING_SNAKE | `DEFAULT_TTL` |
| Commits | `type(scope): description` | `feat(scores): add MLB polling` |
| Branches | `type/short-desc` | `feat/live-scores` |

## Design

```css
--burnt-orange: #BF5700;  --texas-soil: #8B4513;
--charcoal: #1A1A1A;      --midnight: #0D0D0D;
--ember: #FF6B35;  /* accent only */
```

Headings: Oswald (uppercase). Body: Cormorant Garamond. Mono: JetBrains Mono. Mobile-first. Clean backgrounds — no film grain, noise, or particles.

## Environment

```bash
SPORTSDATAIO_API_KEY=...    # Required, never commit
HIGHLIGHTLY_API_KEY=...     # Required, never commit
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Optional
```

## KV TTL

Live scores: 15–30s. Standings: 60s. Final games: 5 min. Rosters: 1 hour.

## Gotchas

- Repo lives on iCloud Drive — `git status`, pre-commit hooks, and ripgrep searches may hang. Use `--no-verify` on commits if hooks stall. If git hangs, check for stale `.git/index.lock` and remove it.
- `next.config.ts` is configured to skip TypeScript build errors — ESLint errors are handled separately in CI
- `tsconfig.json` excludes `workers/**/*` — workers have their own configs
- ESPN dates labeled UTC are actually ET — always verify timezone
- `external/` projects have their own CLAUDE.md and build systems
- Husky handles git hooks via `prepare` script
