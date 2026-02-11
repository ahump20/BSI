# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Blaze Sports Intel (BSI)

## What This Is

BSI is a sports intelligence platform. Next.js 16 static export deployed to Cloudflare Pages, with Cloudflare Workers handling backend services. College baseball coverage is the flagship -- filling ESPN's gaps with complete box scores, live games, and standings.

## Tech Stack

- **Next.js 16** (static export via `output: 'export'`) + **React 19**
- **TypeScript** (strict: false in tsconfig) + **Tailwind CSS 3**
- **Cloudflare Pages** (site hosting) + **Workers** (API/backend) + **D1/KV/R2**
- **Vitest** (unit/integration) + **Playwright** (E2E, accessibility)
- **Luxon** for dates (America/Chicago timezone throughout)
- **Stripe** for payments, **Framer Motion** for animation, **Recharts** for charts

## Commands

```bash
npm run dev              # Next.js dev server
npm run build            # Static export to out/ + copy functions
npm run test             # Vitest (watch mode)
npm run test:all         # API + integration + validation tests
npm run test:routes      # Playwright route tests
npm run test:a11y        # Playwright accessibility tests
npm run typecheck        # tsc --noEmit
npm run lint             # ESLint
npm run lint:fix         # ESLint autofix
npm run format           # Prettier check
npm run format:fix       # Prettier write
vitest run tests/path/to/file.test.ts  # Run a single test file
npm run deploy:production  # Build + deploy to Cloudflare Pages (main)
npm run deploy:worker    # Deploy Cloudflare Worker
npm run deploy:hybrid    # Deploy both Pages + Worker
```

## Directory Structure

```
app/                    # Next.js App Router pages
  college-baseball/     # Primary sport — games, scores, standings, teams, rankings, news
  mlb/                  # MLB coverage
  nfl/                  # NFL coverage
  nba/                  # NBA coverage
  cfb/                  # College football + transfer portal
  nil-valuation/        # NIL analytics tools
  arcade/               # Browser games
  scores/               # Cross-sport scoreboard
components/             # Shared React components
lib/                    # Core logic
  api/                  # Data fetching and sports API clients
  api-clients/          # External API client wrappers
  cv/                   # Computer vision / biomechanics
  intel/                # Intelligence/analytics logic
  genie-dynamics/       # Genie dynamics engine + adapters
  utils/                # Shared utilities
  hooks/                # React hooks
  tokens/               # Design tokens
  analytics/            # Analytics helpers
workers/                # Cloudflare Workers (each has own wrangler.toml)
  bsi-cbb/              # College baseball data sync/gateway
  bsi-cache-warmer/     # Cache warming
  bsi-news-ticker/      # News ticker
  bsi-prod-dashboard/   # Production dashboard
  college-data-sync/    # College data pipeline
  prediction/           # Prediction engine
  ingest/               # Data ingestion
  baseball-rankings/    # Rankings worker
functions/              # Cloudflare Pages Functions (serverless)
games/                  # Browser arcade games
external/               # External projects (e.g., Sandlot-Sluggers)
scripts/                # Build/deploy/data scripts
tests/                  # Test suites
docs/                   # Infrastructure and operations docs
```

## Path Alias

`@/*` maps to project root. Import as `@/lib/utils`, `@/components/Card`, etc.

## Key Patterns

**Static export constraint:** All dynamic routes need `generateStaticParams()`. No server-side rendering — the site is fully static on Cloudflare Pages. API data comes from Workers or client-side fetches.

**No placeholder data.** All data comes from real APIs with proper error handling.

**Timezone:** All dates use America/Chicago. Use Luxon for date handling.

**Mobile-first:** Default styles target mobile; scale up with `md:` and `lg:` breakpoints.

**College baseball priority:** This is the product's differentiator. ESPN doesn't provide complete college baseball box scores — BSI does.

## Data Sources

- **MLB:** `statsapi.mlb.com` (free, no key)
- **College Baseball/Football:** `site.api.espn.com` (free, no key)
- **NFL/NBA:** SportsDataIO (`SPORTSDATAIO_API_KEY` required)

## Environment Variables

Required in `.env` (never commit):
```
SPORTSDATAIO_API_KEY=...
```

Optional:
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Deploy

Main site deploys to Cloudflare Pages. Workers deploy independently via their own `wrangler.toml` files in `workers/`.

```bash
npm run deploy:production    # Pages (main branch)
npm run deploy:preview       # Pages (preview branch)
npm run deploy:worker        # Default worker
npm run deploy:hybrid        # Both
```

## Code Style

Prettier enforces: single quotes, semicolons, trailing commas, 100-char print width, 2-space indent, LF line endings.

## Tests

Test files live in `tests/` (not colocated with source). Subdirectories: `api/`, `intel/`, `integration/`, `validation/`, `a11y/`, `routes/`, `workers/`, `cv/`, `arcade/`, `performance/`, `visual/`, `analytics/`, `mcp/`, `intelligence/`. Note: `tsconfig.json` excludes `**/*.test.ts` — test files are not part of the `typecheck` pass.

## Code Rules

- Assume Cloudflare Workers + KV/R2/D1 exist; any touch is production unless stated.
- Prefer reuse; no new resources, renames, deletes, or migrations unless asked.
- Ask permission before any stateful or destructive operation.

## Gotchas

- `next.config.ts` skips TypeScript and ESLint errors during build (CI handles them separately)
- `tsconfig.json` excludes `workers/**/*` — workers have their own TS configs
- Several `lib/` paths are excluded from tsconfig (`lib/api/v1/**/*`, `lib/adapters/*`, etc.) — legacy code not in active compilation
- The `external/` directory contains standalone projects (Sandlot-Sluggers) with their own CLAUDE.md and build systems
- Husky is configured for git hooks (`prepare` script)
- `'use client'` directive required on components using React hooks or browser APIs (Next.js 16 server components are the default)

## Subdirectory Projects

- **`external/Sandlot-Sluggers/`** — Babylon.js baseball game. Has its own CLAUDE.md, package.json, and Vite build.
- **`BSI-NextGen-claude-pitch-tunnel-simulator-01ENdtCgGLEusa46JHKrLXL1/`** — Pitch tunnel simulator. Has its own CLAUDE.md with detailed monorepo docs (partially stale — the main repo is no longer a pnpm monorepo).
