# BSI Dream Queue

**Generated:** 2026-03-31T11:20:00Z
**Sports in season:** College Baseball (PEAK — mid-season, conference play starting), MLB (Opening Week), NBA (final weeks of regular season), CFB/NFL (offseason)
**Signal summary:** CBB conference standings have been 502ing for 7+ days — the most error-prone route on the entire platform, and it's failing at the worst possible moment as conference play begins. MLB's spring training endpoint is also misfiring now that the regular season opened. Savant batting coverage is thin (25 batters) for mid-season D1.

---

## Priority Queue

### 1. Fix Conference Standings — Broken During Conference Season
**What:** Visitors filtering the standings page by conference (WAC, Big South, Independent, and likely others) see an error instead of team records.
**Why now:** 80 errors in the last 7 days — the #1 error source on the platform. Conference play is starting across D1 baseball right now, which is exactly when fans drill into conference-specific standings. This is broken at peak demand.
**Scope:** 1 session
**Verification:** Load `/college-baseball/standings?conference=wac`, `/college-baseball/standings?conference=big-south`, and `/college-baseball/standings?conference=independent` — each should show a populated standings table. Worker logs should show zero 502s on `GET /api/college-baseball/standings`.
**First step:** Reproduce the 502 by calling `GET /api/college-baseball/standings?conference=wac` directly and reading the handler code to find where the upstream call fails.

---

### 2. Retire Spring Training, Surface Opening Week MLB Scores
**What:** The MLB section shows live regular season games with correct standings instead of stale spring training errors.
**Why now:** MLB Opening Day was March 27. The spring training endpoint is still being called, logging 30 errors in 7 days. Fans landing on the MLB scores page during Opening Week deserve real games, not error states from a dead endpoint.
**Scope:** 1 session
**Verification:** Load `blazesportsintel.com/mlb/scores` and confirm it shows the current day's regular season games. Worker logs should show zero errors on `GET /api/mlb/spring-training/scores`. MLB standings should reflect real division records.
**First step:** Read the MLB spring training handler and the main MLB scores handler to understand whether spring training is a separate route or a mode flag, then redirect or disable it.

---

### 3. Deepen Savant Batting Coverage
**What:** The Savant leaderboard shows a full, meaningful ranking of qualifying batters — not just 25 — with accurate wOBA, wRC+, and percentile grades.
**Why now:** The leaderboard currently surfaces 25 batters, which makes it feel like a demo rather than a real analytical tool. College baseball is at mid-season with hundreds of batters who have accumulated enough plate appearances to qualify. The player directory just launched, and users who discover a player there have nowhere to go for deeper advanced stats.
**Scope:** 1 session
**Verification:** `GET /api/savant/batting/leaderboard` returns 100+ batters. The Savant page at `blazesportsintel.com/college-baseball/savant` shows a populated, filterable leaderboard with real percentile distributions.
**First step:** Check `bsi-savant-compute` cron output and the D1 query that feeds the leaderboard to determine if the 25-batter cap is from the PA threshold, a query `LIMIT`, or sparse compute coverage.

---

### 4. Wire the Conferences Page to Live Data
**What:** The college baseball conferences page displays real standings, records, and leaders for each conference — not a blank or static shell.
**Why now:** The `/college-baseball/conferences` route currently falls through to the static page (no Hono route registered), meaning the page has no live data backing. With conference play starting, this is the most natural destination for fans wanting to compare programs. CBB scores are the #1 traffic endpoint (15K requests/week) — the conferences section should capture that momentum.
**Scope:** 1 session
**Verification:** Load `blazesportsintel.com/college-baseball/conferences` and confirm each conference card shows current standings and at least one stat leader. `GET /api/college-baseball/conferences` returns valid JSON.
**First step:** Confirm the Hono route for `/api/college-baseball/conferences` is missing, then read the existing conferences page component to understand what data shape it expects.

---

