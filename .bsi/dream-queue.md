# BSI Dream Queue

**Generated:** 2026-04-07T11:22:00Z
**Sports in season:** College Baseball (peak — Week 8, full conference play), MLB (regular season Week 2), NBA (final 6 days of regular season, playoffs begin April 13)
**Signal summary:** Five consecutive days with no implementation sessions — the same three broken college baseball features (game detail, conference standings, transfer portal) remain unfixed through the heart of peak season. NBA playoffs open in 6 days with no playoff picture page. MLB stats route still returns HTML. Eight consecutive commits have been dream queue auto-generates with zero fixes shipped.

---

## Priority Queue

### 1. Game box scores still broken — fifth consecutive day
**What:** Clicking any college baseball game from the scores board opens a real box score — inning-by-inning scoring, team stats, game state, and key plays — instead of a blank page with a null data response.
**Why now:** Confirmed again today: every game ID (e.g., `1153683`, `1153646`) returns `game: null`. This is the highest-intent click on the entire site — a fan who sees a live score always wants to go deeper. 83 games are on the board today and every single one leads to a dead end. Five consecutive days in peak season with no fix.
**Scope:** 1 session
**Verification:** `curl https://blazesportsintel.com/api/college-baseball/games/1153683` returns a non-null `game` object with team names and scheduled state. The game page at `blazesportsintel.com/college-baseball/game/1153683/` renders matchup info instead of a blank shell.
**First step:** Read the game detail handler in `workers/handlers/college-baseball/` — trace why the Highlightly fetch returns null and confirm whether the game IDs from the scores endpoint (`data[].id`) match the format the detail handler uses to query Highlightly.

---

### 2. Conference standings frozen at 0-0 — fifth consecutive day
**What:** The college baseball standings page shows each team's real conference record — SEC, Big 12, ACC, Pac-12 races updated with this week's results — instead of every team listed at 0 wins, 0 losses.
**Why now:** Confirmed again: all 138 teams return `conferenceRecord: { wins: 0, losses: 0, pct: 0 }` while overall records are live (UCLA 29-2, Texas 26-5). It's Week 8 — conference standings races are the central college baseball story and the data has been frozen for five straight days. Rankings endpoint is also flagged `meta.degraded: true`.
**Scope:** 1 session
**Verification:** `curl https://blazesportsintel.com/api/college-baseball/standings | python3 -c "import sys,json; d=json.load(sys.stdin); t=d['data'][0]; print(t['team']['name'], t.get('conferenceRecord'))"` returns a non-zero conference record for the top-ranked team.
**First step:** Read the college baseball standings handler and trace where `conferenceRecord` is built — the ESPN source returns a `record` array per team with a conference split; find which field key the transform is missing or mapping incorrectly.

---

### 3. NBA playoff picture — 6 days until the bracket locks in
**What:** A dedicated NBA playoff seeding page shows both conference brackets with current seeds, play-in matchups (7 vs. 8, 9 vs. 10), games remaining, and clinch indicators — giving fans the live playoff picture through the final six days.
**Why now:** The regular season ends April 13. Detroit leads the East at 57-22 with a historic win streak — the biggest story in basketball — and BSI has no page to frame it. The standings data is fully healthy (30 teams, both conferences). Building now gives visitors a destination for the final stretch. Waiting until April 14 turns it into a recap.
**Scope:** 1 session
**Verification:** Navigate to `blazesportsintel.com/nba/playoff-picture/` — both conference brackets render with live seeds, Detroit and OKC called out as division leaders, play-in seeds 7–10 flagged. All data sourced live from `/api/nba/standings`.
**First step:** Read `app/nba/standings/page.tsx` to confirm the data shape, then create `app/nba/playoff-picture/page.tsx` wired to `/api/nba/standings`, rendering a Heritage v2.1 two-column bracket with play-in zone indicators.

---

### 4. Transfer portal empty during active spring movement
**What:** The college baseball transfer portal page shows players currently in the portal — name, position, previous school, and status — reflecting real April roster movement instead of a blank list.
**Why now:** Endpoint confirms `totalEntries: 0`, last synced 11:00 AM today. The spring portal is active and player movement is one of the top college baseball stories every April. The Player Discovery Engine launched two weeks ago — portal data would make it substantially more useful for the scouts and fans BSI is built for.
**Scope:** 1 session
**Verification:** `curl https://blazesportsintel.com/api/college-baseball/transfer-portal` returns `totalEntries > 0` with real player entries including name, position, and previous school.
**First step:** Find the worker or cron responsible for portal sync — check whether Highlightly or SportsDataIO exposes a transfer portal endpoint, whether the KV write key matches the read key in the handler, and whether a scheduled fetch is configured to run.

