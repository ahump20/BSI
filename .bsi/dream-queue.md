# BSI Dream Queue

**Generated:** 2026-04-01T11:15:00Z
**Sports in season:** College Baseball (PEAK — conference play underway), MLB (Opening Day/Week), NBA (final weeks, playoffs mid-April), NFL (offseason/pre-draft)
**Signal summary:** College baseball conference records are broken platform-wide — all 138 teams show 0-0 in conference play despite it being week 7-8 of the season, making the standings page misleading for every visitor. MLB Opening Day just happened with real scores flowing, but the NBA playoff push in two weeks is the next major content opportunity. The player directory shipped Monday and is live — the next layer is pitching data to complete the analytical two-sided view.

---

## Priority Queue

### 1. Fix College Baseball Conference Records — Showing 0-0 for Every Team
**What:** The standings page shows real win-loss records for every team, including how they're performing in conference play — the number that actually determines postseason seeding.
**Why now:** Every single team on the standings page shows 0-0 in conference play even though conference games have been played since mid-March. Fans using standings to track SEC, ACC, Big 12, or any other conference race see nothing useful — the most critical number in baseball standings is missing. This is broken at peak demand.
**Scope:** 1 session
**Verification:** Load `blazesportsintel.com/college-baseball/standings`, filter by any conference (ACC, SEC, Big 12) — teams should show real conference W-L records like "3-0" or "2-1". `GET /api/college-baseball/standings?conference=ACC` should return non-zero `conferenceRecord` values for ranked programs like North Carolina (currently 25-4 overall but showing 0-0 conf).
**First step:** Read the standings handler at `workers/handlers/college-baseball/standings.ts` lines 70–175 where Highlightly enrichment runs, then call the raw Highlightly standings endpoint to determine if it's returning conference W-L data.

---

### 2. NBA Playoffs Countdown — Build the Hub Before the Bracket Locks
**What:** The NBA section has a dedicated playoff hub showing current standings, projected bracket, and in-season stats for likely playoff teams — so fans can follow the race in the final two weeks before seeding locks.
**Why now:** NBA playoffs start mid-April (approximately 2 weeks). Right now the NBA section has scores and standings but no playoff-specific surface. The standings show Detroit as #1 in the East at 55-21 — this is the bracket race fans care about. BSI has the endpoint data (`/api/nba/standings`, `/api/nba/scores`) ready to power it.
**Scope:** 1 session
**Verification:** A page at `blazesportsintel.com/nba/playoffs` loads and shows the current 8-seed picture for both conferences using live standings data. No placeholder text, no empty states — real team records and seeding.
**First step:** Read `app/nba/page.tsx` and `app/nba/standings/page.tsx` to understand the existing data patterns and page structure, then design the playoff bracket layout using Heritage v2.1 tokens.

---

### 3. Savant Leaderboard — Dynamic Early-Season PA Threshold
**What:** The Savant batting leaderboard shows 100+ players instead of 25, automatically calibrated so that early in the season more batters qualify and fans see a meaningful ranking — not a near-empty leaderboard.
**Why now:** At the current default threshold (25 PA), only 25 batters qualify in week 7-8 of the season, making BSI's flagship analytical tool feel empty. Lowering to 10 PA expands coverage to 100 batters — same real data, more useful surface. The player directory just launched and links to Savant, so this thin leaderboard is now the visible destination for new player discovery users.
**Scope:** 1 session
**Verification:** `GET /api/savant/batting/leaderboard` returns 75+ batters with no query params (default). The Savant leaderboard page shows a populated table with players from multiple conferences. The PA filter UI allows manual adjustment.
**First step:** Read `workers/handlers/college-baseball/savant.ts` to find where `minPA` defaults are set, then check D1 for how many players have ≥10 vs ≥25 PA in the current dataset.

---

### 4. MLB Opening Week — Add Starting Pitchers and Line Score to Scores Page
**What:** The MLB scores page shows who's pitching each game alongside the line score (inning-by-inning runs), giving fans the depth they expect during Opening Week — not just a final score.
**Why now:** Opening Day just happened (March 31). 14 real MLB games are flowing through the scores endpoint but the data is ESPN-format with `featuredAthletes` (winning pitcher, etc.) already returned. Opening Week is the highest-traffic MLB moment of the year. The CBB scores page already shows richer game state — MLB should match it.
**Scope:** 1 session
**Verification:** Load `blazesportsintel.com/mlb/scores` — each game card shows the starting pitcher's name or W/L pitcher for finished games, and completed games show an inning summary (or at minimum the final runs). No blank pitcher fields.
**First step:** Read `app/mlb/scores/page.tsx` and the MLB scores handler to map which `featuredAthletes` fields are already in the response vs. what the UI is currently rendering.

