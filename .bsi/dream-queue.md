# BSI Dream Queue

**Generated:** 2026-04-08T11:20:00Z
**Sports in season:** College Baseball (peak — Week 8-9 conference play), MLB (early season, ~10 games in), NBA (final week of regular season, playoffs start mid-April)
**Signal summary:** College baseball standings are returning degraded data — conference win-loss records are estimates from ESPN LPCT, not real figures — at the worst possible time (peak conference play, regional bubble forming). Transfer portal remains broken: two entries, both with `playerName: "Unknown"`. NBA playoffs tip off in roughly one week, and the play-in race is live right now with Detroit (57-22) and OKC leading their conferences.

---

## Priority Queue

### 1. Fix College Baseball Conference Standings
**What:** Visitors to the standings page see accurate conference win-loss records for every program — critical for understanding who's on the regional hosting bubble heading into the final stretch of the regular season.
**Why now:** The standings endpoint is flagged `degraded: true` because the Highlightly enrichment step that provides actual conference W-L data is failing. Conference records are being extrapolated from ESPN win-percentage figures, not real game results. We're in Week 8-9 of conference play — standings shape who hosts regionals. Wrong numbers right now actively mislead anyone trying to follow the D1 race.
**Scope:** 1 session
**Verification:** `curl https://blazesportsintel.com/api/college-baseball/standings` returns `degraded: false` and conference records match known results (e.g. UCLA 18-0 in conference, Jacksonville State 19-0).
**First step:** Add a test fetch of `hlClient.getStandings('NCAA')` with full logging to see exactly what Highlightly returns — check response body, status, and any error fields in the standings handler.

---

### 2. Restore Transfer Portal — Real Player Names
**What:** The transfer portal page shows real player movement with actual names, positions, and schools — not placeholder "Unknown" entries that make the feature look broken.
**Why now:** The API is returning two entries, both with `playerName: "Unknown"`, `position: ""`, and `fromSchool: ""`. This is actively misleading content during peak spring transfer season. Any visitor who lands on the portal page sees garbage data.
**Scope:** 1 session
**Verification:** `curl https://blazesportsintel.com/api/college-baseball/transfer-portal` returns entries where `playerName` is a real name and `fromSchool` is populated. Or the page shows a clean "no verified transfers yet" empty state rather than corrupted entries.
**First step:** Read the transfer portal handler and trace how `playerName` is extracted from Reddit post data — the source URLs are Reddit, so the issue is likely in how post titles are parsed for player name extraction.

---

### 3. NBA Playoff Picture — Play-In Urgency Layer
**What:** The NBA playoff picture page surfaces the play-in race with games-remaining context for seeds 7–10, making it immediately clear which teams are one game away from locking a spot and which are fighting for survival.
**Why now:** NBA play-in games run April 15–16, playoffs begin April 18. Detroit (57-22) and Boston (54-25) are locked, but seeds 7–10 in both conferences are razor close. The page exists and derives clinch status from standings, but there's no "X games remaining" urgency or play-in bracket preview. Traffic to NBA pages spikes the moment playoffs tip — this should be ready before that.
**Scope:** 1 session
**Verification:** At `blazesportsintel.com/nba/playoff-picture`, seeds 7–10 are visually labeled as "Play-In Zone" and each team shows games remaining alongside their record and current seed.
**First step:** Read the playoff picture page (`app/nba/playoff-picture/page.tsx`) to confirm `gamesRemaining` is calculated but not displayed, then surface it in the play-in section.

---

