# BSI Dream Queue

**Generated:** 2026-03-27T11:11:00Z
**Sports in season:** College Baseball (PEAK — 62 games today), MLB (Opening Week), NBA (mid-season)
**Signal summary:** The KV caching layer has a TTL bug causing silent failures across standings, MLB stats, and spring training routes. Conference records are zeroed out for all 138 teams during peak conference play. MLB just opened but its stat leader pages are erroring. Recent engineering momentum has been entirely in design-system consolidation — the surface is clean, the data layer needs attention.

---

## Priority Queue

### 1. Fix the caching bug making standings and stats pages return errors
**What:** Visitors to the standings page and MLB stats leaderboards see real data instead of error states or blank tables.
**Why now:** Cloudflare logs show 30+ errors in 7 days on `/api/college-baseball/standings`, `/api/mlb/stats/leaders`, `/api/mlb/leaderboards/batting`, and `/api/mlb/spring-training/scores` — all traced to the same root cause: the worker is trying to cache responses with a 30-second TTL, but Cloudflare KV requires a minimum of 60 seconds. Every cache write fails silently, so every reader gets a broken response.
**Scope:** 1 session
**Verification:** `curl https://blazesportsintel.com/api/college-baseball/standings` returns non-empty data with no error field. Same for `/api/mlb/stats/leaders`. Cloudflare error count for these routes drops to zero.
**First step:** Search the worker codebase for KV `put` calls using `expiration_ttl: 30` (or any value under 60) and update them to 60.

---

### 2. Restore conference records in the college baseball standings
**What:** The standings page shows each team's actual conference record (wins, losses, win percentage) during the most competitive stretch of the regular season.
**Why now:** It is March 27 — mid-conference-play for every major program. The standings endpoint returns 138 teams but every single team shows a 0–0 conference record. The overall records are correct. This is the most-visited data page during conference season and it is displaying meaningless information where the most meaningful numbers should be.
**Scope:** 1 session
**Verification:** `curl https://blazesportsintel.com/api/college-baseball/standings` returns teams where `conferenceRecord.wins + conferenceRecord.losses > 0` for at least the top-ranked programs (USC is listed as 24–2 overall — their conference record should not be 0–0).
**First step:** Read the standings handler in the worker and trace where `conferenceRecord` is populated — the field exists in the schema but is not being written from the data source.

---

