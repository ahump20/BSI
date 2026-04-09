# BSI Dream Queue

**Generated:** 2026-04-09T11:10:00Z
**Sports in season:** College Baseball (peak — Week 8-9 conference play, Weekend 9 starts tomorrow April 10), MLB (early regular season, 15 games today), NBA (final regular-season days, play-in April 15–16, playoffs April 18)
**Signal summary:** College baseball standings are still returning degraded conference W-L data — wrong numbers going into Weekend 9, the exact moment they shape the regional hosting bubble. The transfer portal dropped from 2 broken "Unknown" entries (yesterday) to 0 entries today — it got worse overnight. NBA play-in races are extremely tight in both conferences with 6 days to go; the page exists but has no play-in context yet.

---

## Priority Queue

### 1. Fix College Baseball Conference Standings
**What:** Visitors to the standings page see accurate conference win-loss records for all 138 programs — the real numbers that determine who hosts a regional and who is on the bubble.
**Why now:** The standings endpoint has been flagged `degraded: true` since at least yesterday, which means conference records are being estimated from ESPN win-percentage data rather than actual game results. Weekend 9 conference games start tomorrow (April 10) — standings shape who hosts regionals. Wrong numbers actively mislead anyone using this site to follow the D1 race at its most consequential stretch.
**Scope:** 1 session
**Verification:** `curl https://blazesportsintel.com/api/college-baseball/standings` returns `degraded: false` and conference records match known results (e.g. UCLA 18-0 in Big West conference play, matching the live standings page on ESPN).
**First step:** Read the standings handler and trace the Highlightly enrichment step to find exactly where `degraded: true` is being set — check the Highlightly response body and determine whether data is missing upstream or the merge logic is failing.

---

### 2. Restore the Transfer Portal
**What:** The transfer portal page shows real player movement — names, positions, and schools — instead of a completely empty table during peak spring transfer season.
**Why now:** The endpoint returned 0 entries today, down from 2 broken "Unknown" entries yesterday. It has gotten worse, not better. Spring portal season is active right now. Any visitor who clicks through to the portal page sees a blank table with no explanation.
**Scope:** 1 session
**Verification:** `curl https://blazesportsintel.com/api/college-baseball/transfer-portal` returns at least one entry with a real player name and school, or the page renders a clean "no verified transfers yet" empty state with an explanation — not a silent empty table.
**First step:** Read the transfer portal handler and check what the underlying data source is returning right now — determine whether the source is empty, the fetch is failing silently, or the parse logic is dropping all entries.

---

### 3. NBA Play-In Urgency Layer
**What:** The playoff picture page shows seeds 7–10 in both conferences grouped under a clear "Play-In Zone" label with games remaining and how close each team is to locking or losing a spot.
**Why now:** The NBA play-in starts April 15 (6 days). Both conferences have extremely tight races right now: Eastern 7–10 spans just 3 games (Orlando 44-36 to Miami 41-38); Western 7–10 spans 7 games (Phoenix 44-36 to Golden State 37-42). Traffic to NBA pages will spike sharply on April 15 and the page currently has no play-in context.
**Scope:** 1 session
**Verification:** At `blazesportsintel.com/nba/playoff-picture`, seeds 7–10 in both conferences are visually grouped under a "Play-In Zone" section showing each team's record, current seed, and games remaining.
**First step:** Read `app/nba/playoff-picture/page.tsx` to see what data is already fetched, then check whether the NBA standings API returns `gamesRemaining` or if it needs to be derived from the schedule endpoint.

---

### 4. College Baseball Weekend 9 Top 25 Spotlight
**What:** An editorial piece surfaces the must-watch matchups for this weekend — specifically the Top 25 clashes that will reshuffle the rankings and clarify the regional bubble before Friday's first pitch.
**Why now:** Weekend 9 conference games start tomorrow (April 10). Tonight's schedule already shows Georgia Tech (#3) hosting Florida State (#5), and Texas (#2) is in Big 12 play. The editorial cadence has been live with back-to-back Weekend 7 and 8 recaps; skipping this weekend while those matchups are on the board breaks the only content pipeline firing consistently at peak season.
**Scope:** 1 session
**Verification:** At `blazesportsintel.com/college-baseball/editorial`, a Weekend 9 entry is visible with at least three named matchups tied to real rankings and records from the current Top 25.
**First step:** Fetch `/api/college-baseball/scores` and `/api/college-baseball/rankings` to identify which of this weekend's games involve Top 25 teams on both sides, then build the editorial entry from real data.

---

### 5. Verify Team Logos on Tonight's Live Game Cards
**What:** Visitors watching tonight's 7 college baseball games see team logos rendering correctly on score cards — not broken images or fallback initials — confirming the TeamCircle integration holds up under live in-game conditions.
**Why now:** The TeamCircle component shipped in the last 3 commits but has only been exercised against scheduled/static data. Tonight's 7 games go live starting at 7:30 PM EDT — the first real in-game test at scale. A broken logo on every active score card during prime viewing hours undermines all the design work just shipped.
**Scope:** 1 session (verify and patch if needed — could be quick)
**Verification:** Open `blazesportsintel.com/college-baseball/scores` after 7:30 PM CT tonight and confirm team logos appear on active game cards; check browser console for any image 404s on Highlightly logo URLs.
**First step:** Audit the TeamCircle component's error/fallback logic to confirm it handles a missing or failed logo URL gracefully (shows initials, not a broken image icon), then spot-check a Highlightly logo URL from tonight's game data to confirm it resolves publicly.

---

## Signal Report

### Production Health
| Endpoint | Status | Notes |
|---|---|---|
| `/api/health` | OK | Hybrid-worker mode, v1.0.0 |
| `/api/college-baseball/scores` | OK | 7 games today, all scheduled for tonight |
| `/api/college-baseball/standings` | **DEGRADED** | 138 teams present, `degraded: true` — conference W-L estimated |
| `/api/college-baseball/transfer-portal` | **BROKEN** | 0 entries (was 2 broken "Unknown" entries yesterday) |
| `/api/college-baseball/rankings` | OK | Top 25 present, UCLA #1 at 29-2 |
| `/api/college-baseball/news` | OK | 6 articles |
| `/api/mlb/scores` | OK | 15 games |
| `/api/mlb/standings` | OK | 30 teams |
| `/api/nba/scores` | OK | 7 games |
| `/api/nba/standings` | OK | 30 teams across 2 conferences |
| `/api/savant/batting/leaderboard` | OK | 25 batters |
| `/api/scores/overview` | OK | All 5 sports present |

### Recent Ships (last 20 commits)
Nearly all 20 recent commits are design and logo work: Heritage token migration (finalizing v2.1 compliance), TeamCircle component shipped and wired into scores/standings/live game cards, security hardening. No new feature endpoints or pages shipped this cycle. The design system migration is wrapping up — the codebase is visually clean and ready for feature work.

### Traffic Patterns
Cloudflare analytics unavailable (MCP tools not accessible in this session).

### Sports Calendar
| Sport | Status | Key Dates |
|---|---|---|
| College Baseball | **Peak — Week 8-9 conference play** | Weekend 9 starts April 10; CWS mid-June |
| MLB | Early regular season | Full slate running |
| NBA | Final regular-season stretch | Play-in April 15–16; Playoffs April 18 |
| CFB | Deep offseason | Spring games complete |
| NFL | Offseason | Draft April 24–26 (15 days out — watch next cycle) |
