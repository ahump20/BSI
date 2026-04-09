# BSI Dream Queue

**Generated:** 2026-04-09T12:42:00Z
**Sports in season:** College Baseball (peak — Weekend 9 conference play starts tomorrow), MLB (early regular season, 15 games today), NBA (final regular-season days, play-in April 15), CFB (deep offseason), NFL (offseason — Draft April 24)
**Signal summary:** Yesterday's #1 and #2 — degraded college baseball standings and an empty transfer portal — are both still broken a day later, neither fix landed. New today: the standalone college baseball scores feed has stopped returning a freshness envelope entirely (no source, no timestamp, no timezone), so every score card on the site is missing its "last updated" stamp at the worst possible moment. CFB scores is also serving 88 future August games as if they were scheduled, turning the offseason scoreboard into a confusing fall calendar.

---

## Priority Queue

### 1. Restore Conference Records on the Standings Page
**What:** Visitors to the college baseball standings page see accurate conference win-loss records for all 138 D1 programs as Weekend 9 unfolds — the numbers that decide who hosts a regional in June.
**Why now:** The standings feed has been flagged degraded for a second straight day, which means conference records are being estimated from ESPN win-percentage data instead of actual game results. Weekend 9 conference games start tomorrow (April 10) and the entire regional bubble moves based on what happens between Friday and Sunday. Every visitor reading these standings between now and the weekend is reading approximations during the most consequential stretch of the year.
**Scope:** 1 session
**Verification:** Pulling the college baseball standings feed shows the degraded flag false, and UCLA, Texas, and the other top contenders show conference records that match what visitors see on ESPN and D1Baseball.
**First step:** Trace the standings pipeline from the upstream baseball provider into the response and pinpoint where the degraded flag is being flipped on — confirm whether the upstream is missing data, the enrichment merge is dropping it, or the fallback is being hit silently.

---

### 2. Put the Freshness Stamp Back on College Baseball Scores
**What:** Every college baseball game card on the scores page shows a clear "last updated" timestamp and data source label again, so visitors know whether the score in front of them is five seconds old or five hours old.
**Why now:** Today the college baseball scores feed is returning data without any of the freshness fields — no source, no fetched-at timestamp, no timezone. MLB, NBA, and CFB all return the standard BSI envelope; college baseball alone is leaking the raw upstream shape. This is a regression from BSI's data philosophy ("every API response includes meta") and the trust signal at the top of every score card now has nothing to display, right as Weekend 9 traffic ramps up.
**Scope:** 1 session
**Verification:** Pulling the college baseball scores feed shows a populated meta block with source, fetched_at, and timezone — matching the MLB and NBA scores shape — and the scores page renders a visible "Last updated" stamp on cards.
**First step:** Compare the college baseball scores response shape to the MLB scores response shape and find where the BSI envelope wrapper is being bypassed.

---

### 3. Restore the Transfer Portal Page
**What:** The college baseball transfer portal page shows real player movement again — names, positions, schools — instead of an empty table during the heart of spring transfer season.
**Why now:** The portal feed has now returned zero entries for two straight days. Yesterday it had two broken "Unknown" entries; today it has none. Spring portal season is active right now and any visitor clicking through to the portal page sees a silent blank table with no explanation. This is the second day in a row this is the top-broken-thing on the site after standings.
**Scope:** 1 session
**Verification:** Pulling the transfer portal feed returns at least one entry with a real player name and school, or the portal page renders an explicit "no verified transfers yet" empty state with a clear explanation — not a silent blank table.
**First step:** Check what the upstream social-intel source is returning right now and determine whether the source has gone empty, the fetch is failing silently, or the parser is dropping every entry.

---

