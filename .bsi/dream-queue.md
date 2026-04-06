# BSI Dream Queue

**Generated:** 2026-04-06T11:23:00Z
**Sports in season:** College Baseball (peak — Week 8, full conference play), MLB (regular season Week 2), NBA (final 7 days of regular season, playoffs begin April 13)
**Signal summary:** Four consecutive days of broken game detail pages and frozen conference standings in college baseball — the two highest-value features during the most important month of the season. Transfer portal remains empty during active spring movement. NBA playoffs open in 7 days with no playoff picture page despite healthy standings data. MLB stats endpoint returns no content despite two weeks of games on the board.

---

## Priority Queue

### 1. Game detail pages still returning nothing — fourth consecutive day
**What:** Clicking any college baseball game from the scores board opens a real box score — inning-by-inning scoring, team stats, and key plays — instead of a blank page with no data.
**Why now:** Confirmed again today: `/api/college-baseball/games/1147546` (Oklahoma at Dallas Baptist, scheduled for tonight) returns `game: null`. Every game ID returns null regardless of game state. This is the highest-intent click on the entire site — a fan who sees a score always wants to go deeper. Four consecutive days with no fix during peak season.
**Scope:** 1 session
**Verification:** `curl https://blazesportsintel.com/api/college-baseball/games/1147546` returns a non-null `game` object with team names, scheduled time, and available state data. The game page at `blazesportsintel.com/college-baseball/game/1147546/` renders matchup information instead of a blank shell.
**First step:** Read the game detail handler in `workers/handlers/college-baseball/` — trace why the Highlightly game fetch returns null and whether the game IDs from the scores endpoint (`data[].id`) match the format the game detail handler uses to query Highlightly.

---

### 2. Conference standings frozen at 0-0 — fourth consecutive day
**What:** The college baseball standings page shows each team's real conference record — SEC, Big 12, ACC, and Pac-12 races updated with this week's results — instead of every team listed at 0 wins and 0 losses in conference play.
**Why now:** Confirmed again: all 138 teams return `conferenceRecord: { wins: 0, losses: 0, pct: 0 }` while overall records are live (UCLA 29-2, North Carolina 27-5). It's Week 8 — the conference standings race is the central college baseball story right now and the data has been frozen for four straight days.
**Scope:** 1 session
**Verification:** `curl https://blazesportsintel.com/api/college-baseball/standings | python3 -c "import sys,json; d=json.load(sys.stdin); t=d['data'][0]; print(t['team']['name'], t['conferenceRecord'])"` — returns a non-zero conference record for the #1 team.
**First step:** Read the college baseball standings handler and trace where `conferenceRecord` is built — the ESPN source returns a `record` array per team with a conference split; find which field key the transform is missing or mapping incorrectly.

---

### 3. Transfer portal showing nothing during active spring movement
**What:** The college baseball transfer portal page populates with players currently in the portal — name, position, previous school, and portal status — reflecting real April roster movement instead of an empty list.
**Why now:** The endpoint confirms: `totalEntries: 0`, last synced 11:00 AM today. The spring portal is open and active. Portal movement is one of the top college baseball stories every April, and BSI has a full transfer portal page that shows nothing. The Player Discovery Engine launched two weeks ago — portal data would make it substantially more useful.
**Scope:** 1 session
**Verification:** `curl https://blazesportsintel.com/api/college-baseball/transfer-portal` returns `totalEntries > 0` with real player entries including name, position, and previous school.
**First step:** Find the worker or cron responsible for portal sync — check whether Highlightly or SportsDataIO exposes a transfer portal endpoint, whether the KV write key matches the read key in the handler, and whether a scheduled fetch is actually configured to run.

---

### 4. NBA playoff picture — 7 days before the race locks in
**What:** A dedicated NBA playoff seeding page shows both conference brackets — current seeds, remaining schedule, play-in matchups (7 vs. 8 and 9 vs. 10), and clinch indicators — giving fans a live view of the playoff race through the final week.
**Why now:** The regular season ends April 13. Detroit leads the East at 57-21 with a 23-game win streak — the biggest story in basketball — and BSI has no page to frame it. The standings endpoint is fully healthy (30 teams, both conferences, complete records). Building now gives visitors a predictive playoff view for the last 7 games. Waiting until April 14 produces only a retrospective scoreboard.
**Scope:** 1 session
**Verification:** Navigate to `blazesportsintel.com/nba/playoff-picture/` — both conference brackets render with current seeds, Detroit and OKC called out as division leaders, and play-in seeds 7-10 flagged. All data sourced live from `/api/nba/standings`.
**First step:** Read `app/nba/standings/page.tsx` to confirm the data shape — then create `app/nba/playoff-picture/page.tsx` wired to `/api/nba/standings`, rendering a Heritage v2.1 two-column bracket layout with play-in zone indicators.

