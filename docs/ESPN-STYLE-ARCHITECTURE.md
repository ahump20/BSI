# ESPN-Style Sports Intelligence Platform Architecture

> **Master Blueprint for blazesportsintel.com UI/UX Overhaul**
>
> This document serves as the complete implementation guide for building ESPN-caliber sports coverage with BSI's unique "Cinematic Grit / Texas Soil / Intel" design language.

---

## Executive Summary

Transform blazesportsintel.com into a premium sports intelligence platform with:

- **Game Pages**: Recap, Box Score, Play-by-Play, Videos tabs
- **Team Pages**: News, Standings, Stats, Roster, Depth Chart, Schedule
- **League Pages**: Scores, Standings, Stats Leaders, News, Schedule
- **Live Experience**: Real-time updates, push notifications, live play-by-play

---

## Route Architecture

### 1. Sport Hub Routes (`/mlb`, `/nfl`, `/ncaa-baseball`, `/ncaa-football`)

```
/{sport}/
├── page.tsx                    # Sport hub (scores, news, standings preview)
├── scores/
│   └── page.tsx               # Full scoreboard with filters
├── standings/
│   └── page.tsx               # Full standings by division/conference
├── stats/
│   └── page.tsx               # League stat leaders
├── news/
│   └── page.tsx               # Sport-specific news feed
├── schedule/
│   └── page.tsx               # Full season schedule
└── teams/
    └── [teamSlug]/
        ├── page.tsx           # Team hub
        ├── roster/
        │   └── page.tsx       # Full roster with filters
        ├── stats/
        │   └── page.tsx       # Team stats breakdown
        ├── schedule/
        │   └── page.tsx       # Team schedule
        ├── depth-chart/
        │   └── page.tsx       # Position depth chart
        └── news/
            └── page.tsx       # Team news feed
```

### 2. Game Detail Routes

```
/{sport}/game/[gameId]/
├── page.tsx                    # Game hub (redirects to recap or gamecast)
├── recap/
│   └── page.tsx               # Post-game recap with highlights
├── boxscore/
│   └── page.tsx               # Full box score
├── playbyplay/
│   └── page.tsx               # Complete play-by-play
├── team-stats/
│   └── page.tsx               # Head-to-head team comparison
└── videos/
    └── page.tsx               # Game highlights and clips
```

### 3. Player Routes

```
/{sport}/player/[playerId]/
├── page.tsx                    # Player profile hub
├── stats/
│   └── page.tsx               # Career and season stats
├── news/
│   └── page.tsx               # Player news
└── gamelog/
    └── page.tsx               # Game-by-game log
```

---

## Component Architecture

### Shared Layout Components

```typescript
// components/sports-layout/SportPageShell.tsx
interface SportPageShellProps {
  sport: 'mlb' | 'nfl' | 'ncaa-baseball' | 'ncaa-football';
  children: React.ReactNode;
  subnav?: SubnavItem[];
}

// Subnav items for sport pages
const MLB_SUBNAV: SubnavItem[] = [
  { label: 'Scores', href: '/mlb/scores' },
  { label: 'Standings', href: '/mlb/standings' },
  { label: 'Stats', href: '/mlb/stats' },
  { label: 'Teams', href: '/mlb/teams' },
  { label: 'Schedule', href: '/mlb/schedule' },
  { label: 'News', href: '/mlb/news' },
];
```

### Game Detail Components

```typescript
// components/game-detail/GamePageLayout.tsx
interface GamePageLayoutProps {
  gameId: string;
  sport: Sport;
  activeTab: GameTab;
  children: React.ReactNode;
}

type GameTab = 'recap' | 'boxscore' | 'playbyplay' | 'teamstats' | 'videos';
```

### Team Page Components

```typescript
// components/team/TeamPageLayout.tsx
interface TeamPageLayoutProps {
  teamId: string;
  sport: Sport;
  activeTab: TeamTab;
  children: React.ReactNode;
}

type TeamTab = 'home' | 'roster' | 'stats' | 'schedule' | 'depth-chart' | 'news';
```

