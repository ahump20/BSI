# BlazeSportsIntel API Upgrade Research & Recommendations

## Executive Summary

This document consolidates research from multiple GitHub repositories, sports APIs, and Cloudflare platform patterns to propose comprehensive upgrades for blazesportsintel.com and its sub-route domains.

---

## 1. Current Architecture Analysis

### Existing Strengths
- **Multi-provider failover** with circuit breaker pattern (SportsDataIO → NCAA → ESPN)
- **122+ API endpoints** across 27 categories
- **Cloudflare Edge deployment** with KV caching and D1 database
- **Durable Objects** for game state management
- **Real statistical models** (Pythagorean expectation, Elo ratings, sabermetrics)

### Current Adapters
| Adapter | Status | Notes |
|---------|--------|-------|
| `espn-api.ts` | Tertiary | Limited to college baseball |
| `ncaa-api.ts` | Backup | No team stats implementation |
| `cfbd-adapter.ts` | Active | College football primary |
| `mlb-adapter.ts` | Active | MLB Stats API integration |
| `statcast-adapter.ts` | Active | Baseball Savant data |
| `nba-production-adapter.ts` | Active | NBA stats with clutch data |
| `nfl-production-adapter.ts` | Active | NFL game data |

---

## 2. New API Sources Discovered

### Free/Freemium Tier APIs

#### BALLDONTLIE API
**Coverage**: NBA, NFL, MLB, NHL, EPL, WNBA, NCAAF, NCAAB
**Features**: 120+ endpoints, official SDKs (Python/JS), MCP server integration
**Pricing**: Free tier available
**Documentation**: https://www.balldontlie.io/

```javascript
// JavaScript SDK
import { BalldontlieAPI } from "@balldontlie/sdk";
const api = new BalldontlieAPI({ apiKey: "your-api-key" });

// Get NCAAF games
const games = await api.ncaaf.games.list({ season: 2024 });
```

#### henrygd/ncaa-api (Free)
**Coverage**: All NCAA sports, all divisions
**Endpoints**:
- `/scoreboard/{sport}/{division}/{date}` - Live scores
- `/stats/{sport}/{division}/current/team/{id}` - Team stats
- `/stats/{sport}/{division}/current/individual/{id}` - Player stats
- `/rankings/{sport}/{division}/{poll}` - Rankings
- `/standings/{sport}/{division}` - Conference standings
- `/game/{gameId}/boxscore` - Detailed box scores
- `/game/{gameId}/play-by-play` - Play-by-play data

**Base URL**: Self-hosted or use existing deployments
**Source**: https://github.com/henrygd/ncaa-api

#### MySportsFeeds
**Coverage**: NFL, MLB, NBA, NHL
**Features**: Real-time scores, play-by-play, injuries, odds
**Pricing**: Free for non-commercial use
**Documentation**: https://www.mysportsfeeds.com/

### ESPN Hidden API Endpoints (Comprehensive)

#### Base URLs
- `site.api.espn.com/apis/site/v2/sports/` - General site data
- `sports.core.api.espn.com/v2/` - Core sports data
- `site.web.api.espn.com/apis/` - Web-specific APIs
- `lm-api-reads.fantasy.espn.com/apis/v3/` - Fantasy data

#### College Football Endpoints
```
# Scoreboard (all FBS games)
https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?groups=80

# By conference (SEC = 8, Big 12 = 4, ACC = 1, Big Ten = 5, Pac-12 = 9)
https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?groups=8

# With date filter
https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?dates=20241123&groups=80

# Rankings
https://site.api.espn.com/apis/site/v2/sports/football/college-football/rankings

# Team info
https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/{team}

# Game summary with detailed stats
https://site.api.espn.com/apis/site/v2/sports/football/college-football/summary?event={gameId}
```

#### College Basketball Endpoints
```
# Men's scoreboard
https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard

# Women's scoreboard
https://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/scoreboard

# Rankings
https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/rankings
```

#### NFL Endpoints
```
# Scoreboard with week
https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week=1

# All regular season events
https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/types/2/events?limit=1000

# Team roster
https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{teamId}/roster

# Player stats
https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/{athleteId}/stats
```

#### MLB Endpoints
```
# Scoreboard
https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard

# College baseball
https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard
```

