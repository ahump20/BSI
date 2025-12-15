# BSI Master Prompt Architecture — Production Build System

## Overview

This document is the single source of truth for building Blaze Sports Intel's ESPN-grade sports platform. Each section contains production-ready prompts, component specifications, Worker APIs, and D1 schemas that can be executed sequentially to build the complete system.

**Stack**: Cloudflare Workers + D1 + KV + R2 | Vanilla JS/HTML (no framework dependencies) | Mobile-first responsive

**Sports Coverage**: College Baseball (primary), MLB, NCAA Football, NFL, NBA

---

## Design System Tokens

```css
:root {
  /* BSI Brand */
  --bsi-burnt-orange: #BF5700;
  --bsi-texas-soil: #8B4513;
  --bsi-charcoal: #1A1A1A;
  --bsi-midnight: #0D0D0D;
  --bsi-ember: #FF6B35;
  --bsi-cream: #F5F5DC;
  
  /* Functional */
  --bsi-win: #22C55E;
  --bsi-loss: #EF4444;
  --bsi-live: #EF4444;
  --bsi-neutral: #6B7280;
  --bsi-highlight: rgba(191, 87, 0, 0.15);
  
  /* Typography */
  --font-display: 'Oswald', sans-serif;
  --font-body: 'Source Sans Pro', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Spacing Scale */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;
  
  /* Layout */
  --header-height: 56px;
  --nav-height: 48px;
  --max-width: 1280px;
  --border-subtle: 1px solid rgba(255,255,255,0.1);
  --border-accent: 2px solid var(--bsi-burnt-orange);
}
```

---

## Route Architecture

### Sport Hub Routes (/:sport/*)
```
/college-baseball/scoreboard    → Daily scores (default landing)
/college-baseball/standings     → Conference standings
/college-baseball/stats         → Stat leaderboards
/college-baseball/rankings      → D1 Baseball Top 25
/college-baseball/news          → News feed

/mlb/scoreboard
/mlb/standings
/mlb/stats
/mlb/news

/ncaa-football/scoreboard
/ncaa-football/standings
/ncaa-football/stats
/ncaa-football/rankings
/ncaa-football/news

/nfl/scoreboard
/nfl/standings
/nfl/stats
/nfl/news

/nba/scoreboard
/nba/standings
/nba/stats
/nba/news
```

### Game Routes (/games/:gameId/*)
```
/games/:gameId/recap           → Post-game summary + highlights
/games/:gameId/box-score       → Full box score (linescore + player stats)
/games/:gameId/play-by-play    → Pitch-by-pitch / play-by-play feed
/games/:gameId/team-stats      → Head-to-head team comparison
```

### Team Routes (/teams/:teamId/*)
```
/teams/:teamId/news            → Team-specific news
/teams/:teamId/standings       → Conference standings (team highlighted)
/teams/:teamId/stats           → Team stat leaders
/teams/:teamId/roster          → Full roster with player cards
/teams/:teamId/depth-chart     → Starting lineup + rotation
/teams/:teamId/schedule        → Full season schedule
/teams/:teamId/videos          → Highlights and press conferences
```

---

## D1 Database Schema

### Core Tables

