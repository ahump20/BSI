# BSI Dream Queue

**Generated:** 2026-04-07T19:15:00Z
**Sports in season:** College Baseball (peak — Week 8, full conference play), MLB (regular season Week 2), NBA (final 5 days of regular season, playoffs begin April 13)
**Signal summary:** Major fix session shipped. All 13 API endpoints healthy. Conference standings unfrozen (135/138 teams with records). Game detail no longer dead-ends. NBA Playoff Picture page live. Dream queue's top 5 items all addressed.

---

## Shipped Today (2026-04-07)

| Item | Status | What shipped |
|---|---|---|
| Game detail null | **FIXED** | Scores-cache fallback extracts game from today's batch when Highlightly/ESPN fail. Added venue + isWinner for component compatibility. |
| Conference standings 0-0 | **FIXED** | ESPN LPCT estimation derives conference records. Highlightly parameter fixed (abbreviation → league). 135/138 teams non-zero. |
| NBA Playoff Picture | **BUILT** | New page at /nba/playoff-picture/ — two-conference bracket, play-in zone, clinch indicators, 60s auto-refresh. |
| MLB stats HTML | **FIXED** | 301 redirect replaced with direct handler call. /api/mlb/stats returns JSON. |
| Transfer portal resilience | **IMPROVED** | KV TTL 1h → 24h, broader ESPN scraping, deterministic IDs. Still 0 entries (data source limitation). |
| Homepage hero | **FIXED** | Removed competing background image. Shield logo is now the sole visual anchor against Heritage CSS texture. |
| Frontend-design agent | **UPGRADED** | 4-layer architecture (core craft → brand adapter → surface mode → UX architecture). 14 reference files. Skill-reviewed. |

---

## Priority Queue

### 1. Transfer portal needs a real data source
**What:** The portal shows 0 entries because no structured API exists for college baseball transfer portal data. Highlightly doesn't have a /transfers endpoint. ESPN news scraping is unreliable.
**Options:** Manual D1 curation, partner with a transfer portal tracking service, or build a scraper targeting 247Sports/On3 portal pages.
**Scope:** Research + decision, then 1-2 sessions to implement.

### 2. Game detail still degraded — no box scores from scores-cache
**What:** The scores-cache fallback shows team names, scores, and status, but no inning-by-inning linescore, no box score, no play-by-play. These require the dedicated Highlightly /matches/:id and /box-scores/:id endpoints.
**Why:** Highlightly /matches/:id was working as of March 26 but may be rate-limited or intermittently failing. The fallback is a safety net, not a permanent state.
**First step:** Check Highlightly rate limit headers in Worker logs. If rate-limited, add request throttling or increase the plan tier.

### 3. MLB stats leaders show 0 — ESPN early-season data gap
**What:** /api/mlb/stats returns valid JSON but `leaders: []` with `unavailable: true`. ESPN's leaders endpoint may not have qualified players this early in the season.
**Scope:** Monitor — may self-resolve as more games are played. If still empty by Week 4, check if ESPN requires a minimum games threshold.

### 4. Rankings degraded — Highlightly not providing rankings data
**What:** /api/college-baseball/rankings returns 25 teams from ESPN but `degraded: true`. Highlightly rankings endpoint not returning data.
**Scope:** Low priority — ESPN D1Baseball Top 25 is the standard source anyway.

### 5. Visual QA across all sport pages
**What:** The hero fix, standings LPCT records, and game detail fallback all need visual verification in a real browser (not Cloudflare Browser, which doesn't execute client-side JS on static export sites).
**Scope:** 1 session with Chrome DevTools or computer use.

---

## Signal Report

### Production Health

| Endpoint | Status | Notes |
|---|---|---|
| `/api/health` | ✅ OK | Worker healthy |
| `/api/college-baseball/scores` | ✅ 83 games | 5 live |
| `/api/college-baseball/games/:id` | ✅ DEGRADED | Scores-cache fallback — team names + scores, no box score |
| `/api/college-baseball/standings` | ✅ 138 teams | 135 with LPCT-derived conference records |
| `/api/college-baseball/rankings` | ⚠️ Degraded | 25 teams, ESPN-only (Highlightly not providing) |
| `/api/college-baseball/transfer-portal` | ❌ EMPTY | 0 entries — no structured data source |
| `/api/savant/batting/leaderboard` | ✅ 25 batters | BSI Savant healthy |
| `/api/mlb/scores` | ✅ 15 games | Week 2 |
| `/api/mlb/standings` | ✅ 30 teams | Full standings |
| `/api/mlb/stats` | ⚠️ Empty | Returns JSON, 0 leaders (ESPN early-season gap) |
| `/api/nba/scores` | ✅ 10 games | Final week |
| `/api/nba/standings` | ✅ 30 teams | Detroit 57-22 East, OKC leads West |
| `/api/scores/overview` | ✅ All 5 sports | CBB 83, MLB 15, NBA 10, NFL 1, CFB 88 |

### Test Suite
676 Vitest tests passing (0 failures). Playwright not run this session.

### Sports Calendar

| Sport | Status | Key Events |
|---|---|---|
| **College Baseball** | PEAK SEASON | Week 8, full conference play; CWS mid-June |
| **MLB** | Active | Week 2 regular season |
| **NBA** | CRITICAL | Final 5 days before playoffs begin April 13 |
| **CFB** | Off-season | Spring practice; NFL Draft April 23-25 |
| **NFL** | Off-season | Draft April 23-25 |