#### Key Query Parameters
- `dates`: YYYYMMDD or YYYYMMDD-YYYYMMDD range
- `groups`: Conference/division IDs (80=FBS, 8=SEC, etc.)
- `week`: Week number for football
- `limit`: Max items (use `limit=1000` to avoid pagination)
- `seasontype`: 1=preseason, 2=regular, 3=playoff, 4=offseason

### MLB Stats API (Official)
**Documentation**: https://statsapi.mlb.com/ (requires login)
**npm Package**: `mlb-stats-api`

```typescript
import MLBStats from 'mlb-stats-api';

const mlbStats = new MLBStats();

// Live game feed
const gameFeed = await mlbStats.getGameFeed({ pathParams: { gamePk: 634197 } });

// Schedule
const schedule = await mlbStats.getSchedule({ date: '2024-09-15' });
```

### College Football Data (CFBD) API v2
**Documentation**: https://apinext.collegefootballdata.com/
**Pricing**: Free tier = 1000 monthly calls
**Features**: GraphQL API for Patreon Tier 3+

```python
from cfbd import GamesApi, BettingApi

games_api = GamesApi()
games = games_api.get_games(year=2024, week=13)
betting_lines = betting_api.get_lines(year=2024, week=13)
```

### Statcast / Baseball Savant
**Documentation**: https://baseballsavant.mlb.com/csv-docs
**Features**: Pitch tracking, swing tracking, exit velocity, spin rate

Key fields available:
- `pitch_type`, `release_speed`, `release_spin`
- `spin_axis`, `release_pos_x`, `release_pos_z`
- `launch_speed`, `launch_angle`, `hc_x`, `hc_y`

**Access via**: pybaseball (Python) or baseballr (R)

---

## 3. Cloudflare Platform Upgrades

### WebSocket Hibernation for Real-Time Scores

The biggest opportunity is implementing **WebSocket Hibernation** with Durable Objects for live score streaming. This allows:
- Persistent connections without compute charges during inactivity
- Automatic wake-up when new data arrives
- Global edge distribution for low latency

#### Implementation Pattern

```typescript
// workers/live-scores-do.ts
export class LiveScoresDO implements DurableObject {
  private sessions: Map<WebSocket, { sport: string; teams: string[] }> = new Map();

  constructor(private state: DurableObjectState, private env: Env) {
    // Restore sessions from hibernation
    this.state.getWebSockets().forEach(ws => {
      const attachment = ws.deserializeAttachment() as { sport: string; teams: string[] };
      if (attachment) {
        this.sessions.set(ws, attachment);
      }
    });

    // Set up auto-response for ping/pong
    this.state.setWebSocketAutoResponse(
      new WebSocketRequestResponsePair("ping", "pong")
    );
  }

  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get("Upgrade");
    if (upgradeHeader !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }

    const url = new URL(request.url);
    const sport = url.searchParams.get("sport") || "all";
    const teams = url.searchParams.get("teams")?.split(",") || [];

    const [client, server] = Object.values(new WebSocketPair());

    // Accept with hibernation support
    this.state.acceptWebSocket(server);

    // Store session data (survives hibernation)
    server.serializeAttachment({ sport, teams });
    this.sessions.set(server, { sport, teams });

    return new Response(null, { status: 101, webSocket: client });
  }

  // Called when WebSocket receives a message (wakes from hibernation)
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const data = JSON.parse(message as string);

    if (data.type === "subscribe") {
      const attachment = { sport: data.sport, teams: data.teams || [] };
      ws.serializeAttachment(attachment);
      this.sessions.set(ws, attachment);
    }
  }

  // Broadcast score updates to relevant subscribers
  async broadcastScoreUpdate(update: ScoreUpdate): Promise<void> {
    for (const [ws, session] of this.sessions) {
      // Filter by sport and team subscriptions
      if (session.sport === "all" || session.sport === update.sport) {
        if (session.teams.length === 0 ||
            session.teams.includes(update.homeTeam) ||
            session.teams.includes(update.awayTeam)) {
          ws.send(JSON.stringify(update));
        }
      }
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    this.sessions.delete(ws);
  }
}
```

### Enhanced Caching Strategy