```sql
-- Games table (all sports)
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  sport TEXT NOT NULL,
  espn_id TEXT UNIQUE,
  home_team_id TEXT NOT NULL,
  away_team_id TEXT NOT NULL,
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'scheduled',
  scheduled_at TEXT NOT NULL,
  venue TEXT,
  attendance INTEGER,
  weather TEXT,
  broadcast TEXT,
  payload_json TEXT,
  source TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE INDEX idx_games_sport_date ON games(sport, scheduled_at);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_teams ON games(home_team_id, away_team_id);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  sport TEXT NOT NULL,
  espn_id TEXT,
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  display_name TEXT NOT NULL,
  conference TEXT,
  division TEXT,
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  venue TEXT,
  city TEXT,
  state TEXT,
  payload_json TEXT,
  source TEXT NOT NULL,
  fetched_at TEXT NOT NULL
);

CREATE INDEX idx_teams_sport ON teams(sport);
CREATE INDEX idx_teams_conference ON teams(conference);
CREATE UNIQUE INDEX idx_teams_espn ON teams(sport, espn_id);

-- Standings table
CREATE TABLE IF NOT EXISTS standings (
  id INTEGER PRIMARY KEY,
  team_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  season INTEGER NOT NULL,
  conference TEXT,
  conf_wins INTEGER DEFAULT 0,
  conf_losses INTEGER DEFAULT 0,
  overall_wins INTEGER DEFAULT 0,
  overall_losses INTEGER DEFAULT 0,
  home_wins INTEGER DEFAULT 0,
  home_losses INTEGER DEFAULT 0,
  away_wins INTEGER DEFAULT 0,
  away_losses INTEGER DEFAULT 0,
  streak TEXT,
  last_10 TEXT,
  games_back REAL,
  rpi REAL,
  ranking INTEGER,
  source TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  UNIQUE(team_id, sport, season)
);

CREATE INDEX idx_standings_sport_season ON standings(sport, season);
CREATE INDEX idx_standings_conference ON standings(conference);

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  espn_id TEXT,
  name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  number TEXT,
  position TEXT,
  height TEXT,
  weight INTEGER,
  birth_date TEXT,
  birth_place TEXT,
  college TEXT,
  class TEXT,
  bats TEXT,
  throws TEXT,
  headshot_url TEXT,
  payload_json TEXT,
  source TEXT NOT NULL,
  fetched_at TEXT NOT NULL
);

CREATE INDEX idx_players_team ON players(team_id);
CREATE INDEX idx_players_sport ON players(sport);
CREATE INDEX idx_players_position ON players(position);

-- Player stats table
CREATE TABLE IF NOT EXISTS player_stats (
  id INTEGER PRIMARY KEY,
  player_id TEXT NOT NULL,
  game_id TEXT,
  sport TEXT NOT NULL,
  season INTEGER NOT NULL,
  stat_type TEXT NOT NULL,
  stats_json TEXT NOT NULL,
  source TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  UNIQUE(player_id, game_id, stat_type)
);

CREATE INDEX idx_stats_player ON player_stats(player_id);
CREATE INDEX idx_stats_game ON player_stats(game_id);
CREATE INDEX idx_stats_season ON player_stats(season, stat_type);

-- Box scores table
CREATE TABLE IF NOT EXISTS box_scores (
  id INTEGER PRIMARY KEY,
  game_id TEXT NOT NULL UNIQUE,
  sport TEXT NOT NULL,
  linescore_json TEXT,
  home_batting_json TEXT,
  away_batting_json TEXT,
  home_pitching_json TEXT,
  away_pitching_json TEXT,
  home_stats_json TEXT,
  away_stats_json TEXT,
  source TEXT NOT NULL,
  fetched_at TEXT NOT NULL
);

CREATE INDEX idx_boxscores_game ON box_scores(game_id);

-- Play-by-play table
CREATE TABLE IF NOT EXISTS plays (
  id INTEGER PRIMARY KEY,
  game_id TEXT NOT NULL,
  play_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  period INTEGER,
  period_type TEXT,
  sequence INTEGER,
  clock TEXT,
  description TEXT,
  score_home INTEGER,
  score_away INTEGER,
  is_scoring INTEGER DEFAULT 0,
  payload_json TEXT,
  source TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  UNIQUE(game_id, play_id)
);

CREATE INDEX idx_plays_game ON plays(game_id, sequence);
CREATE INDEX idx_plays_scoring ON plays(game_id, is_scoring);

-- News/articles table
CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  sport TEXT NOT NULL,
  team_id TEXT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  summary TEXT,
  content TEXT,
  author TEXT,
  image_url TEXT,
  category TEXT,
  tags TEXT,
  published_at TEXT NOT NULL,
  source TEXT NOT NULL,
  source_url TEXT,
  fetched_at TEXT NOT NULL
);

CREATE INDEX idx_articles_sport ON articles(sport, published_at DESC);
CREATE INDEX idx_articles_team ON articles(team_id, published_at DESC);
CREATE INDEX idx_articles_category ON articles(category);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  sport TEXT NOT NULL,
  team_id TEXT,
  game_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  video_url TEXT,
  duration INTEGER,
  category TEXT,
  published_at TEXT NOT NULL,
  source TEXT NOT NULL,
  fetched_at TEXT NOT NULL
);

CREATE INDEX idx_videos_sport ON videos(sport, published_at DESC);
CREATE INDEX idx_videos_team ON videos(team_id, published_at DESC);
CREATE INDEX idx_videos_game ON videos(game_id);

-- Depth charts table (baseball-focused)
CREATE TABLE IF NOT EXISTS depth_charts (
  id INTEGER PRIMARY KEY,
  team_id TEXT NOT NULL,
  sport TEXT NOT NULL,
  season INTEGER NOT NULL,
  position TEXT NOT NULL,
  depth INTEGER NOT NULL DEFAULT 1,
  player_id TEXT NOT NULL,
  role TEXT,
  notes TEXT,
  source TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  UNIQUE(team_id, season, position, depth)
);

CREATE INDEX idx_depth_team ON depth_charts(team_id, season);
```

