# BSI Dream Queue

**Generated:** 2026-03-28T11:10:00Z
**Sports in season:** College Baseball (peak — 82 games today), College Basketball (March Madness Final Four in ~7 days), MLB (Opening Day weekend), NBA (playoff push)
**Signal summary:** The highest-traffic data endpoint on the site — CBB scores at 12,520 requests/week — is returning zero results during March Madness. College baseball standings show 0-0 conference records for all 138 teams despite six weeks of games. MLB stats and leaderboards are unavailable exactly as Opening Day begins. All three failures trace to broken data-source connections while attention has been on portfolio work.

---

## Priority Queue

### 1. Restore college basketball scores for March Madness
**What:** Visitors to any CBB scores page see real game data — live scores, final results, tournament matchups — instead of an empty feed.
**Why now:** `/api/cbb/scores` is the highest-traffic data endpoint on the site at 12,520 requests this week and it has returned zero results all week with `source: "error"`. The Final Four is approximately one week away. A `bsi-cbb-ingest` worker was updated three days ago, suggesting the data pipeline exists but the connection between it and the scores handler is broken. This is the single worst active failure on the site.
**Scope:** 1 session
**Verification:** `curl https://blazesportsintel.com/api/cbb/scores` returns games with real team names and scores. At least one in-progress or final tournament game appears.
**First step:** Read the `bsi-cbb-ingest` worker source and `workers/handlers/cbb.ts` to find where SportsDataIO and the ESPN fallback are both failing — then check whether KV has data the handler isn't reading.

---

### 2. Fix college baseball standings — conference records are 0-0 for every team
**What:** The standings page shows each team's real conference record alongside their overall record, not 0-0 across the board.
**Why now:** This is the #1 erroring route (70 errors/week) and the endpoint carries `degraded: true`. It's March 28 — six weeks into the season — yet all 138 teams in the response carry a 0-0 conference record. Anyone checking where their team stands in the SEC, ACC, or Big 12 sees no meaningful data. College baseball is at peak traffic with 12,270 requests/week on the scores route alone.
**Scope:** 1 session
**Verification:** `curl https://blazesportsintel.com/api/college-baseball/standings` returns teams where `conferenceRecord.wins` and `conferenceRecord.losses` reflect actual games played. USC (25-2 overall) should show a non-zero conference record. The `degraded` flag should be absent.
**First step:** Read the college baseball standings handler and trace where `conferenceRecord` is sourced — the yesterday session added Highlightly enrichment but the field is still zeroed, so the enrichment path is not executing.

---

### 3. Restore MLB stats and batting leaderboards for Opening Day
**What:** The MLB stats and leaderboards pages show real 2026 season leaders in batting average, home runs, ERA, and other categories instead of empty tables.
**Why now:** `/api/mlb/stats/leaders` and `/api/mlb/leaderboards/batting` both return `unavailable: true` with 50 combined errors this week. Opening Day is this weekend — the exact moment people check who is leading the league. This is the highest-impact missed opportunity for MLB coverage at its seasonal peak.
**Scope:** 1 session
**Verification:** `curl https://blazesportsintel.com/api/mlb/stats/leaders` returns a non-empty `leaders` array with at least 10 players and real stat values. Same for `/api/mlb/leaderboards/batting`.
**First step:** Read the MLB stats handler and check if the SportsDataIO season parameter or endpoint path changed for the 2026 season — that is the most likely cause of `unavailable: true`.

---

### 4. Build a college basketball landing page before the Final Four
**What:** BSI has a college basketball page showing today's scores and standings — live, not placeholder.
**Why now:** `/api/cbb/scores` pulls 12,520 requests/week with no page to send visitors to — traffic is landing in a void. The `cbb.ts` handler and `bsi-cbb-ingest` worker both exist. Once item #1 restores the data, the full infrastructure for a CBB page is in place. The Final Four is the last major college basketball moment of the season and it arrives in ~7 days.
**Scope:** 1 session
**Verification:** `blazesportsintel.com/college-basketball/` loads with real scores and standings from the CBB endpoint. No empty states, no placeholder content.
**First step:** Check `workers/handlers/cbb.ts` for all available routes (scores, standings, rankings), then scaffold `app/college-basketball/page.tsx` wired to those endpoints using Heritage Design System v2.1.

---

