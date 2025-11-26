/**
 * NBA Production Adapter
 * Real data integration with ESPN NBA API
 *
 * Data Sources:
 * - ESPN NBA API (primary)
 * - NBA Stats API (advanced stats)
 *
 * Cache Strategy:
 * - Team info: 24 hours
 * - Rosters: 1 hour during season
 * - Standings: 30 minutes
 * - Live scores: 15 seconds during games
 * - Completed games: 1 hour
 */

import { DateTime } from 'luxon';
import { SportsDataClient } from '../api/sports-data-client';

// ============================================================================
// TYPES
// ============================================================================

export interface NBATeam {
  id: string;
  uid: string;
  slug: string;
  location: string;
  name: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  color: string;
  alternateColor: string;
  logos: Array<{
    href: string;
    width: number;
    height: number;
  }>;

  conference: {
    id: string;
    name: string; // "Eastern" or "Western"
    abbreviation: string;
  };

  division: {
    id: string;
    name: string; // "Atlantic", "Southeast", etc.
    abbreviation: string;
  };

  record: {
    summary: string; // "45-37"
    wins: number;
    losses: number;
    winPercent: number;
  };

  rank?: {
    current: number;
  };

  venue?: {
    id: string;
    fullName: string;
    address: {
      city: string;
      state: string;
    };
    capacity: number;
    indoor: boolean;
  };

  links: Array<{
    rel: string[];
    href: string;
    text: string;
  }>;
}

export interface NBAPlayer {
  id: string;
  uid: string;
  guid: string;
  firstName: string;
  lastName: string;
  fullName: string;
  displayName: string;
  shortName: string;

  jersey: string;
  position: {
    abbreviation: string;
    name: string;
    displayName: string;
  };

  height: string; // "6' 7\""
  weight: number;
  age: number;
  dateOfBirth: string;

  experience: {
    years: number;
    displayValue: string; // "7th Season"
  };

  college?: {
    id: string;
    name: string;
    abbreviation: string;
  };

  headshot?: {
    href: string;
    alt: string;
  };

  statistics?: {
    gamesPlayed: number;
    minutesPerGame: number;
    pointsPerGame: number;
    reboundsPerGame: number;
    assistsPerGame: number;
    stealsPerGame: number;
    blocksPerGame: number;
    fieldGoalPct: number;
    threePointPct: number;
    freeThrowPct: number;
  };

  active: boolean;
}

export interface NBAGame {
  id: string;
  uid: string;
  date: string; // ISO 8601
  name: string;
  shortName: string;

  season: {
    year: number;
    type: number;
    slug: string;
  };

  status: {
    period: number; // Quarter
    clock: string; // "7:43"
    type: {
      id: string;
      name: string; // "STATUS_FINAL", "STATUS_IN_PROGRESS", "STATUS_SCHEDULED"
      state: string; // "post", "in", "pre"
      completed: boolean;
      description: string;
      detail: string;
      shortDetail: string;
    };
  };

  teams: {
    away: {
      team: Pick<
        NBATeam,
        'id' | 'displayName' | 'abbreviation' | 'logos' | 'conference' | 'division'
      >;
      score: number;
      record: string;
      rank?: number;
      leaders?: Array<{
        category: string;
        player: NBAPlayer;
        stats: string;
      }>;
    };
    home: {
      team: Pick<
        NBATeam,
        'id' | 'displayName' | 'abbreviation' | 'logos' | 'conference' | 'division'
      >;
      score: number;
      record: string;
      rank?: number;
      leaders?: Array<{
        category: string;
        player: NBAPlayer;
        stats: string;
      }>;
    };
  };

  venue?: {
    fullName: string;
    address: {
      city: string;
      state: string;
    };
  };

  attendance?: number;

  broadcast?: string;
  broadcasts?: Array<{
    market: string;
    names: string[];
  }>;
}

export interface NBAStandings {
  season: {
    year: number;
    type: number;
    name: string;
  };

  conferences: Array<{
    id: string;
    name: string; // "Eastern" or "Western"
    abbreviation: string;

    teams: Array<{
      rank: number;
      playoffSeed?: number;
      team: NBATeam;
      stats: {
        wins: number;
        losses: number;
        winPercent: number;
        conferenceWins: number;
        conferenceLosses: number;
        divisionWins: number;
        divisionLosses: number;
        homeWins: number;
        homeLosses: number;
        roadWins: number;
        roadLosses: number;
        last10Wins: number;
        last10Losses: number;
        streak: string; // "W5", "L2"
        pointsFor: number;
        pointsAgainst: number;
        pointDifferential: number;
      };
    }>;
  }>;
}