---

## Worker API Specifications

### bsi-games-api

**Deployment**: `wrangler deploy --name bsi-games-api`

```typescript
// workers/bsi-games-api/src/index.ts

export interface Env {
  BSI_GAMES_KV: KVNamespace;
  BSI_D1: D1Database;
}

interface GameResponse {
  meta: {
    source: string;
    fetched_at: string;
    timezone: 'America/Chicago';
    cache_status: 'hit' | 'miss';
  };
  data: unknown;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Content-Type': 'application/json; charset=utf-8'
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route handlers
      if (path.match(/^\/api\/games\/([^/]+)$/)) {
        const gameId = path.split('/')[3];
        return handleGetGame(gameId, env, corsHeaders);
      }
      
      if (path.match(/^\/api\/games\/([^/]+)\/box-score$/)) {
        const gameId = path.split('/')[3];
        return handleGetBoxScore(gameId, env, corsHeaders);
      }
      
      if (path.match(/^\/api\/games\/([^/]+)\/plays$/)) {
        const gameId = path.split('/')[3];
        const inning = url.searchParams.get('inning');
        const scoringOnly = url.searchParams.get('scoring_only') === 'true';
        return handleGetPlays(gameId, inning, scoringOnly, env, corsHeaders);
      }
      
      if (path.match(/^\/api\/games\/([^/]+)\/team-stats$/)) {
        const gameId = path.split('/')[3];
        return handleGetTeamStats(gameId, env, corsHeaders);
      }
      
      if (path === '/api/scoreboard') {
        const sport = url.searchParams.get('sport') || 'college-baseball';
        const date = url.searchParams.get('date');
        return handleGetScoreboard(sport, date, env, corsHeaders);
      }
      
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: corsHeaders
      });
      
    } catch (error) {
      console.error('API Error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }
};

async function handleGetScoreboard(
  sport: string, 
  date: string | null, 
  env: Env, 
  headers: Record<string, string>
): Promise<Response> {
  const cacheKey = `scoreboard:${sport}:${date || 'today'}`;
  
  // Check KV cache
  const cached = await env.BSI_GAMES_KV.get(cacheKey, 'json');
  if (cached) {
    return new Response(JSON.stringify({
      meta: { ...cached.meta, cache_status: 'hit' },
      data: cached.data
    }), { headers: { ...headers, 'x-cache': 'hit' } });
  }
  
  // Map sport to ESPN endpoint
  const sportEndpoints: Record<string, string> = {
    'college-baseball': 'baseball/college-baseball',
    'mlb': 'baseball/mlb',
    'ncaa-football': 'football/college-football',
    'nfl': 'football/nfl',
    'nba': 'basketball/nba'
  };
  
  const endpoint = sportEndpoints[sport];
  if (!endpoint) {
    return new Response(JSON.stringify({ error: 'Invalid sport' }), {
      status: 400, headers
    });
  }
  
  let apiUrl = `https://site.api.espn.com/apis/site/v2/sports/${endpoint}/scoreboard`;
  if (date) apiUrl += `?dates=${date}`;
  
  const res = await fetch(apiUrl, {
    headers: { 'User-Agent': 'Blaze-Sports-Intel/1.0' }
  });
  
  if (!res.ok) throw new Error(`ESPN API returned ${res.status}`);
  
  const raw = await res.json();
  const ts = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
  
  const response: GameResponse = {
    meta: {
      source: `ESPN ${sport}`,
      fetched_at: ts,
      timezone: 'America/Chicago',
      cache_status: 'miss'
    },
    data: {
      events: raw.events || [],
      leagues: raw.leagues,
      season: raw.season
    }
  };
  
  // Cache for 30 seconds (live data)
  await env.BSI_GAMES_KV.put(cacheKey, JSON.stringify(response), {
    expirationTtl: 30
  });
  
  return new Response(JSON.stringify(response), {
    headers: { ...headers, 'x-cache': 'miss' }
  });
}

// Additional handler implementations...
```

**Endpoints**:
- `GET /api/scoreboard?sport=college-baseball&date=YYYYMMDD`
- `GET /api/games/:gameId`
- `GET /api/games/:gameId/box-score`
- `GET /api/games/:gameId/plays?inning=5&scoring_only=true`
- `GET /api/games/:gameId/team-stats`

---

### bsi-teams-api

```typescript
// workers/bsi-teams-api/src/index.ts

