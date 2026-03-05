# CLAUDE.md — BSI-NextGen

## Context

This is a **subdirectory** within the larger BSI repo (`../CLAUDE.md` covers the parent project). BSI-NextGen is the original monorepo architecture for the sports intelligence platform. The parent repo has since flattened into a single Next.js app at root -- this subdirectory preserves the pnpm workspace structure and its Cloudflare workers.

## What This Is

TypeScript monorepo with pnpm workspaces. Delivers real-time sports data from official APIs. College baseball coverage is the differentiator -- filling ESPN's gaps with complete box scores.

## Monorepo Structure

```
packages/
├── shared/              # @bsi/shared — Common types and utilities
├── api/                 # @bsi/api — Sports data adapters (MLB, NFL, NBA, NCAA, College Baseball)
├── web/                 # @bsi/web — Next.js web application
├── sports-dashboard/    # Sports dashboard components
└── mcp-sportsdata-io/   # MCP server for SportsDataIO

cloudflare-workers/
├── blaze-trends/        # AI-powered sports trend monitoring
├── blaze-content/       # Content delivery
├── blaze-ingestion/     # Data ingestion pipeline
└── longhorns-baseball/  # Texas Longhorns baseball worker

Package dependencies: @bsi/web → @bsi/api → @bsi/shared
```

## Commands

```bash
# Install & build
pnpm install
pnpm build                     # Builds shared → api → web in order

# Development
pnpm dev                       # Next.js web dev server (localhost:3000)
pnpm dev:api                   # API in watch mode

# Package-specific
pnpm --filter @bsi/web dev
pnpm --filter @bsi/api build
pnpm --filter @bsi/shared test

# Code quality
pnpm lint
pnpm format
pnpm type-check                # tsc --noEmit

# Testing
npx playwright test            # E2E tests
npx playwright test --ui       # Interactive UI mode
.claude/tests/mobile-regression.sh --all  # Mobile regression

# Blaze Trends worker
pnpm trends:dev                # Local worker (localhost:8787)
pnpm trends:deploy             # Deploy to Cloudflare
pnpm trends:tail               # Live logs
pnpm trends:health             # Health check
pnpm trends:db stats           # DB statistics

# Clean
pnpm clean                     # Remove all build artifacts + node_modules
pnpm clean && pnpm install     # Full reset
```

## Key Packages

**@bsi/shared** (`packages/shared/src/`)
- Types: `Team`, `Game`, `Standing`
- Utilities: `formatDate()`, `calculateWinPercentage()`, `getTodayInChicago()`
- All timestamps use **America/Chicago** timezone

**@bsi/api** (`packages/api/src/adapters/`)
- `MLBAdapter` — MLB Stats API (free, no key)
- `NFLAdapter` / `NBAAdapter` — SportsDataIO (requires `SPORTSDATAIO_API_KEY`)
- `NCAAFootballAdapter` — ESPN public API (free)
- `CollegeBaseballAdapter` — ESPN API + enhanced box scores (free)

**@bsi/web** (`packages/web/`)
- Next.js App Router with Tailwind CSS
- API routes at `app/api/sports/{mlb,nfl,nba,ncaa_football,college_baseball}/`
- Mobile-first responsive design

## Blaze Trends Worker

AI-powered trend monitoring using OpenAI GPT-4 Turbo + Brave Search. Runs on Cloudflare Workers with D1 + KV.

Endpoints:
- `GET /health` — Health check
- `GET /api/trends` — All trends (filter with `?sport=college_baseball`)
- `GET /api/trends/:id` — Single trend
- `GET /cron/monitor` — Manual monitoring trigger

## Environment Variables

Required in `.env`:
```
SPORTSDATAIO_API_KEY=...
```

## Data Sources

- **MLB:** `statsapi.mlb.com` (free, no key)
- **College sports:** `site.api.espn.com` (free, no key)
- **NFL/NBA:** `api.sportsdata.io` (requires key)

## Gotchas

- **Build order matters:** shared must build before api, api before web. `pnpm build` handles this.
- **Workspace deps not updating?** Rebuild the dependency package, then restart dev server.
- **Type errors in web?** Usually means shared or api needs a rebuild first.
- **No placeholder data.** All data from real APIs with proper error handling.
- **Mobile-first:** Default styles target mobile, scale up with `md:` / `lg:` breakpoints.
- **Timezone:** Always America/Chicago. Include timezone in API response `meta` objects.

## Deployment

- **Web:** Netlify or Vercel (auto-deploys from `main` branch)
- **Workers:** Deploy individually via their own wrangler configs in `cloudflare-workers/`

## Documentation

- `docs/IMPLEMENTATION_SUMMARY.md` — Start here for infrastructure roadmap
- `docs/INFRASTRUCTURE.md` — 72 Workers, 18 D1 databases, 20+ KV stores mapped
- `docs/OPERATIONAL_RUNBOOKS.md` — Deployment, incident response, backup/recovery
- `.claude/README.md` — Claude Code configuration details
