# BSI Component Prompts — Copy-Paste Ready

Use these prompts to generate each component. Execute in order.

---

## INFRASTRUCTURE PROMPT

```
Create the Cloudflare infrastructure for blazesportsintel.com:

1. D1 Database (bsi-main-db) with these tables:
- games (id, sport, espn_id, home_team_id, away_team_id, scores, status, scheduled_at, venue, payload_json, source, fetched_at)
- teams (id, sport, espn_id, name, abbreviation, display_name, conference, logo_url, colors, payload_json)
- standings (team_id, sport, season, conference, conf_record, overall_record, streak, ranking, source)
- players (id, team_id, sport, name, number, position, height, weight, class, bats, throws, headshot_url)
- player_stats (player_id, game_id, sport, season, stat_type, stats_json, source)
- box_scores (game_id, sport, linescore_json, batting_json, pitching_json, source)
- plays (game_id, play_id, sport, period, sequence, description, score_home, score_away, is_scoring)
- articles (id, sport, team_id, title, slug, summary, content, author, image_url, category, published_at)
- videos (id, sport, team_id, game_id, title, thumbnail_url, video_url, duration, category, published_at)
- depth_charts (team_id, sport, season, position, depth, player_id, role)

All tables need indexes on sport, date/time fields, and foreign keys.
Include source TEXT NOT NULL and fetched_at TEXT NOT NULL on every table.
Use America/Chicago timezone with datetime('now','localtime').

2. KV Namespaces:
- BSI_GAMES_KV
- BSI_TEAMS_KV  
- BSI_CONTENT_KV

3. R2 Bucket:
- bsi-assets (for images, CSV exports, large files)

Output: Complete schemas.sql file + wrangler.toml configuration
```

---

## WORKER PROMPT: bsi-games-api

```
Create a Cloudflare Worker (bsi-games-api) that handles game data for blazesportsintel.com.

Endpoints:
- GET /api/scoreboard?sport={sport}&date={YYYYMMDD}
- GET /api/games/:gameId
- GET /api/games/:gameId/box-score
- GET /api/games/:gameId/plays?inning={n}&scoring_only={bool}
- GET /api/games/:gameId/team-stats

Requirements:
1. Fetch from ESPN APIs:
   - College baseball: site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard
   - MLB: statsapi.mlb.com/api/v1/schedule and /game/{gamePk}/feed/live
   - NFL: site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard
   - NBA: site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard

2. KV caching with TTLs:
   - Live scoreboard: 30 seconds
   - Live game: 15 seconds
   - Final game: 1 hour
   - Box score: 1 hour

3. D1 persistence for historical tracking

4. Response format:
{
  meta: { source, fetched_at, timezone: 'America/Chicago', cache_status },
  data: { ... }
}

5. CORS headers for cross-origin requests
6. Error handling with exponential backoff retry
7. User-Agent: 'Blaze-Sports-Intel/1.0'

Bindings: BSI_GAMES_KV (KVNamespace), BSI_D1 (D1Database)

Output: Complete TypeScript Worker with all handlers
```

---

## WORKER PROMPT: bsi-teams-api

```
Create a Cloudflare Worker (bsi-teams-api) for team data on blazesportsintel.com.

Endpoints:
- GET /api/teams/:teamId
- GET /api/teams/:teamId/roster?position={pos}
- GET /api/teams/:teamId/stats?type={batting|pitching}
- GET /api/teams/:teamId/schedule?season={year}
- GET /api/teams/:teamId/depth-chart
- GET /api/standings?sport={sport}&conference={conf}
- GET /api/stats/leaders?sport={sport}&category={cat}&limit={n}

Requirements:
1. Fetch team data from ESPN team endpoints
2. KV caching:
   - Team info: 5 minutes
   - Roster: 10 minutes
   - Schedule: 1 hour
   - Standings: 5 minutes
   - Leaders: 5 minutes

3. D1 queries for:
   - Player roster with position filtering
   - Season stats aggregation
   - Standings calculation
   - Stat leaders with minimum qualifiers

4. Same response format and error handling as bsi-games-api

Bindings: BSI_TEAMS_KV (KVNamespace), BSI_D1 (D1Database)

Output: Complete TypeScript Worker
```