```typescript
// lib/cache/tiered-cache.ts
export class TieredCache {
  constructor(
    private kv: KVNamespace,
    private ctx: ExecutionContext
  ) {}

  // Sport-specific TTLs
  private readonly TTL_CONFIG = {
    'live_scores': 15,        // 15 seconds for live games
    'scheduled_games': 300,   // 5 minutes for upcoming
    'final_scores': 3600,     // 1 hour for completed
    'standings': 300,         // 5 minutes
    'player_stats': 600,      // 10 minutes
    'rankings': 1800,         // 30 minutes
    'historical': 86400,      // 24 hours
  };

  async get<T>(key: string, category: keyof typeof this.TTL_CONFIG): Promise<T | null> {
    const cached = await this.kv.get(key, 'json');
    return cached as T | null;
  }

  async set<T>(
    key: string,
    data: T,
    category: keyof typeof this.TTL_CONFIG
  ): Promise<void> {
    const ttl = this.TTL_CONFIG[category];
    await this.kv.put(key, JSON.stringify(data), { expirationTtl: ttl });
  }

  // Stale-while-revalidate pattern
  async getWithSWR<T>(
    key: string,
    category: keyof typeof this.TTL_CONFIG,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const cached = await this.get<T>(key, category);

    if (cached) {
      // Background refresh
      this.ctx.waitUntil(this.refreshInBackground(key, category, fetchFn));
      return cached;
    }

    const fresh = await fetchFn();
    await this.set(key, fresh, category);
    return fresh;
  }

  private async refreshInBackground<T>(
    key: string,
    category: keyof typeof this.TTL_CONFIG,
    fetchFn: () => Promise<T>
  ): Promise<void> {
    try {
      const fresh = await fetchFn();
      await this.set(key, fresh, category);
    } catch (error) {
      console.error(`Background refresh failed for ${key}:`, error);
    }
  }
}
```

---

## 4. New Adapter Implementations

### BALLDONTLIE Adapter

```typescript
// lib/adapters/balldontlie-adapter.ts
import { BalldontlieAPI } from "@balldontlie/sdk";

export class BalldontlieAdapter {
  private api: BalldontlieAPI;

  constructor(apiKey: string) {
    this.api = new BalldontlieAPI({ apiKey });
  }

  // NCAAF Games
  async getNCAAFGames(params: { season: number; week?: number }): Promise<ProviderGame[]> {
    const games = await this.api.ncaaf.games.list({
      season: params.season,
      week: params.week,
    });
    return games.data.map(this.transformGame);
  }

  // NCAAB Games
  async getNCAABGames(params: { season: number; date?: string }): Promise<ProviderGame[]> {
    const games = await this.api.ncaab.games.list({
      season: params.season,
      dates: params.date ? [params.date] : undefined,
    });
    return games.data.map(this.transformGame);
  }

  // NFL Games with advanced stats
  async getNFLGames(params: { season: number; week: number }): Promise<ProviderGame[]> {
    const games = await this.api.nfl.games.list({
      season: params.season,
      week: params.week,
    });
    return games.data.map(this.transformGame);
  }

  // Player stats
  async getPlayerStats(sport: 'nfl' | 'nba' | 'mlb', playerId: number, season: number) {
    return await this.api[sport].stats.list({
      player_ids: [playerId],
      seasons: [season],
    });
  }

  private transformGame(game: any): ProviderGame {
    return {
      id: game.id.toString(),
      scheduledAt: game.date,
      status: this.mapStatus(game.status),
      homeTeamId: game.home_team.id.toString(),
      awayTeamId: game.visitor_team.id.toString(),
      homeScore: game.home_team_score,
      awayScore: game.visitor_team_score,
      providerName: 'BALLDONTLIE',
      feedPrecision: 'GAME',
    };
  }

  private mapStatus(status: string): ProviderGame['status'] {
    const statusMap: Record<string, ProviderGame['status']> = {
      'scheduled': 'SCHEDULED',
      'in_progress': 'LIVE',
      'final': 'FINAL',
      'postponed': 'POSTPONED',
      'cancelled': 'CANCELLED',
    };
    return statusMap[status.toLowerCase()] || 'SCHEDULED';
  }
}
```

### Enhanced ESPN Adapter (All Sports)