### 4. Hide Fall Schedule from the College Football Scoreboard in April
**What:** Visitors landing on the college football scores page during the spring see an offseason view — countdown to Week 0, recent draft and transfer headlines, spring game recaps — not a confusing list of 88 August matchups labeled as "scheduled."
**Why now:** The CFB scores feed is currently serving 88 future games dated August 29 and later. The result is a scoreboard with no actual games and a fall schedule mistakenly framed as live. The NFL Draft is 15 days out and football traffic on the site is about to climb — visitors who hit the CFB scoreboard right now see something broken-looking, not an offseason story.
**Scope:** 1 session
**Verification:** Loading the college football scores page in April shows an offseason layout (Week 0 countdown, draft news, transfer headlines) instead of an "8/29 - TBD" list of August games.
**First step:** Determine where the offseason switch should live — filter at the scores feed level so no future-dated game leaks into a "today's scores" list, or branch at the page render level using the schedule date.

---

### 5. NBA Play-In Urgency Layer
**What:** The NBA playoff picture page groups seeds 7–10 in both conferences under a clear "Play-In Zone" label with each team's record, current seed, and games remaining, so visitors can see who is locked, who is fighting, and who is about to drop out.
**Why now:** The NBA play-in starts April 15 — six days from today. Both conferences have very tight 7–10 races right now and traffic to NBA pages will spike sharply on play-in day. The playoff picture page already exists but currently surfaces no play-in context at all. This was on yesterday's queue too and the window is one day shorter today.
**Scope:** 1 session
**Verification:** Loading the NBA playoff picture page shows a "Play-In Zone" section in each conference with the four teams in seeds 7–10, their current records, and games remaining.
**First step:** Pull the current NBA standings response and confirm whether games remaining is already exposed or needs to be derived from the schedule feed.

---

## Signal Report

### Production Health
| Endpoint | Status | Notes |
|---|---|---|
| `/api/health` | OK | Hybrid-worker mode, v1.0.0 |
| `/api/college-baseball/scores` | **REGRESSION** | 7 games today, but `meta: {}` empty — leaking raw upstream shape with `plan` + `pagination` instead of BSI envelope |
| `/api/college-baseball/standings` | **DEGRADED** (day 2) | 138 teams, `degraded: true` — conference W-L estimated, not from real games |
| `/api/college-baseball/rankings` | **DEGRADED** (new today) | Top 25 present, `degraded: true` flag added since yesterday |
| `/api/college-baseball/transfer-portal` | **BROKEN** (day 2) | 0 entries (yesterday: 2 broken "Unknown"); source `social-intel` |
| `/api/college-baseball/news` | OK | 6 articles |
| `/api/cfb/scores` | **OFFSEASON LEAK** | 88 games returned, all dated Aug 29+ — fall schedule served as "today's scores" |
| `/api/mlb/scores` | OK | 15 games |
| `/api/mlb/standings` | OK | 30 teams |
| `/api/nba/scores` | OK | 7 games |
| `/api/nba/standings` | OK | 30 teams across 2 conferences |
| `/api/nfl/standings` | OK | Returns 2 conference groupings (offseason expected) |
| `/api/savant/batting/leaderboard` | OK | 25 batters, cache hit |
| `/api/savant/pitching/leaderboard` | OK | 25 pitchers |
| `/api/scores/overview` | OK | All 5 sports present |

### Recent Ships (last 20 commits)
The branch shipped yesterday's auto-generated queue (`ceab38c`) and a small cleanup pass (`c663143`), but none of yesterday's five priorities — standings, portal, NBA play-in, Weekend 9 editorial, logo verification — landed as code. The rest of the recent history is the same Heritage-token migration and TeamCircle logo work that wrapped up over the last cycle. The codebase is visually clean; the data layer is the bottleneck right now.

### Traffic Patterns
Cloudflare analytics unavailable (MCP tools not accessible in this session).

### Sports Calendar
| Sport | Status | Key Dates |
|---|---|---|
| College Baseball | **Peak — Weekend 9 conference play** | Weekend 9 starts April 10; CWS mid-June |
| MLB | Early regular season | Full slate running |
| NBA | Final regular-season days | Play-in April 15 (T-6 days); Playoffs April 18 |
| CFB | Deep offseason | Spring games complete; Week 0 ~140 days out |
| NFL | Offseason | Draft April 24–26 (T-15 days — watch next cycle) |