export interface Env {
  BSI_TEAMS_KV: KVNamespace;
  BSI_D1: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Content-Type': 'application/json; charset=utf-8'
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // GET /api/teams/:teamId
      if (path.match(/^\/api\/teams\/([^/]+)$/)) {
        const teamId = path.split('/')[3];
        return handleGetTeam(teamId, env, corsHeaders);
      }
      
      // GET /api/teams/:teamId/roster
      if (path.match(/^\/api\/teams\/([^/]+)\/roster$/)) {
        const teamId = path.split('/')[3];
        const position = url.searchParams.get('position');
        return handleGetRoster(teamId, position, env, corsHeaders);
      }
      
      // GET /api/teams/:teamId/stats
      if (path.match(/^\/api\/teams\/([^/]+)\/stats$/)) {
        const teamId = path.split('/')[3];
        const statType = url.searchParams.get('type') || 'batting';
        return handleGetTeamStats(teamId, statType, env, corsHeaders);
      }
      
      // GET /api/teams/:teamId/schedule
      if (path.match(/^\/api\/teams\/([^/]+)\/schedule$/)) {
        const teamId = path.split('/')[3];
        const season = url.searchParams.get('season');
        return handleGetSchedule(teamId, season, env, corsHeaders);
      }
      
      // GET /api/teams/:teamId/depth-chart
      if (path.match(/^\/api\/teams\/([^/]+)\/depth-chart$/)) {
        const teamId = path.split('/')[3];
        return handleGetDepthChart(teamId, env, corsHeaders);
      }
      
      // GET /api/standings
      if (path === '/api/standings') {
        const sport = url.searchParams.get('sport') || 'college-baseball';
        const conference = url.searchParams.get('conference');
        return handleGetStandings(sport, conference, env, corsHeaders);
      }
      
      // GET /api/stats/leaders
      if (path === '/api/stats/leaders') {
        const sport = url.searchParams.get('sport') || 'college-baseball';
        const category = url.searchParams.get('category') || 'avg';
        const limit = parseInt(url.searchParams.get('limit') || '25');
        return handleGetLeaders(sport, category, limit, env, corsHeaders);
      }
      
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404, headers: corsHeaders
      });
      
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Server error' }), {
        status: 500, headers: corsHeaders
      });
    }
  }
};
```

**Endpoints**:
- `GET /api/teams/:teamId`
- `GET /api/teams/:teamId/roster?position=P`
- `GET /api/teams/:teamId/stats?type=batting`
- `GET /api/teams/:teamId/schedule?season=2025`
- `GET /api/teams/:teamId/depth-chart`
- `GET /api/standings?sport=college-baseball&conference=big-12`
- `GET /api/stats/leaders?sport=college-baseball&category=avg&limit=25`

---

### bsi-content-api

```typescript
// workers/bsi-content-api/src/index.ts

export interface Env {
  BSI_CONTENT_KV: KVNamespace;
  BSI_D1: D1Database;
  BSI_R2: R2Bucket;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json; charset=utf-8'
    };

    try {
      // GET /api/news
      if (path === '/api/news') {
        const sport = url.searchParams.get('sport');
        const teamId = url.searchParams.get('team');
        const category = url.searchParams.get('category');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        return handleGetNews(sport, teamId, category, limit, offset, env, corsHeaders);
      }
      
      // GET /api/news/:slug
      if (path.match(/^\/api\/news\/([^/]+)$/)) {
        const slug = path.split('/')[3];
        return handleGetArticle(slug, env, corsHeaders);
      }
      
      // GET /api/videos
      if (path === '/api/videos') {
        const sport = url.searchParams.get('sport');
        const teamId = url.searchParams.get('team');
        const gameId = url.searchParams.get('game');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        return handleGetVideos(sport, teamId, gameId, limit, env, corsHeaders);
      }
      
      // GET /api/videos/:id
      if (path.match(/^\/api\/videos\/([^/]+)$/)) {
        const videoId = path.split('/')[3];
        return handleGetVideo(videoId, env, corsHeaders);
      }
      
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404, headers: corsHeaders
      });
      
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Server error' }), {
        status: 500, headers: corsHeaders
      });
    }
  }
};
```

**Endpoints**:
- `GET /api/news?sport=college-baseball&team=texas&limit=20&offset=0`
- `GET /api/news/:slug`
- `GET /api/videos?sport=college-baseball&team=texas&game=12345&limit=20`
- `GET /api/videos/:id`

---

## Component Build Prompts

### PROMPT 1: Scoreboard Page

```
Build the /:sport/scoreboard page for blazesportsintel.com.

