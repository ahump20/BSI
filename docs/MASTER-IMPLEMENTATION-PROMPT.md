# BSI Master Implementation Prompt

> **One prompt to rule them all.** Use this to generate the complete ESPN-style sports platform for blazesportsintel.com.

---

## Quick Start

Copy this entire prompt into Claude Code to begin implementation:

```
You are building a production-ready ESPN-style sports intelligence platform for blazesportsintel.com.

STACK:
- Frontend: Next.js 14 (App Router) with React Server Components
- Backend: Cloudflare Workers + D1 (SQLite) + KV (cache) + R2 (assets)
- Styling: Tailwind CSS with BSI design tokens
- Data: MLB Stats API, ESPN API, NCAA official sources

DESIGN SYSTEM:
- Background: midnight (#0D0D0D), charcoal (#1A1A1A) for cards
- Brand: burnt orange (#BF5700), ember (#FF6B35) for accents
- Fonts: Oswald (display), Inter (body), monospace for stats
- Mobile-first, dark theme only

ROUTES TO BUILD:

1. SPORT HUBS (MLB, NFL, NCAA Baseball, NCAA Football):
   /{sport}/ - Hub with scoreboard, news, standings preview
   /{sport}/scores - Full daily scoreboard with date picker
   /{sport}/standings - Conference/division standings with sorts
   /{sport}/stats - League stat leaders by category
   /{sport}/news - Aggregated news feed
   /{sport}/schedule - Full season schedule

2. TEAM PAGES:
   /{sport}/teams/{teamSlug}/ - Team hub with recent results
   /{sport}/teams/{teamSlug}/news - Team-specific news
   /{sport}/teams/{teamSlug}/standings - Conference standings
   /{sport}/teams/{teamSlug}/stats - Team stats leaderboard
   /{sport}/teams/{teamSlug}/roster - Full roster grid
   /{sport}/teams/{teamSlug}/depth-chart - Lineup card style
   /{sport}/teams/{teamSlug}/schedule - Team schedule

3. GAME PAGES:
   /{sport}/game/{gameId}/ - Game hub (redirect based on status)
   /{sport}/game/{gameId}/recap - Post-game recap + highlights
   /{sport}/game/{gameId}/boxscore - Full box score
   /{sport}/game/{gameId}/playbyplay - Pitch/play-by-play feed
   /{sport}/game/{gameId}/team-stats - H2H team comparison
   /{sport}/game/{gameId}/videos - Game highlights

4. PLAYER PAGES:
   /{sport}/player/{playerId}/ - Player profile
   /{sport}/player/{playerId}/stats - Career/season stats
   /{sport}/player/{playerId}/gamelog - Game-by-game log

COMPONENTS NEEDED:

1. Layout Components:
   - SportPageShell (wrapper with sport-specific subnav)
   - GamePageLayout (game header + tab nav)
   - TeamPageLayout (team header + tab nav)
   - TabNavigation (ESPN-style horizontal tabs)

2. Data Display:
   - Scoreboard (date picker + game cards)
   - ScoreCard (individual game with live updates)
   - StandingsTable (sortable, filterable)
   - BoxScore (linescore + batting + pitching)
   - PlayByPlay (filterable feed)
   - StatsLeaderboard (category tabs)
   - DataTable (generic sortable table)

3. Team Components:
   - RosterGrid (position-grouped player cards)
   - DepthChart (lineup card style)
   - TeamSchedule (calendar or list view)
   - TeamStatsTable (season stats)

4. Content Components:
   - NewsFeed (hero + grid layout)
   - ArticleCard (thumbnail + headline)
   - VideoGrid (thumbnail gallery)
   - VideoPlayer (modal player)

5. Shared:
   - PlayerCard (headshot + key stats)
   - TeamLogo (with fallback)
   - Citation (source + timestamp)
   - LoadingSkeleton (per component)

API ENDPOINTS (Cloudflare Workers):

Games:
- GET /api/{sport}/scoreboard?date=YYYYMMDD
- GET /api/{sport}/game/{gameId}
- GET /api/{sport}/game/{gameId}/boxscore
- GET /api/{sport}/game/{gameId}/plays
- GET /api/{sport}/game/{gameId}/recap

Teams:
- GET /api/{sport}/teams
- GET /api/{sport}/team/{teamId}
- GET /api/{sport}/team/{teamId}/roster
- GET /api/{sport}/team/{teamId}/stats
- GET /api/{sport}/team/{teamId}/schedule
- GET /api/{sport}/team/{teamId}/depth-chart

Standings & Stats:
- GET /api/{sport}/standings?conference={id}
- GET /api/{sport}/stats/leaders?category={cat}

News & Videos:
- GET /api/news?sport={sport}&team={teamId}
- GET /api/videos?sport={sport}&game={gameId}

RULES:
1. NO PLACEHOLDERS - All components must fetch real data
2. MOBILE FIRST - Touch gestures, swipe between tabs
3. CITATIONS REQUIRED - Every data display needs source + timestamp
4. DARK THEME ONLY - No light mode
5. PERFORMANCE - <3s LCP, skeleton loaders, virtualized lists
6. ACCESSIBILITY - ARIA labels, keyboard nav, focus management

START WITH: The scoreboard component and /mlb/scores route.
```

