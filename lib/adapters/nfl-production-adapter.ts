/**
 * NFL Production Adapter
 * Real data integration with ESPN NFL API
 *
 * Data Sources:
 * - ESPN NFL API (primary)
 * - SportsDataIO (fallback, requires API key)
 *
 * Cache Strategy:
 * - Team info: 24 hours
 * - Rosters: 1 hour during season
 * - Standings: 30 minutes
 * - Live scores: 30 seconds during games
 * - Completed games: 1 hour
 */

import { DateTime } from 'luxon';
import { SportsDataClient } from '../api/sports-data-client';

// ============================================================================
// TYPES
// ============================================================================

export interface NFLTeam {
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
    name: string; // "NFC" or "AFC"
    abbreviation: string;
  };

  division: {
    id: string;
    name: string; // "NFC East", "AFC West", etc.
    abbreviation: string;
  };

  record: {
    summary: string; // "8-6"
    wins: number;
    losses: number;
    ties: number;
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
    grass: boolean;
    indoor: boolean;
  };

  links: Array<{
    rel: string[];
    href: string;
    text: string;
  }>;
}

export interface NFLPlayer {
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

  height: string; // "6' 4\""
  weight: number;
  age: number;
  dateOfBirth: string;

  experience: {
    years: number;
    displayValue: string; // "5th Season"
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
    passing?: {
      completions: number;
      attempts: number;
      yards: number;
      touchdowns: number;
      interceptions: number;
      rating: number;
    };
    rushing?: {
      attempts: number;
      yards: number;
      touchdowns: number;
      yardsPerCarry: number;
    };
    receiving?: {
      receptions: number;
      yards: number;
      touchdowns: number;
      yardsPerReception: number;
    };
    defense?: {
      tackles: number;
      sacks: number;
      interceptions: number;
      forcedFumbles: number;
    };
  };

  active: boolean;
}

export interface NFLGame {
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

  week: {
    number: number;
    text: string; // "Week 10"
  };