CONTEXT:
- This is the default landing page for each sport
- Shows all games for the selected date
- ESPN-style score cards in a responsive grid

REQUIREMENTS:
1. Date navigation (prev/today/next buttons + date picker)
2. Game cards showing:
   - Team logos + names
   - Current score or game time
   - Status badge (LIVE/FINAL/time)
   - Venue info
   - Click to navigate to /games/:gameId/recap
3. Filter by conference (for college sports)
4. Auto-refresh every 30 seconds for live games

DATA:
- Fetch from: GET /api/scoreboard?sport={sport}&date={YYYYMMDD}
- Response includes events[] with competitions, competitors, status

DESIGN:
- Dark theme (--bsi-midnight background)
- Score cards on --bsi-charcoal
- Live games get --bsi-live pulse indicator
- Winning team score highlighted in --bsi-win
- Mobile: 1 column, Tablet: 2 columns, Desktop: 3-4 columns

OUTPUT: Single HTML file with embedded CSS/JS, no external dependencies except Google Fonts
```

---

### PROMPT 2: Box Score Page

```
Build the /games/:gameId/box-score page for blazesportsintel.com.

CONTEXT:
- Most important game page—validates the complete data pipeline
- Baseball-specific: linescore + batting + pitching tables
- Football/Basketball: different stat categories

REQUIREMENTS:
1. Game header showing:
   - Team logos + names
   - Final score (large, prominent)
   - Game status, date, venue
2. Tab navigation: Recap | Box Score | Play-by-Play | Team Stats
3. Linescore table:
   - Innings 1-9+ across columns
   - R/H/E totals
   - Sticky team column on mobile horizontal scroll
4. Batting tables (one per team):
   - Player name + position
   - AB, R, H, RBI, BB, SO, AVG
   - Totals row
   - Sortable columns
5. Pitching tables (one per team):
   - Player name + decision (W/L/S)
   - IP, H, R, ER, BB, SO, ERA
   - Pitch count if available

DATA:
- Fetch from: GET /api/games/:gameId/box-score
- Response includes linescore, batting[], pitching[] for both teams

DESIGN:
- Tables use --font-mono for numbers
- Highlight player with notable game (3+ H, 10+ K)
- Decision badges: W=green, L=red, S=orange
- Sticky headers on vertical scroll
- Horizontal scroll for wide tables on mobile

OUTPUT: Complete HTML with game header + tab nav + box score component
```

---

### PROMPT 3: Play-by-Play Page

```
Build the /games/:gameId/play-by-play page for blazesportsintel.com.

CONTEXT:
- Pitch-by-pitch for baseball, play-by-play for football/basketball
- College baseball: This is the BIG opportunity—ESPN barely covers this
- Must handle both live and completed games

REQUIREMENTS:
1. Inherit game header and tab navigation from box-score page
2. Inning/Quarter/Period filter tabs
3. "Scoring plays only" toggle
4. Play feed showing:
   - Inning/period indicator
   - Batter vs Pitcher (baseball) or team/player (other)
   - Play description
   - Running score after scoring plays
   - Timestamp/game clock
5. For baseball, show pitch sequence when expanded:
   - Ball/Strike count progression
   - Pitch types and velocities if available
6. Auto-scroll to live play when game is in progress

DATA:
- Fetch from: GET /api/games/:gameId/plays?inning={n}&scoring_only={bool}
- Response includes plays[] with period, description, score

DESIGN:
- Timeline/feed layout (vertical)
- Scoring plays get orange left border
- Inning dividers with score summary
- Compact by default, expand for details
- Live games: newest plays at top with "NEW" badge

OUTPUT: Complete HTML with play-by-play component
```

---

### PROMPT 4: Team Stats Page

```
Build the /games/:gameId/team-stats page for blazesportsintel.com.

CONTEXT:
- Head-to-head team comparison for a single game
- Aggregate stats, not individual player lines

REQUIREMENTS:
1. Inherit game header and tab navigation
2. Side-by-side comparison layout:
   - Away team stats | Category | Home team stats
   - Visual bar indicators showing percentage split
3. Baseball categories:
   - Batting: AVG, Hits, Runs, RBI, LOB, RISP
   - Pitching: ERA, K, BB, Hits allowed
   - Fielding: Errors, Double plays
4. Football categories:
   - Total yards, Passing yards, Rushing yards
   - First downs, Third down %, Turnovers
   - Time of possession, Penalties