---

## Phase-by-Phase Implementation

### Phase 1: Foundation & Scoreboard

**Goal:** Build the daily scoreboard - it's the landing page for each sport.

**Files to create:**
```
app/mlb/scores/page.tsx
components/scoreboard/Scoreboard.tsx
components/scoreboard/ScoreCard.tsx
components/scoreboard/DatePicker.tsx
lib/api/mlb.ts
workers/bsi-mlb-api/index.ts
```

**Prompt:**
```
Build the MLB scoreboard page for blazesportsintel.com.

Features:
1. Date picker (prev/today/next navigation)
2. Game cards grouped by status (Live, Final, Upcoming)
3. Real-time updates for live games (10s polling)
4. Click card to navigate to game detail

ScoreCard shows:
- Team logos and names
- Score (large for final/live, hidden for upcoming)
- Game status (LIVE - Top 7th, FINAL, 7:10 PM CT)
- Situation for live games (runners, outs)
- Broadcast info

API: /api/mlb/scoreboard?date=20250315
Cache: 30s for live games, 5min for final/scheduled

Use design tokens:
- bg-midnight, card-charcoal
- text-white, text-white/70, text-white/40
- accent-burnt-orange for live indicator
- font-display (Oswald) for scores
```

### Phase 2: Standings

**Goal:** Full standings page with conference/division views.

**Files:**
```
app/mlb/standings/page.tsx
components/standings/StandingsPage.tsx
components/standings/StandingsTable.tsx
components/standings/ConferenceSelector.tsx
```

**Prompt:**
```
Build the MLB standings page for blazesportsintel.com.

Features:
1. Division/League/Wild Card view tabs
2. Sortable columns (W, L, PCT, GB, STRK, etc.)
3. Movement indicators (up/down arrows)
4. Clinch indicators (playoff secured)
5. Followed team highlight (localStorage)

Columns:
# | Team | W | L | PCT | GB | HOME | AWAY | RS | RA | DIFF | STRK | L10

Mobile: Horizontal scroll with frozen team column

API: /api/mlb/standings?type=division
Cache: 5 minutes
```

### Phase 3: Box Score

**Goal:** Complete box score for finished games.

**Files:**
```
app/mlb/game/[gameId]/boxscore/page.tsx
components/boxscore/BoxScorePage.tsx
components/boxscore/Linescore.tsx
components/boxscore/BattingTable.tsx
components/boxscore/PitchingTable.tsx
```

**Prompt:**
```
Build the MLB box score page for blazesportsintel.com.

Sections:
1. Game header (teams, final score, date/venue)
2. Tab navigation (Recap | Box Score | Play-by-Play | etc.)
3. Linescore (inning-by-inning with R/H/E)
4. Away batting table
5. Away pitching table
6. Home batting table
7. Home pitching table
8. Game notes (2B, 3B, HR details)

Batting columns: Player, AB, R, H, RBI, BB, SO, AVG
Pitching columns: Pitcher, IP, H, R, ER, BB, SO, PC-S, ERA

Highlight:
- Multi-hit games (green)
- Winning/losing pitcher (W/L badge)
- Home runs (bold)

API: /api/mlb/game/{gameId}/boxscore
```

### Phase 4: Play-by-Play

**Goal:** Pitch-by-pitch or play-by-play feed.

