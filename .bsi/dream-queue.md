# BSI Dream Queue

**Generated:** 2026-03-29T11:15:00.000Z
**Sports in season:** College Baseball (peak — conference play), MLB (Opening Day today), NBA (playoff push — final 2 weeks of regular season)
**Signal summary:** MLB launched its regular season today with 15 live games, but the MLB stats and leaderboard pages return zero data — fans see empty tables on the biggest day of the year. College baseball is the platform's dominant traffic driver (10,780 API calls/week, #1 endpoint) and is performing well on scores, but the standings endpoint threw 130 5xx errors over the past week. The last 15 of 20 commits were portfolio work — sports data features have been idle while the calendar is at its most urgent.

---

## Priority Queue

### 1. Fix MLB stats and leaderboards on Opening Day
**What:** Visitors to the MLB hub will see real batting and pitching leaders instead of a blank page — on the day they're most likely to check.
**Why now:** Today is Opening Day (15 games confirmed live). The `/api/mlb/leaderboards/batting` and `/api/mlb/stats/leaders` endpoints both return `unavailable: true` with zero data. Every fan landing on the MLB stats page right now sees nothing. Cloudflare logged 10 and 10 errors respectively on those routes over the past week — the failure predates today.
**Scope:** 1 session
**Verification:** Load `blazesportsintel.com/mlb/stats` and confirm batting and pitching leaders populate with at least 10 names and real season stats. Curl `/api/mlb/leaderboards/batting` and confirm `unavailable` is absent or false.
**First step:** Read the MLB leaderboards handler in `workers/handlers/` to find what API call is failing and why it sets `unavailable: true`.

---

### 2. Eliminate CBB standings 500 errors
**What:** The college baseball standings page loads reliably for every conference, without intermittent crashes.
**Why now:** Cloudflare logged 130 5xx errors on `/api/college-baseball/standings` over the past 7 days — the highest error count of any route on the platform. This is the peak of college baseball season and the standings page is the second thing fans check after scores. Conference-filtered queries (e.g. `?conference=SEC`) appear to trigger the crashes.
**Scope:** 1 session
**Verification:** Curl standings with at least 6 different conference values (SEC, ACC, Big 12, Big Ten, Pac-12, American) and confirm all return HTTP 200 with a non-empty `data` array. Run the full CBB gate: `npm run gate:cbb`.
**First step:** Reproduce the crash: curl `/api/college-baseball/standings?conference=` with an empty or invalid conference string, then read the standings handler to identify the unguarded code path.

---

### 3. Retire spring training content and redirect to regular season
**What:** The MLB spring training scores page sends fans to current Opening Day action instead of showing a dead endpoint.
**Why now:** Today is Opening Day — spring training ended last week. Cloudflare recorded 40 5xx errors on `/api/mlb/spring-training/scores` over the past week; the endpoint is becoming unreliable as the upstream source stops serving spring data. Fans following links to that page hit a broken experience on the most-watched day of the MLB calendar.
**Scope:** 1 session
**Verification:** Load `blazesportsintel.com/mlb/spring-training` and confirm it either redirects to `/mlb/scores` or displays a clear "Spring Training has ended — see Opening Day scores" message with a working link. Curl `/api/mlb/spring-training/scores` and confirm no 5xx response.
**First step:** Read `app/mlb/spring-training/page.tsx` and the spring training scores handler to decide whether to redirect, archive, or replace the route.

---

### 4. Build real CBB game detail pages
**What:** Fans clicking a college baseball game see a full in-game or post-game page — lineup, scoring by inning, and team stats — instead of a loading placeholder.
**Why now:** College baseball scores is the #1 API endpoint on the platform at 10,780 calls per week. Every click from that page lands on a dynamic placeholder shell that assembles itself via client-side JS from `window.location`. Peak CBB season runs through June; building real detail pages now multiplies the value of the platform's busiest traffic flow for the next three months.
**Scope:** multi-session
**Verification:** Click three games on `blazesportsintel.com/college-baseball/scores` — one scheduled, one live, one final — and confirm each game page shows inning-by-inning scoring, team records, and venue. No "loading…" shell on direct URL load.
**First step:** Read `app/college-baseball/games/page.tsx` and the game placeholder component, then fetch `/api/college-baseball/games/{a-real-game-id}` to confirm the data shape the detail page should render.

