# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Blaze Sports Intel

BSI covers what mainstream sports media overlook — athletes, programs, and markets outside the East/West Coast spotlight. Old-school scouting instinct fused with new-school sabermetrics, powered by AI. Coverage spans MLB, NFL, NBA, NCAA football, NCAA baseball, and NCAA basketball.

**Repos:** `github.com/ahump20/BSI` (site + workers) · `github.com/Blaze-sports-Intel/blazecraft` (system health UI)
**Production:** `blazesportsintel.com` (Pages + Workers) · `blazecraft.app` (Pages) · `arcade.blazesportsintel.com` · `labs.blazesportsintel.com`

## Reporting Standard

Global instructions (`~/.claude/global-claude-instructions.md`) govern how you communicate. In BSI context, these BSI-specific examples apply:

**After deploying a site change:**
- WRONG: "Deployed blazesportsintel-worker-prod with updated Hono handlers. Build passed with zero TypeScript errors. Wrangler output confirmed routes registered."
- RIGHT: "The change is live. Visitors at blazesportsintel.com/scores now see the full scoreboard with real game data. NBA in-season games are populating."

**After fixing a data issue:**
- WRONG: "Fixed null pointer in getPlayerStats() where player.season_stats was undefined. Added optional chaining and fallback."
- RIGHT: "Player pages were breaking when a data source returned nothing. Now they show a clean empty state instead of crashing. Tested with a player who had missing stats — works."

**After running analytics:**
- WRONG: "bsi-savant-compute cron executed successfully. 247 rows written to cbb_batting_advanced. D1 query confirmed fresh wOBA values."
- RIGHT: "Advanced stats just recalculated. The Savant leaderboard shows fresh numbers for 247 batters. Recomputes automatically every 6 hours."

## Architecture

GitHub holds the source. Cloudflare runs the product. No AWS, no Vercel, no external databases. This constraint forces simplicity and keeps the platform debuggable by one person. Verify deployed state via `wrangler` or Cloudflare MCP tools.

**Stack:** Next.js 16 (static export) · React 19 · TypeScript · Tailwind CSS 3 · Cloudflare Pages/Workers (Hono) · D1/KV/R2 · Vitest/Playwright · Luxon (`America/Chicago`) · Stripe · Framer Motion · Recharts

**Static export:** Every dynamic route needs `generateStaticParams()`. No SSR. Components using hooks/browser APIs need `'use client'`.

**Data flow:** External APIs → Workers (fetch, transform, cache) → KV/D1/R2 → Worker API routes or client fetches → Static UI. Workers are the only code that talks to external APIs.

**Path alias:** `@/*` maps to project root.

**Infrastructure inventory:** `~/.claude/projects/-Users-AustinHumphrey/memory/infrastructure.md`

## Worker Architecture

**Apex worker pattern:** `blazesportsintel-worker-prod` (Hono) handles `blazesportsintel.com/*`. API routes are served by Hono handlers in `workers/handlers/`. All other requests proxy to `blazesportsintel.pages.dev` (the Pages static export). This means the Worker is the single entry point — Pages never receives traffic directly.

**Game detail fallback:** Dynamic game IDs (e.g., `/college-baseball/game/12345/`) don't have static pages. When Pages 404s, the Worker serves a placeholder shell (`/game/placeholder/`). Client-side routing reads the real ID from `window.location` and fetches data dynamically.

**Scheduled handler:** Main worker cron runs every minute (`handleScheduled`), warming KV cache for scores and rankings across all sports.

**Satellite workers:** 18 independent workers in `workers/*/`, each with own `wrangler.toml`, deployed separately via `wrangler deploy --config workers/{name}/wrangler.toml`. Key satellites:
- `bsi-savant-compute` — 6h cron, recomputes wOBA/FIP/wRC+ from D1
- `bsi-cbb-analytics` — daily 6AM CT, full sabermetric recompute (park factors + conference strength on Sundays)
- `bsi-live-scores` — Durable Objects + WebSocket, polls Highlightly every 15s
- `college-baseball-mcp` — MCP server for Claude tools
- `error-tracker` — tail consumer for all worker errors

**Durable Objects (in main worker):**
- `CacheObject` — in-memory TTL cache
- `PortalPoller` — stub, alarm-based transfer portal polling (not yet active)

## Data Philosophy

All data fetched dynamically. Never hardcode teams, players, scores, standings, schedules, or season data.

