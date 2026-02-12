# CLAUDE.md — Blaze Sports Intel

## The Work

BSI covers what mainstream sports media won't. College baseball doesn't have ESPN box scores — BSI does. That gap is the product. Equal coverage across MLB, NFL, NCAA football, NBA, and college basketball, built by one person on Cloudflare infrastructure.

**Repository:** `github.com/ahump20/BSI`
**Production:** `blazesportsintel.com`
**System Health:** `blazecraft.app`
**Owner:** Austin Humphrey — `Austin@BlazeSportsIntel.com`

## How to Think About This Codebase

The best coaching philosophy for this work comes from Augie Garrido: you control your preparation and your response. Not the outcome.

**Win the next pitch.** When you open this repo, read the code as it is — not as the docs say it should be. The current state of the codebase is the truth. Docs, comments, and this file are maps. The territory is always the code.

**Process is the product.** The discipline of how code gets written here — searching before creating, replacing rather than adding, deleting the old in the same commit as the new — isn't bureaucracy. It's how a solo founder keeps a 53-Worker platform from becoming unnavigable. Every shortcut in process becomes debt in clarity.

**Stay present.** When given a task, understand WHY it matters before deciding WHAT to build or HOW to build it. Jumping to implementation before grounding the purpose is like swinging before the pitch arrives.

**Compete with yourself.** The codebase should be better after every session. Not bigger — better. If you create something, ask: did I also remove what this replaces? If not, you added weight without adding strength.

## Architecture

Next.js 16 static export on Cloudflare Pages. All backend logic runs in Cloudflare Workers. No AWS, no Vercel, no external databases. This constraint is intentional — it forces simplicity and keeps the entire platform debuggable by one person.

### Stack

- **Next.js 16** (static export, `output: 'export'`) + **React 19** + **TypeScript** + **Tailwind CSS 3**
- **Cloudflare Pages** (hosting) + **Workers** (Hono framework) + **D1** + **KV** + **R2**
- **Vitest** + **Playwright** for testing
- **Luxon** for dates — always `America/Chicago`
- **Stripe**, **Framer Motion**, **Recharts** as needed

### Static Export Constraint

Every dynamic route needs `generateStaticParams()`. No SSR. Data reaches the UI through Workers or client-side fetches. Components using hooks or browser APIs need `'use client'`.

### Path Alias

`@/*` maps to project root: `@/lib/utils`, `@/components/Card`.

## Data Philosophy

All data is fetched dynamically. Never hardcode teams, players, scores, standings, schedules, or season data. If it comes from an API, it gets fetched from an API.

### Sources

| Source | Base URL | Auth | Role |
|--------|----------|------|------|
| **Highlightly Pro** | `api.highlightly.net` | `x-api-key` | Primary pipeline — use first for all baseball and football |
| ESPN Site API | `site.api.espn.com` | None | College baseball/football fallback |
| MLB StatsAPI | `statsapi.mlb.com` | None | MLB |
| SportsDataIO | `api.sportsdata.io` | `Ocp-Apim-Subscription-Key` | NFL, NBA |

Highlightly Pro (via RapidAPI) is canonical. Wire new integrations there before falling back to other sources.

### Every API Response Includes

Source attribution, fetch timestamp, timezone. The UI always shows "Last updated" and the data source. No anonymous data.

```typescript
meta: { source: string; fetched_at: string; timezone: 'America/Chicago' }
```

## Live Infrastructure

This is what actually exists in Cloudflare right now. Use `wrangler` or the Cloudflare MCP tools to verify current state — don't trust this list if something feels off.

### Workers (53 deployed)

**Core data pipeline:**
`bsi-ingest` · `bsi-college-data-sync` · `bsi-cbb-sync` · `bsi-cbb-gateway` · `espn-data-cache` · `bsi-baseball-rankings` · `bsi-prediction-api` · `blazesports-ingest`

**Site and API:**
`blazesportsintel-worker` · `blazesportsintel-worker-prod` · `blazesportsintel-worker-canary` · `bsi-home` · `bsi-api` · `blaze-sports-api` · `blaze-data-layer-prod` · `blaze-data-layer`

**Operations:**
`bsi-ops-bridge` · `bsi-ops-bridge-production` · `bsi-prod-dashboard` · `bsi-news-ticker` · `bsi-ticker` · `bsi-cache-warmer` · `bsi-mcp-server` · `bsi-mcp-deploy`