---

## WORKER PROMPT: bsi-content-api

```
Create a Cloudflare Worker (bsi-content-api) for news and video content on blazesportsintel.com.

Endpoints:
- GET /api/news?sport={sport}&team={teamId}&category={cat}&limit={n}&offset={n}
- GET /api/news/:slug
- GET /api/videos?sport={sport}&team={teamId}&game={gameId}&category={cat}&limit={n}
- GET /api/videos/:id

Requirements:
1. D1 queries with filtering and pagination
2. KV caching:
   - News list: 5 minutes
   - Article: 24 hours
   - Video list: 5 minutes
   - Video: 24 hours

3. R2 integration for media assets
4. Support relative timestamps ("2 hours ago")
5. Category filtering: news, analysis, interviews, highlights

Bindings: BSI_CONTENT_KV (KVNamespace), BSI_D1 (D1Database), BSI_R2 (R2Bucket)

Output: Complete TypeScript Worker
```

---

## PAGE PROMPT: Scoreboard

```
Build the scoreboard page (/:sport/scoreboard) for blazesportsintel.com.

Features:
1. Date navigation with prev/today/next buttons
2. Sport selector in header: College Baseball | MLB | NCAA Football | NFL | NBA
3. Game cards in responsive grid showing:
   - Away team: logo + name + record
   - Home team: logo + name + record
   - Score or scheduled time
   - Status badge (FINAL/LIVE pulse/time)
   - Venue info
   - Click navigates to /games/:gameId/recap

4. Conference filter dropdown (college sports)
5. Auto-refresh indicator (30 seconds for live games)
6. Loading skeleton during fetch
7. Empty state: "No games scheduled"

Data: Fetch from /api/scoreboard?sport={sport}&date={date}

Design tokens:
- Background: #0D0D0D (midnight)
- Cards: #1A1A1A (charcoal)
- Accent: #BF5700 (burnt orange)
- Live: #EF4444 with pulse animation
- Win highlight: #22C55E
- Fonts: Oswald (headers), Source Sans Pro (body)

Mobile: 1 column
Tablet: 2 columns
Desktop: 3-4 columns

Output: Single HTML file with embedded CSS/JS, Google Fonts only external dependency
```

---

## PAGE PROMPT: Box Score

```
Build the box score page (/games/:gameId/box-score) for blazesportsintel.com.

Features:
1. Game header:
   - Away logo + name + record on left
   - Home logo + name + record on right
   - Large final score in center
   - Status, date, venue below

2. Tab navigation (sticky below header):
   - Recap | Box Score (active) | Play-by-Play | Team Stats
   - Orange underline on active tab

3. Linescore table:
   - Row per team
   - Columns: Team | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | R | H | E
   - Extra innings if needed
   - Sticky team column on mobile scroll

4. Batting tables (away, then home):
   - Header: "AWAY BATTING" / "HOME BATTING"
   - Columns: Player | AB | R | H | RBI | BB | SO | AVG
   - Player shows name + position
   - Totals row at bottom
   - Sortable columns

5. Pitching tables (away, then home):
   - Columns: Pitcher | IP | H | R | ER | BB | SO | ERA
   - Decision badge (W/L/S) next to name
   - Pitch count if available

Data: Fetch from /api/games/:gameId/box-score

Design:
- Numbers in JetBrains Mono
- Header row: slightly lighter background
- Winning decision: green pill
- Losing decision: red pill
- Notable performance (3+ H, 10+ K): subtle row highlight

Mobile: Horizontal scroll with sticky first column

Output: Complete HTML with all box score functionality
```

---

## PAGE PROMPT: Play-by-Play