  status: {
    period: number; // Quarter
    clock: string; // "14:53"
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
      team: Pick<NFLTeam, 'id' | 'displayName' | 'abbreviation' | 'logos' | 'conference' | 'division'>;
      score: number;
      record: string;
      rank?: number;
      leaders?: Array<{
        category: string;
        player: NFLPlayer;
        stats: string;
      }>;
    };
    home: {
      team: Pick<NFLTeam, 'id' | 'displayName' | 'abbreviation' | 'logos' | 'conference' | 'division'>;
      score: number;
      record: string;
      rank?: number;
      leaders?: Array<{
        category: string;
        player: NFLPlayer;
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

  odds?: {
    overUnder: number;
    spread: number;
    favorite: 'home' | 'away';
  };

  weather?: {
    temperature: number;
    condition: string;
    wind: string;
  };
}

export interface NFLStandings {
  season: {
    year: number;
    type: number;
    name: string;
  };

  conferences: Array<{
    id: string;
    name: string; // "AFC" or "NFC"
    abbreviation: string;

    divisions: Array<{
      id: string;
      name: string;
      abbreviation: string;

      teams: Array<{
        rank: number;
        team: NFLTeam;
        stats: {
          wins: number;
          losses: number;
          ties: number;
          winPercent: number;
          conferenceWins: number;
          conferenceLosses: number;
          divisionWins: number;
          divisionLosses: number;
          pointsFor: number;
          pointsAgainst: number;
          pointDifferential: number;
          streak: string; // "W3", "L2"
        };
      }>;
    }>;
  }>;
}

// ============================================================================
// ADAPTER CLASS
// ============================================================================

export class NFLProductionAdapter {
  private client: SportsDataClient;
  private cache: KVNamespace | null;

  private static readonly ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';

  private static readonly CACHE_KEYS = {
    TEAM: (teamId: string) => `nfl:team:${teamId}`,
    ROSTER: (teamId: string, season: number) => `nfl:roster:${teamId}:${season}`,
    STANDINGS: (season: number) => `nfl:standings:${season}`,
    SCORES: (week: number, season: number) => `nfl:scores:${week}:${season}`,
    GAME: (gameId: string) => `nfl:game:${gameId}`,
  };

  private static readonly CACHE_TTL = {
    TEAM: 86400, // 24 hours
    ROSTER: 3600, // 1 hour
    STANDINGS: 1800, // 30 minutes
    SCORES_LIVE: 30, // 30 seconds
    SCORES_FINAL: 3600, // 1 hour
    GAME_LIVE: 30, // 30 seconds
    GAME_FINAL: 3600, // 1 hour
  };

  constructor(cache?: KVNamespace) {
    this.client = new SportsDataClient();
    this.cache = cache || null;
  }

  // ==========================================================================
  // CORE FETCH UTILITIES
  // ==========================================================================

  private async fetchWithCache<T>(
    url: string,
    cacheKey: string,
    ttl: number
  ): Promise<T> {
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
    const response = await this.client.fetch<T>(url, {
      headers: {
        'User-Agent': 'BlazeSportsIntel/1.0 (https://blazesportsintel.com)',
        'Accept': 'application/json',
      },
    });

    // Store in KV cache
    if (this.cache) {
      try {
        await this.cache.put(cacheKey, JSON.stringify(response), {
          expirationTtl: ttl,
        });
      } catch (error) {
        console.warn(`KV cache write failed for ${cacheKey}:`, error);
      }
    }

    return response;
  }

  // ==========================================================================
  // TEAM DATA
  // ==========================================================================

  /**
   * Fetch team information
   */
  async fetchTeamInfo(teamId: string, season?: number): Promise<NFLTeam> {
    const year = season || new Date().getFullYear();
    const url = `${NFLProductionAdapter.ESPN_BASE}/teams/${teamId}?season=${year}`;
    const cacheKey = NFLProductionAdapter.CACHE_KEYS.TEAM(teamId);

    const data = await this.fetchWithCache<{ team: NFLTeam }>(
      url,
      cacheKey,
      NFLProductionAdapter.CACHE_TTL.TEAM
    );

    return data.team;
  }

  /**
   * Fetch team roster
   */
  async fetchRoster(teamId: string, season?: number): Promise<NFLPlayer[]> {
    const year = season || new Date().getFullYear();
    const url = `${NFLProductionAdapter.ESPN_BASE}/teams/${teamId}/roster?season=${year}`;
    const cacheKey = NFLProductionAdapter.CACHE_KEYS.ROSTER(teamId, year);

    const data = await this.fetchWithCache<{ athletes: NFLPlayer[] }>(
      url,
      cacheKey,
      NFLProductionAdapter.CACHE_TTL.ROSTER
    );

    return data.athletes || [];
  }

  /**
   * Fetch all NFL teams
   */
  async fetchAllTeams(season?: number): Promise<NFLTeam[]> {
    const year = season || new Date().getFullYear();
    const url = `${NFLProductionAdapter.ESPN_BASE}/teams?season=${year}&limit=32`;
    const cacheKey = `nfl:teams:all:${year}`;

    const data = await this.fetchWithCache<{ sports: Array<{ leagues: Array<{ teams: NFLTeam[] }> }> }>(
      url,
      cacheKey,
      NFLProductionAdapter.CACHE_TTL.TEAM
    );

    const teams = data.sports?.[0]?.leagues?.[0]?.teams || [];
    return teams;
  }

  // ==========================================================================
  // GAME DATA
  // ==========================================================================

  /**
   * Fetch scoreboard for a specific week
   */
  async fetchScoreboard(week?: number, season?: number): Promise<{ week: number; season: number; games: NFLGame[] }> {
    const year = season || new Date().getFullYear();
    const weekNum = week || this.getCurrentWeek();
    const url = `${NFLProductionAdapter.ESPN_BASE}/scoreboard?week=${weekNum}&season=${year}`;
    const cacheKey = NFLProductionAdapter.CACHE_KEYS.SCORES(weekNum, year);

    // Determine if games are live
    const isLive = this.isCurrentWeek(weekNum);
    const ttl = isLive
      ? NFLProductionAdapter.CACHE_TTL.SCORES_LIVE
      : NFLProductionAdapter.CACHE_TTL.SCORES_FINAL;

    const data = await this.fetchWithCache<{ week: { number: number }; season: { year: number }; events: any[] }>(
      url,
      cacheKey,
      ttl
    );

    const games: NFLGame[] = (data.events || []).map((event: any) => ({
      id: event.id,
      uid: event.uid,
      date: event.date,
      name: event.name,
      shortName: event.shortName,
      season: event.season,
      week: event.week,
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
      odds: event.competitions[0].odds?.[0],
      weather: event.weather,
    }));

    return {
      week: data.week.number,
      season: data.season.year,
      games,
    };
  }

  /**
   * Fetch detailed game information
   */
  async fetchGameDetails(gameId: string): Promise<NFLGame> {
    const url = `${NFLProductionAdapter.ESPN_BASE}/summary?event=${gameId}`;
    const cacheKey = NFLProductionAdapter.CACHE_KEYS.GAME(gameId);

    const data = await this.fetchWithCache<any>(
      url,
      cacheKey,
      NFLProductionAdapter.CACHE_TTL.GAME_LIVE
    );

    const competition = data.header?.competitions?.[0] || {};

    return {
      id: competition.id,
      uid: competition.uid,
      date: competition.date,
      name: data.header?.competitions?.[0]?.name,
      shortName: data.header?.competitions?.[0]?.shortName,
      season: data.header?.season,
      week: data.header?.week,
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
      weather: data.gameInfo?.weather,
    };
  }

  // ==========================================================================
  // STANDINGS
  // ==========================================================================

  /**
   * Fetch NFL standings
   */
  async fetchStandings(season?: number): Promise<NFLStandings> {
    const year = season || new Date().getFullYear();
    const url = `${NFLProductionAdapter.ESPN_BASE}/standings?season=${year}`;
    const cacheKey = NFLProductionAdapter.CACHE_KEYS.STANDINGS(year);

    const data = await this.fetchWithCache<any>(
      url,
      cacheKey,
      NFLProductionAdapter.CACHE_TTL.STANDINGS
    );

    const conferences = (data.children || []).map((conf: any) => ({
      id: conf.id,
      name: conf.name,
      abbreviation: conf.abbreviation,
      divisions: (conf.children || []).map((div: any) => ({
        id: div.id,
        name: div.name,
        abbreviation: div.abbreviation,
        teams: (div.standings?.entries || []).map((entry: any, index: number) => ({
          rank: index + 1,
          team: this.parseTeamFromStandings(entry),
          stats: this.parseStandingsStats(entry.stats),
        })),
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

  private getCurrentWeek(): number {
    // Simple heuristic: NFL season starts first week of September
    // Returns current week (1-18 for regular season)
    const now = new Date();
    const seasonStart = new Date(now.getFullYear(), 8, 1); // September 1
    const diffTime = Math.abs(now.getTime() - seasonStart.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const week = Math.floor(diffDays / 7) + 1;
    return Math.min(18, Math.max(1, week));
  }

  private isCurrentWeek(week: number): boolean {
    return week === this.getCurrentWeek();
  }

  private parseTeamFromStandings(entry: any): NFLTeam {
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
        ties: entry.stats?.find((s: any) => s.name === 'ties')?.value || 0,
        winPercent: entry.stats?.find((s: any) => s.name === 'winPercent')?.value || 0,
      },
      links: entry.team.links,
    };
  }

  private parseStandingsStats(stats: any[]): NFLStandings['conferences'][0]['divisions'][0]['teams'][0]['stats'] {
    return {
      wins: stats.find(s => s.name === 'wins')?.value || 0,
      losses: stats.find(s => s.name === 'losses')?.value || 0,
      ties: stats.find(s => s.name === 'ties')?.value || 0,
      winPercent: stats.find(s => s.name === 'winPercent')?.value || 0,
      conferenceWins: stats.find(s => s.name === 'conferenceWins')?.value || 0,
      conferenceLosses: stats.find(s => s.name === 'conferenceLosses')?.value || 0,
      divisionWins: stats.find(s => s.name === 'divisionWins')?.value || 0,
      divisionLosses: stats.find(s => s.name === 'divisionLosses')?.value || 0,
      pointsFor: stats.find(s => s.name === 'pointsFor')?.value || 0,
      pointsAgainst: stats.find(s => s.name === 'pointsAgainst')?.value || 0,
      pointDifferential: (stats.find(s => s.name === 'pointsFor')?.value || 0) -
                          (stats.find(s => s.name === 'pointsAgainst')?.value || 0),
      streak: stats.find(s => s.name === 'streak')?.displayValue || '-',
    };
  }
}