```typescript
// lib/adapters/espn-unified-adapter.ts
export class ESPNUnifiedAdapter {
  private readonly BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports';
  private readonly CORE_URL = 'https://sports.core.api.espn.com/v2/sports';

  // Sport/League configuration
  private readonly SPORT_CONFIG = {
    'ncaaf': { sport: 'football', league: 'college-football', groups: 80 },
    'ncaab': { sport: 'basketball', league: 'mens-college-basketball' },
    'wcbb': { sport: 'basketball', league: 'womens-college-basketball' },
    'nfl': { sport: 'football', league: 'nfl' },
    'nba': { sport: 'basketball', league: 'nba' },
    'wnba': { sport: 'basketball', league: 'wnba' },
    'mlb': { sport: 'baseball', league: 'mlb' },
    'cbb': { sport: 'baseball', league: 'college-baseball' },
    'nhl': { sport: 'hockey', league: 'nhl' },
  };

  // Conference IDs for CFB
  private readonly CFB_CONFERENCES = {
    'SEC': 8,
    'Big Ten': 5,
    'Big 12': 4,
    'ACC': 1,
    'Pac-12': 9,
    'FBS': 80,
    'FCS': 81,
  };

  async getScoreboard(
    sportKey: keyof typeof this.SPORT_CONFIG,
    options: { date?: string; week?: number; conference?: string } = {}
  ): Promise<ProviderGame[]> {
    const config = this.SPORT_CONFIG[sportKey];
    const params = new URLSearchParams();

    if (options.date) {
      params.set('dates', options.date.replace(/-/g, ''));
    }
    if (options.week) {
      params.set('week', options.week.toString());
    }
    if (config.groups) {
      params.set('groups', config.groups.toString());
    }
    if (options.conference && this.CFB_CONFERENCES[options.conference as keyof typeof this.CFB_CONFERENCES]) {
      params.set('groups', this.CFB_CONFERENCES[options.conference as keyof typeof this.CFB_CONFERENCES].toString());
    }

    const url = `${this.BASE_URL}/${config.sport}/${config.league}/scoreboard?${params}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'BlazeSportsIntel/2.0',
      },
    });

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status}`);
    }

    const data = await response.json();
    return (data.events || []).map((event: any) => this.transformEvent(event, sportKey));
  }

  async getGameSummary(sportKey: keyof typeof this.SPORT_CONFIG, gameId: string) {
    const config = this.SPORT_CONFIG[sportKey];
    const url = `${this.BASE_URL}/${config.sport}/${config.league}/summary?event=${gameId}`;

    const response = await fetch(url);
    return response.json();
  }

  async getRankings(sportKey: 'ncaaf' | 'ncaab' | 'wcbb') {
    const config = this.SPORT_CONFIG[sportKey];
    const url = `${this.BASE_URL}/${config.sport}/${config.league}/rankings`;

    const response = await fetch(url);
    return response.json();
  }

  async getTeamRoster(sportKey: keyof typeof this.SPORT_CONFIG, teamId: string) {
    const config = this.SPORT_CONFIG[sportKey];
    const url = `${this.BASE_URL}/${config.sport}/${config.league}/teams/${teamId}/roster`;

    const response = await fetch(url);
    return response.json();
  }

  async getAllEvents(sportKey: keyof typeof this.SPORT_CONFIG, season: number, seasonType: number = 2) {
    const config = this.SPORT_CONFIG[sportKey];
    const url = `${this.CORE_URL}/${config.sport}/leagues/${config.league}/seasons/${season}/types/${seasonType}/events?limit=1000`;

    const response = await fetch(url);
    return response.json();
  }

  private transformEvent(event: any, sportKey: string): ProviderGame {
    const competition = event.competitions?.[0] || {};
    const competitors = competition.competitors || [];
    const home = competitors.find((c: any) => c.homeAway === 'home') || {};
    const away = competitors.find((c: any) => c.homeAway === 'away') || {};

    return {
      id: event.id,
      scheduledAt: event.date,
      status: this.mapStatus(competition.status?.type?.name),
      homeTeamId: home.team?.id?.toString() || '',
      awayTeamId: away.team?.id?.toString() || '',
      homeTeamName: home.team?.displayName,
      awayTeamName: away.team?.displayName,
      homeScore: parseFloat(home.score) || null,
      awayScore: parseFloat(away.score) || null,
      homeRanking: home.curatedRank?.current,
      awayRanking: away.curatedRank?.current,
      venue: competition.venue?.fullName,
      broadcast: competition.broadcasts?.[0]?.names?.[0],
      providerName: 'ESPN',
      feedPrecision: 'EVENT',
      // Sport-specific fields
      ...(sportKey.includes('football') && {
        quarter: competition.status?.period,
        timeRemaining: competition.status?.displayClock,
        possession: competition.situation?.possession,
        down: competition.situation?.down,
        distance: competition.situation?.distance,
        yardLine: competition.situation?.yardLine,
      }),
      ...(sportKey.includes('basketball') && {
        period: competition.status?.period,
        timeRemaining: competition.status?.displayClock,
      }),
      ...(sportKey.includes('baseball') && {
        inning: competition.status?.period,
        inningHalf: competition.status?.type?.description?.includes('Top') ? 'TOP' : 'BOTTOM',
        outs: competition.situation?.outs,
        balls: competition.situation?.balls,
        strikes: competition.situation?.strikes,
      }),
    };
  }

  private mapStatus(statusName: string): ProviderGame['status'] {
    const lower = (statusName || '').toLowerCase();
    if (lower.includes('scheduled') || lower.includes('pre')) return 'SCHEDULED';
    if (lower.includes('progress') || lower.includes('live')) return 'LIVE';
    if (lower.includes('final')) return 'FINAL';
    if (lower.includes('postponed')) return 'POSTPONED';
    if (lower.includes('cancel')) return 'CANCELLED';
    return 'SCHEDULED';
  }
}
```