### 3. Fix MLB opening-week stat leader pages
**What:** The MLB stats leaders and batting leaderboard pages load with real data for the first week of the season.
**Why now:** MLB Opening Day was March 26 — the first full day of regular season baseball. Cloudflare logs show 30 errors on `/api/mlb/stats/leaders` and 20 on `/api/mlb/leaderboards/batting` in just 7 days. Fans checking early-season stat leaders are hitting broken pages at the exact moment those pages get peak annual traffic.
**Scope:** 1 session
**Verification:** `curl https://blazesportsintel.com/api/mlb/stats/leaders` returns a non-empty list of batters or pitchers. The MLB stats page at blazesportsintel.com/mlb/stats populates with leader data.
**First step:** Hit the endpoint directly and read the full error message to determine if this is the same KV TTL bug (fix #1 may resolve it) or a separate data-source issue.

---

### 4. Expand the Savant leaderboard beyond 25 players
**What:** The college baseball Savant leaderboard shows rankings for hundreds of qualified batters instead of stopping at 25.
**Why now:** The leaderboard is live and returning data, but only 25 batters appear. D1 college baseball has 300+ programs with thousands of qualified plate appearances by late March. The leaderboard is BSI's flagship differentiator — the stat that no mainstream outlet publishes — and it is currently showing less than 1% of qualified players. The recent recompute ran successfully (247 rows written per prior session) but the API tier filter is cutting the display too aggressively.
**Scope:** 1 session
**Verification:** `curl https://blazesportsintel.com/api/savant/batting/leaderboard` returns 100+ batters. The Savant page at blazesportsintel.com/college-baseball/savant shows a full leaderboard with paginated results.
**First step:** Read the leaderboard API handler and find the tier or limit filter that caps output at 25. Check whether it is a free-tier paywall filter or a hard result limit.

---

### 5. Fix the intel/news feed and grow college baseball editorial coverage
**What:** The news and intel feed populates with current college baseball stories instead of returning errors or showing only 6 stale articles.
**Why now:** Cloudflare logs show consistent errors on `/api/intel/news`. The college baseball news endpoint returns only 6 articles during the busiest week of the season (62 games on a single Friday). The editorial page for Arizona-2026 is already attracting organic traffic — readers are arriving and finding almost no surrounding content to explore.
**Scope:** 1 session
**Verification:** `curl https://blazesportsintel.com/api/intel/news` returns a non-error response with 10+ items. `curl https://blazesportsintel.com/api/college-baseball/news` returns 15+ articles with timestamps from the past 48 hours.
**First step:** Hit `/api/intel/news` directly and read the error to determine if this is a missing handler, a broken data-source connection, or a KV issue.

---

## Signal Report

### Production Health

| Endpoint | Status | Detail |
|---|---|---|
| `/api/health` | OK | Returns `{"status":"ok"}` |
| `/api/college-baseball/scores` | OK | 62 games today (scheduled, under `data` key) |
| `/api/mlb/scores` | OK | 11 games returning |
| `/api/college-baseball/standings` | DEGRADED | 138 teams but all `conferenceRecord: 0-0`; KV errors in logs |
| `/api/savant/batting/leaderboard` | PARTIAL | Returns 25 batters — too few for D1 season |
| `/api/scores/overview` | OK | All 5 sports present |
| `/api/college-baseball/rankings` | OK | 25 ranked teams |
| `/api/college-baseball/power-rankings` | OK | 24 teams |
| `/api/college-baseball/news` | THIN | Only 6 articles |
| `/api/intel/news` | ERRORING | Cloudflare logs: 10 errors in 7 days |
| `/api/mlb/stats/leaders` | ERRORING | 30 errors in 7 days |
| `/api/mlb/leaderboards/batting` | ERRORING | 20 errors in 7 days |
| `/api/mlb/spring-training/scores` | ERRORING | KV TTL bug confirmed: `expiration_ttl of 30` < required 60 |

### Recent Ships (last 20 commits)

All 20 recent commits are in the Heritage Design System migration and visual consolidation:
- `b6e65eb` — Labs absorbed into flagship site (charts, pages, shell)
- `f0b8edf` — 301 redirect: labs.blazesportsintel.com → main
- `f536355` — Savant: replaced marketing hero with data-first dashboard header
- `c683b7e` / `4195a66` — Nav restructure; app shell expanded to analytics + scores
- `6b678e1` / `cd9bed1` / `4eb47f8` — Heritage warmup across Savant, analytics, Card/Badge components
- `00cd929` / `16cb255` / `35b2af3` — Kill backdrop-filter; solid surfaces; Labs grid texture
- `d1bc05a` — Cache key versioning to bust stale responses
- `86fd823` — Free tier expanded (all players visible, performance_score gated)

**Pattern:** The last two weeks were entirely design/UX. The data layer has not been touched. This creates opportunity: the surfaces are now polished enough that data quality gaps are more visible.

### Traffic Patterns

From Cloudflare Observability (last 7 days, blazesportsintel-worker-prod):

**Top routes by volume:** Mostly static Next.js chunks and asset requests — organic API traffic is low but growing. The Arizona editorial page (`/college-baseball/editorial/arizona-2026/`) is getting 20 hits, suggesting editorial content drives return visits.

**Consistent error routes:**
- `/api/mlb/stats/leaders` — 30 errors
- `/api/college-baseball/standings` — 30 errors
- `/api/mlb/spring-training/scores` — 30 errors (KV TTL confirmed)
- `/api/mlb/leaderboards/batting` — 20 errors
- `/api/intel/news` — 10 errors
- `/api/college-football/articles` — 10 errors

**Root cause identified:** KV `put` calls with `expiration_ttl: 30` (below Cloudflare's 60s minimum) are failing silently, causing downstream reads to return errors.

### Sports Calendar

| Sport | Status | Notes |
|---|---|---|
| College Baseball | PEAK SEASON | 62 games today (March 27). Conference races heating up. CWS is ~12 weeks away. Most important window of year for BSI. |
| MLB | OPENING WEEK | Season began ~March 26. Fans checking early-season leaders, standings, stats. High-intent traffic window. |
| NBA | MID-SEASON | Regular season continues. Playoff picture forming. |
| NFL | OFFSEASON | Free agency / draft prep. Low game-day traffic. |
| CFB | OFFSEASON | Spring practice only. Low traffic. |