---

### 5. MLB stats leaderboard missing — two weeks of season data uncaptured
**What:** The MLB stats page surfaces early-season batting and pitching leaders — average, home runs, ERA, strikeouts — giving visitors a reason to come back to the MLB section on non-game days.
**Why now:** `/api/mlb/stats` returns HTML instead of JSON — no worker route is registered. The `/mlb/stats/` page exists but serves nothing. MLB is two weeks in with 13 games on the board today. Early-season leaders are a high-novelty story and the window of surprise is closing.
**Scope:** 1 session
**Verification:** `curl https://blazesportsintel.com/api/mlb/stats` returns valid JSON with batting and pitching leader arrays. The stats page at `blazesportsintel.com/mlb/stats/` renders a populated leaderboard with qualified players.
**First step:** Check `workers/handlers/mlb.ts` for a stats handler — determine whether the route registration is missing from the Hono router, or whether the SportsDataIO fetch exists but is unregistered.

---

## Signal Report

### Production Health

| Endpoint | Status | Notes |
|---|---|---|
| `/api/health` | ✅ OK | Worker healthy, hybrid mode |
| `/api/college-baseball/scores` | ✅ 83 games | 5 live; data in `data` key (not `games`) |
| `/api/college-baseball/games/:id` | ❌ BROKEN | `game: null` for all IDs — 5th consecutive day |
| `/api/college-baseball/standings` | ⚠️ Degraded | 138 teams, all `conferenceRecord` frozen at 0-0 — 5th day |
| `/api/college-baseball/rankings` | ⚠️ Degraded | 25 teams but `meta.degraded: true`, conference records absent |
| `/api/college-baseball/transfer-portal` | ❌ BROKEN | `totalEntries: 0` — active spring portal season |
| `/api/savant/batting/leaderboard` | ✅ Working | 25 batters default |
| `/api/mlb/scores` | ✅ 13 games | Week 2, healthy |
| `/api/mlb/standings` | ✅ 30 teams | Full standings |
| `/api/mlb/stats` | ❌ BROKEN | Returns HTML — no worker route registered |
| `/api/nba/scores` | ✅ 5 games | Final week of regular season |
| `/api/nba/standings` | ✅ 30 teams | Detroit leads East 57-22; OKC leads West |
| `/api/scores/overview` | ✅ Working | All 5 sports present |

### Recent Ships (last 20 commits)

| Commit | What shipped |
|---|---|
| `49c936e`–`274abaf` | Dream queue auto-generates (Mar 31–Apr 6) — 8 consecutive queue-only commits, zero implementation sessions |
| `96e33b2` | Player directory added to navigation, position data enriched from D1 |
| `2126bdc` | Homepage empty/error states added for leaderboard and standout cards |
| `91286eb` | Players: min PA default 25, UN/null position display cleaned up |
| `6ec204f` | Player Discovery Engine launched — searchable directory with advanced metrics |
| `a20f5a5` | Visual regression baselines, build-verify agent, Live Scores accent |
| `35b8f26` | NFL: removed unsupported style prop from SportIcon |
| `09ca2f3` | 10 design upgrades — table headers, sticky scroll, sport differentiation, score badges, mobile reorder |

**Pattern:** Recent work concentrated on the Player Discovery Engine and design polish. The three core college baseball features — game detail, conference standings, transfer portal — have received no commits for 5+ days.

### Traffic Patterns

Cloudflare analytics unavailable — MCP tools not accessible in this session.

### Sports Calendar

| Sport | Status | Key Events |
|---|---|---|
| **College Baseball** | 🔥 PEAK SEASON | Week 8, full conference play; 83 games today; CWS mid-June |
| **MLB** | ✅ Active | Week 2 regular season; 13 games today |
| **NBA** | ⚡ CRITICAL | Final 6 days before playoffs begin April 13 |
| **CFB** | Off-season | Spring practice; no games |
| **NFL** | Off-season | Draft April 23–25; no games |
