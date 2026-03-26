# BSI Dream Queue

**Generated:** 2026-03-26T11:12:00Z
**Sports in season:** College Baseball (PEAK), NBA (playoffs approaching), MLB (Opening Day imminent), NBA Playoffs (April)
**Signal summary:** College baseball is the highest-traffic sport, but standings data is actively broken — all 138 teams show 0-0 conference records despite being deep into conference play. The internal health monitor has a missing secret and has been silently skipping its most important check 120 times this week. One mysterious high-traffic API route (14K hits in 7 days) is returning an HTML page instead of data.

---

## Priority Queue

### 1. Restore conference records in college baseball standings
**What:** The standings page shows real conference records (e.g., "4-2 in SEC") for every team instead of a blank 0-0 for all 138 programs — making it useful for fans following the conference race.
**Why now:** It's March 26, peak conference play, and every team on the standings page shows 0-0 in conference despite the enrichment fix that shipped last week. The standings endpoint is also logging errors in production. This is the most visible broken page during the most important part of the season.
**Scope:** 1 session
**Verification:** blazesportsintel.com/college-baseball/standings — any team that has played conference games shows a non-zero W-L record.
**First step:** Read the standings worker handler and trace why the Highlightly conference enrichment response isn't mapping to the standings output after the recent fix.

---

### 2. Fix the internal health monitor (missing admin credential)
**What:** The synthetic monitor runs its full D1 database freshness check every 5 minutes instead of silently skipping it — so stale data gets caught before visitors see it.
**Why now:** This has been failing 120 times per week. The monitor is logging "ADMIN_KEY not set — skipping D1 freshness check" on every single run. Data freshness is invisible to the status page and any alerting. Any silent data staleness goes undetected.
**Scope:** 1 session (minutes to fix)
**Verification:** Worker observability shows no more "ADMIN_KEY not set" errors from bsi-synthetic-monitor across a 1-hour window.
**First step:** Set the `ADMIN_KEY` secret on the `bsi-synthetic-monitor` worker via `wrangler secret put ADMIN_KEY --config workers/bsi-synthetic-monitor/wrangler.toml`.

---

### 3. Identify and handle the 14K-request mystery route
**What:** Whatever is hitting `/api/cbb/scores` 14,000 times per week gets real data back instead of an HTML page — and the source of those requests becomes known.
**Why now:** This is the single highest-traffic specific API route over the last 7 days, beating even the main college baseball scores endpoint. Every request is returning an HTML page instead of JSON. This is happening during March Madness. Whether it's the MCP server calling a wrong internal path, a stale client somewhere, or an unbuilt basketball endpoint, it needs to be resolved.
**Scope:** 1 session
**Verification:** `curl blazesportsintel.com/api/cbb/scores` returns JSON. Worker logs show no more requests hitting this path and returning HTML.
**First step:** Search the MCP server worker code and Hono route definitions to find who is calling `/api/cbb/scores` and whether it should resolve to a basketball scores handler or redirect to the college baseball endpoint.

---

### 4. Fix the advanced stats recompute (analytics cron errors)
**What:** The Savant leaderboard shows wOBA, FIP, and wRC+ for all D1 batters and pitchers — not just the 25 currently appearing — and those numbers refresh every 6 hours as designed.
**Why now:** The 6-hour analytics cron has been throwing 60 errors over the past 7 days. The leaderboard currently shows only 25 batters and 25 pitchers; previously it computed 247 batters. Most of the advanced stats content is effectively missing during the heart of the college baseball season.
**Scope:** 1 session
**Verification:** blazesportsintel.com/college-baseball/savant shows well more than 25 rows on both the batting and pitching leaderboard tabs. Worker logs show clean runs from the 6-hour cron.
**First step:** Pull the actual error messages from the `0 */6 * * *` cron worker events in Cloudflare Observability and trace what's failing in the analytics pipeline.

---