---

## Component Specifications

### 1. Scoreboard Component

```typescript
// components/scoreboard/Scoreboard.tsx
interface ScoreboardProps {
  sport: Sport;
  date?: string; // YYYY-MM-DD format
  showFilters?: boolean;
  variant?: 'compact' | 'full';
}

// Features:
// - Date picker navigation
// - Filter by status (live, final, upcoming)
// - Filter by conference/division
// - Real-time score updates via WebSocket
// - Click-through to game detail
```

### 2. Standings Component (Enhanced)

```typescript
// components/standings/StandingsPage.tsx
interface StandingsPageProps {
  sport: Sport;
  defaultView?: 'division' | 'conference' | 'league' | 'wildcard';
}

// Views:
// - Division standings with detailed stats
// - Conference rankings
// - Wild card race tracker
// - Playoff picture projection
// - Historical comparison

// Columns by sport:
// MLB: W, L, PCT, GB, HOME, AWAY, RS, RA, DIFF, STRK, L10
// NFL: W, L, T, PCT, PF, PA, DIFF, HOME, AWAY, DIV, CONF, STRK
// NCAA: W, L, CONF, PCT, HOME, AWAY, NEUTRAL, STRK, RPI
```

### 3. Box Score Component

```typescript
// components/boxscore/BoxScorePage.tsx
interface BoxScorePageProps {
  gameId: string;
  sport: Sport;
}

// Sections:
// - Linescore (inning-by-inning / quarter-by-quarter)
// - Batting stats (baseball) / Passing/Rushing/Receiving (football)
// - Pitching stats (baseball) / Defensive stats (football)
// - Advanced metrics tab (Pro subscribers)
// - Comparison overlays

// Baseball columns: AB, R, H, RBI, BB, SO, AVG, OBP, SLG
// Football columns: COMP, ATT, YDS, TD, INT, RTG (passing)
```

### 4. Play-by-Play Component

```typescript
// components/playbyplay/PlayByPlayPage.tsx
interface PlayByPlayPageProps {
  gameId: string;
  sport: Sport;
}

// Features:
// - Filterable by inning/quarter/period
// - Filterable by play type (scoring, key plays)
// - Filterable by team
// - Win probability chart integration
// - Expandable play details
// - Video clips for key plays (if available)
```

### 5. Roster Component

```typescript
// components/roster/RosterPage.tsx
interface RosterPageProps {
  teamId: string;
  sport: Sport;
}

// Views:
// - Full roster grid
// - By position
// - Alphabetical
// - By jersey number

// Player card shows:
// - Photo
// - Name, Number, Position
// - Key stats (season leaders highlighted)
// - Status (injury indicator)
// - Click-through to player profile
```

### 6. Depth Chart Component

```typescript
// components/depthchart/DepthChartPage.tsx
interface DepthChartPageProps {
  teamId: string;
  sport: Sport;
}

// Baseball depth chart:
// - Starting lineup (projected/actual)
// - Rotation (5-man)
// - Bullpen (by role: closer, setup, middle relief)
// - Bench

// Football depth chart:
// - Offense (by position group)
// - Defense (by position group)
// - Special teams
// - Practice squad indicator
```

### 7. Stats Leaders Component

```typescript
// components/stats/StatsLeadersPage.tsx
interface StatsLeadersPageProps {
  sport: Sport;
  category?: string;
}

// Categories by sport:
// MLB: Batting AVG, HR, RBI, SB | Pitching ERA, W, K, SV
// NFL: Passing YDS/TD, Rushing YDS/TD, Receiving YDS/TD, Sacks, INT
// NCAA: Same as pro with conference filters
```

### 8. News Feed Component