### 5. Expand the Savant leaderboard from 25 batters to full D1 coverage
**What:** The Savant advanced stats leaderboard shows hundreds of qualified D1 batters ranked by wOBA, wRC+, and other metrics instead of capping at 25.
**Why now:** The savant endpoint is working and returning data, but only 25 batters appear for a sport with 300+ D1 programs. Peak season is now — coaches, scouts, and fans use this leaderboard to track talent. The `bsi-savant-compute` cron runs every 6 hours and its last run was successful. This is a depth problem, not a breakage — but it limits what is BSI's most differentiated product during its most important window.
**Scope:** 1 session
**Verification:** `curl https://blazesportsintel.com/api/savant/batting/leaderboard` returns 150+ batters. The Savant page at `blazesportsintel.com/college-baseball/savant/` shows a full leaderboard scrollable beyond 25 rows.
**First step:** Read the `bsi-savant-compute` worker's D1 query — determine whether the 25-batter cap is a `LIMIT` clause, a minimum plate appearances filter too aggressive for early season, or a data ingestion scope issue.

---

## Signal Report

### Production Health
| Endpoint | Status | Detail |
|----------|--------|--------|
| `/api/health` | OK | `{"status":"ok","mode":"hybrid-worker"}` |
| `/api/college-baseball/scores` | OK | 82 games (12 final, 69 scheduled, 1 canceled) in `data[]` |
| `/api/cbb/scores` | **BROKEN** | 0 games, `source: "error"` — SportsDataIO + ESPN both failing |
| `/api/college-baseball/standings` | **DEGRADED** | 138 teams, all 0-0 conference records, `degraded: true` |
| `/api/college-baseball/rankings` | Degraded | 25 teams ranked, `degraded: true` |
| `/api/mlb/scores` | OK | 8 games |
| `/api/mlb/standings` | OK | 30 teams across divisions |
| `/api/mlb/spring-training/scores` | OK | 8 final games |
| `/api/mlb/stats/leaders` | **BROKEN** | `unavailable: true`, empty leaders array |
| `/api/mlb/leaderboards/batting` | **BROKEN** | `unavailable: true`, empty data array |
| `/api/nba/scores` | OK | 10 games |
| `/api/nba/standings` | OK | Eastern + Western conference |
| `/api/savant/batting/leaderboard` | Partial | 25 batters (low D1 coverage) |
| `/api/intel/news` | OK | 6 articles |
| `/api/scores/overview` | OK | All 5 sports present |

### Recent Ships (last 20 commits)
- **Last 10 commits** (Mar 24–28): Portfolio site work — chat widget, print stylesheet, photo documentary redesign, keyboard nav, structured data, scroll animations
- **Before that** (Mar 21–24): Sports polish — MLB + NFL page design, R2 hero backgrounds across sport pages, Heritage CSS additions
- **Before that** (Mar 19–21): Homepage rebuilt as live data dashboard with leaderboards and nav grid
- **Pattern:** Engineering focus has been entirely on portfolio for ~5 days. Worker-level data handler fixes have not shipped since the standings Highlightly enrichment (yesterday), and that fix is not yet showing results in production.

### Traffic Patterns (last 7 days — blazesportsintel-worker-prod)
| Route | Requests |
|-------|----------|
| `*/1 * * * *` (scheduled cron) | 53,020 |
| `GET /api/cbb/scores` | 12,520 |
| `GET /api/college-baseball/scores` | 12,270 |
| `GET /api/status` | 10,580 |
| `GET /api/intel/news` | 8,890 |
| Static assets / Pages proxy | ~6,000–8,000 each |

**Error leaders (last 7 days):**
| Route | Errors |
|-------|--------|
| `GET /api/college-baseball/standings` | 70 |
| `GET /api/mlb/stats/leaders` | 30 |
| `GET /api/mlb/spring-training/scores` | 30 |
| `GET /api/mlb/leaderboards/batting` | 20 |

### Sports Calendar
| Sport | Status | Notes |
|-------|--------|-------|
| College Baseball | **Peak season** | 82 games today, CWS in June |
| College Basketball | **Peak season** | NCAA Tournament, Final Four ~April 4–6 |
| MLB | **Opening Day** | Regular season starts this week, spring training final games March 28 |
| NBA | In season | Playoff push, postseason begins mid-April |
| NFL | Offseason | — |
| CFB | Offseason | Spring practices |
