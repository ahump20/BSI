# Blaze Sports Intel

**Born to Blaze the Path Less Beaten.**

Blaze Sports Intel (BSI) is a sports intelligence platform providing real-time analytics, complete box scores, and advanced statistics for college baseball—plus coverage of MLB, NFL, NCAA Football, and more.

**Live Site:** [blazesportsintel.com](https://blazesportsintel.com)

---

## What We Do

- **Real-time college baseball coverage** for all 300+ D1 programs
- **Complete box scores** with batting lines, pitching stats, and defensive metrics
- **NIL Valuation Engine** using Fair Market NIL Value (FMNV) models
- **Advanced analytics** including WAR calculations and predictive models
- **Live game tracking** with 5-minute refresh during active games
- **Historical data** cross-referenced from 3+ official sources

## Who It's For

| User Type | Use Case |
|-----------|----------|
| **College Baseball Fans** | Real-time scores, standings, and stats for every D1 program |
| **High School Coaches** | Scouting tools and player comparisons |
| **College Programs** | Advanced analytics and recruiting insights |
| **Professional Scouts** | Prospect evaluation and NIL valuations |
| **Media & Analysts** | API access for data-driven content |

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/ahump20/BSI.git
cd BSI

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

### Environment Setup

Copy `.env.example` to `.env.local` and configure your API keys:

```bash
cp .env.example .env.local
```

Required environment variables for full functionality:
- `SPORTSDATA_API_KEY` - SportsDataIO for live scores
- `CLOUDFLARE_API_TOKEN` - For Workers/D1/KV deployment

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Next.js 16, TypeScript, Tailwind CSS |
| **Backend** | Cloudflare Workers, D1 (SQLite), KV, R2 |
| **AI/ML** | Cloudflare Workers AI, Vectorize embeddings |
| **Analytics** | Cloudflare Analytics Engine |
| **Payments** | Stripe subscriptions |
| **CI/CD** | GitHub Actions, Cloudflare Pages |

---

## Project Structure

```
BSI/
├── app/                 # Next.js pages and API routes
├── components/          # React UI components
├── lib/                 # Shared utilities, adapters, and hooks
├── public/              # Static assets and HTML pages
├── functions/           # Cloudflare Pages Functions (API endpoints)
├── workers/             # Cloudflare Worker configurations
├── scripts/             # Build, deploy, and data ingestion scripts
├── tests/               # Vitest unit tests and Playwright E2E
├── docs/                # Documentation
└── mcp/                 # MCP (Model Context Protocol) servers
```

For detailed development guidelines, see [CLAUDE.md](./CLAUDE.md).

---

## API Documentation

API documentation is available at [/docs/api.html](https://blazesportsintel.com/docs/api.html) on the live site.

### Key Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/v1/college-baseball/rankings` | D1 Baseball rankings by poll |
| `/api/v1/college-baseball/games` | Game schedules and results |
| `/api/v1/college-baseball/box-score/{gameId}` | Complete box scores |
| `/api/v1/nil/valuation/{playerId}` | NIL valuations |
| `/api/v1/mlb/standings` | MLB standings |
| `/api/v1/nfl/scores` | NFL scores |

---

## Deployment

The site deploys automatically to Cloudflare Pages on push to `main`.

### Manual Deployment

```bash
# Deploy to Cloudflare Pages
CLOUDFLARE_API_TOKEN=your-token npx wrangler pages deploy public --project-name=blazesportsintel

# Deploy a specific Worker
npx wrangler deploy --config workers/ingest/wrangler.toml
```

---

## Texas Longhorns MCP Server

BSI includes a Model Context Protocol (MCP) server for Texas Longhorns data services. See [mcp/texas-longhorns/README.md](./mcp/texas-longhorns/README.md) for MCP-specific documentation.

### MCP Tools

| Tool | Description |
|------|-------------|
| `get_team_seasons` | Season summaries across sports |
| `get_season_schedule` | Schedule for a given sport |
| `get_game_box_score` | Box score for a specific game |
| `get_player_career` | Player career search |
| `get_rankings_context` | Poll rankings and trends |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Follow the guidelines in [CLAUDE.md](./CLAUDE.md)
4. Run tests (`npm run test`)
5. Submit a pull request

### Code Quality Requirements

- TypeScript with strict mode
- Zero TODO comments in production code
- WCAG AA accessibility minimum
- Mobile-first responsive design
- All timestamps in America/Chicago timezone

---

## Data Sources

All statistics are sourced and timestamped:

- **College Baseball:** D1Baseball.com, NCAA Official Stats, Conference APIs
- **MLB:** Baseball Reference, MLB Stats API
- **NFL:** Pro Football Reference, ESPN API
- **College Football:** Sports Reference CFB, AP/Coaches Polls

---

## License

Proprietary. All rights reserved. See [LICENSE](./LICENSE) for details.

---

## Contact

- **Website:** [blazesportsintel.com](https://blazesportsintel.com)
- **Email:** austin@blazesportsintel.com
- **GitHub:** [github.com/ahump20/BSI](https://github.com/ahump20/BSI)

---

*Born in Memphis. Rooted in Texas soil. Covering college baseball like it matters—because it does.*