### 5. Add Pitching Leaderboard to Savant
**What:** Visitors can explore an ERA–, FIP, and K/9 leaderboard for college pitchers alongside the existing batting leaderboard — giving BSI's analytical product a complete two-sided view of the game.
**Why now:** The `bsi-savant-compute` and `bsi-cbb-analytics` workers already compute FIP for pitchers, but there's no front-end surface for it. The batting Savant just got more visible via the player directory. Pitching is the natural next layer — especially in early conference play when aces are the story.
**Scope:** multi-session
**Verification:** `GET /api/savant/pitching/leaderboard` returns FIP, ERA–, and K/9 for qualifying starters. The Savant page at `blazesportsintel.com/college-baseball/savant` includes a toggle between Batting and Pitching views.
**First step:** Read `bsi-savant-compute` and `bsi-cbb-analytics` worker code to confirm what pitching metrics are already computed and stored in D1, then scope the leaderboard query.

---

## Signal Report

### Production Health
| Endpoint | Status | Detail |
|---|---|---|
| `/api/health` | OK | `{"status":"ok","mode":"hybrid-worker"}` |
| `/api/college-baseball/scores` | OK | Scheduled games for today returning (response key is `data`) |
| `/api/college-baseball/standings` | BROKEN | Base route returns data; **all conference-filtered requests 502** |
| `/api/mlb/scores` | OK | 15 games live |
| `/api/mlb/standings` | OK | 30 teams |
| `/api/nba/scores` | OK | 8 games |
| `/api/nba/standings` | OK | East + West conference objects |
| `/api/savant/batting/leaderboard` | THIN | 25 batters (low for mid-season D1) |
| `/api/scores/overview` | OK | All 5 sports present |
| `/api/college-baseball/teams` | MISSING | No Hono route — returns static HTML |
| `/api/college-baseball/conferences` | MISSING | No Hono route — returns static HTML |
| `/api/mlb/spring-training/scores` | STALE | 30 errors/week, season is over |

### Recent Ships (last 20 commits)
- **Player Discovery Engine** (3 commits) — searchable directory with sabermetric filtering and D1 position enrichment; fresh this week
- **Visual regression system** — build-verify agent, Playwright baselines, live scores accent color
- **10 UX design upgrades** — table headers, sticky scroll, sport differentiation, score badges, mobile reorder
- **Portfolio work** (8 commits) — Lighthouse 100, contact form hardening, chat widget, reading times, print styles

Pattern: heavy UI and portfolio investment over the past 2 weeks; backend and data coverage work paused. Player directory launched without a pitching data counterpart.

### Traffic Patterns (last 7 days, blazesportsintel-worker-prod)
| Route | Requests | Notes |
|---|---|---|
| Cron `*/1 * * * *` | 52,400 | KV cache warming — expected |
| `GET /api/college-baseball/scores` | 15,040 | #1 user-facing data route |
| `GET /api/status` | 11,790 | Monitoring |
| `/college-baseball/` page | ~9,360 | #1 page destination |
| `/scores/` page | ~8,140 | |
| `GET /api/intel/news` | 8,070 | Consistent demand |
| `/ask/` page | ~6,900 | AI chat getting real user traffic |

**Errors (7 days):**
- `GET /api/college-baseball/standings` — **80 errors**, all 502, all conference-filtered (`?conference=wac`, `?conference=big-south`, `?conference=independent`)
- `GET /api/mlb/spring-training/scores` — 30 errors (season over)
- `GET /api/status` — 20 errors (sporadic)
- `GET /api/mlb/the-show-26/cards/[id]` — 10 errors
- `GET /api/intel/news` — 10 errors

### Sports Calendar
| Sport | Status | Key Dates |
|---|---|---|
| **College Baseball** | PEAK — conference play starting | Regionals May, CWS mid-June |
| **MLB** | Opening Week (Day 4) | Regular season started Mar 27 |
| **NBA** | Late regular season | Playoffs begin mid-April |
| **NFL** | Offseason | Draft late April |
| **CFB** | Spring practices | Season Sep |
