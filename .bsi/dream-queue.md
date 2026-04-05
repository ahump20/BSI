# BSI Dream Queue

**Generated:** 2026-04-05T11:26:00Z
**Sports in season:** College Baseball (peak — Week 8, full conference play), MLB (early regular season, Week 2), NBA (final 8 days of regular season, playoffs begin ~April 13)
**Signal summary:** Three data pipelines remain broken into a third consecutive day: game detail returns null, conference standings are frozen at 0-0, and the transfer portal serves zero entries. The Savant cap issue from yesterday is resolved — the UI correctly requests 100 players and receives them. NBA playoff season starts in 8 days with no playoff picture page built yet. MLB stats endpoint is empty despite the season being two weeks old.

---

## Priority Queue

### 1. Game detail pages blank for every game — third day
**What:** Clicking any college baseball game from the scores board opens a real box score — inning-by-inning scoring, team stats, and play-by-play — instead of a dead page with no data.
**Why now:** The game detail handler returns `game: null` for every game ID regardless of state. Tested today against IDs `1143815`, `1143802`, and `1139792` — all null. This is the highest-intent click on the site: a fan who sees a score wants to go deeper. Today is Sunday, the biggest game day of the week in college baseball. Three days without any fix.
**Scope:** 1 session
**Verification:** `curl https://blazesportsintel.com/api/college-baseball/games/1139792` returns a non-null `game` object with team names, score, and inning data. The game page at `blazesportsintel.com/college-baseball/game/1139792/` renders a real box score.
**First step:** Read the `handleCollegeBaseballGame` function in `workers/handlers/college-baseball/` — trace why Highlightly's match fetch returns nothing and whether the ESPN fallback attempts the request with a game ID format that matches what the scores endpoint produces.

---

### 2. Conference standings frozen at 0-0 — third consecutive day
**What:** The college baseball standings page shows each team's real conference record — SEC, ACC, Big 12, Pac-12 races all visible — instead of every team showing 0 wins and 0 losses in conference play.
**Why now:** Confirmed for the third day running: all 138 teams show `conferenceRecord: { wins: 0, losses: 0 }`. Overall records are correct (UCLA 28-2, North Carolina 27-5) but the conference split is wrong. It's Week 8 — conference standings are the most consequential data of the season and they've been broken since at least April 3.
**Scope:** 1 session
**Verification:** `curl https://blazesportsintel.com/api/college-baseball/standings | python3 -c "import sys,json; d=json.load(sys.stdin); t=d['data'][0]; print(t['team']['name'], t['conferenceRecord'])"` — returns a real conference record, not `{wins: 0, losses: 0}`.
**First step:** Read the college baseball standings worker handler and trace where `conferenceRecord` is assigned — the ESPN source includes a `record` or `statsList` field with conference breakdown; find which key is being missed or skipped in the transform layer.

---

### 3. Transfer portal showing zero entries in active portal season
**What:** The college baseball transfer portal page populates with players currently in the portal — name, position, previous school, and status — reflecting real roster movement happening right now.
**Why now:** The spring transfer portal is open and `curl https://blazesportsintel.com/api/college-baseball/transfer-portal` returns `totalEntries: 0`. The Player Discovery Engine shipped last week and is in the main nav — having zero portal data makes the roster movement feature feel disconnected from reality. Portal movement is one of the top college baseball stories every April.
**Scope:** 1 session
**Verification:** `curl https://blazesportsintel.com/api/college-baseball/transfer-portal` returns `totalEntries > 0` with player names, positions, and schools.
**First step:** Find which worker or cron is responsible for populating transfer portal data — check whether Highlightly or SportsDataIO has a portal endpoint, whether the KV key written matches the key the handler reads, and whether a scheduled fetch is even configured.

---

### 4. NBA playoff picture before the race locks in 8 days
**What:** A dedicated NBA playoff seeding page shows both conference brackets — current seeds, play-in matchups (7 vs. 8, 9 vs. 10), and clinch indicators — sourced live from standings data that is already fully healthy.
**Why now:** The regular season ends April 13 — 8 days away. Detroit leads the East at 57-21; their historic turnaround is the story of the year and BSI has no page to frame it. The NBA standings endpoint returns 30 teams, two full conferences, and complete records. Building now gives visitors a predictive playoff view for the final 8 games; waiting until April 14 produces a recap scoreboard instead of a preview tool.
**Scope:** 1 session
**Verification:** Navigate to `blazesportsintel.com/nba/playoff-picture/` — both conference brackets render with current seeds, Detroit and OKC called out as leaders, and play-in seeds 7-10 flagged for both conferences. All data sourced live from `/api/nba/standings`.
**First step:** Read `app/nba/standings/page.tsx` to confirm the data shape includes conference rank, wins, losses, and GB — then create `app/nba/playoff-picture/page.tsx` wired to the same `/api/nba/standings` endpoint, rendering a Heritage v2.1 bracket layout.