| Source | Auth | Role |
|--------|------|------|
| **Highlightly Pro** (`api.highlightly.net`) | `x-api-key` | Primary — use first for baseball and football |
| **SportsDataIO** (`api.sportsdata.io`) | `Ocp-Apim-Subscription-Key` | NFL, NBA, MLB, CFB, CBB |
| ESPN Site API (`site.api.espn.com`) | None | College baseball only |

Every API response includes: `meta: { source, fetched_at, timezone: 'America/Chicago' }`. The UI always shows "Last updated" and the data source.

**ESPN constraints:** `~/.claude/projects/-Users-AustinHumphrey/memory/espn-constraints.md`

## Directory Structure

```
app/                    # Next.js App Router (college-baseball/, mlb/, nfl/, nba/, cfb/, auth/, intel/, scores/, pricing/, etc.)
components/             # Shared React components
lib/                    # Core logic (api-clients/, analytics/, intel/, scores/, data/, utils/, hooks/, tokens/)
workers/                # Main Hono worker + sub-workers (each has own wrangler.toml)
  handlers/             # Handler functions by sport/domain
  shared/               # Types, helpers, constants, cors, rate-limit, auth
games/                  # Browser arcade games
external/               # Standalone projects (own CLAUDE.md)
scripts/                # Build/deploy/data scripts
tests/                  # workers/ (Vitest), routes/ (Playwright), analytics/ (Vitest), flows/ + a11y/ (Playwright)
```

## Commands