### NCAA API Adapter (henrygd/ncaa-api)

```typescript
// lib/adapters/ncaa-enhanced-adapter.ts
export class NCAAEnhancedAdapter {
  private baseUrl: string;

  constructor(baseUrl: string = 'https://your-ncaa-api-deployment.workers.dev') {
    this.baseUrl = baseUrl;
  }

  async getScoreboard(params: {
    sport: 'football' | 'basketball-men' | 'basketball-women' | 'baseball';
    division: 'fbs' | 'fcs' | 'd1' | 'd2' | 'd3';
    year: number;
    month?: number;
    day?: number;
    week?: number;
  }): Promise<ProviderGame[]> {
    let dateStr: string;

    if (params.sport === 'football') {
      dateStr = `${params.year}/${params.week || 1}`;
    } else {
      dateStr = `${params.year}/${params.month?.toString().padStart(2, '0')}/${params.day?.toString().padStart(2, '0')}`;
    }

    const url = `${this.baseUrl}/scoreboard/${params.sport}/${params.division}/${dateStr}/all-conf`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`NCAA API error: ${response.status}`);
    }

    const data = await response.json();
    return data.games.map(this.transformGame);
  }

  async getTeamStats(params: {
    sport: string;
    division: string;
    teamId: number;
    season?: string;
  }) {
    const season = params.season || 'current';
    const url = `${this.baseUrl}/stats/${params.sport}/${params.division}/${season}/team/${params.teamId}`;

    const response = await fetch(url);
    return response.json();
  }

  async getPlayerStats(params: {
    sport: string;
    division: string;
    playerId: number;
    season?: string;
  }) {
    const season = params.season || 'current';
    const url = `${this.baseUrl}/stats/${params.sport}/${params.division}/${season}/individual/${params.playerId}`;

    const response = await fetch(url);
    return response.json();
  }

  async getBoxScore(gameId: string) {
    const url = `${this.baseUrl}/game/${gameId}/boxscore`;
    const response = await fetch(url);
    return response.json();
  }

  async getPlayByPlay(gameId: string) {
    const url = `${this.baseUrl}/game/${gameId}/play-by-play`;
    const response = await fetch(url);
    return response.json();
  }

  async getRankings(sport: string, division: string, poll: string = 'associated-press') {
    const url = `${this.baseUrl}/rankings/${sport}/${division}/${poll}`;
    const response = await fetch(url);
    return response.json();
  }

  async getStandings(sport: string, division: string) {
    const url = `${this.baseUrl}/standings/${sport}/${division}`;
    const response = await fetch(url);
    return response.json();
  }

  private transformGame(game: any): ProviderGame {
    return {
      id: game.id,
      scheduledAt: game.startTime,
      status: game.gameState?.toUpperCase() || 'SCHEDULED',
      homeTeamId: game.home.id,
      awayTeamId: game.away.id,
      homeTeamName: game.home.name,
      awayTeamName: game.away.name,
      homeScore: game.home.score,
      awayScore: game.away.score,
      providerName: 'NCAA',
      feedPrecision: 'GAME',
    };
  }
}
```

---

## 5. Enhanced Provider Manager