```typescript
// components/news/NewsFeed.tsx
interface NewsFeedProps {
  sport?: Sport;
  teamId?: string;
  playerId?: string;
  limit?: number;
  variant?: 'cards' | 'list' | 'featured';
}

// Features:
// - Hero article with large image
// - Secondary articles grid
// - Breaking news indicator
// - Video thumbnails
// - Share functionality
// - Bookmarking (Pro feature)
```

### 9. Schedule Component

```typescript
// components/schedule/SchedulePage.tsx
interface SchedulePageProps {
  sport: Sport;
  teamId?: string;
  view?: 'calendar' | 'list' | 'week';
}

// Features:
// - Month/week/day views
// - Filter by home/away
// - Filter by opponent
// - Result indicators
// - Broadcast info
// - Ticket links (future)
```

---

## API Endpoints Architecture

### Game Data Endpoints

```typescript
// Worker: bsi-sports-api

// GET /api/{sport}/games
// Query params: date, status, teamId
// Response: GameSummary[]

// GET /api/{sport}/game/{gameId}
// Response: GameDetail

// GET /api/{sport}/game/{gameId}/boxscore
// Response: BoxScore

// GET /api/{sport}/game/{gameId}/playbyplay
// Response: Play[]

// GET /api/{sport}/game/{gameId}/recap
// Response: GameRecap

// GET /api/{sport}/game/{gameId}/videos
// Response: VideoClip[]
```

### Team Data Endpoints

```typescript
// GET /api/{sport}/teams
// Response: Team[]

// GET /api/{sport}/team/{teamId}
// Response: TeamDetail

// GET /api/{sport}/team/{teamId}/roster
// Response: Player[]

// GET /api/{sport}/team/{teamId}/stats
// Query params: season, split
// Response: TeamStats

// GET /api/{sport}/team/{teamId}/schedule
// Query params: season
// Response: ScheduleGame[]

// GET /api/{sport}/team/{teamId}/depth-chart
// Response: DepthChart

// GET /api/{sport}/team/{teamId}/news
// Response: NewsArticle[]
```

### Standings & Stats Endpoints

```typescript
// GET /api/{sport}/standings
// Query params: season, type (division|conference|wildcard)
// Response: StandingsGroup[]

// GET /api/{sport}/stats/leaders
// Query params: category, season, limit
// Response: StatLeader[]
```

---

## Data Models

### Game Models

```typescript
interface Game {
  id: string;
  sport: Sport;
  status: 'scheduled' | 'in_progress' | 'final' | 'postponed' | 'cancelled';
  startTime: string; // ISO 8601
  venue: Venue;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  homeScore: number;
  awayScore: number;
  period: string; // "Top 7th", "Q3 4:32", etc.
  situation?: GameSituation; // Baseball: runners, outs, count
  broadcasts: Broadcast[];
  odds?: GameOdds;
}

interface BoxScore {
  gameId: string;
  linescore: LinescoreEntry[];
  homeStats: TeamGameStats;
  awayStats: TeamGameStats;
  playerStats: {
    home: PlayerGameStats[];
    away: PlayerGameStats[];
  };
}

interface Play {
  id: string;
  gameId: string;
  period: string;
  time: string;
  type: PlayType;
  description: string;
  team: TeamInfo;
  players: PlayerInfo[];
  result: PlayResult;
  winProbability?: number;
  videoClipId?: string;
}
```

### Team Models

```typescript
interface Team {
  id: string;
  name: string;
  nickname: string;
  abbreviation: string;
  location: string;
  conference: string;
  division: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  venue: Venue;
}

interface Roster {
  teamId: string;
  season: string;
  players: RosterPlayer[];
  coaches: Coach[];
}

interface DepthChart {
  teamId: string;
  positions: DepthPosition[];
  lastUpdated: string;
}

interface DepthPosition {
  position: string;
  positionGroup: string;
  depth: DepthPlayer[];
}
```

### Player Models

```typescript
interface Player {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  jersey: string;
  position: string;
  height: string;
  weight: number;
  birthDate: string;
  birthPlace: string;
  college?: string;
  experience: number;
  status: 'active' | 'injured' | 'inactive' | 'suspended';
  injuryStatus?: InjuryInfo;
  headshotUrl: string;
  stats: PlayerSeasonStats;
}
```