```bash
npm run dev / dev:worker / dev:hybrid   # Dev servers
npm run build                            # Static export to out/
npm run test / test:all / test:workers   # Vitest (test:all does NOT run Playwright)
npm run test:routes / test:a11y          # Playwright (separate)
npm run typecheck / typecheck:strict     # tsc
npm run lint / lint:fix / format / format:fix

# Deploy
npm run deploy:production    # build → stage → wrangler pages deploy
npm run deploy:worker        # Main worker (--env production)
npm run deploy:all           # pre-deploy-check + deploy:safe + worker
npm run deploy:preview       # Preview branch

# Data
npm run db:migrate:production / db:seed:production
npm run data:freshness / cache:warm

# Single test / filtered
npx vitest run tests/workers/scores.test.ts      # One Vitest file
npx vitest run -t "standings"                     # Tests matching name
npx playwright test tests/smoke/homepage.spec.ts --config=playwright.smoke.config.ts --project=chromium

# Worker typecheck (all satellite workers)
npm run typecheck:workers

# Satellite worker deploy (each has own wrangler.toml)
wrangler deploy --config workers/{name}/wrangler.toml

# Deploy gates
npm run gate:cbb         # Playwright: college baseball critical paths
npm run smoke:release    # Smoke suite (homepage, layout, scores, mobile)
npm run gate:release     # smoke:release + gate:cbb
npm run health           # Post-deploy: 9 curl checks against production
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

## Heritage Design System v2.1

Site-wide as of Mar 10, 2026. Every page and component uses heritage tokens. Zero old glass-card tokens remain.

**Surfaces:** `--surface-dugout` (#161616, cards) · `--surface-scoreboard` (#0A0A0A, hero bg) · `--surface-press-box` (#111111, table headers)

**Colors:** `--bsi-primary` (#BF5700, burnt-orange — stamps/borders/buttons) · `--bsi-bone` (#F5F2EB, primary text) · `--bsi-dust` (#C4B8A5, secondary text) · `--heritage-columbia-blue` (#4B9CD3, data links) · `--border-vintage` (rgba(140,98,57,0.3), subtle borders)

**Typography:** Bebas Neue hero headings at `clamp(2.5rem,6vw,5rem)`. Oswald section headings (uppercase). Cormorant Garamond body. JetBrains Mono code.

**Classes:** `.heritage-stamp` (Oswald/burnt-orange labels) · `.heritage-card` (solid-surface card) · `.btn-heritage` / `.btn-heritage-fill` (buttons) · `.corner-marks` (20px inset decorative corners) · `.grain-overlay` (scoped texture)

**Score ticker:** CSS marquee, burnt-orange diamond separators, 2px top border.

## Auth Model

Stripe-keyed, no passwords. Signup → Stripe checkout → webhook provisions key into `BSI_KEYS` KV. Login sends key via Resend. Client stores in `localStorage`, sends as `X-BSI-Key`. Key files: `app/auth/`, `workers/handlers/auth.ts`, `workers/shared/auth.ts`.

## Environment

```bash
# Worker secrets — never commit
SPORTSDATAIO_API_KEY · HIGHLIGHTLY_API_KEY · SPORTRADAR_API_KEY · ANTHROPIC_API_KEY
RESEND_API_KEY · TURNSTILE_SECRET_KEY · NOTION_TOKEN · AMPLITUDE_API_KEY
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY hardcoded in next.config.ts
```

## KV TTL

Live scores: 15–30s. Standings: 60s. Final games: 5 min. Rosters: 1 hour.

## Gotchas

- **iCloud Drive:** git operations may hang. Check for stale `.git/index.lock`. Use `--no-verify` if hooks stall.
- **Build:** `scripts/build-safe.sh` builds in-place, cleans `.next` first, retries once if iCloud evicts. `/var/tmp/bsi-deploy-out` is for deploy staging only (rsync from `out/`).
- **Pages deploy:** timeout on 15K+ files — retry; second deploy is instant (hash dedup). Wrangler 4.71.0+ required.
- **next.config.ts:** skips TS build errors, `trailingSlash: true`, `images: { unoptimized: true }`.
- **tsconfig:** excludes `workers/**/*` (own configs).
- **Testing:** `test:all` (Vitest) does NOT include Playwright tests. Run `test:routes`, `test:a11y` separately.
- **ESPN dates:** labeled UTC but actually ET.
- **Dual analytics crons:** `bsi-savant-compute` (6h) + `bsi-cbb-analytics` (daily) both write advanced metrics. Check both when debugging.

## Non-Negotiable Rules

### Anti-Mock-Data Protocol
Never generate hardcoded mock data, sample arrays, Math.random() values, or placeholder content. BSI has 40+ live API routes returning real data.
1. Read the API code first (via MCP tools, web fetch, or codebase search)
2. Write real fetch() calls to real endpoints
3. If you can't determine the endpoint, ASK — don't invent data
A visually complete component with fake data is worth ZERO. A rough component wired to real data is worth everything.

### Anti-Fabrication Protocol
When you don't know something, say "I don't know" and stop. Never fill knowledge gaps with plausible-sounding fiction. Before making architectural, technical, or capability claims: verify with a tool (web search, web fetch, MCP, codebase search) or explicitly flag as unverified.

### Verification Protocol
Never claim a task is complete without verification the user can see. "Build passed" is not verification. "Deploy succeeded" is not verification. Verification means: the end user would see the intended result if they loaded the page right now.
- After every deploy, `curl` the affected page URLs and confirm real data appears
- If a page renders empty tables, blank grids, or zero content, the task is NOT complete
- Report what users SEE, not what code says

### Anti-Regression Protocol
- ALWAYS read `git log --oneline -20` before modifying any file that was recently changed
- ALWAYS check what the previous session fixed before introducing changes
- Pre-commit hook blocks mock-data patterns in non-test files

### Anti-Template-Recycling Protocol
When asked for something "novel" or "creative," check what's already been produced. If the structural layout matches a prior output (same grid, same card pattern, same color placement), you are recycling, not creating. Generate a genuinely different form factor, information architecture, or interaction model.

### Identity
- BSI is a passion project / prospective startup. NOT a company. NOT formally founded.
- Never position Austin as "CEO," "founder of a company," or any corporate title
- Brand: Blaze Intelligence (parent); Blaze Sports Intel (public-facing)
- Tagline: "Born to Blaze the Path Beaten Less" — this exact word order, always

### Code Standard
- Production-ready. No placeholders, TODOs, or mock data.
- Search codebase before creating new files. Replace instead of add. Delete replaced code.
- For bugs: write a reproducing test first, then fix, then prove with passing test.
- Wire to real endpoints. Always. No exceptions.

## API Route Patterns

Production worker serves 40+ routes. Key patterns:
- `/api/{sport}/scores` — live scores (college-baseball, mlb, nfl, nba, cfb)
- `/api/{sport}/standings` — current standings
- `/api/{sport}/rankings` — where applicable
- `/api/{sport}/news` — news feed
- `/api/{sport}/teams/:id` — team detail
- `/api/{sport}/players/:id` — player detail
- `/api/{sport}/games/:id` — game detail
- `/api/health` — health check
- `/api/admin/health` — admin health (requires X-Admin-Key header)
- `/v1/*` — NCAA Baseball v1 API (60s browser cache, 5min edge cache)

## Banned Patterns

Pre-commit hook and Claude Code session discipline both enforce these. Must NOT appear in non-test source files:

- `Math.random()` in data-rendering context
- `mockGames` / `mockScores` / `mockStandings` / `mockTeams` — hardcoded arrays
- `sampleData` — any sample/placeholder data
- `faker.` — faker library usage
- `"placeholder"` in data components
- `const.*=.*\[.*{.*home:.*away:` — hardcoded game objects