---

### 5. NBA playoff-race tracker before seeding locks
**What:** Fans see a live playoff picture with clinching scenarios, current seeds, and games remaining — timed to when the NBA race actually matters.
**Why now:** The NBA regular season ends in approximately 14 days and playoffs begin around April 19. The platform has working NBA scores (6 games today) and standings (30 teams). Building a seeding/clinching tracker now puts BSI in front of the coverage window before mainstream outlets flood the topic — which is the exact niche BSI is built for.
**Scope:** 1 session
**Verification:** Load `blazesportsintel.com/nba/standings` (or a new `/nba/playoff-race` page) and confirm it shows current seeds for both conferences, magic numbers or elimination numbers, and games remaining for bubble teams. Data should be live, not static.
**First step:** Curl `/api/nba/standings` to confirm the current data shape and check whether games-remaining and conference seed are already present in the response before planning what to build.

---

## Signal Report

### Production Health

| Endpoint | Status | Notes |
|----------|--------|-------|
| `/api/health` | ✅ OK | `mode: hybrid-worker` |
| `/api/college-baseball/scores` | ✅ 76 games | `data` key (not `games`) — UI handles both correctly |
| `/api/college-baseball/standings` | ✅ 138 teams (cached) | 130 5xx errors in past 7 days — conference queries intermittently fail |
| `/api/college-baseball/rankings` | ✅ 25 teams | Working |
| `/api/mlb/scores` | ✅ 15 games | Opening Day, sourced from ESPN |
| `/api/mlb/standings` | ✅ 30 teams | Working |
| `/api/mlb/leaderboards/batting` | ❌ `unavailable: true` | 0 batters returned, 10 5xx errors in 7 days |
| `/api/mlb/stats/leaders` | ❌ `unavailable` present | Degraded, 10 5xx errors in 7 days |
| `/api/mlb/spring-training/scores` | ⚠️ 200 but stale | 40 5xx errors in 7 days, season is over |
| `/api/savant/batting/leaderboard` | ✅ 25 batters | `tier: free` — paywall working as designed |
| `/api/scores/overview` | ✅ All 5 sports present | Working |
| `/api/intel/news` | ✅ 200 OK | 4th-highest traffic route |

### Recent Ships (last 20 commits)

15 of 20 commits are portfolio work (`austin-humphrey.com`). Sports-touching commits:
- `d2fefd5` — MLB + NFL page polish, contact/glossary/search/coverage design
- `ef10b65` — R2 heroBg on all sport pages, Heritage CSS additions
- `8dd224d` — R2 photography and Heritage craft across BSI ecosystem
- `ea7da9f` — Homepage two-column dashboard layout
- `16fe9a8` — Homepage meta property name fix

No data or handler work shipped in last 20 commits. College baseball feature development stalled entering peak season.

### Traffic Patterns (Cloudflare, last 7 days)

| Route | Requests |
|-------|----------|
| Cron `*/1 * * * *` | 49,210 |
| `GET /api/college-baseball/scores` | 10,780 |
| `GET /api/status` | 10,750 |
| `GET /images/brand/bsi-lettermark-square.png` | 8,980 |
| `HEAD /college-baseball/` | 8,530 |
| `GET /api/intel/news` | 7,980 |
| `HEAD /scores/` | 7,240 |
| `HEAD /` | 6,790 |

**5xx errors by route:**
- `/api/college-baseball/standings` — 130 errors (highest on platform)
- `/api/mlb/spring-training/scores` — 40 errors
- `/api/mlb/leaderboards/batting` — 10 errors
- `/api/mlb/stats/leaders` — 10 errors

### Sports Calendar

| Sport | Status | Key Date |
|-------|--------|----------|
| College Baseball | 🔴 Peak season — conference play underway | CWS: mid-June |
| MLB | 🔴 Opening Day — TODAY (March 29) | 15 games confirmed |
| NBA | 🟡 Final 2 weeks of regular season | Playoffs ~April 19 |
| NFL | ⚪ Offseason | Draft: late April |
| CFB | ⚪ Offseason | Spring games only |
