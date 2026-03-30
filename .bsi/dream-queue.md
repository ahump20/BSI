# BSI Dream Queue

**Generated:** 2026-03-30T11:15:00Z
**Sports in season:** College Baseball (peak), MLB (Opening Week), NBA (regular season — playoffs approaching)
**Signal summary:** College baseball is the undisputed traffic leader with 14,920 API calls in 7 days, but conference standings are degraded for all tested conferences — visitors filtering by SEC, WAC, or Big South see empty tables. Meanwhile MLB launched today with live scores but no stats layer. Two weeks of portfolio-focused commits left BSI sports product coasting on infrastructure.

---

## Priority Queue

### 1. College Baseball Conference Standings — Restore the Broken Filter
**What:** Visitors who click into a conference (SEC, Big Ten, WAC, Big South) see real standings with records and rankings instead of a blank table.
**Why now:** 70 server errors in the last 7 days, all from conference-filtered standings requests. The standings route gets 4,220 hits per week — the fifth-busiest API route on the site — and conference filtering is how most visitors actually use it. Peak mid-season window, conference races are heating up.
**Scope:** 1 session
**Verification:** Load `/college-baseball/standings` in a browser, filter to SEC — teams with win/loss records populate. Curl `/api/college-baseball/standings?conference=sec` returns non-empty `data` array with `degraded: false`.
**First step:** Read the standings worker handler and trace why conference-filtered requests return `reason: no-data-available` while the unfiltered endpoint returns 138 teams correctly.

---

### 2. MLB Opening Week — Wire the Stats Layer
**What:** Visitors on the MLB stats page see early-season batting and pitching leaders with real data from the first games of 2026, not a blank leaderboard.
**Why now:** Opening Day is today, March 30. The MLB scores endpoint is already live (12 games). But `/api/mlb/leaderboards/batting` is returning empty with `unavailable: true` and logged 20 errors last week. The first week of the season is the highest-engagement moment for MLB readers — capturing that audience now compounds for the whole season.
**Scope:** 1 session
**Verification:** Load `/mlb/stats` and confirm batting leaders populate with real names, teams, and stat lines. Curl `/api/mlb/leaderboards/batting` returns players with non-zero at-bats.
**First step:** Check what data source and cron backs the MLB batting leaderboard, confirm whether the season-start data is available from SportsDataIO, and trace why the endpoint marks itself unavailable.

---

### 3. Savant Leaderboard — Show More, Gate Less
**What:** Visitors on the Savant leaderboard see the top 50+ college baseball hitters by wOBA and wRC+ instead of a truncated list of 25 names with most stats hidden behind a paywall prompt.
**Why now:** The Savant batting leaderboard is the 6th busiest API route — 3,920 requests last week — and the conference-strength endpoint behind it gets another 2,230. These visitors came specifically for advanced analytics. The current free tier returns 25 players with `_tier_gated: true` on all of them. The data is computed and fresh (25 batters with wRC+ and wOBA calculated from D1). Showing the top 50 free, gating deeper filtering or export, would convert more browsers to subscribers.
**Scope:** 1 session
**Verification:** Load `/college-baseball/savant` without being logged in — at least 50 batters visible with real wOBA/wRC+ values, clear upgrade prompt for full access.
**First step:** Read the savant leaderboard handler and auth middleware to understand where the 25-row free-tier cap is set and what the gating logic controls.

---

### 4. Intel/News Feed — Recover from Portfolio Sprint
**What:** Visitors on the Intel and news pages see recently updated, sport-relevant articles and headlines rather than stale or missing content from weeks of neglected upkeep.
**Why now:** The intel/news endpoint is the 3rd busiest route on the site — 7,990 requests last week — and logged 10 errors. The last 8 of 12 commits were entirely portfolio work (austin-humphrey.com). The sports product coasted. With college baseball in peak season and MLB just launched, the gap between traffic and freshness is widest right now.
**Scope:** 1 session
**Verification:** Load `/intel` and confirm news items carry current dates within the last 48 hours. Curl `/api/intel/news` returns articles with `published_at` from this week.
**First step:** Curl `/api/intel/news` and inspect the response for article dates and sources — determine whether the issue is a stale cache, a failing external API, or missing editorial content.

---

### 5. Spring Training Endpoint — Retire It Before It Rots
**What:** Any page or component still referencing spring training scores gracefully redirects visitors to the regular-season scoreboard instead of hitting a broken endpoint.
**Why now:** `/api/mlb/spring-training/scores` logged 40 errors last week. Spring training ended and the regular season started today. Forty failures a week on a sunset endpoint is background noise that will only grow as MLB traffic climbs. Clean slate for Opening Week.
**Scope:** 1 session
**Verification:** A browser request to any spring training URL redirects to the MLB scores page with no console errors. Cloudflare error count for `GET /api/mlb/spring-training/scores` drops to zero within 24 hours.
**First step:** Find every route, link, and navigation item pointing to spring training in `app/mlb/` and `workers/handlers/`, then decide whether to redirect, remove, or repurpose the endpoint for historical reference.

---

## Signal Report

### Production Health
| Endpoint | Status |
|---|---|
| `/api/health` | ✅ OK |
| `/api/college-baseball/scores` | ✅ 2 games today (Mon), 82 Sat / 76 Sun — working |
| `/api/college-baseball/standings` (no filter) | ✅ 138 teams |
| `/api/college-baseball/standings?conference=*` | ❌ Degraded — empty data, all tested conferences |
| `/api/college-baseball/rankings` | ✅ 25 ranked teams |
| `/api/mlb/scores` | ✅ 12 games (Opening Day) |
| `/api/mlb/leaderboards/batting` | ❌ Empty — `unavailable: true` |
| `/api/mlb/spring-training/scores` | ❌ 40 errors/week |
| `/api/savant/batting/leaderboard` | ⚠️ 25 batters, all tier-gated |
| `/api/scores/overview` | ✅ All 5 sports present |
| `/api/nba/scores` | ✅ 9 games |

### Recent Ships (last 20 commits)
Strong portfolio/blaze-field sprint (8 of 12 commits). BSI sports product last touched: `bsi-cbb-ingest` (Mar 25), `bsi-cbb-analytics` (Mar 26), main worker deployed (Mar 28). Design polish to MLB/NFL pages in `d2fefd5`. Homepage dashboard layout in `ea7da9f`.

### Traffic Patterns
Top API routes, last 7 days (`blazesportsintel-worker-prod`):
1. `/api/college-baseball/scores` — 14,920 req
2. `/api/status` — 11,380 req
3. `/api/intel/news` — 7,990 req
4. `/api/health` — 7,630 req
5. `/api/college-baseball/standings` — 4,220 req
6. `/api/savant/batting/leaderboard` — 3,920 req
7. `/api/scores/overview` — 3,150 req
8. `/api/college-baseball/rankings` — 2,470 req
9. `/api/savant/conference-strength` — 2,230 req
10. `/api/nil/leaderboard` — 1,310 req

**Error hotspots:** CBB standings (70 errors) · MLB spring training (40) · MLB batting leaderboard (20) · Status endpoint (20) · Intel/news (10)

### Sports Calendar
- **College Baseball** — Peak mid-season. Conference races active. CWS June 13–24. Highest BSI traffic by a significant margin.
- **MLB** — Opening Day today (March 30). Scores live, stats layer missing at launch.
- **NBA** — Regular season, ~3 weeks to Play-In. Playoff positioning races underway.
- **NFL** — Offseason. Free agency underway, draft (April 23) approaching.
- **CFB** — Deep offseason. Spring practices beginning but no live data needed.
