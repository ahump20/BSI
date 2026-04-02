# BSI Dream Queue

**Generated:** 2026-04-02T11:18:12Z
**Sports in season:** College Baseball (peak — April conference race), MLB (Opening Week), NBA (final stretch + playoffs Apr 19), CFB (spring practice)
**Signal summary:** Two active regressions are live on production — player detail pages return empty data the day after the discovery engine shipped, and conference standings show zeroed-out records during the heart of the conference race. NBA playoffs are 17 days out with no bracket/seeding surface on the site.

---

## Priority Queue

### 1. Fix broken college baseball player profiles
**What:** Visitors who click a player from the discovery directory land on a fully populated profile — stats, advanced metrics, position, team — instead of a blank page.
**Why now:** The player discovery engine shipped three days ago (Apr 1). Every player link in that directory sends users to an empty shell. The endpoint `/api/college-baseball/players/:id` returns `{"player":{},"statistics":{}}` for every player ID. A flagship feature is broken at its most critical step.
**Scope:** 1 session
**Verification:** Load `blazesportsintel.com/college-baseball/players/87998` — the page should show Tague Davis's batting stats (0.400 AVG, 17 HR, 70 RBI) pulled live from the player directory instead of an empty profile.
**First step:** Read the player detail handler in `workers/handlers/` to find why the Highlightly player lookup returns empty, then trace the correct endpoint and ID mapping.

---

### 2. Restore conference standings during peak conference race
**What:** The college baseball standings page shows teams grouped by conference with real conference win-loss records, not a flat list of 138 teams all showing 0-0 in conference play.
**Why now:** It's April 2 — the middle of conference season. Every team has 6–12 conference games played. The endpoint returns `degraded: true` and `conferenceRecord: {wins: 0, losses: 0}` for all 138 teams. Fans checking standings to track their team's road to Regionals see no conference data at all.
**Scope:** 1 session
**Verification:** Load `blazesportsintel.com/college-baseball/standings` — each conference section (SEC, ACC, Big 12, etc.) should show teams ranked by real conference W-L records, not zeros.
**First step:** Audit the standings handler to find where conference records are sourced — check if the ESPN Site API conference standings endpoint is being called correctly or if the fallback is silently swallowing the structured data.

---

### 3. NBA playoff picture before the bracket locks
**What:** The NBA standings page gains a playoff-race framing — showing the current 8 seeds per conference, play-in matchup projections, and games back for bubble teams — live and updating daily.
**Why now:** The NBA playoffs begin April 19 — 17 days away. Play-in starts April 15. The standings endpoint is fully healthy (30 teams, accurate records, real streaks). There's no page on the site that frames this data as a playoff race. This is peak NBA casual engagement — fans who never visit in January are checking standings daily right now.
**Scope:** 1 session
**Verification:** Load `blazesportsintel.com/nba/standings` — the page should call out the current 8 seeds in each conference, highlight play-in teams (seeds 7–10), and show games back from the 8-seed for bubble teams. All numbers must come from the live standings API, not hardcoded.
**First step:** Read `app/nba/standings/page.tsx` and the existing standings API response structure to understand what data is already available, then add playoff seeding context to the UI without adding a new endpoint.

---

### 4. College baseball Savant pitching leaderboard
**What:** The Savant analytics hub gains a pitching tab alongside batting — showing ERA-, FIP, WHIP, strikeout rate, and walk rate leaders for qualifying starters and relievers.
**Why now:** It's April — pitchers have enough appearances to generate stable metrics, and the Savant compute cron already runs every 6 hours. Batting has 25 qualified hitters. Pitching has zero analytical coverage, which is a conspicuous gap in peak season. Conference aces are the story right now.
**Scope:** 1 session
**Verification:** Load `blazesportsintel.com/college-baseball/savant` — a pitching tab shows at least 15 qualified starters sorted by FIP, with real names and real numbers. Confirm against the D1 database that the rows exist before building the UI.
**First step:** Query `bsi-analytics-db` to check whether `cbb_pitching_advanced` already has rows from the `bsi-cbb-analytics` cron — if data exists, the work is mostly UI; if not, extend the savant compute to write pitching rows first.

---