```
Build the play-by-play page (/games/:gameId/play-by-play) for blazesportsintel.com.

Features:
1. Inherit game header and tab nav from box score
2. Control bar:
   - Inning filter buttons (1-9+)
   - "Scoring plays only" toggle
   - Live games: "Jump to live" button

3. Play feed (vertical timeline):
   - Inning divider with score
   - Play cards showing:
     - Half inning indicator (▲ top, ▼ bottom)
     - Batter vs Pitcher
     - Play description
     - Result icon (out, hit, run, etc.)
     - Score after (if scoring play)

4. Scoring plays get orange left border
5. Expandable for pitch sequence details
6. Live games: new plays appear at top with animation

Data: Fetch from /api/games/:gameId/plays?inning={n}&scoring_only={bool}

Design:
- Timeline layout with centered line
- Play cards alternate slight indent
- Inning headers span full width
- Compact by default, tap to expand
- Scoring play animation: slide in from left

Output: Complete HTML with play-by-play feed
```

---

## PAGE PROMPT: Team Stats

```
Build the team stats page (/games/:gameId/team-stats) for blazesportsintel.com.

Features:
1. Inherit game header and tab nav
2. Side-by-side comparison layout:
   - Away stats (left) | Category | Home stats (right)
   - Horizontal bar showing split
   - Leading team's bar in burnt orange

3. Baseball categories:
   BATTING: Team AVG, Hits, Runs, RBI, LOB, RISP
   PITCHING: Team ERA, Strikeouts, Walks, Hits Allowed
   FIELDING: Errors, Double Plays, Passed Balls

4. Football categories:
   Total Yards, Passing Yards, Rushing Yards
   First Downs, 3rd Down %, Time of Possession
   Turnovers, Penalties, Sacks

5. Category grouping with headers

Data: Fetch from /api/games/:gameId/team-stats

Design:
- Stat bars: gray base, orange for leader
- Numbers aligned to edges
- Category text centered
- Leading stats slightly larger/bold
- Mobile: Stack vertically with team tabs

Output: Complete HTML with team stats comparison
```

---

## PAGE PROMPT: Recap

```
Build the recap page (/games/:gameId/recap) for blazesportsintel.com.

Features:
1. Inherit game header and tab nav (Recap active)

2. For FINAL games:
   - Score summary box (prominent)
   - "Stars of the Game" section:
     - 2-3 key players with photo + stat highlights
   - Game summary (3-4 paragraphs)
   - Scoring summary (inning-by-inning)
   - Related articles sidebar (desktop) / below (mobile)

3. For SCHEDULED games (preview):
   - Matchup hero
   - "Recent Form" - last 5 games each team
   - Head-to-head history
   - Probable starters
   - Weather (if outdoor)

4. For LIVE games:
   - Current score + situation
   - Last 5 plays
   - "Watch Play-by-Play" CTA
   - Live updating

Data: Fetch from /api/games/:gameId

Design:
- Hero section with team colors
- Player photos circular, 60px
- Editorial typography for summary
- Clean card layouts for related content

Output: Complete HTML with recap/preview functionality
```

---

## PAGE PROMPT: Standings

```
Build the standings page (/:sport/standings, /teams/:teamId/standings) for blazesportsintel.com.

Features:
1. Conference selector dropdown
2. Standings table:
   - Columns: # | Team | Conf | Overall | Home | Away | Streak | GB
   - Team shows logo + name
   - Sortable columns
   - Ranked teams show ranking badge

3. Visual indicators:
   - Clinched: filled circle
   - Eliminated: hollow circle
   - Team page: highlight row with --bsi-highlight

4. Last updated timestamp
5. "View Full Standings" link (sport page)
6. Conference legend/explanation

Data: Fetch from /api/standings?sport={sport}&conference={conf}

Design:
- Full-width table
- Sticky first column on mobile
- Streak: green W, red L
- Games back: dimmer color if 0.0
- Selected team (team page): orange border + highlight bg

Output: Complete HTML with standings functionality
```

---

## PAGE PROMPT: Stats Leaders

