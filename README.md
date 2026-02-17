<p align="center">
  <img src="public/images/brand/logo-full.webp" alt="Blaze Sports Intel" width="280" />
</p>

<h3 align="center">Sports intelligence platform for undercovered programs, plus AI coaching for high-stakes communication.</h3>

---

## What is BSI?

Blaze Sports Intel is a mobile-first sports intelligence platform. The flagship product is complete college baseball coverage - full box scores, live game tracking, standings, and rankings - filling the gap ESPN leaves wide open. The platform also covers MLB, NFL, NBA, college football (with transfer portal tracking), and NIL valuation tools.

BSI now includes a separate coaching product surface: **Presence Coach**. It is intentionally distinct from sports pages and focuses on real-time communication delivery (posture, gaze, and voice), starting with seated video-call optimization.

Built as a fully static Next.js 16 site deployed to Cloudflare Pages, with Cloudflare Workers powering backend data pipelines.

## Features

- **College Baseball** — Complete box scores, live games, standings, team pages, rankings, and news
- **MLB** — Stats and coverage via the MLB Stats API
- **NFL & NBA** — Live data powered by SportsDataIO
- **College Football** — Scores, standings, and transfer portal tracking
- **NIL Valuation** — Analytics tools for name/image/likeness deals
- **Presence Coach** — Staged coaching surface for posture/gaze/voice guidance in live sessions
- **Cross-Sport Scoreboard** — Unified live scores view
- **Arcade** — Browser-based sports games (including Sandlot Sluggers)

## Product Areas

- **Sports Analytics Pages (`/mlb`, `/nfl`, `/nba`, `/cfb`, `/college-baseball`, etc.)** - Team and player intelligence sourced from external data providers.
- **Presence Coach (`/presence-coach`)** - Human communication coaching loop for on-camera delivery, with progressive cues and staged capture logic.

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

### Quick Start with GitHub Codespaces

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/ahump20/BSI?quickstart=1)

Click the badge above to create a pre-configured cloud development environment. Everything is set up automatically—Node.js, dependencies, Wrangler CLI, and VS Code extensions. See [`.github/CODESPACES.md`](.github/CODESPACES.md) for details.

### Local Development

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
NEXT_PUBLIC_ENABLE_PRESENCE_COACH=false
```

Optional provider keys (recommended for advanced data ingest):

```
SPORTRADAR_API_KEY=replace_with_real_key
SKILLCORNER_API_KEY=replace_with_real_key
BIOMECHANICS_API_KEY=replace_with_real_key
```

Do not commit real values. Configure production keys with `scripts/configure-provider-secrets.sh` instead of storing long-lived secrets in git-tracked files.

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
| `./scripts/configure-provider-secrets.sh --target pages --env production` | Interactive setup for provider keys in Cloudflare Pages secrets |
| `./scripts/configure-provider-secrets.sh --target worker --env production` | Interactive setup for provider keys in Worker secrets (`workers/wrangler.toml`) |

## Project Structure

```
app/                    # Next.js App Router pages
  college-baseball/     #   Primary sport — games, scores, standings, teams
  mlb/                  #   MLB coverage
  nfl/                  #   NFL coverage
  nba/                  #   NBA coverage
  cfb/                  #   College football + transfer portal
  nil-valuation/        #   NIL analytics tools
  presence-coach/       #   Coaching product area (landing + session shell)
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

Provider setup runbook: `docs/runbooks/provider-keys-and-endpoints.md`

## Typography Note

- Runtime display font is **Oswald** (`font-display` token).
- Body text uses **Inter**.
- Data/mono surfaces use **JetBrains Mono**.

## Deployment

The site uses automated GitHub Actions workflows to deploy to Cloudflare infrastructure:

- **Cloudflare Pages** - Static site hosting at `blazesportsintel.com`
- **Cloudflare Workers** - Backend API and data pipelines

### Automated Deployment

Deployments happen automatically on push to `main`. See [`docs/deployment.md`](docs/deployment.md) for complete details on:

- How the automated workflow works
- Required GitHub secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`)
- Manual deployment options
- Troubleshooting

### Manual Deployment Commands

```bash
npm run deploy:production    # Pages (main branch)
npm run deploy:preview       # Pages (preview branch)
npm run deploy:worker        # Default worker
npm run deploy:hybrid        # Both Pages + Worker
```

**Note:** Manual deployments require Wrangler authentication. Run `npx wrangler login` first.

## License

All rights reserved. This is proprietary software.