**Files:**
```
app/mlb/game/[gameId]/playbyplay/page.tsx
components/playbyplay/PlayByPlayPage.tsx
components/playbyplay/PlayList.tsx
components/playbyplay/PlayCard.tsx
components/playbyplay/InningHeader.tsx
```

**Prompt:**
```
Build the MLB play-by-play page for blazesportsintel.com.

Features:
1. Inning filter (dropdown or pills)
2. Team filter (Away | All | Home)
3. Scoring plays only toggle
4. Sticky inning headers as you scroll
5. Scoring plays highlighted (burnt orange border)

Each play shows:
- Batter vs Pitcher
- Pitch sequence (if available)
- Result description
- Running score (after scoring plays)

For live games:
- Auto-refresh every 10 seconds
- New play animation (slide in)
- "Following live" indicator

API: /api/mlb/game/{gameId}/plays?inning=5&scoring_only=true
```

### Phase 5: Team Pages

**Goal:** Complete team hub with all sub-routes.

**Files:**
```
app/mlb/teams/[teamSlug]/page.tsx
app/mlb/teams/[teamSlug]/roster/page.tsx
app/mlb/teams/[teamSlug]/stats/page.tsx
app/mlb/teams/[teamSlug]/schedule/page.tsx
app/mlb/teams/[teamSlug]/depth-chart/page.tsx
components/team/TeamHeader.tsx
components/team/TeamPageLayout.tsx
components/roster/RosterPage.tsx
components/depthchart/DepthChartPage.tsx
```

**Prompt:**
```
Build the MLB team pages for blazesportsintel.com.

Team Hub shows:
- Team header (logo, name, record, conference)
- Tab nav: News | Standings | Stats | Roster | Depth Chart | Schedule
- Recent results (last 5 games)
- Next game preview
- News feed preview

Roster Page:
- Position filter (All | Pitchers | Catchers | Infielders | Outfielders)
- Sort by: Number | Name | Position | Class
- Player cards with headshot, number, name, position, B/T, class

Depth Chart:
- Lineup card style for position players
- Rotation (Fri/Sat/Sun/Midweek starters)
- Bullpen by role (Closer, Setup, Middle Relief)

Schedule:
- Calendar or list view toggle
- Filter by home/away
- Results with scores
- Broadcast info
```

### Phase 6: Stats Leaders

**Goal:** League-wide stat leaders with categories.

**Files:**
```
app/mlb/stats/page.tsx
components/stats/StatsLeadersPage.tsx
components/stats/LeaderCard.tsx
components/stats/CategoryTabs.tsx
```

**Prompt:**
```
Build the MLB stats leaders page for blazesportsintel.com.

Categories (Batting):
- AVG, HR, RBI, R, H, SB, OBP, SLG, OPS

Categories (Pitching):
- ERA, W, SO, SV, WHIP, IP, K/9

Features:
1. Batting/Pitching tab toggle
2. Category sub-tabs
3. Top 25 leaders per category
4. Player card: rank, headshot, name, team, stat value
5. Qualified indicator + explanation tooltip
6. Load more pagination

API: /api/mlb/stats/leaders?category=batting_avg&limit=25
```

### Phase 7: News & Videos

**Goal:** Content feeds for articles and video highlights.

**Files:**
```
app/mlb/news/page.tsx
components/news/NewsFeed.tsx
components/news/ArticleCard.tsx
components/news/FeaturedArticle.tsx
app/mlb/game/[gameId]/videos/page.tsx
components/videos/VideoGrid.tsx
components/videos/VideoPlayer.tsx
```

**Prompt:**
```
Build news and video components for blazesportsintel.com.

News Feed:
- Hero article (large thumbnail, headline, excerpt)
- Article grid (2 cols desktop, 1 mobile)
- Category filter (All | Recaps | Analysis | Transactions)
- Infinite scroll

Video Grid:
- Thumbnail with play button overlay
- Duration badge
- Title (2 lines max)
- Category tag
- Click to open modal player

Video Player Modal:
- Full-width video
- Title and description
- Related videos sidebar
```

---

## API Worker Template

Use this template for all Cloudflare Workers:

