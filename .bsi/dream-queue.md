# BSI Dream Queue

**Generated:** 2026-04-03T11:22:00Z
**Sports in season:** College Baseball (peak), MLB (opening week), NBA (final stretch + playoffs imminent)
**Signal summary:** Two data bugs are live on production during peak college baseball season — conference standings are stuck at 0-0 for all 138 teams, and the player directory launched last week with completely empty bio fields (position, class year, headshot all missing for every player). The NBA regular season ends in ~11 days with OKC and Detroit as the two biggest stories nobody is writing about yet.

---

## Priority Queue

### 1. College baseball conference standings stuck at 0-0
**What:** Every team's conference record on the standings page shows real wins and losses — allowing fans to see who's leading the SEC, ACC, and Big 12 during the heart of conference season — instead of the current frozen 0-0 state.
**Why now:** The `/api/college-baseball/standings` endpoint returns 138 teams but every single team has `conferenceRecord: {wins: 0, losses: 0}`. It's April 3 — conference play has been going for weeks. The ESPN standings parser is falling back to `'0-0'` for every team because the stat name lookup (`conferenceRecord` or `Conference`) isn't matching the actual ESPN response. This is the most-checked data surface in peak college baseball season.
**Scope:** 1 session
**Verification:** `curl https://blazesportsintel.com/api/college-baseball/standings | python3 -c "import sys,json; d=json.load(sys.stdin); t=d['data'][0]; print(t['team']['name'], t['conferenceRecord'])"` — should show a real W-L split, not `{wins: 0, losses: 0}`.
**First step:** Read `workers/handlers/college-baseball/standings.ts` around line 120 and log the raw ESPN statsList for a known team (e.g. UCLA) to find the correct stat name for conference record, then fix the lookup.

---

### 2. Player directory profiles are empty shells
**What:** Visitors browsing the college baseball player directory see real position labels, class years, and player headshots alongside their stats — instead of blank/unknown fields for every single player.
**Why now:** The player directory launched last week and is featured in navigation. Right now 100% of 50+ queried players show position=UN, no class year, no headshot, no conference. The Player Discovery Engine is being actively promoted but every profile is a hollow shell. A freshly-shipped feature showing "Unknown" for every player erodes trust in BSI's data quality positioning.
**Scope:** 1 session
**Verification:** `curl "https://blazesportsintel.com/api/college-baseball/players?minPA=25&limit=5" | python3 -c "import sys,json; d=json.load(sys.stdin); p=d['players'][0]; print(p['name'], '|', p['position'], '|', p['classYear'], '|', bool(p['headshot']))"` — should show real position, year, and `True` for headshot.
**First step:** Read the D1 schema in `bsi-analytics-db` to confirm whether player bio columns (`position`, `class_year`, `headshot_url`) have data, then trace the players API handler to where it joins stats with bio records.

---

### 3. NBA playoff seeding page before the race locks
**What:** BSI has a live playoff bracket/seeding page showing current seeds, play-in picture, and the two biggest underdog stories — Detroit Pistons leading the East at 56-21 and OKC Thunder at 61-16 — before the regular season ends April 14.
**Why now:** The NBA standings endpoint is healthy and returning 30 teams with accurate records. The regular season ends in ~11 days. Detroit at 56-21 is one of the biggest sports stories of the year — a franchise that was historically bad, now leading the East. BSI's "beats the overlooked" mandate is made for this. There is no page on the site that frames the playoff picture at all. Traffic window opens now and closes when media saturates the story.
**Scope:** 1 session
**Verification:** Visit `blazesportsintel.com/nba/playoff-picture` — page loads with seeded brackets for both conferences, Detroit and OKC highlighted as conference leaders, and play-in teams (seeds 7-10) called out. All data sourced from the live standings API.
**First step:** Read `app/nba/standings/page.tsx` to understand the existing standings data flow, then decide whether to extend that page or create `/nba/playoff-picture` — wire to `/api/nba/standings` which already returns the needed records.

---

### 4. Verify MLB and NBA scores are rendering team names
**What:** The MLB and NBA scores pages display actual team names and scores rather than blank entries — confirming the displays work during opening week and the NBA final stretch.
**Why now:** Both `/api/mlb/scores` and `/api/nba/scores` return games in ESPN's `teams[]` array format — not a `homeTeam`/`awayTeam` object. Python verification with `homeTeam`/`awayTeam` returns `?` for every team name. If the frontend components use those same field names, every score card is rendering blank during the two most traffic-heavy moments of the spring calendar. Needs a browser verification and fix if broken.
**Scope:** 1 session (verify first, fix if broken)
**Verification:** Visit `blazesportsintel.com/mlb/scores` and `blazesportsintel.com/nba/scores` in a browser — both pages show real team names, scores, and game status with no blanks. If broken, fix the component's field access to use the `teams[]` array structure.
**First step:** Read `app/mlb/scores/page.tsx` and its data-fetching logic to check whether it accesses `homeTeam`/`awayTeam` or correctly handles the `teams[]` array, then load the page in browser to confirm.

