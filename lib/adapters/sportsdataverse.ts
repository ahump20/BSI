/**
 * SportsDataverse Adapter
 * Unified multi-sport data access with consistent interfaces
 */

import type {
  Sport,
  SportsDataverseConfig,
  UnifiedGameData,
  UnifiedStandingsData,
  UnifiedPlayerData,
  TeamInfo,
  StandingEntry,
} from '../types/sportsdataverse';
import { apiCache } from '../utils/cache';
import { DateTime } from 'luxon';

export class SportsDataverseAdapter {
  private readonly DEFAULT_TTL = 60000; // 1 minute

  /**
   * Get games for a specific sport
   */
  async getGames(sport: Sport, date?: string): Promise<UnifiedGameData[]> {
    const config: SportsDataverseConfig = {
      sport,
      endpoint: `/games/${sport}`,
      cacheKey: `sportsdataverse:games:${sport}:${date || 'today'}`,
      ttl: this.DEFAULT_TTL,
    };

    const cached = apiCache.get<UnifiedGameData[]>(config.cacheKey);
    if (cached) {
      return cached;
    }

    const games = await this.fetchGames(sport, date);
    apiCache.set(config.cacheKey, games, config.ttl);
    return games;
  }

  /**
   * Get standings for a specific sport
   */
  async getStandings(sport: Sport, conference?: string): Promise<UnifiedStandingsData> {
    const cacheKey = `sportsdataverse:standings:${sport}:${conference || 'all'}`;
    const cached = apiCache.get<UnifiedStandingsData>(cacheKey);

    if (cached) {
      return cached;
    }

    const standings = await this.fetchStandings(sport, conference);
    apiCache.set(cacheKey, standings, this.DEFAULT_TTL);
    return standings;
  }

  /**
   * Get player data for a specific sport
   */
  async getPlayers(sport: Sport, teamId?: string): Promise<UnifiedPlayerData[]> {
    const cacheKey = `sportsdataverse:players:${sport}:${teamId || 'all'}`;
    const cached = apiCache.get<UnifiedPlayerData[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const players = await this.fetchPlayers(sport, teamId);
    apiCache.set(cacheKey, players, this.DEFAULT_TTL);
    return players;
  }

  /**
   * Normalize game data from different sources
   */
  private normalizeGameData(rawData: any, sport: Sport): UnifiedGameData {
    return {
      gameId: rawData.id || rawData.gameId || String(rawData.GameID),
      sport,
      homeTeam: this.normalizeTeam(rawData.homeTeam || rawData.HomeTeam),
      awayTeam: this.normalizeTeam(rawData.awayTeam || rawData.AwayTeam),
      status: this.normalizeStatus(rawData.status || rawData.Status),
      score: {
        home: rawData.homeScore || rawData.HomeScore || 0,
        away: rawData.awayScore || rawData.AwayScore || 0,
      },
      startTime: rawData.startTime || rawData.DateTime || new Date().toISOString(),
      venue: rawData.venue || rawData.Stadium || 'TBD',
      broadcast: rawData.broadcast || rawData.Channel,
    };
  }

  /**
   * Normalize team data
   */
  private normalizeTeam(rawTeam: any): TeamInfo {
    return {
      id: String(rawTeam.id || rawTeam.TeamID || rawTeam.Key),
      name: rawTeam.name || rawTeam.Name || rawTeam.TeamName,
      abbreviation: rawTeam.abbreviation || rawTeam.Key || rawTeam.Abbr,
      logo: rawTeam.logo || rawTeam.WikipediaLogoUrl,
      color: rawTeam.color || rawTeam.PrimaryColor,
    };
  }

  /**
   * Normalize game status
   */
  private normalizeStatus(rawStatus: string): 'scheduled' | 'in_progress' | 'final' {
    const status = rawStatus?.toLowerCase();
    if (!status) return 'scheduled';

    if (status.includes('final') || status.includes('completed')) {
      return 'final';
    }
    if (
      status.includes('live') ||
      status.includes('progress') ||
      status.includes('active') ||
      status.includes('playing')
    ) {
      return 'in_progress';
    }
    return 'scheduled';
  }

  /**
   * Fetch games from API (mock implementation)
   */
  private async fetchGames(sport: Sport, date?: string): Promise<UnifiedGameData[]> {
    // In production, this would call the appropriate API based on sport
    // For now, return mock data
    return [
      {
        gameId: `${sport}-game-1`,
        sport,
        homeTeam: {
          id: '1',
          name: 'Home Team',
          abbreviation: 'HOM',
        },
        awayTeam: {
          id: '2',
          name: 'Away Team',
          abbreviation: 'AWY',
        },
        status: 'scheduled',
        score: { home: 0, away: 0 },
        startTime: new Date().toISOString(),
        venue: 'Stadium Name',
      },
    ];
  }

  /**
   * Fetch standings from API (mock implementation)
   */
  private async fetchStandings(sport: Sport, conference?: string): Promise<UnifiedStandingsData> {
    const teams: StandingEntry[] = [
      {
        team: {
          id: '1',
          name: 'Team One',
          abbreviation: 'T1',
        },
        wins: 10,
        losses: 5,
        winPct: 0.667,
        gamesBack: 0,
        streak: 'W3',
      },
    ];

    return {
      sport,
      conference,
      teams,
      lastUpdated: DateTime.now().setZone('America/Chicago').toISO() || '',
    };
  }

  /**
   * Fetch players from API (mock implementation)
   */
  private async fetchPlayers(sport: Sport, teamId?: string): Promise<UnifiedPlayerData[]> {
    return [
      {
        playerId: '1',
        sport,
        name: 'Player One',
        team: {
          id: teamId || '1',
          name: 'Team Name',
          abbreviation: 'TM',
        },
        position: 'QB',
        jerseyNumber: 12,
        stats: {},
      },
    ];
  }
}

export const sportsDataverseAdapter = new SportsDataverseAdapter();