---

### 5. Pitching Leaderboard — Complete the Savant Two-Sided View
**What:** Visitors can explore ERA–, FIP, and strikeout rate rankings for college pitchers alongside the existing batting leaderboard, making BSI's analytics section a complete two-sided analytical product.
**Why now:** The player directory launched Monday and surfaces batters with wOBA and wRC+. Coaches and scouts who discover a pitcher through the site hit a dead end — there's no analytical surface for arms. The `bsi-cbb-analytics` worker already computes FIP. Conference aces are the story in early April.
**Scope:** multi-session
**Verification:** `GET /api/savant/pitching/leaderboard` returns qualified starters with FIP, ERA–, and K/9. The Savant page at `blazesportsintel.com/college-baseball/savant` includes a toggle between Batting and Pitching views with data populating both.
**First step:** Read `bsi-cbb-analytics` worker and query the `bsi-analytics-db` D1 to confirm which pitching metrics (FIP, ERA, K, BB, IP) are already computed and stored — then scope the leaderboard endpoint.

---

## Signal Report

### Production Health
| Endpoint | Status | Detail |
|---|---|---|
| `/api/health` | OK | `{"status":"ok","mode":"hybrid-worker"}` |
| `/api/college-baseball/scores` | OK | 13 games today (response key: `data`, not `games`) |
| `/api/college-baseball/standings` | BROKEN | 138 teams return; **all show `conferenceRecord: {wins:0, losses:0, pct:0}`** |
| `/api/college-baseball/standings?conference=ACC` | BROKEN | 16 ACC teams return; North Carolina 25-4 overall but 0-0 conference |
| `/api/mlb/scores` | OK | 14 Opening Day/Week games, real scores |
| `/api/mlb/standings` | OK | 30 teams, real records |
| `/api/nba/scores` | OK | 7 games |
| `/api/nba/standings` | OK | East + West conference objects present |
| `/api/savant/batting/leaderboard` | THIN | 25 batters default (minPA=25); 100 available at minPA=10 |
| `/api/scores/overview` | OK | All 5 sports present (college-baseball, mlb, nfl, nba, cfb) |
| `/api/nfl/players` | OK | Live player data flowing |
| `/api/players` (cross-sport) | MISSING | No route — falls through to static HTML |

### Recent Ships (last 20 commits)
| Commit | What shipped |
|---|---|
| `96e33b2` | Player directory added to nav + homepage; position data enriched from D1 |
| `2126bdc` | Homepage empty/error states for leaderboard and standout cards |
| `91286eb` | Savant default min PA set to 25, position display cleaned |
| `a20f5a5` | Player Discovery Engine — searchable directory with advanced metrics |
| `a35b8f26` | Visual regression baselines, build-verify agent |
| `310a770` | 10 design upgrades (table headers, sticky scroll, score badges, mobile) |
| `2fbd31c`–`23abbc8` | 8 portfolio commits — Lighthouse 100, contact form, chat widget, print styles |
| `d2fefd5` | MLB + NFL page design polish |

**Pattern:** Heavy UI polish and portfolio work over the past 2 weeks. Player directory just launched. Backend data work (conference records, pitching metrics) is the gap.

### Traffic Patterns
Cloudflare analytics unavailable via MCP tools. Based on prior queue data:
- `GET /api/college-baseball/scores` — #1 user-facing data route (~15K req/week)
- `/college-baseball/` — #1 page destination
- `/ask/` — consistent AI chat traffic (~6.9K req/week)

### Sports Calendar
| Sport | Status | Key Dates |
|---|---|---|
| **College Baseball** | PEAK — conference play underway (week 7-8) | Regionals late May, CWS mid-June |
| **MLB** | Opening Week (Day 2) | Season started March 31; full schedule through October |
| **NBA** | Final stretch, race to 8 seeds | Playoffs begin ~April 15 |
| **NFL** | Offseason | Draft late April; training camp July |
| **CFB** | Spring practices | Season September |