5. Highlight the team winning each category

DATA:
- Fetch from: GET /api/games/:gameId/team-stats
- Response includes home{} and away{} stat objects

DESIGN:
- Horizontal bars showing statistical comparison
- Leading stat highlighted in --bsi-burnt-orange
- Categories grouped logically
- Mobile: Stack vertically with team tabs

OUTPUT: Complete HTML with team stats comparison component
```

---

### PROMPT 5: Recap Page

```
Build the /games/:gameId/recap page for blazesportsintel.com.

CONTEXT:
- Post-game summary for completed games
- Pre-game preview for upcoming games
- Default landing for /games/:gameId

REQUIREMENTS:
1. Inherit game header and tab navigation
2. For FINAL games:
   - Headline (auto-generated or editorial)
   - Final score box
   - Key players section (stars of the game)
   - Game summary (3-4 paragraphs)
   - Scoring summary by inning/quarter
   - Related articles/videos
3. For SCHEDULED games:
   - Matchup preview
   - Recent form (last 5 games)
   - Head-to-head history
   - Projected lineups/starters
   - Weather (outdoor sports)
4. For LIVE games:
   - Current score + situation
   - Recent plays
   - Link to play-by-play
   - Live comments/updates

DATA:
- Fetch from: GET /api/games/:gameId
- Check status field to determine layout

DESIGN:
- Hero section with final score
- Star players get photo + stat highlights
- Clean editorial typography for summary
- Related content in sidebar (desktop) or below (mobile)

OUTPUT: Complete HTML with recap/preview component
```

---

### PROMPT 6: Standings Page

```
Build the /:sport/standings and /teams/:teamId/standings pages for blazesportsintel.com.

CONTEXT:
- Conference/division standings table
- Team page version highlights the selected team's row

REQUIREMENTS:
1. Conference selector dropdown
2. Standings table columns:
   - Rank + team (logo + name)
   - Conference record
   - Overall record
   - Home record
   - Away record
   - Streak (W5, L2, etc.)
   - Games back (if applicable)
3. Sortable by any column
4. Visual indicators:
   - Clinched playoff/tournament
   - Eliminated
   - Selected team row highlight (team page)
5. Rankings badge for ranked teams (college)
6. Date/time of last update

DATA:
- Fetch from: GET /api/standings?sport={sport}&conference={conf}
- Response includes teams[] with all record fields

DESIGN:
- Full-width table on desktop
- Horizontal scroll on mobile with sticky team column
- Streak: green for W, red for L
- Clinch indicator: bullet or icon
- Selected team: --bsi-highlight background

OUTPUT: Complete HTML with standings table component
```

---

### PROMPT 7: Stats Leaderboard Page

```
Build the /:sport/stats and /teams/:teamId/stats pages for blazesportsintel.com.

CONTEXT:
- Statistical leaders across the sport/team
- Category-based tab navigation

REQUIREMENTS:
1. Category tabs:
   - Baseball batting: AVG, HR, RBI, H, R, SB, OPS
   - Baseball pitching: ERA, W, K, WHIP, SV
   - Football: Passing yards, Rushing yards, Receiving yards, Touchdowns
   - Basketball: Points, Rebounds, Assists, Steals, Blocks
2. Leaderboard table:
   - Rank
   - Player name + headshot thumbnail
   - Team (logo + abbrev)
   - Stat value (prominent)
   - Supporting stats (GP, AB/IP for rate stats)
3. Minimum qualifiers note
4. Pagination (25 per page)
5. Team page filters to only that team's players

DATA:
- Fetch from: GET /api/stats/leaders?sport={sport}&category={cat}&limit=25
- Response includes leaders[] with player, team, stats

DESIGN:
- Tab pills for categories
- Table with player photos (small, circular)
- Stat value in --font-mono, larger than other columns
- Top 3 get medal colors (gold/silver/bronze)
- Team page: header shows team context

OUTPUT: Complete HTML with stats leaderboard component
```

---

### PROMPT 8: Roster Page

```
Build the /teams/:teamId/roster page for blazesportsintel.com.

CONTEXT:
- Full team roster with player cards
- Position-based organization

REQUIREMENTS:
1. Team header (inherited from team layout)
2. Position filter dropdown: All | Pitchers | Catchers | Infielders | Outfielders
3. Player cards showing:
   - Headshot (placeholder if unavailable)
   - Number badge
   - Name
   - Position
   - Physical: Height, Weight
   - Class/Experience (college)
   - Hometown/High School
   - B/T (Bats/Throws)