```typescript
// lib/adapters/enhanced-provider-manager.ts
import { ESPNUnifiedAdapter } from './espn-unified-adapter';
import { BalldontlieAdapter } from './balldontlie-adapter';
import { NCAAEnhancedAdapter } from './ncaa-enhanced-adapter';
import { SportsDataIOAdapter } from './sports-data-io';
import { CFBDAdapter } from './cfbd-adapter';

interface ProviderConfig {
  name: string;
  adapter: any;
  priority: number;
  sports: string[];
  rateLimit: { requests: number; window: number };
}

export class EnhancedProviderManager {
  private providers: ProviderConfig[];
  private circuitBreakers: Map<string, CircuitBreakerState>;
  private rateLimiters: Map<string, { count: number; resetAt: number }>;

  constructor(env: Env) {
    this.providers = [
      // Primary providers (paid/reliable)
      {
        name: 'sportsDataIO',
        adapter: new SportsDataIOAdapter(env.SPORTSDATA_API_KEY),
        priority: 1,
        sports: ['mlb', 'nfl', 'nba', 'nhl'],
        rateLimit: { requests: 1000, window: 60000 },
      },
      {
        name: 'cfbd',
        adapter: new CFBDAdapter(env.CFBD_API_KEY),
        priority: 1,
        sports: ['ncaaf'],
        rateLimit: { requests: 100, window: 60000 },
      },
      // Secondary providers (free tiers)
      {
        name: 'balldontlie',
        adapter: new BalldontlieAdapter(env.BALLDONTLIE_API_KEY),
        priority: 2,
        sports: ['ncaaf', 'ncaab', 'nfl', 'nba', 'mlb', 'nhl', 'wnba'],
        rateLimit: { requests: 60, window: 60000 },
      },
      {
        name: 'ncaa',
        adapter: new NCAAEnhancedAdapter(env.NCAA_API_URL),
        priority: 2,
        sports: ['ncaaf', 'ncaab', 'wcbb', 'cbb'],
        rateLimit: { requests: 100, window: 60000 },
      },
      // Tertiary providers (fallback)
      {
        name: 'espn',
        adapter: new ESPNUnifiedAdapter(),
        priority: 3,
        sports: ['ncaaf', 'ncaab', 'wcbb', 'nfl', 'nba', 'wnba', 'mlb', 'cbb', 'nhl'],
        rateLimit: { requests: 30, window: 60000 },
      },
    ];

    this.circuitBreakers = new Map();
    this.rateLimiters = new Map();

    // Initialize circuit breakers
    this.providers.forEach(p => {
      this.circuitBreakers.set(p.name, { failures: 0, lastFailure: null, isOpen: false });
      this.rateLimiters.set(p.name, { count: 0, resetAt: Date.now() + p.rateLimit.window });
    });
  }

  async getGames(sport: string, params: any): Promise<ProviderGame[]> {
    // Get providers for this sport, sorted by priority
    const sportProviders = this.providers
      .filter(p => p.sports.includes(sport))
      .sort((a, b) => a.priority - b.priority);

    for (const provider of sportProviders) {
      if (this.isCircuitOpen(provider.name)) continue;
      if (this.isRateLimited(provider.name, provider.rateLimit)) continue;

      try {
        this.incrementRateLimit(provider.name);
        const games = await this.fetchFromProvider(provider, sport, params);
        this.recordSuccess(provider.name);
        return games;
      } catch (error) {
        console.error(`[ProviderManager] ${provider.name} failed:`, error);
        this.recordFailure(provider.name);
      }
    }

    throw new Error(`All providers failed for ${sport}`);
  }

  private async fetchFromProvider(provider: ProviderConfig, sport: string, params: any) {
    switch (provider.name) {
      case 'espn':
        return provider.adapter.getScoreboard(sport, params);
      case 'balldontlie':
        return provider.adapter[`get${sport.toUpperCase()}Games`](params);
      case 'ncaa':
        return provider.adapter.getScoreboard({ sport, ...params });
      default:
        return provider.adapter.getGames(params);
    }
  }

  private isRateLimited(name: string, config: { requests: number; window: number }): boolean {
    const limiter = this.rateLimiters.get(name)!;

    if (Date.now() > limiter.resetAt) {
      limiter.count = 0;
      limiter.resetAt = Date.now() + config.window;
    }

    return limiter.count >= config.requests;
  }

  private incrementRateLimit(name: string): void {
    const limiter = this.rateLimiters.get(name)!;
    limiter.count++;
  }

  // ... circuit breaker methods remain the same
}
```

---

## 6. Recommended Sub-Route Architecture

### Proposed Domain Structure