// ============================================================================
// ADAPTER CLASS
// ============================================================================

export class NBAProductionAdapter {
  private client: SportsDataClient;
  private cache: KVNamespace | null;

  private static readonly ESPN_BASE =
    'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';

  private static readonly CACHE_KEYS = {
    TEAM: (teamId: string) => `nba:team:${teamId}`,
    ROSTER: (teamId: string, season: number) => `nba:roster:${teamId}:${season}`,
    STANDINGS: (season: number) => `nba:standings:${season}`,
    SCORES: (date: string) => `nba:scores:${date}`,
    GAME: (gameId: string) => `nba:game:${gameId}`,
  };

  private static readonly CACHE_TTL = {
    TEAM: 86400, // 24 hours
    ROSTER: 3600, // 1 hour
    STANDINGS: 1800, // 30 minutes
    SCORES_LIVE: 15, // 15 seconds (NBA moves fast)
    SCORES_FINAL: 3600, // 1 hour
    GAME_LIVE: 15, // 15 seconds
    GAME_FINAL: 3600, // 1 hour
  };

  constructor(cache?: KVNamespace) {
    this.client = new SportsDataClient();
    this.cache = cache || null;
  }

  // ==========================================================================
  // CORE FETCH UTILITIES
  // ==========================================================================

  private async fetchWithCache<T>(url: string, cacheKey: string, ttl: number): Promise<T> {
    // Try KV cache first
    if (this.cache) {
      try {
        const cached = await this.cache.get(cacheKey, 'json');
        if (cached) {
          return cached as T;
        }
      } catch (error) {
        console.warn(`KV cache read failed for ${cacheKey}:`, error);
      }
    }

    // Fetch from ESPN API
    const apiResponse = await this.client.fetch<T>('espn', url, {});
    const data = apiResponse.data as T;

    // Store in KV cache
    if (this.cache && data) {
      try {
        await this.cache.put(cacheKey, JSON.stringify(data), {
          expirationTtl: ttl,
        });
      } catch (error) {
        console.warn(`KV cache write failed for ${cacheKey}:`, error);
      }
    }

    return data;
  }

  // ==========================================================================
  // TEAM DATA
  // ==========================================================================

  /**
   * Fetch team information
   */
  async fetchTeamInfo(teamId: string, season?: number): Promise<NBATeam> {
    const year = season || new Date().getFullYear();
    const url = `${NBAProductionAdapter.ESPN_BASE}/teams/${teamId}?season=${year}`;
    const cacheKey = NBAProductionAdapter.CACHE_KEYS.TEAM(teamId);

    const data = await this.fetchWithCache<{ team: NBATeam }>(
      url,
      cacheKey,
      NBAProductionAdapter.CACHE_TTL.TEAM
    );

    return data.team;
  }

  /**
   * Fetch team roster
   */
  async fetchRoster(teamId: string, season?: number): Promise<NBAPlayer[]> {
    const year = season || new Date().getFullYear();
    const url = `${NBAProductionAdapter.ESPN_BASE}/teams/${teamId}/roster?season=${year}`;
    const cacheKey = NBAProductionAdapter.CACHE_KEYS.ROSTER(teamId, year);

    const data = await this.fetchWithCache<{ athletes: NBAPlayer[] }>(
      url,
      cacheKey,
      NBAProductionAdapter.CACHE_TTL.ROSTER
    );

    return data.athletes || [];
  }

  /**
   * Fetch all NBA teams
   */
  async fetchAllTeams(season?: number): Promise<NBATeam[]> {
    const year = season || new Date().getFullYear();
    const url = `${NBAProductionAdapter.ESPN_BASE}/teams?season=${year}&limit=30`;
    const cacheKey = `nba:teams:all:${year}`;

    const data = await this.fetchWithCache<{
      sports: Array<{ leagues: Array<{ teams: NBATeam[] }> }>;
    }>(url, cacheKey, NBAProductionAdapter.CACHE_TTL.TEAM);

    const teams = data.sports?.[0]?.leagues?.[0]?.teams || [];
    return teams;
  }

  // ==========================================================================
  // GAME DATA
  // ==========================================================================

  /**
   * Fetch today's scoreboard
   */
  async fetchTodaysScoreboard(): Promise<{ date: string; games: NBAGame[] }> {
    const today = DateTime.now().setZone('America/Chicago').toFormat('yyyyMMdd');
    return this.fetchScoreboard(today);
  }