```
Build the stats page (/:sport/stats, /teams/:teamId/stats) for blazesportsintel.com.

Features:
1. Category tab pills:
   Baseball Batting: AVG | HR | RBI | H | R | SB | OPS
   Baseball Pitching: ERA | W | K | WHIP | SV
   (Adapt for other sports)

2. Leaderboard table:
   - Columns: # | Player | Team | Stat Value | GP
   - Player shows headshot + name
   - Team shows logo + abbrev
   - Top 3 get medal styling (gold/silver/bronze)

3. Minimum qualifier note (e.g., "Min. 2.0 PA per game")
4. Team page filters to that team only
5. "View All" pagination or infinite scroll

Data: Fetch from /api/stats/leaders?sport={sport}&category={cat}&limit=25

Design:
- Category pills: horizontal scroll on mobile
- Active category: orange pill
- Stat value in JetBrains Mono, larger size
- Headshots: 32px circular
- Medals: subtle background color

Output: Complete HTML with stats leaderboard
```

---

## PAGE PROMPT: Roster

```
Build the roster page (/teams/:teamId/roster) for blazesportsintel.com.

Features:
1. Team header (logo, name, record, conference, ranking)
2. Team tab navigation: News | Standings | Stats | Roster (active) | Depth Chart | Schedule | Videos

3. Position filter dropdown: All | Pitchers | Catchers | Infielders | Outfielders | DH
4. Sort by: Number | Name | Position | Class

5. Player cards in grid:
   - Headshot (placeholder if none)
   - Number badge (burnt orange)
   - Name (prominent)
   - Position
   - Height / Weight
   - B/T (Bats/Throws)
   - Class (Fr/So/Jr/Sr/Gr)
   - Hometown / High School

6. Click card expands to show season stats or links to player page

Data: Fetch from /api/teams/:teamId/roster?position={pos}

Design:
- Grid: 1 col mobile, 2 tablet, 3-4 desktop
- Card: charcoal bg, subtle border
- Number badge: top-left corner, orange bg
- Headshot: 80px, rounded corners
- Position groups with headers when sorted by position

Output: Complete HTML with roster grid
```

---

## PAGE PROMPT: Depth Chart

```
Build the depth chart page (/teams/:teamId/depth-chart) for blazesportsintel.com.

Features (Baseball focus):
1. Team header + team tabs (Depth Chart active)

2. Starting Lineup section:
   - Visual baseball diamond showing defensive positions
   - Batting order 1-9 with player + position
   - Each position clickable for stats popup

3. Weekend Rotation section:
   - Three cards: Friday | Saturday | Sunday
   - Each shows: Pitcher name, W-L, ERA, K
   - Last start date

4. Bullpen section:
   - Role-based organization:
     - Closer (red badge)
     - Setup (orange badge)
     - Middle Relief
     - Long Relief
   - Shows recent usage (days rest)

5. Bench section:
   - Backup by position
   - Shows stats in smaller text

Data: Fetch from /api/teams/:teamId/depth-chart

Design:
- Diamond: SVG with position dots
- Lineup: numbered list with position abbreviations
- Rotation cards: prominent pitcher name
- Role badges: colored pills
- Mobile: collapse diamond to list view

Output: Complete HTML with depth chart visualization
```

---

## PAGE PROMPT: Schedule

```
Build the schedule page (/teams/:teamId/schedule) for blazesportsintel.com.

Features:
1. Team header + team tabs (Schedule active)
2. View toggle: List | Calendar
3. Filter: All | Home | Away | Conference

4. List view:
   - Date + Day
   - Opponent (@ for away, vs for home)
   - Result: W 5-3 or L 3-7 or time for upcoming
   - TV/Streaming broadcast
   - Conference game indicator (*)

5. Calendar view:
   - Month grid with navigation
   - Game indicators on days
   - Click day to see games

6. Record summary at top: Overall | Home | Away | Conference

7. Click game row navigates to game page

Data: Fetch from /api/teams/:teamId/schedule?season=2025

Design:
- List: alternating row backgrounds
- Won: green W badge
- Lost: red L badge
- Upcoming: neutral, shows time
- Current week highlighted
- Conference games marked with asterisk

Output: Complete HTML with both schedule views
```

---

## PAGE PROMPT: News Feed

