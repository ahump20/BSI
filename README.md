<p align="center">
  <img src="public/images/brand/logo-full.webp" alt="Blaze Sports Intel" width="280" />
</p>

<h3 align="center">Sports intelligence platform — college baseball coverage ESPN won't build.</h3>

---

## What is BSI?

Blaze Sports Intel is a mobile-first sports intelligence platform. The flagship product is complete college baseball coverage — full box scores, live game tracking, standings, and rankings — filling the gap ESPN leaves wide open. The platform also covers MLB, NFL, NBA, college football (with transfer portal tracking), and NIL valuation tools.

Built as a fully static Next.js 16 site deployed to Cloudflare Pages, with Cloudflare Workers powering backend data pipelines.

## Features

- **College Baseball** — Complete box scores, live games, standings, team pages, rankings, and news
- **MLB** — Stats and coverage via the MLB Stats API
- **NFL & NBA** — Live data powered by SportsDataIO
- **College Football** — Scores, standings, and transfer portal tracking
- **NIL Valuation** — Analytics tools for name/image/likeness deals
- **Cross-Sport Scoreboard** — Unified live scores view
- **Arcade** — Browser-based sports games (including Sandlot Sluggers)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (static export) + React 19 |
| Language | TypeScript + Tailwind CSS 3 |
| Hosting | Cloudflare Pages |
| Backend | Cloudflare Workers + D1 / KV / R2 |
| Dates | Luxon (America/Chicago timezone) |
| Payments | Stripe |
| Animation | Framer Motion |
| Charts | Recharts |
| Testing | Vitest (unit/integration) + Playwright (E2E, a11y) |

## Getting Started

```bash
git clone <repo-url>
cd BSI
npm install
```

Create a `.env` file at the project root:

```
SPORTS_DATA_IO_API_KEY=4353bc28a8004b569f51d2222392ba17
```

Optional:

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Start the dev server:

```bash
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Static export to `out/` + copy functions |
| `npm run test` | Vitest in watch mode |
| `npm run test:all` | API + integration + validation tests |
| `npm run test:routes` | Playwright route tests |
| `npm run test:a11y` | Playwright accessibility tests |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run format` | Prettier check |
| `npm run deploy:production` | Build + deploy to Cloudflare Pages (main) |
| `npm run deploy:worker` | Deploy Cloudflare Worker |
| `npm run deploy:hybrid` | Deploy both Pages + Worker |

Playwright CLI quick capture:

```bash
# Uses the Playwright binary shipped by @playwright/mcp.
npx --yes --package @playwright/mcp playwright screenshot https://playwright.dev output/playwright/playwright-dev.png
```

## Project Structure

```
app/                    # Next.js App Router pages
  college-baseball/     #   Primary sport — games, scores, standings, teams
  mlb/                  #   MLB coverage
  nfl/                  #   NFL coverage
  nba/                  #   NBA coverage
  cfb/                  #   College football + transfer portal
  nil-valuation/        #   NIL analytics tools
  arcade/               #   Browser games
  scores/               #   Cross-sport scoreboard
components/             # Shared React components
lib/                    # Core logic (API clients, utils, hooks, analytics)
workers/                # Cloudflare Workers (each with own wrangler.toml)
functions/              # Cloudflare Pages Functions (serverless)
games/                  # Browser arcade games
external/               # Standalone sub-projects (Sandlot Sluggers)
tests/                  # Test suites (api, integration, a11y, routes, etc.)
scripts/                # Build, deploy, and data scripts
docs/                   # Infrastructure and operations docs
```

Path alias: `@/*` maps to the project root.

## Deployment

The site deploys as a static export to **Cloudflare Pages**. Workers deploy independently, each with their own `wrangler.toml` in `workers/`.

```bash
npm run deploy:production    # Pages (main branch)
npm run deploy:preview       # Pages (preview branch)
npm run deploy:worker        # Default worker
npm run deploy:hybrid        # Both Pages + Worker
```

## License

All rights reserved. This is proprietary software.
