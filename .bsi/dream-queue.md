# BSI Dream Queue

**Generated:** 2026-04-04T17:55:00Z
**Sports in season:** College Baseball (peak — conference play, 80 games today), MLB (Opening Week), NBA (final stretch, regular season ends ~Apr 13)
**Signal summary:** Game detail pages are completely broken — live games in progress return null data, leaving the site's deepest content layer unreachable on the biggest game day of the week. Conference standings have been stuck at 0-0 for two consecutive days (unresolved from Apr 3 queue). The Savant leaderboard is capped at 25 players despite 6 weeks of season data in D1.

---

## Priority Queue

### 1. Fix game detail pages — live games return blank on a 44-game Saturday
**What:** Clicking into any college baseball game — Florida vs. Ole Miss, Oklahoma State vs. Cincinnati, any of the 80 games on today's board — shows real live score, inning-by-inning data, and team stats instead of a dead page.
**Why now:** 44 games are in progress right now (April 4, Saturday). `GET /api/college-baseball/games/:id` returns `{ "game": null }` for every ID including actively live games. Game detail is the highest-intent content click on a game day. Every fan following a live game hits this wall.
**Scope:** 1 session
**Verification:** `curl https://blazesportsintel.com/api/college-baseball/games/1139825` returns a non-null `game` object with score and team data. Then navigate to the game page in browser and confirm live score renders.
**First step:** Read `workers/handlers/college-baseball/scores.ts:169–241` — the `handleCollegeBaseballGame` function tries Highlightly first, then ESPN. Both are silently failing. Confirm whether Highlightly's `getMatch(1139825)` is returning an error or empty payload, then check if the ESPN fallback game ID scheme matches the IDs the scores endpoint returns.

---

### 2. College baseball conference records stuck at 0-0 for second consecutive day
**What:** The standings page shows each team's real conference win-loss split — so fans can see who leads the SEC, ACC, Big 12, and Pac-12 races — instead of every team showing 0-0 across the board.
**Why now:** This was Priority #1 in the April 3 queue and remains unfixed. It's April 4 — deep in conference play. The endpoint returns 138 teams; all have `conferenceRecord: { wins: 0, losses: 0 }`. This data is wrong and visible to every user who checks standings.
**Scope:** 1 session
**Verification:** `curl https://blazesportsintel.com/api/college-baseball/standings | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data'][0]['team']['name'], d['data'][0]['conferenceRecord'])"` — returns a real W-L split, not `{wins: 0, losses: 0}`.
**First step:** Read `workers/handlers/college-baseball/standings.ts` and find where `conferenceRecord` is populated — the ESPN response includes conference records in a `statsList` or `record` array; trace which field key is being missed or misread in the transform.

---

### 3. Expand the Savant leaderboard depth — 25 players is not a leaderboard
**What:** The advanced stats leaderboard shows 100+ qualified college baseball hitters with wOBA, wRC+, and FIP rankings deep enough to make conference and class-year comparisons meaningful.
**Why now:** 6 weeks into the season and the leaderboard is capped at 25 total players regardless of minPA threshold. This is BSI's clearest differentiation from any mainstream outlet — the only sabermetric college baseball leaderboard on the web. At 25 players it reads as a proof-of-concept, not a tool. The `bsi-savant-compute` cron runs every 6 hours; the compute is happening but the data isn't making it to the surface.
**Scope:** 1 session
**Verification:** `curl https://blazesportsintel.com/api/savant/batting/leaderboard` returns `total > 100`. The Savant page on the site shows a scrollable leaderboard with at least 100 rows.
**First step:** Query `bsi-analytics-db` D1 directly — check row count in the advanced batting table and whether the 25-row cap is a query `LIMIT`, a join condition failing for most players, or an ingestion gap where only a handful of teams' data is landing in D1.

---

### 4. Wire the transfer portal — zero entries during active portal season
**What:** The college baseball transfer portal page shows players currently in the portal — name, position, previous school, and eligibility status — updated automatically.
**Why now:** Spring transfer portal is active. The endpoint returns 0 entries. The Player Discovery Engine shipped last week and is in the main nav — having 0 portal entries when the portal is active makes the feature feel disconnected from live roster movement. Transfer portal is one of the top search terms in college baseball right now.
**Scope:** 1 session
**Verification:** `curl https://blazesportsintel.com/api/college-baseball/transfer-portal` returns `totalEntries > 0` with player names, positions, and schools.
**First step:** Check the worker that populates transfer portal data — find whether Highlightly or SportsDataIO has a portal endpoint, whether a cron is configured to fetch it, and whether the KV key being written to matches the key the handler reads from.