  /**
   * Fetch scoreboard for a specific date
   */
  async fetchScoreboard(date: string): Promise<{ date: string; games: NBAGame[] }> {
    const url = `${NBAProductionAdapter.ESPN_BASE}/scoreboard?dates=${date}`;
    const cacheKey = NBAProductionAdapter.CACHE_KEYS.SCORES(date);

    // Determine if today (live games possible)
    const today = DateTime.now().setZone('America/Chicago').toFormat('yyyyMMdd');
    const isToday = date === today;
    const ttl = isToday
      ? NBAProductionAdapter.CACHE_TTL.SCORES_LIVE
      : NBAProductionAdapter.CACHE_TTL.SCORES_FINAL;

    const data = await this.fetchWithCache<{ day: { date: string }; events: any[] }>(
      url,
      cacheKey,
      ttl
    );

    const games: NBAGame[] = (data.events || []).map((event: any) => ({
      id: event.id,
      uid: event.uid,
      date: event.date,
      name: event.name,
      shortName: event.shortName,
      season: event.season,
      status: event.status,
      teams: {
        away: {
          team: {
            id: event.competitions[0].competitors[1].id,
            displayName: event.competitions[0].competitors[1].team.displayName,
            abbreviation: event.competitions[0].competitors[1].team.abbreviation,
            logos: event.competitions[0].competitors[1].team.logos,
            conference: event.competitions[0].competitors[1].team.conference,
            division: event.competitions[0].competitors[1].team.division,
          },
          score: parseInt(event.competitions[0].competitors[1].score || '0'),
          record: event.competitions[0].competitors[1].records?.[0]?.summary,
          rank: event.competitions[0].competitors[1].rank,
          leaders: event.competitions[0].competitors[1].leaders,
        },
        home: {
          team: {
            id: event.competitions[0].competitors[0].id,
            displayName: event.competitions[0].competitors[0].team.displayName,
            abbreviation: event.competitions[0].competitors[0].team.abbreviation,
            logos: event.competitions[0].competitors[0].team.logos,
            conference: event.competitions[0].competitors[0].team.conference,
            division: event.competitions[0].competitors[0].team.division,
          },
          score: parseInt(event.competitions[0].competitors[0].score || '0'),
          record: event.competitions[0].competitors[0].records?.[0]?.summary,
          rank: event.competitions[0].competitors[0].rank,
          leaders: event.competitions[0].competitors[0].leaders,
        },
      },
      venue: event.competitions[0].venue,
      attendance: event.competitions[0].attendance,
      broadcast: event.competitions[0].broadcasts?.[0]?.names?.[0],
      broadcasts: event.competitions[0].broadcasts,
    }));

    return {
      date: data.day.date,
      games,
    };
  }

  /**
   * Fetch detailed game information
   */
  async fetchGameDetails(gameId: string): Promise<NBAGame> {
    const url = `${NBAProductionAdapter.ESPN_BASE}/summary?event=${gameId}`;
    const cacheKey = NBAProductionAdapter.CACHE_KEYS.GAME(gameId);

    const data = await this.fetchWithCache<any>(
      url,
      cacheKey,
      NBAProductionAdapter.CACHE_TTL.GAME_LIVE
    );

    const competition = data.header?.competitions?.[0] || {};

    return {
      id: competition.id,
      uid: competition.uid,
      date: competition.date,
      name: data.header?.competitions?.[0]?.name,
      shortName: data.header?.competitions?.[0]?.shortName,
      season: data.header?.season,
      status: competition.status,
      teams: {
        away: {
          team: {
            id: competition.competitors[1].id,
            displayName: competition.competitors[1].team.displayName,
            abbreviation: competition.competitors[1].team.abbreviation,
            logos: competition.competitors[1].team.logos,
            conference: competition.competitors[1].team.conference,
            division: competition.competitors[1].team.division,
          },
          score: parseInt(competition.competitors[1].score || '0'),
          record: competition.competitors[1].records?.[0]?.summary,
          rank: competition.competitors[1].rank,
        },
        home: {
          team: {
            id: competition.competitors[0].id,
            displayName: competition.competitors[0].team.displayName,
            abbreviation: competition.competitors[0].team.abbreviation,
            logos: competition.competitors[0].team.logos,
            conference: competition.competitors[0].team.conference,
            division: competition.competitors[0].team.division,
          },
          score: parseInt(competition.competitors[0].score || '0'),
          record: competition.competitors[0].records?.[0]?.summary,
          rank: competition.competitors[0].rank,
        },
      },
      venue: competition.venue,
      attendance: competition.attendance,
    };
  }