### 4. College Baseball Weekend 9 Game Spotlight
**What:** A pre-weekend editorial piece surfaces the three or four matchups that matter most for the Top 25 this weekend — the games that will reshuffle the rankings and clarify the regional hosting picture before the first pitch Friday.
**Why now:** Weekend 7 and Weekend 8 editorial recaps shipped back-to-back and the cadence is live. Weekend 9 (April 10–12) is two days away with UCLA, Texas (#2, 26-5), Georgia Tech (#3, 26-5), and a clutch of unbeaten conference leaders on the board. Missing this weekend breaks the only editorial pipeline that has been firing consistently at peak season.
**Scope:** 1 session (editorial generation + publish)
**Verification:** `blazesportsintel.com/college-baseball/editorial` shows a Weekend 9 entry dated April 9–10 with real game matchups sourced from the schedule API.
**First step:** `curl "https://blazesportsintel.com/api/college-baseball/scores?date=2026-04-11"` to pull Friday's top matchups and identify the three ranked-vs-ranked or bubble games.

---

### 5. MLB Early-Season Power Index
**What:** A live power ranking of all 30 MLB teams two weeks into the season — ordered by a composite of run differential, strength of early schedule, and ERA, giving fans an honest read on who's actually good versus who's beaten up on weak competition.
**Why now:** MLB is roughly 10 games in and real signal is emerging: Yankees 8-2, Guardians 7-5, Cardinals already buried. The multi-sport homepage redesign just shipped and is routing traffic to the MLB hub, which currently has standings and scores but zero editorial or ranking content. This is the highest-leverage moment to build early-season authority before the narrative firms up.
**Scope:** 1 session
**Verification:** A page at `blazesportsintel.com/mlb/stats` or `/mlb/power-rankings` shows all 30 teams ranked with run differential and a composite score, all sourced from the live standings API.
**First step:** `curl https://blazesportsintel.com/api/mlb/standings` and verify that `runsScored` and `runsAllowed` fields are present in the payload — they are (confirmed in signal gathering), so the ranking formula can be computed client-side.

---

## Signal Report

### Production Health

| Endpoint | Status | Notes |
|---|---|---|
| `/api/health` | OK | Hybrid-worker mode |
| `/api/college-baseball/scores` | OK | 25 games today (all scheduled, evening) |
| `/api/mlb/scores` | OK | 15 games (yesterday finals) |
| `/api/college-baseball/standings` | DEGRADED | `degraded: true` — 138 team entries, conference W-L estimated from LPCT |
| `/api/college-baseball/rankings` | OK | 25 teams, UCLA #1 at 29-2 |
| `/api/college-baseball/power-rankings` | OK | 26 teams |
| `/api/savant/batting/leaderboard` | OK | 25 batters cached |
| `/api/scores/overview` | OK | All 5 sports present (CBB, MLB, NFL, NBA, CFB) |
| `/api/nba/standings` | OK | 2 conferences, full rosters |
| `/api/nba/scores` | OK | 10 games |
| `/api/mlb/standings` | OK | 30 teams, `runsScored`/`runsAllowed` present |
| `/api/college-baseball/news` | OK | 6 articles (thin for peak season) |
| `/api/college-baseball/transfer-portal` | BROKEN | 2 entries, both `playerName: "Unknown"`, `fromSchool: ""` |
| `/api/college-baseball/weekly-pulse` | OK | Week 15 data, real wRC+ leaders |
| `/api/college-baseball/sabermetrics` | OK | League constants healthy |

### Recent Ships (last 20 commits)

- **Team comparison** — dynamic compare for any D1 pair
- **Editorial** — Weekend 7 (Iowa run-rules UCLA) + Weekend 8 (UCLA 30-2, Alabama surge) recaps
- **Homepage** — redesigned landing with multi-sport pulse
- **Team/player detail** — `useResolvedParam` hook, roster normalization for NFL/NBA, duplicate suffix fix
- **SEO** — dynamic page titles for game detail, Savant profiles, player pages
- **Proxy fallbacks** — team detail (NFL/NBA/CFB), daily schedule, college baseball player detail

Pattern: heavy investment in player/team detail infrastructure and editorial consistency. SEO and navigation reliability are clearly in focus.

### Traffic Patterns

Cloudflare analytics unavailable (no MCP tools in this session).

### Sports Calendar

| Sport | Status | Key Event |
|---|---|---|
| College Baseball | PEAK — Week 8-9 conf play | Regional bubble forming; CWS mid-June |
| MLB | Active — ~10 games in | Early-season signal just becoming reliable |
| NBA | Final regular-season week | Play-in April 15-16; Playoffs ~April 18 |
| NFL | Offseason | NFL Draft late April |
| CFB | Offseason | Spring games only |
