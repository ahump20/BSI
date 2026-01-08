# BSI Infrastructure State
> Generated: 2025-01-07 | Audit for 12-hour sprint

---

## Deployment Architecture

**Platform:** Cloudflare Pages + Workers
**Main Project:** `college-baseball-tracker`
**Build Output:** `dist/`
**Domain:** blazesportsintel.com

---

## Workers Inventory

| Worker | Purpose | Bindings |
|--------|---------|----------|
| `college-baseball-tracker` | Main site (Pages) | KV, D1, R2, Vectorize |
| `bsi-cache-warmer` | Preload cache | - |
| `bsi-cfb-ai` | CFB AI analysis | D1, KV |
| `bsi-chatgpt-app` | ChatGPT plugin | - |
| `bsi-news-ticker` | Real-time ticker | Durable Objects |
| `bsi-prediction-api` | Game predictions | D1, KV |
| `bsi-baseball-rankings` | College rankings | KV |
| `bsi-records-api` | Historical records | D1 |
| `bsi-portal-agent` | Transfer portal AI | D1, KV |
| `blazesports-ingest` | Data ingestion | R2 |

**Games (Mini-apps):**
- `blaze-backyard-baseball`
- `blaze-blitz-football`
- `blaze-hoops-shootout`
- `blaze-qb-challenge`

---

## Data Bindings

### KV Namespaces
- `BSI_CACHE` (id: a53c3726fc3044be82e79d2d1e371d26)
- `NIL_CACHE` (same ID, aliased)
- Prefix pattern: `mlb:`, `nfl:`, `ncaa:`, etc.

### D1 Databases
- `bsi-historical-db` (id: 9cecff0f-a3ab-433f-bf10-d2664d9542b0)
- `bsi-game-db` (games)
- `bsi-portal-db` (transfer portal)

### R2 Buckets
- `blaze-sports-data-lake`
- `blaze-nil-archive`
- `blazesports-archives`

### Vectorize
- `sports-scouting-index`

---

## Route Inventory (70 pages)

### Core Routes
- `/` - Homepage with live scores hub
- `/dashboard` - Command center with sport tabs
- `/pricing` - Subscription tiers ($29 Pro, $199 Enterprise)
- `/about`, `/contact`, `/privacy`, `/terms`

### MLB (13 routes)
- `/mlb` - Hub
- `/mlb/games`, `/mlb/scores`, `/mlb/standings`, `/mlb/stats`, `/mlb/news`
- `/mlb/teams`, `/mlb/teams/[teamId]`
- `/mlb/players`, `/mlb/players/[playerId]`
- `/mlb/game/[gameId]` + box-score, play-by-play, recap, team-stats

### NFL (8 routes)
- `/nfl` - Hub
- `/nfl/games`, `/nfl/standings`, `/nfl/news`
- `/nfl/teams`, `/nfl/teams/[teamId]`

### NBA (2 routes)
- `/nba` - Hub
- `/nba/standings`

### College Baseball (18 routes)
- `/college-baseball` - Hub
- `/college-baseball/games`, `/scores`, `/standings`, `/rankings`, `/news`
- `/college-baseball/teams`, `/teams/[teamId]`
- `/college-baseball/conferences`, `/conferences/[conferenceId]`
- `/college-baseball/players`
- `/college-baseball/transfer-portal`, `/transfer-portal/[playerId]`
- `/college-baseball/preseason` + power-25, sec-preview, lone-star-rivalry
- `/college-baseball/game/[gameId]` + box-score, play-by-play, recap, team-stats

### CFB (3 routes)
- `/cfb` - Hub
- `/cfb/transfer-portal`
- `/cfb/articles/[slug]`

### Other
- `/nil-valuation` + methodology, tools
- `/arcade` - Mini-games
- `/auth/login`, `/auth/signup`
- `/checkout`, `/checkout/return`
- `/scores`, `/search`, `/settings`
- `/coverage`, `/for-coaches`, `/for-scouts`
- `/vision-AI-Intelligence`

---

## Missing Routes (404s)

| Route | Status | Fix Required |
|-------|--------|--------------|
| `/analytics` | NO PAGE | Create app/analytics/page.tsx |
| `www.blazesportsintel.com/*` | Subdomain 404 | Configure www redirect in Cloudflare |

---

## API Endpoints (functions/api/)

### MLB
- `/api/mlb/standings` - Standings data
- `/api/mlb/scores` - Live scores
- `/api/mlb/teams/[[teamId]]` - Team details

### NFL
- `/api/nfl/standings` - Standings
- `/api/nfl/scores` - Scores

### NCAA
- `/api/ncaa/baseball/*` - Rankings, scores, standings, teams

### Sports (unified)
- `/api/sports/mlb`, `/api/sports/nfl`, `/api/sports/nba`
- `/api/espn/*` - ESPN data proxy

---

## Data Adapters (lib/adapters/)

| Adapter | Source | Usage |
|---------|--------|-------|
| `espn-unified-adapter.ts` | ESPN API | Primary for NFL, NBA |
| `mlb-adapter.ts` | statsapi.mlb.com | MLB core data |
| `mlb-teams-adapter.ts` | MLB API | Team rosters, stats |
| `ncaa-baseball-adapter.ts` | NCAA | College baseball |
| `nfl-production-adapter.ts` | ESPN | NFL live data |
| `nba-production-adapter.ts` | ESPN | NBA live data |

---

## Known Issues

1. **Dashboard shows placeholder data** - Some cards show hardcoded values, need live API wiring
2. **College baseball "Loading..."** - Rankings endpoint may be stale or timing out
3. **NBA section minimal** - Only 2 routes, needs expansion
4. **www subdomain** - Not redirecting to apex domain
5. **Empty stubs cleaned** - Removed analytics.html, multiplayer.html (0 bytes)

---

## Next Steps (Sprint Blocks 2-10)

- [x] Block 1: Infrastructure audit complete
- [ ] Block 2: Fix analytics route, www subdomain
- [ ] Block 3: College baseball live scoreboard worker
- [ ] Block 4: Dashboard dynamic data
- [ ] Block 5: MLB real standings/scores
- [ ] Block 6: NFL section completion
- [ ] Block 7: Analytics hub build
- [ ] Block 8: Pricing + Stripe flow
- [ ] Block 9: Mobile optimization
- [ ] Block 10: Final deploy + smoke test

---

*Last updated: 2025-01-07 21:30 CT*