### 5. Surface the Weekly Pulse as the editorial center of college baseball
**What:** The college baseball hub page promotes the Weekly Pulse as a featured module — showing this week's top riser, top performer, and biggest wOBA mover — so visitors discover it without hunting through navigation.
**Why now:** The Weekly Pulse endpoint is live and data-rich (`top_hitters`, `top_pitchers`, `movers_woba`, `movers_fip`, `conference_snapshot`). The page exists but the data never appears on the main college baseball hub. The endpoint is doing real work that almost no one sees, and the player directory that just launched makes this the logical "what's hot this week" companion surface.
**Scope:** 1 session
**Verification:** Load `blazesportsintel.com/college-baseball` — a "This Week in College Baseball" card shows the current week number, the top batting mover by wOBA change, and a link to the full pulse. Numbers must match what `/api/college-baseball/weekly-pulse` returns live.
**First step:** Read `app/college-baseball/page.tsx` to find where to inject the Weekly Pulse card, then wire a fetch to the existing endpoint and render the top mover using Heritage v2.1 card tokens.

---

## Signal Report

### Production Health

| Endpoint | Status | Notes |
|---|---|---|
| `/api/health` | ✅ OK | `hybrid-worker` mode, v1.0.0 |
| `/api/college-baseball/scores` | ✅ 44 games | Response key is `data`, not `games` |
| `/api/college-baseball/standings` | ⚠️ DEGRADED | `degraded: true` — 138 teams returned but all `conferenceRecord` values are `0-0` |
| `/api/college-baseball/rankings` | ✅ OK | Real ranked teams with accurate records |
| `/api/college-baseball/players` (list) | ✅ OK | Directory returns players with batting stats |
| `/api/college-baseball/players/:id` | 🔴 BROKEN | Returns `{"player":{},"statistics":{}}` for all player IDs |
| `/api/college-baseball/news` | ⚠️ THIN | Only 6 articles in peak season |
| `/api/college-baseball/weekly-pulse` | ✅ OK | Rich data — hitters, pitchers, movers, conference snapshot |
| `/api/mlb/scores` | ✅ 15 games | ESPN source, Opening Week live data |
| `/api/mlb/standings` | ✅ OK | Full 30-team data |
| `/api/nba/scores` | ✅ 9 games | April 1 slate, all final |
| `/api/nba/standings` | ✅ OK | Full 30 teams across East/West |
| `/api/savant/batting/leaderboard` | ✅ 25 batters | Min 25 PA filter, fresh compute |
| `/api/scores/overview` | ✅ All 5 sports present | — |

### Recent Ships (last 20 commits)

| Commit | What shipped |
|---|---|
| `f9ffdbf` | Dream queue auto-generated (Apr 1) |
| `274abaf` | Dream queue auto-generated (Mar 31) |
| `96e33b2` | Player directory added to nav + homepage; D1 position enrichment |
| `2126bdc` | Homepage empty/error states for leaderboard and standout cards |
| `91286eb` | Savant default min PA set to 25, position display cleaned |
| `6ec204f` | Player Discovery Engine — searchable directory with advanced metrics |
| `a20f5a5` | Visual regression baselines, build-verify agent, Live Scores accent |
| `35b8f26` | Fix NFL style prop issue |
| `310a770` | 10 design upgrades (table headers, sticky scroll, score badges, mobile) |
| `2fbd31c`–`23abbc8` | 8 portfolio commits — Lighthouse 100, contact form, print styles, chat widget |

**Pattern:** Player analytics had concentrated attention (4 commits in 4 days). The discovery engine is live but its downstream detail layer is broken. Homepage error states just fixed. Backend data work is the gap now.

### Traffic Patterns

Cloudflare analytics unavailable — no MCP tools matched in this session. Signal inferred from endpoint activity and commit frequency. Prior session data indicates `/college-baseball/` and `/api/college-baseball/scores` are the highest-traffic destinations.

### Sports Calendar

| Sport | Status | Key Dates |
|---|---|---|
| **College Baseball** | 🔴 PEAK SEASON | 44 games/day. Conference race (April). Regionals mid-May. CWS June 12–22. |
| **MLB** | 🟡 Opening Week | Day 7 of the season. 15 games daily. First standings forming. |
| **NBA** | 🟡 Final Stretch | 17 days to playoffs (Apr 19). Play-in begins Apr 15. Seeding is live. |
| **CFB** | ⚪ Offseason | Spring practices. Spring games late April. Draft (Apr 24–26). |
| **NFL** | ⚪ Offseason | Draft April 24–26 is next major event. |
