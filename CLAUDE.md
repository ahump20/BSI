# CLAUDE.md

# Blaze Sports Intel

BSI covers what mainstream sports media overlook — athletes, programs, and markets outside the East/West Coast spotlight. Old-school scouting instinct fused with new-school sabermetrics, powered by AI. Coverage spans MLB, NFL, NBA, NCAA football, NCAA baseball, and NCAA basketball.

**Repos:** `github.com/ahump20/BSI` (site + workers) · `github.com/Blaze-sports-Intel/blazecraft` (system health UI)
**Production:** `blazesportsintel.com` (Pages + Workers) · `blazecraft.app` (Pages) · `arcade.blazesportsintel.com` · `labs.blazesportsintel.com`

## Architecture

GitHub holds the source. Cloudflare runs the product. No AWS, no Vercel, no external databases. This constraint forces simplicity and keeps the platform debuggable by one person. Verify deployed state via `wrangler` or Cloudflare MCP tools.

**Stack:** Next.js 16 (static export) · React 19 · TypeScript · Tailwind CSS 3 · Cloudflare Pages/Workers (Hono) · D1/KV/R2 · Vitest/Playwright · Luxon (`America/Chicago`) · Stripe · Framer Motion · Recharts

**Static export:** Every dynamic route needs `generateStaticParams()`. No SSR. Components using hooks/browser APIs need `'use client'`.

**Data flow:** External APIs → Workers (fetch, transform, cache) → KV/D1/R2 → Worker API routes or client fetches → Static UI. Workers are the only code that talks to external APIs.

**Path alias:** `@/*` maps to project root.

**Infrastructure inventory:** `~/.claude/projects/-Users-AustinHumphrey/memory/infrastructure.md`

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

## Non-Negotiable Rules

### Mock Data Ban

Never use hardcoded arrays, `Math.random()`, `faker`, `sampleData`, or placeholder content in production code. Every piece of data on the site must come from a real API call to one of BSI's data sources (Highlightly, ESPN, SportsDataIO) or from D1/KV/R2 storage. Fallback arrays in components (like editorial previews) are acceptable ONLY as last-resort error states when the API is unreachable — they must be clearly marked as fallbacks and must contain realistic, dated content.

### Verification Protocol

After any deploy or page change, verify the LIVE production URL — not the build output, not a local dev server, not a curl of the API alone. Open the actual page in a browser and confirm:
1. Real data renders (team names, scores, records — not empty tables)
2. No console errors
3. The specific change you made is visible to visitors

### Anti-Regression

Before modifying any file, check `git log --oneline -5 <file>` to understand recent changes. Do not overwrite work from recent commits. If a file was modified in the last 3 commits, understand WHY before changing it.

### Effort Standard

100% always. When uncertain, say "I don't know" rather than guessing. Never ship code you haven't verified works. Never claim something is fixed without evidence.

### Identity

BSI is Austin Humphrey's passion project, not a company. It's one person building the sports coverage platform he wanted to exist. Every decision filters through that lens — scrappy, resourceful, authentic.

### Banned Patterns

These patterns are NEVER allowed in non-test files under `app/`, `components/`, or `lib/`:
- `Math.random()` in a data context (generating fake scores, standings, stats)
- `mockGames`, `mockScores`, `mockStandings`, `mockTeams`, `sampleData` variables
- Hardcoded game/score arrays that aren't clearly labeled as API-down fallbacks
- `lorem ipsum` or placeholder text in any visitor-facing component
- Inline hex colors that aren't Heritage Design System tokens

### Key API Routes

The main worker exposes 40+ routes. Key endpoints for sport hubs:

| Sport | Scores | Standings | Other |
|-------|--------|-----------|-------|
| College Baseball | `/api/college-baseball/scores` | `/api/college-baseball/standings` | `/api/college-baseball/rankings`, `/api/college-baseball/savant/*`, `/api/college-baseball/editorial/*` |
| MLB | `/api/mlb/scores` | `/api/mlb/standings` | `/api/mlb/schedule` |
| NFL | `/api/nfl/scores` | `/api/nfl/standings` | `/api/nfl/schedule` |
| NBA | `/api/nba/scores` | `/api/nba/standings` | `/api/nba/schedule` |
| CFB | `/api/cfb/scores` | `/api/cfb/standings` | `/api/cfb/rankings` |

Worker base: `https://bsi-api.blazesportsintel.com` (production) or the Worker dev server locally.

## Gotchas

- **iCloud Drive:** git operations may hang. Check for stale `.git/index.lock`. Use `--no-verify` if hooks stall.
- **Build:** `scripts/build-safe.sh` rsyncs to `/var/tmp/bsi-build-staging` to avoid iCloud evicting `.next/`. Staging path: `/var/tmp/bsi-deploy-out` (NOT `/tmp/`).
- **Pages deploy:** timeout on 15K+ files — retry; second deploy is instant (hash dedup). Wrangler 4.71.0+ required.
- **next.config.ts:** skips TS build errors, `trailingSlash: true`, `images: { unoptimized: true }`.
- **tsconfig:** excludes `workers/**/*` (own configs).
- **Testing:** `test:all` (Vitest) does NOT include Playwright tests. Run `test:routes`, `test:a11y` separately.
- **ESPN dates:** labeled UTC but actually ET.
- **Dual analytics crons:** `bsi-savant-compute` (6h) + `bsi-cbb-analytics` (daily) both write advanced metrics. Check both when debugging.