---

### 5. MLB opening week pace tracker
**What:** BSI surfaces which teams are on historically significant 162-game win-pace trajectories after one week — spotlighting early surprises like the Yankees (5-1) and Astros (5-2, on a W5 streak) before mainstream coverage catches up.
**Why now:** The MLB standings endpoint is returning real data with ~6 games played per team. Opening week is the peak period for "pace" and "hot start" search traffic. Yankees, Astros, and Blue Jays are already separating. Adding projected win totals to the existing standings page takes one session and turns a plain standings table into an analytical differentiator — exactly BSI's brand.
**Scope:** 1 session
**Verification:** Visit `blazesportsintel.com/mlb/standings` — the standings table includes a "162-game pace" column showing projected wins based on current record. All numbers derived live from the existing standings API response, no hardcoded values.
**First step:** Read `app/mlb/standings/page.tsx` and confirm the standings data includes `wins` and `losses` fields, then add a computed pace column (wins / (wins+losses) * 162, rounded) to the existing table.

---

## Signal Report

### Production Health

| Endpoint | Status | Notes |
|---|---|---|
| `/api/health` | ✅ OK | `{"status":"ok","mode":"hybrid-worker"}` |
| `/api/college-baseball/scores` | ✅ 74 games | Returns under `data` key (not `games`) |
| `/api/college-baseball/standings` | ⚠️ BROKEN | 138 teams, every team `conferenceRecord: {wins:0, losses:0}` |
| `/api/college-baseball/rankings` | ✅ OK | Real ranked teams with accurate records |
| `/api/college-baseball/players` | ⚠️ DEGRADED | 50 players returned, 100% missing position/classYear/headshot |
| `/api/college-baseball/news` | ✅ OK | 6 articles |
| `/api/mlb/scores` | ⚠️ VERIFY | `teams[]` array format — may render blank names in UI |
| `/api/mlb/standings` | ✅ OK | 30 teams, accurate early-season records |
| `/api/nba/scores` | ⚠️ VERIFY | `teams[]` array format — may render blank names in UI |
| `/api/nba/standings` | ✅ OK | 30 teams, Detroit 56-21 / OKC 61-16 |
| `/api/savant/batting/leaderboard` | ✅ 25 batters | wRC+, wOBA live |
| `/api/savant/pitching/leaderboard` | ✅ Working | FIP, xFIP, K/9 live |
| `/api/scores/overview` | ✅ OK | All 5 sports present |

### Recent Ships (last 20 commits)

| Commit | What shipped |
|---|---|
| `4137046` | Dream queue auto-generated (Apr 2) |
| `f9ffdbf` | Dream queue auto-generated (Apr 1) |
| `274abaf` | Dream queue auto-generated (Mar 31) |
| `96e33b2` | Player directory added to nav + homepage; D1 position enrichment |
| `2126bdc` | Homepage empty/error states for leaderboard and standout cards |
| `91286eb` | Savant min-PA default set to 25; UN/null position display cleanup |
| `6ec204f` | Player Discovery Engine — searchable directory with advanced metrics |
| `a20f5a5` | Visual regression baselines, build-verify agent, Live Scores accent |
| `35b8f26` | Fix NFL SportIcon style prop |
| `09ca2f3` | 10 design upgrades (table headers, sticky scroll, sport differentiation) |
| `310a770` | Dream queue auto-generated (Mar 30) |
| `2fbd31c`–`d8bf0cb` | ~8 portfolio commits — Lighthouse 100, contact form, print styles, chat widget |

**Pattern:** Heavy college baseball player analytics investment this sprint (Player Discovery Engine, Savant fixes, position enrichment). Bio enrichment is not flowing through despite multiple commits trying to address it. Portfolio work paused BSI momentum for several days but appears complete.

### Traffic Patterns

Cloudflare analytics unavailable — no MCP tools present in session.

### Sports Calendar

| Sport | Status | Key Dates |
|---|---|---|
| **College Baseball** | 🔥 PEAK SEASON | Conference race in full swing. Regionals ~May 30. Super Regionals ~Jun 6. CWS Jun 13–24. |
| **MLB** | 🔥 Opening Week | ~6 games played per team. Yankees 5-1, Astros 5-2 (W5). |
| **NBA** | 🔥 Final Stretch | Regular season ends ~Apr 14. Play-in Apr 15-18. Playoffs ~Apr 19. OKC 61-16, Detroit 56-21. |
| **NFL** | Offseason | Draft Apr 23–25 is the next event. |
| **CFB** | Deep offseason | Spring practices. Spring games late April. |