**Features:**
`bsi-cfb-ai` · `bsi-fanbase-sentiment` · `bsi-fanbase-updater` · `bsi-nil-sync` · `bsi-portal-agent` · `bsi-chatgpt-app` · `bsi-skills-api` · `bsi-gamebridge` · `bsi-gamebridge-production` · `neural-coach-v2` · `agent-gateway` · `blaze-ai-search-nlweb`

**BlazeCraft:**
`blaze-field-site` · `blaze-field-do` · `blazecraft-assets` · `blazecraft-events`

**Games/Arcade:**
`sandlot-sluggers` · `backyard-baseball-api` · `mini-games-api` · `bsi-blitz-game` · `blaze-blitz` · `bsi-agentforge-game` · `bsi-game-backend` · `bsi-inferno-sprint-leaderboard`

**Other:**
`blazesportsintel-com` · `bsi-mmr-ledger` · `customer-worker-1` · `wrangler` · `wrangler-action`

### D1 Databases (12)

| Name | Size | Purpose |
|------|------|---------|
| `bsi-historical-db` | 4.5 MB | Historical archives |
| `bsi-game-db` | 3.3 MB | Live/recent game data |
| `bsi-prod-db` | 246 KB | Production data |
| `bsi-fanbase-db` | 197 KB | Fan sentiment |
| `blazecraft-gateway-db` | 168 KB | BlazeCraft gateway |
| `blazecraft-db` | 139 KB | BlazeCraft core |
| `bsi-agentforge-db` | 115 KB | AgentForge game |
| `bsi-mmr-db` | 74 KB | MMR/ranking |
| `blazecraft-leaderboards` | 45 KB | Leaderboards |
| `bsi-game-telemetry` | 37 KB | Game telemetry |
| `sandlot-sluggers-db` | 12 KB | Sandlot Sluggers |
| `blazecraft-events-db` | 12 KB | BlazeCraft events |

### KV Namespaces (45)

**Primary caches:** `BSI_SPORTS_CACHE` · `BSI_SCORES_CACHE` · `BSI_CACHE` · `BSI_PROD_CACHE` · `PREDICTION_CACHE` · `BSI_PREVIEW_CACHE`

**Operations:** `BSI_OPS_METRICS` · `BSI_OPS_EVENTS` · `BSI_OPS_DELTAS` · `BSI_ANALYTICS_EVENTS` · `BSI_HOME_ANALYTICS`

**Features:** `BSI_FANBASE_CACHE` · `BSI_PORTAL_CACHE` · `BSI_CHATGPT_CACHE` · `BSI_MCP_STATE` · `CFB_CACHE` · `SPORTS_DATA_KV`

**BlazeCraft:** `BLAZECRAFT_CACHE` · `BLAZECRAFT_CONFIG` · `BLAZECRAFT_SESSIONS`

**GameBridge:** `BSI_GAMEBRIDGE_SNAPSHOT` · `BSI_GAMEBRIDGE_DELTAS`

**Games:** `SANDLOT_CACHE` · `HOTDOG_CACHE` · `BLITZ_CACHE` + various game-specific

**Sessions/Rate Limiting:** `BSI_SESSIONS` · `BSI_HOME_SESSIONS` · `RATE_LIMIT`

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
workers/                # Cloudflare Workers (each has own wrangler.toml)
functions/              # Cloudflare Pages Functions
games/                  # Browser arcade games
external/               # Standalone projects (Sandlot-Sluggers)
scripts/                # Build/deploy/data scripts
tests/                  # Test suites
docs/                   # Infrastructure and operations docs
```

## Commands

```bash
npm run dev              # Dev server
npm run build            # Static export
npm run test             # Vitest (watch)
npm run test:all         # Full test suite
npm run test:routes      # Playwright routes
npm run test:a11y        # Playwright accessibility
npm run typecheck        # tsc --noEmit
npm run lint             # ESLint
npm run deploy:production  # Cloudflare Pages (main)
npm run deploy:worker    # Worker deploy
npm run deploy:hybrid    # Both
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
- `next.config.ts` skips TS/ESLint errors during build — CI handles them separately
- `tsconfig.json` excludes `workers/**/*` — workers have their own configs
- Legacy paths excluded: `lib/api/v1/**/*`, `lib/adapters/*`
- ESPN dates labeled UTC are actually ET — always verify timezone
- `external/` projects have their own CLAUDE.md and build systems
- Husky handles git hooks via `prepare` script