```
blazesportsintel.com
├── /api/v2/                         # Main API gateway
│   ├── /live/                       # WebSocket connections
│   │   ├── /scores                  # Real-time score streaming
│   │   └── /updates                 # Game state updates
│   │
│   ├── /college/                    # College sports hub
│   │   ├── /football/               # CFB
│   │   │   ├── /scoreboard
│   │   │   ├── /rankings
│   │   │   ├── /teams/{teamId}
│   │   │   ├── /games/{gameId}
│   │   │   └── /stats
│   │   ├── /basketball/             # CBB (men's & women's)
│   │   │   ├── /mens/
│   │   │   └── /womens/
│   │   └── /baseball/               # College baseball
│   │
│   ├── /pro/                        # Professional sports
│   │   ├── /nfl/
│   │   ├── /mlb/
│   │   ├── /nba/
│   │   ├── /wnba/
│   │   └── /nhl/
│   │
│   ├── /analytics/                  # Advanced analytics
│   │   ├── /predictions
│   │   ├── /rankings
│   │   └── /comparisons
│   │
│   └── /search/                     # Unified search
│       └── /copilot                 # AI-powered queries
```

---

## 7. Implementation Priorities

### Phase 1: Core API Expansion (Immediate)
1. Implement `ESPNUnifiedAdapter` to support all sports from ESPN
2. Add `BalldontlieAdapter` for NCAAF/NCAAB coverage
3. Deploy `henrygd/ncaa-api` as a Cloudflare Worker
4. Update `EnhancedProviderManager` with new adapters

### Phase 2: Real-Time Infrastructure
1. Implement WebSocket Hibernation Durable Object for live scores
2. Add subscription-based filtering (by sport, team, conference)
3. Implement stale-while-revalidate caching pattern

### Phase 3: Analytics Enhancement
1. Integrate Statcast data via pybaseball/baseballr patterns
2. Add CFBD GraphQL integration for advanced CFB analytics
3. Implement win probability models using CFBD's new 2025 calculator

### Phase 4: MCP Integration
1. Configure BALLDONTLIE MCP server for AI agent access
2. Create custom MCP tools for BlazeSportsIntel data
3. Enable natural language queries via copilot endpoint

---

## 8. API Key Requirements

| Provider | Key Required | Free Tier | Notes |
|----------|-------------|-----------|-------|
| ESPN | No | Unlimited* | Unofficial, no SLA |
| BALLDONTLIE | Yes | Available | 120+ endpoints |
| NCAA API (henrygd) | Optional | Self-host | Full coverage |
| CFBD | Yes | 1000/month | GraphQL for Tier 3 |
| MLB Stats API | No | Unlimited* | Official MLB data |
| SportsDataIO | Yes | Trial | Enterprise tier |
| MySportsFeeds | Yes | Non-commercial | All major sports |

---

## Sources

### Primary Research
- [BALLDONTLIE API](https://www.balldontlie.io/)
- [ESPN Hidden API Gist](https://gist.github.com/akeaswaran/b48b02f1c94f873c6655e7129910fc3b)
- [NFL ESPN API Endpoints](https://gist.github.com/nntrn/ee26cb2a0716de0947a0a4e9a157bc1c)
- [henrygd/ncaa-api](https://github.com/henrygd/ncaa-api)
- [Public ESPN API Documentation](https://github.com/pseudo-r/Public-ESPN-API)
- [College Football Data API](https://api.collegefootballdata.com/)

### Cloudflare Platform
- [WebSocket Hibernation Docs](https://developers.cloudflare.com/durable-objects/best-practices/websockets/)
- [Durable Objects Examples](https://developers.cloudflare.com/durable-objects/examples/websocket-hibernation-server/)
- [Real-Time Apps with Durable Objects](https://dzone.com/articles/serverless-websocket-real-time-apps)

### Baseball Data
- [MLB-StatsAPI Python Wrapper](https://github.com/toddrob99/MLB-StatsAPI/wiki/Endpoints)
- [Baseball Savant CSV Docs](https://baseballsavant.mlb.com/csv-docs)
- [pybaseball](https://github.com/jldbc/pybaseball)

### Additional Sports APIs
- [MySportsFeeds](https://www.mysportsfeeds.com/)
- [SportsDataIO](https://sportsdata.io)
- [Sportradar NFL Overview](https://developer.sportradar.com/football/reference/nfl-overview)