  // ==========================================================================
  // STANDINGS
  // ==========================================================================

  /**
   * Fetch NBA standings
   */
  async fetchStandings(season?: number): Promise<NBAStandings> {
    const year = season || new Date().getFullYear();
    const url = `${NBAProductionAdapter.ESPN_BASE}/standings?season=${year}`;
    const cacheKey = NBAProductionAdapter.CACHE_KEYS.STANDINGS(year);

    const data = await this.fetchWithCache<any>(
      url,
      cacheKey,
      NBAProductionAdapter.CACHE_TTL.STANDINGS
    );

    const conferences = (data.children || []).map((conf: any) => ({
      id: conf.id,
      name: conf.name,
      abbreviation: conf.abbreviation,
      teams: (conf.standings?.entries || []).map((entry: any, index: number) => ({
        rank: index + 1,
        playoffSeed: entry.stats?.find((s: any) => s.name === 'playoffSeed')?.value,
        team: this.parseTeamFromStandings(entry),
        stats: this.parseStandingsStats(entry.stats),
      })),
    }));

    return {
      season: {
        year: data.season?.year || year,
        type: data.season?.type || 2,
        name: data.season?.name || 'Regular Season',
      },
      conferences,
    };
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private parseTeamFromStandings(entry: any): NBATeam {
    return {
      id: entry.team.id,
      uid: entry.team.uid,
      slug: entry.team.slug,
      location: entry.team.location,
      name: entry.team.name,
      abbreviation: entry.team.abbreviation,
      displayName: entry.team.displayName,
      shortDisplayName: entry.team.shortDisplayName,
      color: entry.team.color,
      alternateColor: entry.team.alternateColor,
      logos: entry.team.logos,
      conference: {
        id: entry.team.conferenceId || '',
        name: entry.team.conference || '',
        abbreviation: entry.team.conferenceAbbreviation || '',
      },
      division: {
        id: entry.team.divisionId || '',
        name: entry.team.division || '',
        abbreviation: entry.team.divisionAbbreviation || '',
      },
      record: {
        summary: entry.stats?.find((s: any) => s.name === 'overall')?.displayValue || '0-0',
        wins: entry.stats?.find((s: any) => s.name === 'wins')?.value || 0,
        losses: entry.stats?.find((s: any) => s.name === 'losses')?.value || 0,
        winPercent: entry.stats?.find((s: any) => s.name === 'winPercent')?.value || 0,
      },
      links: entry.team.links,
    };
  }

  private parseStandingsStats(stats: any[]): NBAStandings['conferences'][0]['teams'][0]['stats'] {
    return {
      wins: stats.find((s) => s.name === 'wins')?.value || 0,
      losses: stats.find((s) => s.name === 'losses')?.value || 0,
      winPercent: stats.find((s) => s.name === 'winPercent')?.value || 0,
      conferenceWins: stats.find((s) => s.name === 'conferenceWins')?.value || 0,
      conferenceLosses: stats.find((s) => s.name === 'conferenceLosses')?.value || 0,
      divisionWins: stats.find((s) => s.name === 'divisionWins')?.value || 0,
      divisionLosses: stats.find((s) => s.name === 'divisionLosses')?.value || 0,
      homeWins: stats.find((s) => s.name === 'homeWins')?.value || 0,
      homeLosses: stats.find((s) => s.name === 'homeLosses')?.value || 0,
      roadWins: stats.find((s) => s.name === 'awayWins')?.value || 0,
      roadLosses: stats.find((s) => s.name === 'awayLosses')?.value || 0,
      last10Wins: stats.find((s) => s.name === 'l10Wins')?.value || 0,
      last10Losses: stats.find((s) => s.name === 'l10Losses')?.value || 0,
      streak: stats.find((s) => s.name === 'streak')?.displayValue || '-',
      pointsFor: stats.find((s) => s.name === 'pointsFor')?.value || 0,
      pointsAgainst: stats.find((s) => s.name === 'pointsAgainst')?.value || 0,
      pointDifferential:
        (stats.find((s) => s.name === 'pointsFor')?.value || 0) -
        (stats.find((s) => s.name === 'pointsAgainst')?.value || 0),
    };
  }
}