### 5. Prepare MLB for Opening Day
**What:** Visitors to the MLB section see live scores, standings, and a working stats leaderboard the moment the regular season begins — no broken endpoints or empty tables.
**Why now:** Opening Day is imminent. Right now, the MLB stats leaders and batting leaderboard endpoints are returning errors in production. Spring training ends and fans will arrive expecting real season data. The page needs to be ready before the first pitch.
**Scope:** 1 session
**Verification:** blazesportsintel.com/mlb/scores loads with real game data on Opening Day. blazesportsintel.com/mlb/standings shows all 30 teams with records. The stats leaders page shows real season stats.
**First step:** Check the SportsDataIO endpoint configuration for MLB stats leaders to confirm whether it needs a different route path for the regular season vs. the spring training data feed currently erroring.

---

## Signal Report

### Production Health
| Endpoint | Status | Notes |
|---|---|---|
| `/api/health` | OK | Worker running, hybrid mode |
| `/api/college-baseball/scores` | Working | 4 games today, 30 yesterday — data is real |
| `/api/college-baseball/standings` | Broken | 138/138 teams show 0-0 conference records |
| `/api/college-baseball/rankings` | Working | 25 teams ranked |
| `/api/college-baseball/news` | Thin | Only 6 articles returning |
| `/api/savant/batting/leaderboard` | Degraded | 25 batters (was 247); cron errors upstream |
| `/api/savant/pitching/leaderboard` | Degraded | 25 pitchers |
| `/api/mlb/scores` | Working | 1 spring training game |
| `/api/mlb/standings` | Working | 30 teams |
| `/api/mlb/stats/leaders` | Broken | Returns `unavailable: true` |
| `/api/mlb/spring-training/scores` | Working | 1 game |
| `/api/nba/scores` | Working | 12 games |
| `/api/cbb/scores` | Broken | Returns HTML instead of JSON |
| `bsi-synthetic-monitor` cron | Broken | ADMIN_KEY missing, D1 check skipped every run |
| `0 */6 * * *` analytics cron | Degraded | 60 errors this week |

### Recent Ships (last 20 commits)
- **Standings enrichment** — conference records fix shipped but not working in production
- **Savant expansion** — expected stats (xBA, xSLG, xwOBA) surfaced for all visitors; league context added
- **HAV-F** — live scouting grades wired into methodology page
- **Navigation fix** — hydration mismatch on placeholder routes resolved
- **Data pipeline** — HAV-F column mismatch and MMI table constraint fixed
- **Homepage** — BSI Ask made the front door; ScrollReveal ghosting fixed
- **SEO** — breadcrumb structured data, conference layout polish

Recent pattern: heavy sweep/fix cycle across standings, savant, tools, nav, and trust signals. The team has been in repair mode. The standings fix is the most urgent outstanding item.

### Traffic Patterns (Last 7 Days via Cloudflare)
| Route | Requests | Note |
|---|---|---|
| `bsi-error-tracker` | 514,950 | Tail consumer processing all worker errors |
| `*/1 * * * *` cron | 40,960 | Main worker cache warming (healthy) |
| `GET /api/cbb/scores` | 14,180 | **Returns HTML — needs investigation** |
| `POST /api/blazecraft/events` | 11,230 | Blazecraft product gaining traction |
| `GET /api/college-baseball/scores` | 10,320 | Top real data endpoint |
| `GET /api/status` | 7,040 | High status page traffic |
| `GET /api/intel/news` | 6,160 | News feed active |
| `GET /api/mlb/scores` | 5,390 | MLB spring training interest |
| `GET /api/hero-scores` | 5,150 | Homepage scores widget healthy |
| `HEAD /college-baseball/` | 5,020 | CBB section heavily crawled |

**Error sources this week:** `bsi-synthetic-monitor` (ADMIN_KEY, 120 errors), analytics 6h cron (60 errors), MLB stats leaders (30 errors), MLB spring training scores (30 errors), MLB batting leaderboard (20 errors), college baseball standings (10 errors).

### Sports Calendar
| Sport | Status | Key Event |
|---|---|---|
| **College Baseball** | PEAK SEASON | Conference play underway; CWS mid-June |
| **NBA** | Late regular season | Playoffs begin April — standings race active |
| **MLB** | Spring Training ending | **Opening Day imminent (first week of April)** |
| **NCAA Basketball** | Tournament | March Madness Final Four/Championship |
| **CFB** | Offseason | Spring practice, no games |
| **NFL** | Offseason | Free agency, no games |