4. Click card to expand stats or link to player page
5. Sort by: Number | Name | Position

DATA:
- Fetch from: GET /api/teams/:teamId/roster?position={pos}
- Response includes players[] with all bio fields

DESIGN:
- Card grid: 1 col mobile, 2 tablet, 3-4 desktop
- Number badge: --bsi-burnt-orange background
- Position group headers when sorted by position
- Hover state: slight lift + border highlight
- Headshot placeholder: team color silhouette

OUTPUT: Complete HTML with roster grid component
```

---

### PROMPT 9: Depth Chart Page

```
Build the /teams/:teamId/depth-chart page for blazesportsintel.com.

CONTEXT:
- Baseball: Lineup card style showing batting order + pitching rotation
- Football: Position-based depth chart
- Focus on baseball since ESPN neglects this

REQUIREMENTS (Baseball):
1. Team header (inherited)
2. Starting Lineup section:
   - Visual diamond showing defensive positions
   - Batting order (1-9) with player + position
   - Click player for stats popup
3. Weekend Rotation:
   - Friday/Saturday/Sunday starters
   - Stats: W-L, ERA, K
4. Bullpen:
   - Closer
   - Setup men
   - Middle relief
   - Long relief
   - Each with recent usage indicator
5. Bench:
   - Backup players by position

DATA:
- Fetch from: GET /api/teams/:teamId/depth-chart
- Response includes lineup[], rotation[], bullpen[], bench[]

DESIGN:
- Baseball diamond graphic for positions
- Lineup card aesthetic (white on dark, clean lines)
- Rotation cards show last outing date
- Color coding for pitcher roles (closer=red, setup=orange, etc.)
- Mobile: collapse diamond to list view

OUTPUT: Complete HTML with depth chart visualization
```

---

### PROMPT 10: Schedule Page

```
Build the /teams/:teamId/schedule page for blazesportsintel.com.

CONTEXT:
- Full season schedule with results
- Calendar and list views

REQUIREMENTS:
1. Team header (inherited)
2. View toggle: List | Calendar
3. Month navigation for calendar view
4. Schedule row showing:
   - Date + time
   - Home/Away indicator (@)
   - Opponent (logo + name)
   - Result (W/L + score) or game time
   - TV/streaming broadcast
   - Conference game indicator
5. Filter: All | Home | Away | Conference
6. Record summary: Overall, Home, Away, Conference
7. Click game to navigate to game page

DATA:
- Fetch from: GET /api/teams/:teamId/schedule?season=2025
- Response includes games[] with opponent, result, broadcast

DESIGN:
- List: Clean rows with alternating backgrounds
- Calendar: Month grid with game indicators
- Won: green background, Lost: red background
- Upcoming: neutral background
- Rivalry games get special styling
- Current/next game highlighted

OUTPUT: Complete HTML with schedule component (both views)
```

---

### PROMPT 11: News Feed Page

```
Build the /:sport/news and /teams/:teamId/news pages for blazesportsintel.com.

CONTEXT:
- News feed with featured article + article list
- Team page filters to team-specific content

REQUIREMENTS:
1. Featured article (hero):
   - Large image
   - Headline
   - Summary excerpt
   - Author + date
   - Click to full article
2. Article list:
   - Thumbnail + headline
   - Category badge
   - Timestamp (relative: "2 hours ago")
   - Brief excerpt on hover/tap
3. Category filter tabs: All | News | Analysis | Interviews | Scores
4. Infinite scroll or pagination
5. Team page: Show team-specific news only

DATA:
- Fetch from: GET /api/news?sport={sport}&team={teamId}&category={cat}
- Response includes articles[] with title, summary, image, author, date

DESIGN:
- Featured: Full-width card with image overlay text
- List: Compact cards, 1 column mobile, 2-3 desktop
- Category badges: color-coded pills
- Hover: title underline + slight image zoom
- Loading skeleton during fetch

OUTPUT: Complete HTML with news feed component
```

---

### PROMPT 12: Videos Page

```
Build the /teams/:teamId/videos page for blazesportsintel.com.

CONTEXT:
- Video grid with highlights, press conferences, features
- Modal player for video playback

REQUIREMENTS:
1. Team header (inherited)
2. Category filter: All | Highlights | Press Conferences | Features
3. Video grid showing:
   - Thumbnail with play button overlay
   - Duration badge
   - Title
   - Date posted
4. Click to open video in modal player
5. Related videos in sidebar (desktop) or below (mobile)
6. Sort by: Most Recent | Most Viewed

