# BSI Dream Queue

**Generated:** 2026-04-09T13:32:00Z
**Sports in season:** College Baseball (Week 9 — peak, Weekend 9 opens tomorrow April 10, regional selection ~6 weeks out), MLB (regular season, ~2 weeks in, 15 games today), NBA (final regular-season week, play-in April 15, playoffs April 18). NFL and CFB are in offseason.
**Signal summary:** Standings are still returning a `degraded` flag with 135 estimated conference records — the morning's clamp fix stopped the absurd numbers but didn't restore the real ones, and Weekend 9 opens in under 24 hours. Transfer portal remains empty during peak spring movement. Weekend 9 preview shipped since the last queue, but there is no live scoreboard hub to receive traffic when those games start. NBA play-in is now 6 days away with a live bubble that still has no play-in context on-site.

---

## Priority Queue

### 1. Real Conference Standings for Weekend 9
**What:** Visitors to the college baseball standings page see actual conference win-loss records for every D1 program — not estimates — right as Weekend 9 conference play begins.
**Why now:** The morning's partial fix clamped the ceiling on estimated conference records, but the endpoint still reports `degraded: true` with 135 teams flagged as estimated. Weekend 9 opens tomorrow and these records drive regional hosting conversations for the next six weeks. Wrong numbers during the most consequential stretch of the season are actively misleading.
**Scope:** 1 session
**Verification:** Open `blazesportsintel.com/college-baseball/standings` and confirm the "estimated" badge is gone from conference records on at least a dozen spot-checked teams; the standings API response no longer flips `degraded` to true.
**First step:** Pull down the current standings payload, identify which conferences still show the "estimated" flag after the clamp, and determine whether real conference records can be sourced from a second feed or back-computed from completed conference games in the schedule endpoint.

---

### 2. Restore the Transfer Portal Feed
**What:** The transfer portal page shows real player movement during peak spring portal season — names, schools, positions — instead of an empty table on every visit.
**Why now:** The endpoint still returns zero entries with an `emptyReason` set, same as yesterday. Two consecutive days with a blank portal during active spring movement means visitors arriving from search or social see nothing and bounce. This is the second day in a row the item has sat in the queue.
**Scope:** 1 session
**Verification:** Load `blazesportsintel.com/college-baseball/transfer-portal` and see at least a handful of real verified player entries with schools and positions, or a clearly worded empty state that explains what's missing — not a silent blank.
**First step:** Trace the portal data source, confirm whether the upstream has any entries today, and decide whether to switch sources, fix the parse, or ship a transparent empty state that explains the gap.

---

### 3. NBA Play-In Zone on the Playoff Picture Page
**What:** The NBA playoff picture page clearly marks the play-in race — seeds 7 through 10 in each conference — with records, remaining games, and how tight the race is at a glance.
**Why now:** Play-in games start in six days. Traffic to NBA pages will spike hard on April 15 and the current playoff picture page has no play-in framing yet. Both conferences have tight races that get richer context from a dedicated grouping.
**Scope:** 1 session
**Verification:** At `blazesportsintel.com/nba/playoff-picture`, seeds 7–10 in both the Eastern and Western Conferences are visually grouped and labeled as the play-in zone with each team's record and games remaining.
**First step:** Fetch the current NBA standings to confirm the shape available per team, then add the play-in grouping to the existing playoff picture page using Heritage tokens.

---

### 4. Weekend 9 Live Scoreboard Hub
**What:** A single destination for this weekend's college baseball action — tonight's 7 games, Friday through Sunday's full slate, live scores, and a running list of Top 25 matchups — all updating without a refresh.
**Why now:** The Weekend 9 preview editorial shipped earlier today and will drive readers looking for live follow-through. Weekend 9 opens tomorrow and the rest of the site has no dedicated place for them to land. Built right, the hub becomes reusable every weekend through June.
**Scope:** 1 session
**Verification:** Visit the weekend hub on Friday evening and see tonight's games with live scores, Friday's slate visible, and the Top 25 matchups flagged — all with a clear "last updated" stamp tied to real response metadata.
**First step:** Sketch the hub layout using the Heritage card pattern and confirm which existing scores and rankings endpoints supply everything the hub needs.

---

### 5. College Football Offseason Display
**What:** Visitors arriving at the CFB scores page during the offseason see a clear "next season starts August 29" framing with spring game coverage, instead of a grid of scheduled August games that reads like a cache bug.
**Why now:** The CFB scores endpoint is returning 88 games all dated August 29 from a stale cache — technically correct fall openers, but presenting them in April as if they're current makes the page look broken. Low-traffic issue, but it's the cleanest visible mismatch on the site right now and a fast win.
**Scope:** 1 session
**Verification:** Load `blazesportsintel.com/cfb/scores` and see an offseason header that communicates the sport is between seasons, with the August openers framed as "2026 season begins" rather than presented as today's scoreboard.
**First step:** Confirm the fall opener data is genuinely what the endpoint is serving, then update the CFB scores page to render an offseason mode when the closest scheduled game is more than a few weeks away.

---

## Signal Report

### Production Health
| Endpoint | Status | Notes |
|---|---|---|
| `/api/health` | OK | Hybrid-worker mode, v1.0.0 |
| `/api/college-baseball/scores` (default) | OK | 6 games in raw Highlightly shape, schema differs from date-filtered variant |
| `/api/college-baseball/scores?date=today` | OK | 7 games today, clean shape with meta |
| `/api/college-baseball/standings` | **DEGRADED** | 135 estimated conference records still flagged after morning clamp |
| `/api/college-baseball/rankings` | OK | Top 25 present (UCLA, Texas, Georgia Tech on top), meta.degraded spuriously true |
| `/api/college-baseball/transfer-portal` | **BROKEN** | 0 entries, 2nd day running |
| `/api/college-baseball/news` | OK | 6 articles |
| `/api/mlb/scores` | OK | 15 games |
| `/api/mlb/standings` | OK | 30 teams present |
| `/api/nba/scores` | OK | 7 games |
| `/api/nba/standings` | OK | 30 teams grouped East/West |
| `/api/cfb/scores` | STALE | 88 games cached from fall opener (August 29), displayed in April |
| `/api/savant/batting/leaderboard` | OK | 25 batters, cache hit |
| `/api/scores/overview` | OK | All 5 sports populated |

### Recent Ships (since prior queue, ~2 hours ago)
- Standings conference W-L clamp — capped bad estimates but left the `degraded` flag on
- Dream queue itself committed
- Weekend 9 preview editorial now live (79KB page)
- Last 20 commits remain dominated by Heritage design system migration and TeamCircle logo work — design phase is wrapping, feature work can resume

### Traffic Patterns
Cloudflare analytics unavailable (no observability MCP tools in this session).

### Sports Calendar
- **College Baseball:** Week 9 — peak season, Weekend 9 opens Friday April 10, regional selection ~June 1, CWS ~June 13
- **MLB:** ~2 weeks into the regular season, narrative still forming
- **NBA:** Final regular-season week, play-in games April 15, playoffs April 18
- **NFL:** Offseason, draft later this month
- **CFB:** Offseason, spring practices in progress