---

### 5. MLB stats endpoint returning nothing — Week 2 of the season
**What:** An MLB leaderboard surfaces early-season batting and pitching leaders — average, home runs, ERA, strikeouts — giving visitors a reason to return to the MLB section on non-game days.
**Why now:** The endpoint returns no content at all (empty body, not even JSON). MLB is two weeks old with 16 games on the board today. The `/mlb/stats/` page exists but serves nothing. Early-season statistical leaders are a high-interest story — who's off to a hot start, who's struggling — and this is the only window when early numbers are novel and surprising.
**Scope:** 1 session
**Verification:** `curl https://blazesportsintel.com/api/mlb/stats` returns a valid JSON response with batting and pitching leader arrays. The stats page at `blazesportsintel.com/mlb/stats/` renders a leaderboard with qualified players.
**First step:** Read `workers/handlers/mlb/` to check whether a stats handler exists and which SportsDataIO endpoint it targets — then determine whether the failure is a missing route registration, a broken KV write, or a transform gap.

---

## Signal Report

### Production Health

| Endpoint | Status | Notes |
|---|---|---|
| `/api/health` | ✅ OK | Worker healthy, hybrid mode |
| `/api/college-baseball/scores` | ✅ 5 games | Scheduled for tonight — data in `data` key (not `games`) |
| `/api/college-baseball/games/:id` | ❌ BROKEN | `game: null` for all IDs — 4th consecutive day |
| `/api/college-baseball/standings` | ⚠️ Degraded | 138 teams, all `conferenceRecord` frozen at 0-0 — 4th day |
| `/api/college-baseball/rankings` | ⚠️ Degraded | Returns 25 teams but `meta.degraded: true` |
| `/api/college-baseball/transfer-portal` | ❌ BROKEN | `totalEntries: 0` — active spring portal season |
| `/api/savant/batting/leaderboard` | ⚠️ Capped | Default returns 25; explicit `?limit=100` returns 100 — UI must request 100 |
| `/api/mlb/scores` | ✅ 16 games | Week 2, healthy |
| `/api/mlb/standings` | ✅ 30 teams | Full standings |
| `/api/mlb/stats` | ❌ BROKEN | Returns empty body (no JSON) |
| `/api/nba/scores` | ✅ 11 games | Final week of regular season |
| `/api/nba/standings` | ✅ 30 teams | Detroit leads East 57-21; OKC leads West |
| `/api/scores/overview` | ✅ Working | All 5 sports present |

### Recent Ships (last 20 commits)

| Commit | What shipped |
|---|---|
| `dbf9238` | Dream queue auto-generated (Apr 5) |
| `96e33b2` | Player directory added to navigation, position data enriched from D1 |
| `2126bdc` | Empty/error states added to homepage leaderboard and standout cards |
| `91286eb` | Player discovery defaults min PA to 25, cleans up position display |
| `6ec204f` | Player Discovery Engine — searchable directory with advanced metrics |
| `a20f5a5` | Visual regression baselines, build-verify agent, Live Scores accent |

**Pattern:** Recent work concentrated on the Player Discovery Engine and homepage polish. Game detail and conference standings — both broken for 4+ days — have received no commits.

### Traffic Patterns

Cloudflare analytics unavailable in this session. Signal derived from endpoint health checks.

### Sports Calendar

| Sport | Status | Key Date |
|---|---|---|
| **College Baseball** | Peak — Week 8, conference play | CWS: mid-June |
| **MLB** | Week 2 regular season | Postseason: October |
| **NBA** | Final 7 days, playoffs imminent | Playoffs begin: April 13 |
| **NFL** | Offseason | Draft: late April |
| **CFB** | Offseason | Season: September |