---

## UI/UX Design Specifications

### Color System (BSI Design Tokens)

```typescript
const colors = {
  // Primary brand
  burntOrange: '#BF5700',
  ember: '#FF6B35',
  texasSoil: '#8B4513',
  gold: '#C9A227',

  // Backgrounds
  midnight: '#0D0D0D',
  charcoal: '#1A1A1A',
  slate: '#2D2D2D',

  // Status colors
  live: '#FF4444',
  final: '#888888',
  win: '#22C55E',
  loss: '#EF4444',

  // Text hierarchy
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textTertiary: '#666666',
};
```

### Typography System

```typescript
const typography = {
  // Headlines (Oswald)
  h1: { family: 'Oswald', size: '48px', weight: 700, tracking: '0.02em' },
  h2: { family: 'Oswald', size: '36px', weight: 700, tracking: '0.02em' },
  h3: { family: 'Oswald', size: '24px', weight: 600, tracking: '0.02em' },

  // Body (Inter)
  body: { family: 'Inter', size: '16px', weight: 400, lineHeight: 1.6 },
  bodySmall: { family: 'Inter', size: '14px', weight: 400, lineHeight: 1.5 },

  // Stats/Data (Inter Mono feel)
  stat: { family: 'Inter', size: '14px', weight: 600, tracking: '0.05em' },
  statLarge: { family: 'Oswald', size: '32px', weight: 700 },

  // Labels
  label: { family: 'Inter', size: '12px', weight: 500, tracking: '0.08em' },
};
```

### Component Patterns

#### Score Card Pattern

```
┌─────────────────────────────────────────┐
│ LIVE • TOP 7TH                     ESPN │
├─────────────────────────────────────────┤
│  🟡 Cardinals          3                │
│     @                                   │
│  🔵 Cubs               5                │
├─────────────────────────────────────────┤
│  Runners: 1st & 2nd • 1 Out            │
│  Arenado batting vs. Hendricks          │
└─────────────────────────────────────────┘
```

#### Standings Row Pattern

```
┌────┬─────────────────┬────┬────┬──────┬─────┬──────┐
│ #  │ TEAM            │ W  │ L  │ PCT  │ GB  │ STRK │
├────┼─────────────────┼────┼────┼──────┼─────┼──────┤
│ 1  │ 🔴 Cardinals    │ 89 │ 73 │ .549 │ -   │ W3   │
│ 2  │ 🔵 Cubs         │ 83 │ 79 │ .512 │ 6.0 │ L1   │
└────┴─────────────────┴────┴────┴──────┴─────┴──────┘
```

#### Tab Navigation Pattern

