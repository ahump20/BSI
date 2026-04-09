# BSI Dream Queue

**Generated:** 2026-04-09T13:30:00Z
**Sports in season:** College Baseball (peak — Weekend 9 conference play starts April 10), MLB (early regular season, 15 games today), NBA (final regular-season week, Play-In April 15–16, Playoffs April 18)
**Signal summary:** Two broken things this cycle. College baseball standings are still serving estimated conference records the day before Weekend 9 — the morning commit only clamped the numbers, the underlying source gap remains. New discovery: the college football scoreboard is serving 88 games from next season's August opener during offseason, which means the homepage live-scores widget is showing North Carolina at TCU on "8/29 — TBD" as if it were happening now. Meanwhile NBA play-in is six days out and Weekend 9 college baseball starts in eighteen hours.

---

## Priority Queue

### 1. Fix College Baseball Conference Standings Before Weekend 9
**What:** Visitors to the standings page see real conference win-loss records for all 138 Division I programs — the numbers that actually decide regional hosts and the bubble — not estimates derived from win percentage.
**Why now:** Still flagged degraded today, second day in a row. This morning's clamp fix only capped the estimated numbers so they can't exceed overall records — it did not replace the estimation with real conference results. Weekend 9 first pitch is tomorrow evening. Every conference game played Friday through Sunday will shift the host picture, and BSI is currently publishing wrong inputs to that conversation.
**Scope:** 1 session
**Verification:** The standings page no longer shows the "estimated" or "degraded" disclaimer, and the top of the SEC, ACC, and Big 12 match what a visitor can cross-check against ESPN's conference standings for the same morning.
**First step:** Trace where the standings endpoint decides conference records are unavailable and surface the actual upstream response — is the source returning conference W-L at all, or is it being dropped in transform? If upstream truly lacks it, switch to computing conference W-L from the schedule and box scores BSI already has.

---

### 2. Stop the Homepage From Showing Next-Season College Football Games
**What:** Visitors to the homepage and the overview scoreboard during college football offseason see an honest "Next game: August 29" state — not a list of 88 scheduled preseason openers labeled as today's activity.
**Why now:** The college football scoreboard is currently serving 88 cached games, all dated between August 29 and September 7, 2026 — the Week 0 and Week 1 openers of next season. The homepage overview pulls this feed and treats it as live. During offseason the correct count is zero games today, with a clear pointer to when the sport resumes. This is a silent data-integrity bug on the most-viewed surface.
**Scope:** 1 session
**Verification:** The overview scoreboard shows zero college football games for today's date; the college football section on the homepage shows an offseason state that names the next scheduled game and its date. The API response for today no longer contains games dated months in the future.
**First step:** Confirm the stale payload is coming from the cache warmer writing a full schedule into the "today" slot during offseason, then change the warmer so offseason dates write either an empty set or a compact "next game" marker instead of the full forward schedule.

---

### 3. Restore the College Baseball Transfer Portal
**What:** The transfer portal page shows real player movement with names, positions, and destination schools — or, if the upstream source has nothing today, a clean explanation of why the list is empty and when it last had entries.
**Why now:** The endpoint has been returning zero entries for two days in a row and still returns zero today. Spring portal activity is real in the outside world; an empty BSI page during peak spring transfer season looks broken. The response does now carry an `emptyReason` field, which is progress — the next step is making that reason visible on the page instead of a silent blank table.
**Scope:** 1 session
**Verification:** The transfer portal page either renders at least one real player entry, or renders a clearly-labeled empty state that surfaces the reason from the API response and the timestamp of the most recent entry BSI has ever stored for this source.
**First step:** Read the current empty-reason string the API is returning and decide whether the source is truly empty, silently rate-limited, or being parsed into nothing — then wire whichever answer applies into the page copy so visitors stop seeing a blank grid.

---

### 4. Weekend 9 Top 25 Spotlight (College Baseball Editorial)
**What:** A Weekend 9 preview lives in the college baseball editorial feed with the must-watch Top 25 matchups — real teams, real records, real rankings — going into Friday first pitch.
**Why now:** Weekend 9 starts tomorrow. Tonight's schedule already has Georgia Tech hosting Florida State and the Top 25 is packed with ranked-on-ranked conference series across the weekend. BSI has a live editorial cadence with Weekend 7 and Weekend 8 recaps already published; skipping Weekend 9 breaks the only content cadence firing consistently at peak season and lets the competitor narrative fill the vacuum.
**Scope:** 1 session
**Verification:** The college baseball editorial index shows a new Weekend 9 entry with at least three named matchups, each tied to real current rankings and records, dated today or tomorrow.
**First step:** Pull the current Top 25 and this weekend's conference schedule, identify every ranked-on-ranked matchup and every bubble series with regional implications, and draft the spotlight from those real inputs.