---

### 5. MLB season stats surface — two weeks of data going nowhere
**What:** An MLB stats leaderboard shows early-season batting and pitching leaders — average, home runs, ERA, strikeouts — giving visitors a reason to return to the MLB section every day during the week, not just on game days.
**Why now:** The regular season is two weeks old with 16 games on the board today. The `/mlb/stats/` page exists but the API endpoint returns empty. Every visit to the MLB section ends at scores and standings — there is no second click. Early-season leaders are a high-interest story: who's hitting .400, who hasn't allowed an earned run through 10 appearances. This is the window when those numbers are novel.
**Scope:** 1 session
**Verification:** `curl https://blazesportsintel.com/api/mlb/stats` returns structured stat leaders with player names and values. The stats page at `blazesportsintel.com/mlb/stats/` renders a leaderboard with qualified batters and pitchers.
**First step:** Read `workers/handlers/mlb/` to find whether a stats handler exists and which SportsDataIO endpoint it targets — then determine whether the failure is a missing handler, a broken KV write, or a transform gap.

---

## Signal Report

### Production Health

| Endpoint | Status | Notes |
|---|---|---|
| `/api/health` | ✅ OK | Worker healthy, hybrid mode |
| `/api/college-baseball/scores` | ✅ 17 games | 16 scheduled, 1 final — data in `data` key (not `games`) |
| `/api/college-baseball/games/:id` | ❌ BROKEN | `game: null` for all IDs — 3rd day |
| `/api/college-baseball/standings` | ⚠️ Degraded | 138 teams, all `conferenceRecord` frozen at 0-0 — 3rd day |
| `/api/college-baseball/rankings` | ✅ Working | UCLA #1, full list returned |
| `/api/college-baseball/news` | ⚠️ Thin | 6 articles, no published timestamps |
| `/api/college-baseball/transfer-portal` | ❌ BROKEN | `totalEntries: 0` — active portal season |
| `/api/savant/batting/leaderboard` | ✅ Working | 100 batters at limit=100; UI correctly requests 100 — resolved from Apr 4 queue |
| `/api/savant/pitching/leaderboard` | ✅ Working | 100 pitchers at limit=100 |
| `/api/mlb/scores` | ✅ 16 games | Week 2, healthy |
| `/api/mlb/standings` | ✅ 30 teams | Full standings |
| `/api/mlb/stats` | ❌ BROKEN | Returns empty / no response |
| `/api/nba/scores` | ✅ 3 games | Final week of regular season |
| `/api/nba/standings` | ✅ 30 teams | Detroit leads East 57-21; OKC leads West |
| `/api/scores/overview` | ✅ Working | All 5 sports present |

### Recent Ships (last 20 commits)

| Commit | What shipped |
|---|---|
| `a9f31fc` | Dream queue auto-generated (Apr 4) |
| `96e33b2` | Players directory added to navigation, position data enriched from D1 |
| `2126bdc` | Homepage empty/error states for leaderboard and standout cards |
| `91286eb` | Players directory: min PA default 25, UN/null position cleanup |
| `6ec204f` | Player Discovery Engine — searchable directory with advanced metrics |
| `a20f5a5` | Visual regression baselines, build-verify agent, Live Scores accent |
| `35b8f26` | NFL SportIcon style prop fix |
| `09ca2f3` | 10 design upgrades: table headers, sticky scroll, sport differentiation, score badges, mobile |

**Pattern:** Four sessions focused on college baseball player analytics and UI polish. Zero worker-side fixes in the recent window. The three broken data pipelines (game detail, conference records, transfer portal) have accumulated without attention while frontend work ran in parallel.

### Traffic Patterns

Cloudflare analytics unavailable — MCP tools not present in this session.

### Sports Calendar

| Sport | Status | Key Dates |
|---|---|---|
| **College Baseball** | PEAK — Week 8, conference play | Regionals ~May 30. CWS June 13–24. |
| **MLB** | Early regular season — Week 2 | All-Star Break mid-July. |
| **NBA** | Final 8 days | Regular season ends April 13. Play-in April 15-18. Playoffs ~April 19. |
| **NFL** | Offseason | Draft April 23–25. |
| **CFB** | Deep offseason | Spring games late April. |
