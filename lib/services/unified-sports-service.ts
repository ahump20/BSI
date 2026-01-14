/**
 * Unified Sports Service
 * Single interface for all sports data with automatic provider selection
 */

import { sportsDataverseAdapter } from '../adapters/sportsdataverse';
import type { Sport, UnifiedGameData, UnifiedStandingsData } from '../types/sportsdataverse';
import { apiCache } from '../utils/cache';

export class UnifiedSportsService {
  /**
   * Get games across all sports or for a specific sport
   */
  async getGames(sport?: Sport, date?: string): Promise<UnifiedGameData[]> {
    if (sport) {
      return sportsDataverseAdapter.getGames(sport, date);
    }

    // Get games for all sports
    const sports: Sport[] = ['nfl', 'nba', 'mlb', 'cfb', 'cbb'];
    const allGames = await Promise.all(
      sports.map((s) => sportsDataverseAdapter.getGames(s, date))
    );

    return allGames.flat();
  }

  /**
   * Get standings for a specific sport
   */
  async getStandings(sport: Sport, conference?: string): Promise<UnifiedStandingsData> {
    return sportsDataverseAdapter.getStandings(sport, conference);
  }

  /**
   * Get live scores across all sports
   */
  async getLiveScores(): Promise<UnifiedGameData[]> {
    const allGames = await this.getGames();
    return allGames.filter((game) => game.status === 'in_progress');
  }

  /**
   * Search games by team
   */
  async getGamesByTeam(teamId: string, sport: Sport): Promise<UnifiedGameData[]> {
    const games = await this.getGames(sport);
    return games.filter(
      (game) => game.homeTeam.id === teamId || game.awayTeam.id === teamId
    );
  }
}

export const unifiedSportsService = new UnifiedSportsService();