```
Build the news page (/:sport/news, /teams/:teamId/news) for blazesportsintel.com.

Features:
1. Featured article (hero):
   - Large image
   - Headline overlay
   - Excerpt
   - Author + relative time

2. Article list:
   - Thumbnail (left) + content (right)
   - Category badge (color-coded)
   - Headline
   - Relative timestamp ("2 hours ago")
   - Brief excerpt on hover

3. Category filter tabs: All | News | Analysis | Interviews | Scores
4. Load more / infinite scroll
5. Team page filters to team content only

Data: Fetch from /api/news?sport={sport}&team={teamId}&category={cat}&limit=20&offset=0

Design:
- Featured: full-width, dark overlay on image for text
- List cards: horizontal layout
- Category badges: colored pills
- Hover: underline title, slight image zoom
- Loading: skeleton cards

Output: Complete HTML with news feed
```

---

## PAGE PROMPT: Videos

```
Build the videos page (/teams/:teamId/videos) for blazesportsintel.com.

Features:
1. Team header + team tabs (Videos active)
2. Category filter: All | Highlights | Press Conferences | Features | Replays
3. Sort: Most Recent | Most Viewed

4. Video grid:
   - Thumbnail (16:9)
   - Play button overlay (centered)
   - Duration badge (bottom-right)
   - Title below thumbnail
   - Date posted

5. Video modal player:
   - Dark overlay
   - Centered video player
   - Title + description
   - Related videos sidebar
   - Close button (X)

6. Pagination or infinite scroll

Data: Fetch from /api/videos?team={teamId}&category={cat}&limit=20

Design:
- Grid: 1 col mobile, 2 tablet, 3 desktop
- Thumbnail: rounded corners, hover dim + scale
- Play button: white with semi-transparent black bg
- Duration: white text on dark badge
- Modal: fade in animation

Output: Complete HTML with video grid + modal player
```

---

## FINAL INTEGRATION PROMPT

```
Integrate all BSI pages into a unified single-page application for blazesportsintel.com.

Requirements:
1. Client-side hash routing (works without server)
2. Persistent header with:
   - BSI logo (left)
   - Primary nav: College Baseball | MLB | NCAA Football | NFL | NBA
   - Mobile hamburger menu

3. Sub-navigation per sport:
   - Scoreboard | Standings | Stats | Rankings | News

4. Route handling:
   - /:sport/scoreboard (default per sport)
   - /:sport/standings
   - /:sport/stats
   - /:sport/rankings
   - /:sport/news
   - /games/:gameId/recap
   - /games/:gameId/box-score
   - /games/:gameId/play-by-play
   - /games/:gameId/team-stats
   - /teams/:teamId/news
   - /teams/:teamId/standings
   - /teams/:teamId/stats
   - /teams/:teamId/roster
   - /teams/:teamId/depth-chart
   - /teams/:teamId/schedule
   - /teams/:teamId/videos

5. Loading states during navigation
6. Error boundary for failed fetches
7. Deep linking support
8. Browser back/forward navigation

API Base: https://api.blazesportsintel.com

Design:
- Smooth page transitions
- Scroll to top on navigation
- Active nav highlighting
- Mobile drawer navigation

Output: Complete index.html with all routing and page rendering
```

---

## DEPLOYMENT CHECKLIST

```
1. [ ] Deploy D1 database: wrangler d1 create bsi-main-db
2. [ ] Run schema migrations: wrangler d1 execute bsi-main-db --file=./schemas.sql
3. [ ] Create KV namespaces: wrangler kv namespace create BSI_GAMES_KV
4. [ ] Create R2 bucket: wrangler r2 bucket create bsi-assets
5. [ ] Deploy bsi-games-api: cd workers/bsi-games-api && wrangler deploy
6. [ ] Deploy bsi-teams-api: cd workers/bsi-teams-api && wrangler deploy
7. [ ] Deploy bsi-content-api: cd workers/bsi-content-api && wrangler deploy
8. [ ] Deploy frontend to Cloudflare Pages
9. [ ] Configure custom domain: blazesportsintel.com
10. [ ] Test all routes on production
11. [ ] Verify mobile responsiveness
12. [ ] Check citation footers on all pages
13. [ ] Validate KV caching with x-cache headers
14. [ ] Run Lighthouse audit (target: 90+ performance)
```