---

### 5. NBA Play-In Zone on the Playoff Picture
**What:** The NBA playoff picture page visibly groups seeds 7 through 10 in both conferences under a labeled "Play-In" section so visitors can see at a glance who is fighting to make the tournament and how tight the race is.
**Why now:** The NBA Play-In Tournament starts April 15 — six days out. Both conferences have extremely compressed 7–10 seed races right now. Traffic to NBA pages will spike the moment brackets are set, and the playoff picture page currently treats every seed equally, burying the actual story. Shipping this before the field is locked is what makes it useful; shipping it after is wallpaper.
**Scope:** 1 session
**Verification:** The playoff picture page in both Eastern and Western sections shows a distinct "Play-In" band covering seeds 7 through 10, each row showing the team's record and their current seed.
**First step:** Confirm whether the standings response already carries the games-behind numbers needed to reason about play-in tightness, and if not, compute those from the standings data already on the page before drawing the new visual grouping.

---

## Signal Report

### Production Health
| Endpoint | Status | Notes |
|---|---|---|
| `/api/health` | OK | hybrid-worker mode, v1.0.0, 200 |
| `/api/college-baseball/scores` | OK | 6 real games today via Highlightly (response uses `data` key, not `games`) |
| `/api/college-baseball/standings` | **DEGRADED** | 138 teams, 135 with estimated conference W-L, `degraded: true` — clamp fix this morning did not restore real data |
| `/api/college-baseball/rankings` | DEGRADED-flagged | Top 25 present with prior rankings, but meta carries `degraded: true` — investigate if tied to same source gap |
| `/api/college-baseball/news` | OK | 6 articles from ESPN |
| `/api/college-baseball/transfer-portal` | **BROKEN** | 0 entries (day 2), `emptyReason` field now present but not surfaced to UI |
| `/api/mlb/scores` | OK | 15 games from ESPN |
| `/api/mlb/standings` | OK | 30 teams |
| `/api/nba/scores` | OK | 7 games (final regular-season week) |
| `/api/nba/standings` | OK | 30 teams grouped by 2 conferences |
| `/api/cfb/scores` | **BROKEN (new)** | 88 games returned, all dated August 29 – September 7, 2026 (next season openers), served from cache |
| `/api/nfl/scores` | OK (offseason) | 1 game present, likely draft/spring event |
| `/api/savant/batting/leaderboard` | OK | 25 batters, cache hit |
| `/api/savant/pitching/leaderboard` | OK | 25 pitchers, fresh compute |
| `/api/scores/overview` | DEGRADED | Pulls the broken CFB payload into the all-sport rollup; 6/15/7/1/88 across college-baseball/mlb/nba/nfl/cfb |

### Recent Ships (last 20 commits)
Two threads dominate the last twenty commits. First, final cleanup of the Heritage v2.1 design migration — nine commits moving the last inline styles, colors, borders, fonts and background properties into Tailwind classes across the homepage and scores pages. Second, the team-logo rollout — the TeamCircle component was built and wired into scores cards, standings, and live-game surfaces across college baseball. Two commits shipped yesterday's dream queue outputs (standings clamp, dream queue regeneration). The design system migration is now effectively complete; feature work can resume without fighting the token system.

### Traffic Patterns
Cloudflare analytics unavailable in this session. No observability MCP tools accessible from the current environment.

### Sports Calendar
| Sport | Status | Key dates from today |
|---|---|---|
| College Baseball | **Peak — Week 9** | Weekend 9 first pitch tomorrow (April 10); CWS mid-June |
| MLB | Early regular season | Full slate daily |
| NBA | Final regular-season week | Play-In April 15–16 (6 days); Round 1 April 18 |
| NFL | Offseason | Draft April 24–26 (15 days — next cycle's concern) |
| CFB | Deep offseason | Next games August 29 (142 days away) — and the scoreboard needs to know that |
| NCAA Basketball | Offseason | Final Four ended April 6 |