---

### 5. NBA playoff picture before the race locks
**What:** The NBA section shows a live playoff seeding view — current seeds for both conferences, play-in matchups (7 vs. 8, 9 vs. 10), and clinch/elimination callouts — using data that's already flowing from the standings API.
**Why now:** Regular season ends April 13 — 9 days. Detroit Pistons lead the East at 56-21, OKC leads the West at 61-16. The standings endpoint is fully healthy with 30 teams. Building the playoff picture now makes it a preview tool; waiting until April 14 makes it just a scoreboard. BSI's mission is to find the overlooked story; Detroit's historic turnaround is the story of the year.
**Scope:** 1 session
**Verification:** Navigate to `blazesportsintel.com/nba/playoff-picture` — page loads with seeded brackets for both conferences, Detroit and OKC highlighted as conference leaders, and play-in teams (seeds 7-10) called out. All data sourced live from `/api/nba/standings`.
**First step:** Read `app/nba/standings/page.tsx` to confirm the existing standings data shape includes wins, losses, GB, and conference rank — then decide whether to extend that page or add a new `/nba/playoff-picture/` route wired to the same endpoint.

---

## Signal Report

### Production Health

| Endpoint | Status | Notes |
|---|---|---|
| `/api/health` | ✅ OK | Worker healthy, hybrid mode |
| `/api/college-baseball/scores` | ✅ 80 games | 44 live, 36 scheduled — data in `data` key (not `games`) |
| `/api/college-baseball/games/:id` | ❌ BROKEN | Returns `game: null` for all IDs including live games |
| `/api/college-baseball/standings` | ⚠️ Degraded | 138 teams returned; all conference records 0-0 (2nd day) |
| `/api/college-baseball/rankings` | ✅ Working | UCLA #1, full top-25 |
| `/api/college-baseball/power-rankings` | ✅ Working | 26 teams |
| `/api/college-baseball/transfer-portal` | ❌ BROKEN | Returns 0 entries |
| `/api/college-baseball/news` | ⚠️ Thin | 6 articles, last updated 17h ago |
| `/api/savant/batting/leaderboard` | ⚠️ Limited | 25 batters total (cap persists across all minPA values) |
| `/api/mlb/scores` | ✅ 16 games | Opening Week, working |
| `/api/mlb/standings` | ✅ 30 teams | Full standings working |
| `/api/nba/scores` | ✅ 3 games | Working |
| `/api/nba/standings` | ✅ 30 teams | Both conferences, full records |
| `/api/scores/overview` | ✅ Working | All 5 sports present |

### Recent Ships (last 20 commits)

| Commit | What shipped |
|---|---|
| `4fffc2e` | Dream queue auto-generated (Apr 3) |
| `4137046` | Dream queue auto-generated (Apr 2) |
| `f9ffdbf` | Dream queue auto-generated (Apr 1) |
| `274abaf` | Dream queue auto-generated (Mar 31) |
| `96e33b2` | Player directory added to nav + D1 position enrichment |
| `2126bdc` | Homepage empty/error states for leaderboard and standout cards |
| `91286eb` | Savant min-PA default 25, UN/null position display cleanup |
| `6ec204f` | Player Discovery Engine — searchable directory with advanced metrics |
| `a20f5a5` | Visual regression baselines, build-verify agent, Live Scores accent |
| `09ca2f3` | 10 design upgrades (table headers, sticky scroll, sport differentiation) |

**Pattern:** College baseball player analytics have had 3 consecutive sprint sessions. Conference standings and game detail have had zero recent commits. Game detail null is a fresh finding — not previously investigated. Transfer portal appears never to have been populated.

### Traffic Patterns

Cloudflare analytics unavailable (MCP tools not present in session).

### Sports Calendar

| Sport | Status | Key Dates |
|---|---|---|
| **College Baseball** | 🔥 PEAK SEASON | Conference play in full swing. 80 games today. Regionals ~May 30. CWS Jun 13–24. |
| **MLB** | 🔥 Opening Week | ~3–4 games played per team. Early surprises forming. |
| **NBA** | 🔥 Final Stretch | Regular season ends ~Apr 13. Play-in Apr 15-18. Playoffs ~Apr 19. Detroit 56-21 East leaders. |
| **NFL** | Offseason | Draft Apr 23–25 is the next event. |
| **CFB** | Deep offseason | Spring practices. Spring games late April. |