```typescript
// workers/bsi-{sport}-api/index.ts

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { cache } from 'hono/cache';

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  ASSETS: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS for blazesportsintel.com
app.use('*', cors({
  origin: ['https://blazesportsintel.com', 'http://localhost:3000'],
}));

// Cache middleware
app.use('/api/*', cache({
  cacheName: 'bsi-api-cache',
  cacheControl: 'max-age=60',
}));

// Health check
app.get('/api/health', (c) => c.json({ status: 'healthy', timestamp: new Date().toISOString() }));

// Scoreboard
app.get('/api/:sport/scoreboard', async (c) => {
  const sport = c.req.param('sport');
  const date = c.req.query('date') || getTodayDate();

  // Check KV cache first
  const cacheKey = `scoreboard:${sport}:${date}`;
  const cached = await c.env.CACHE.get(cacheKey);
  if (cached) {
    return c.json(JSON.parse(cached));
  }

  // Fetch from upstream API
  const games = await fetchGames(sport, date);

  // Cache for 30s (live games) or 5min (no live)
  const hasLive = games.some(g => g.status === 'live');
  await c.env.CACHE.put(cacheKey, JSON.stringify(games), {
    expirationTtl: hasLive ? 30 : 300,
  });

  return c.json(games);
});

// Game detail
app.get('/api/:sport/game/:gameId', async (c) => {
  const { sport, gameId } = c.req.param();
  // ... fetch and return game data
});

// Box score
app.get('/api/:sport/game/:gameId/boxscore', async (c) => {
  const { sport, gameId } = c.req.param();
  // ... fetch and return box score
});

// Plays
app.get('/api/:sport/game/:gameId/plays', async (c) => {
  const { sport, gameId } = c.req.param();
  const inning = c.req.query('inning');
  const scoringOnly = c.req.query('scoring_only') === 'true';
  // ... fetch and return plays with filters
});

// Standings
app.get('/api/:sport/standings', async (c) => {
  const sport = c.req.param('sport');
  const conference = c.req.query('conference');
  const type = c.req.query('type') || 'division';
  // ... fetch and return standings
});

// Team endpoints
app.get('/api/:sport/team/:teamId', async (c) => { /* ... */ });
app.get('/api/:sport/team/:teamId/roster', async (c) => { /* ... */ });
app.get('/api/:sport/team/:teamId/stats', async (c) => { /* ... */ });
app.get('/api/:sport/team/:teamId/schedule', async (c) => { /* ... */ });
app.get('/api/:sport/team/:teamId/depth-chart', async (c) => { /* ... */ });

// Stats leaders
app.get('/api/:sport/stats/leaders', async (c) => {
  const sport = c.req.param('sport');
  const category = c.req.query('category');
  const limit = parseInt(c.req.query('limit') || '25');
  // ... fetch and return leaders
});

export default app;
```

---

## Component Template

Use this pattern for all React components:

```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';

interface ComponentNameProps {
  // Props interface
}

async function fetchData(params: Params) {
  const res = await fetch(`/api/endpoint?${new URLSearchParams(params)}`);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

export function ComponentName({ prop1, prop2 }: ComponentNameProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['key', prop1, prop2],
    queryFn: () => fetchData({ prop1, prop2 }),
    refetchInterval: 30_000, // For live data
    staleTime: 60_000,
  });

  if (error) {
    return (
      <div className="p-4 text-center text-white/50">
        Unable to load data. Please try again.
      </div>
    );
  }

  if (isLoading) {
    return <ComponentNameSkeleton />;
  }

  return (
    <div className="bg-charcoal rounded-lg p-4">
      {/* Component content */}

      <Citation source="MLB Stats API" fetchedAt={data.meta.fetchedAt} />
    </div>
  );
}

function ComponentNameSkeleton() {
  return (
    <div className="bg-charcoal rounded-lg p-4 space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
```

---

## Deployment Checklist

Before deploying each phase:

- [ ] All routes return 200
- [ ] API endpoints respond < 200ms
- [ ] No console errors
- [ ] Mobile layout works (test at 375px)
- [ ] Tab navigation works
- [ ] Loading skeletons appear
- [ ] Error states handle gracefully
- [ ] Citations include source and timestamp
- [ ] Images load from R2
- [ ] Cache headers are set

---

## File to Copy

Copy these from the downloaded archives:
1. `bsi-uiux-architecture.md` → `docs/`
2. `bsi-component-prompts.md` → `docs/`
3. `bsi-cloudflare-platform.skill` → `.claude/skills/`

---

*Generated: December 2025*