DATA:
- Fetch from: GET /api/videos?team={teamId}&category={cat}
- Response includes videos[] with thumbnail, title, duration, url

DESIGN:
- Grid: 1 col mobile, 2 tablet, 3-4 desktop
- Thumbnail aspect ratio: 16:9
- Play button: centered, semi-transparent background
- Duration badge: bottom-right corner
- Modal: dark overlay, centered player, close button

OUTPUT: Complete HTML with video grid + modal player
```

---

## KV Caching Strategy

```typescript
// KV key patterns and TTLs

const KV_PATTERNS = {
  // Live data - short TTL
  'scoreboard:{sport}:{date}': 30,           // 30 seconds
  'game:live:{gameId}': 15,                  // 15 seconds
  'plays:{gameId}:live': 10,                 // 10 seconds
  
  // Near-live data - medium TTL
  'standings:{sport}:{conference}': 300,     // 5 minutes
  'team:{teamId}': 300,                      // 5 minutes
  'roster:{teamId}': 600,                    // 10 minutes
  
  // Static data - long TTL
  'game:final:{gameId}': 3600,               // 1 hour
  'boxscore:{gameId}': 3600,                 // 1 hour
  'schedule:{teamId}:{season}': 3600,        // 1 hour
  'depth-chart:{teamId}': 3600,              // 1 hour
  
  // Content - very long TTL
  'article:{slug}': 86400,                   // 24 hours
  'video:{id}': 86400,                       // 24 hours
  'player:{playerId}': 86400,                // 24 hours
};
```

---

## wrangler.toml Configuration

```toml
# blazesportsintel.com Cloudflare configuration

name = "bsi-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# D1 Database
[[d1_databases]]
binding = "BSI_D1"
database_name = "bsi-main-db"
database_id = "your-d1-database-id"

# KV Namespaces
[[kv_namespaces]]
binding = "BSI_GAMES_KV"
id = "your-games-kv-id"

[[kv_namespaces]]
binding = "BSI_TEAMS_KV"
id = "your-teams-kv-id"

[[kv_namespaces]]
binding = "BSI_CONTENT_KV"
id = "your-content-kv-id"

# R2 Bucket
[[r2_buckets]]
binding = "BSI_R2"
bucket_name = "bsi-assets"

# Routes
[env.production]
routes = [
  { pattern = "api.blazesportsintel.com/*", zone_name = "blazesportsintel.com" }
]

# Dev settings
[dev]
port = 8787
local_protocol = "http"
```

---

## Citation Pattern

Every API response and page must include source attribution:

```typescript
const Citation = {
  source: 'ESPN college-baseball' | 'statsapi.mlb.com' | 'ESPN NFL' | 'ESPN NBA',
  fetched_at: '2025-03-15',  // YYYY-MM-DD
  timezone: 'America/Chicago' as const,
  note?: string
};

// Footer component
`Data: ${source} • Retrieved: ${fetchedAt} CT • About our data`
```

---

## Build Sequence

Execute in this order for optimal dependency resolution:

1. **Infrastructure** (Week 1)
   - Deploy D1 database with all schemas
   - Create KV namespaces
   - Create R2 bucket
   - Deploy bsi-games-api Worker
   - Deploy bsi-teams-api Worker
   - Deploy bsi-content-api Worker

2. **Core Pages** (Week 2)
   - Scoreboard (validates data pipeline)
   - Box Score (most complex, most important)
   - Standings
   - Stats Leaders

3. **Game Pages** (Week 3)
   - Play-by-Play
   - Team Stats
   - Recap

4. **Team Pages** (Week 4)
   - Roster
   - Depth Chart
   - Schedule
   - News
   - Videos

5. **Polish** (Week 5)
   - Loading states
   - Error handling
   - Mobile optimization
   - Performance (LCP < 3s)
   - SEO meta tags

---

## Quality Checklist

Before deploying any component:

- [ ] Mobile-first responsive design tested at 320px, 768px, 1280px
- [ ] Tab navigation works correctly
- [ ] Loading states show skeleton UI
- [ ] Error states display user-friendly messages
- [ ] Citation footer present on every page
- [ ] All data fetched from BSI Workers (no direct ESPN calls from client)
- [ ] KV caching implemented with appropriate TTL
- [ ] D1 persistence for historical data
- [ ] Keyboard navigation works (tab, enter)
- [ ] Color contrast meets WCAG AA
- [ ] Numbers use monospace font
- [ ] Links navigate correctly
- [ ] No console errors
- [ ] Performance: LCP < 3s on 3G