```
┌──────────┬──────────┬─────────────┬────────────┬────────┐
│ GAMECAST │ RECAP    │ BOX SCORE   │ PLAY-BY-PLAY│ VIDEOS │
└──────────┴──────────┴─────────────┴────────────┴────────┘
     ↑ Active (burnt orange underline)
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)

- [ ] Create route structure for MLB and NFL
- [ ] Build SportPageShell and TeamPageLayout components
- [ ] Implement enhanced StandingsPage
- [ ] Create Scoreboard component with date navigation
- [ ] Set up API routes for standings and scores

### Phase 2: Game Detail (Week 2)

- [ ] Build GamePageLayout with tab navigation
- [ ] Implement BoxScorePage for MLB and NFL
- [ ] Implement PlayByPlayPage with filters
- [ ] Create RecapPage with video integration
- [ ] Add TeamStatsPage comparison view

### Phase 3: Team Pages (Week 3)

- [ ] Build RosterPage with position filters
- [ ] Create DepthChartPage for both sports
- [ ] Implement TeamStatsPage
- [ ] Add team SchedulePage with calendar view
- [ ] Create team NewsFeed

### Phase 4: Stats & News (Week 4)

- [ ] Build StatsLeadersPage with categories
- [ ] Create PlayerProfilePage
- [ ] Implement league-wide NewsFeed
- [ ] Add search functionality
- [ ] Build notification system for live games

### Phase 5: Polish & Performance (Week 5)

- [ ] Optimize for mobile (touch gestures, swipe navigation)
- [ ] Add loading skeletons for all components
- [ ] Implement error boundaries
- [ ] Add analytics tracking
- [ ] Performance audit and optimization

---

## API Integration Strategy

### Data Sources

| Sport         | Primary API   | Secondary  | Fallback               |
| ------------- | ------------- | ---------- | ---------------------- |
| MLB           | MLB Stats API | ESPN       | Baseball-Reference     |
| NFL           | ESPN API      | NFL.com    | Pro-Football-Reference |
| NCAA Baseball | NCAA API      | D1Baseball | Stats LLC              |
| NCAA Football | ESPN          | NCAA       | CFBStats               |

### Caching Strategy

```typescript
// KV Cache TTLs
const CACHE_TTL = {
  liveGame: 15, // 15 seconds during live games
  scores: 60, // 1 minute for scoreboard
  standings: 300, // 5 minutes
  boxScore: 60, // 1 minute (live), 3600 (final)
  roster: 86400, // 24 hours
  depthChart: 43200, // 12 hours
  stats: 3600, // 1 hour
  news: 300, // 5 minutes
};
```

### WebSocket Strategy (Live Games)

```typescript
// Real-time updates via Cloudflare Durable Objects
interface LiveGameUpdate {
  type: 'score' | 'play' | 'status' | 'situation';
  gameId: string;
  timestamp: string;
  data: ScoreUpdate | PlayUpdate | StatusUpdate | SituationUpdate;
}
```

---

## Mobile-First Considerations

### Responsive Breakpoints

```typescript
const breakpoints = {
  sm: '640px', // Phone landscape
  md: '768px', // Tablet portrait
  lg: '1024px', // Tablet landscape / small laptop
  xl: '1280px', // Desktop
  '2xl': '1536px', // Large desktop
};
```

### Touch Interactions

- **Swipe left/right**: Navigate between tabs
- **Pull to refresh**: Refresh scores/data
- **Long press**: Show quick actions (share, bookmark)
- **Double tap**: Expand/collapse sections

### Performance Targets

| Metric | Target  | Mobile Target |
| ------ | ------- | ------------- |
| LCP    | < 2.5s  | < 3.0s        |
| FID    | < 100ms | < 100ms       |
| CLS    | < 0.1   | < 0.1         |
| TTI    | < 3.5s  | < 5.0s        |

---

## File Structure

```
BSI/
├── app/
│   ├── mlb/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── scores/page.tsx
│   │   ├── standings/page.tsx
│   │   ├── stats/page.tsx
│   │   ├── news/page.tsx
│   │   ├── schedule/page.tsx
│   │   ├── teams/
│   │   │   ├── page.tsx
│   │   │   └── [teamSlug]/
│   │   │       ├── page.tsx
│   │   │       ├── roster/page.tsx
│   │   │       ├── stats/page.tsx
│   │   │       ├── schedule/page.tsx
│   │   │       ├── depth-chart/page.tsx
│   │   │       └── news/page.tsx
│   │   ├── game/
│   │   │   └── [gameId]/
│   │   │       ├── page.tsx
│   │   │       ├── recap/page.tsx
│   │   │       ├── boxscore/page.tsx
│   │   │       ├── playbyplay/page.tsx
│   │   │       ├── team-stats/page.tsx
│   │   │       └── videos/page.tsx
│   │   └── player/
│   │       └── [playerId]/
│   │           ├── page.tsx
│   │           ├── stats/page.tsx
│   │           └── gamelog/page.tsx
│   ├── nfl/
│   │   └── [same structure as mlb]
│   ├── ncaa-baseball/
│   │   └── [same structure]
│   └── ncaa-football/
│       └── [same structure]
├── components/
│   ├── sports-layout/
│   │   ├── SportPageShell.tsx
│   │   ├── SportSubnav.tsx
│   │   ├── GamePageLayout.tsx
│   │   └── TeamPageLayout.tsx
│   ├── scoreboard/
│   │   ├── Scoreboard.tsx
│   │   ├── ScoreCard.tsx
│   │   ├── ScoreCardLive.tsx
│   │   └── DatePicker.tsx
│   ├── standings/
│   │   ├── StandingsPage.tsx
│   │   ├── StandingsTable.tsx
│   │   ├── DivisionStandings.tsx
│   │   └── WildcardRace.tsx
│   ├── boxscore/
│   │   ├── BoxScorePage.tsx
│   │   ├── Linescore.tsx
│   │   ├── BattingTable.tsx
│   │   ├── PitchingTable.tsx
│   │   ├── PassingTable.tsx
│   │   └── RushingReceivingTable.tsx
│   ├── playbyplay/
│   │   ├── PlayByPlayPage.tsx
│   │   ├── PlayList.tsx
│   │   ├── PlayCard.tsx
│   │   └── PlayFilters.tsx
│   ├── roster/
│   │   ├── RosterPage.tsx
│   │   ├── RosterGrid.tsx
│   │   ├── PlayerCard.tsx
│   │   └── PositionFilter.tsx
│   ├── depthchart/
│   │   ├── DepthChartPage.tsx
│   │   ├── BaseballDepthChart.tsx
│   │   └── FootballDepthChart.tsx
│   ├── stats/
│   │   ├── StatsLeadersPage.tsx
│   │   ├── StatLeaderCard.tsx
│   │   └── CategoryTabs.tsx
│   ├── news/
│   │   ├── NewsFeed.tsx
│   │   ├── NewsCard.tsx
│   │   ├── FeaturedArticle.tsx
│   │   └── BreakingNews.tsx
│   └── schedule/
│       ├── SchedulePage.tsx
│       ├── CalendarView.tsx
│       ├── ListView.tsx
│       └── GameRow.tsx
├── lib/
│   ├── api/
│   │   ├── mlb.ts
│   │   ├── nfl.ts
│   │   ├── ncaa.ts
│   │   └── types.ts
│   ├── hooks/
│   │   ├── useGameDetail.ts
│   │   ├── useStandings.ts
│   │   ├── useRoster.ts
│   │   ├── useDepthChart.ts
│   │   └── useLiveScores.ts
│   └── utils/
│       ├── sportFormatters.ts
│       ├── dateUtils.ts
│       └── statsCalculators.ts
└── workers/
    └── bsi-sports-api/
        ├── index.ts
        ├── routes/
        │   ├── mlb.ts
        │   ├── nfl.ts
        │   ├── ncaa.ts
        │   └── shared.ts
        └── adapters/
            ├── mlb-stats-api.ts
            ├── espn-api.ts
            └── ncaa-api.ts
```

---

## Deployment Checklist

- [ ] All routes return 200 OK
- [ ] API endpoints respond < 200ms
- [ ] Mobile Lighthouse score > 90
- [ ] All images optimized and served from R2
- [ ] Error boundaries in place for all routes
- [ ] Analytics tracking on all page views
- [ ] SEO meta tags on all pages
- [ ] Open Graph images for social sharing
- [ ] Sitemap includes all sport routes
- [ ] Cache headers properly configured

---

## Success Metrics

| Metric          | Target  | Measurement          |
| --------------- | ------- | -------------------- |
| Page Load       | < 3s    | Lighthouse           |
| API Response    | < 200ms | Cloudflare Analytics |
| Bounce Rate     | < 40%   | Analytics            |
| Pages/Session   | > 3     | Analytics            |
| Mobile Traffic  | > 60%   | Analytics            |
| Return Visitors | > 30%   | Analytics            |

---

_Last Updated: December 2025_
_Author: Claude Code (Staff Engineer)_
