/**
 * NFL Play-by-Play Service
 * Fetches and processes play-by-play data with EPA/WPA calculations
 */

import type {
  NFLPlay,
  PlayByPlayResponse,
  GameSummary,
  EPAMetrics,
  WPAMetrics,
} from '../types/nfl-playbyplay';
import { apiCache } from '../utils/cache';
import { DateTime } from 'luxon';

/**
 * Expected Points lookup table by field position and down
 * Based on historical NFL data
 */
const EP_TABLE: Record<number, Record<number, number>> = {
  1: { 1: 2.2, 2: 1.8, 3: 1.4, 4: 0.9 },
  10: { 1: 2.4, 2: 2.0, 3: 1.6, 4: 1.1 },
  20: { 1: 2.8, 2: 2.4, 3: 2.0, 4: 1.5 },
  30: { 1: 3.3, 2: 2.9, 3: 2.5, 4: 2.0 },
  40: { 1: 3.9, 2: 3.5, 3: 3.1, 4: 2.6 },
  50: { 1: 4.5, 2: 4.1, 3: 3.7, 4: 3.2 },
  60: { 1: 5.2, 2: 4.8, 3: 4.4, 4: 3.9 },
  70: { 1: 5.9, 2: 5.5, 3: 5.1, 4: 4.6 },
  80: { 1: 6.5, 2: 6.1, 3: 5.7, 4: 5.2 },
  90: { 1: 6.8, 2: 6.4, 3: 6.0, 4: 5.5 },
};

export class NFLPlayByPlayService {
  private readonly CACHE_TTL = 30000; // 30 seconds for live games

  /**
   * Fetch play-by-play data for a specific game
   */
  async getPlayByPlay(gameId: string): Promise<PlayByPlayResponse> {
    const cacheKey = `nfl:playbyplay:${gameId}`;
    const cached = apiCache.get<PlayByPlayResponse>(cacheKey);

    if (cached) {
      return cached;
    }

    // In production, this would call ESPN or SportsDataIO API
    // For now, return structured mock data
    const response = await this.fetchPlayByPlayData(gameId);

    apiCache.set(cacheKey, response, this.CACHE_TTL);
    return response;
  }

  /**
   * Calculate EPA (Expected Points Added) for a play
   */
  calculateEPA(
    startYardLine: number,
    endYardLine: number,
    startDown: number,
    endDown: number,
    scored: boolean
  ): number {
    if (scored) {
      return 7.0 - this.getExpectedPoints(startYardLine, startDown);
    }

    const startEP = this.getExpectedPoints(startYardLine, startDown);
    const endEP = this.getExpectedPoints(endYardLine, endDown);

    return endEP - startEP;
  }

  /**
   * Calculate WPA (Win Probability Added)
   */
  calculateWPA(
    quarter: number,
    timeRemaining: number,
    scoreDiff: number,
    startYardLine: number,
    endYardLine: number
  ): number {
    const startWP = this.getWinProbability(quarter, timeRemaining, scoreDiff, startYardLine);
    const endWP = this.getWinProbability(quarter, timeRemaining - 0.5, scoreDiff, endYardLine);

    return endWP - startWP;
  }

  /**
   * Calculate CPOE (Completion Percentage Over Expected)
   */
  calculateCPOE(
    distance: number,
    airYards: number,
    pressure: boolean,
    completed: boolean
  ): number {
    // Expected completion percentage based on distance and pressure
    let expectedCP = 0.7;

    if (airYards > 20) {
      expectedCP = 0.45;
    } else if (airYards > 10) {
      expectedCP = 0.6;
    }

    if (pressure) {
      expectedCP -= 0.15;
    }

    const actualCP = completed ? 1.0 : 0.0;
    return actualCP - expectedCP;
  }

  /**
   * Get EPA metrics for a game
   */
  async getEPAMetrics(gameId: string): Promise<EPAMetrics> {
    const playByPlay = await this.getPlayByPlay(gameId);

    const byQuarter: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    let passingEPA = 0;
    let rushingEPA = 0;
    let passingCount = 0;
    let rushingCount = 0;

    for (const play of playByPlay.plays) {
      byQuarter[play.quarter] = (byQuarter[play.quarter] || 0) + play.epa;

      if (play.playType === 'pass') {
        passingEPA += play.epa;
        passingCount++;
      } else if (play.playType === 'rush') {
        rushingEPA += play.epa;
        rushingCount++;
      }
    }

    return {
      overall: playByPlay.plays.reduce((sum, p) => sum + p.epa, 0) / playByPlay.plays.length,
      passing: passingCount > 0 ? passingEPA / passingCount : 0,
      rushing: rushingCount > 0 ? rushingEPA / rushingCount : 0,
      byQuarter,
    };
  }

  /**
   * Get WPA metrics for a game
   */
  async getWPAMetrics(gameId: string): Promise<WPAMetrics> {
    const playByPlay = await this.getPlayByPlay(gameId);
    const byPlayer: Record<string, number> = {};

    for (const play of playByPlay.plays) {
      const playerId = play.passerId || play.rusherId;
      if (playerId) {
        byPlayer[playerId] = (byPlayer[playerId] || 0) + play.wpa;
      }
    }

    const criticalPlays = playByPlay.plays
      .filter((p) => Math.abs(p.wpa) > 0.1)
      .sort((a, b) => Math.abs(b.wpa) - Math.abs(a.wpa))
      .slice(0, 10);

    return {
      overall: playByPlay.plays.reduce((sum, p) => sum + p.wpa, 0),
      byPlayer,
      criticalPlays,
    };
  }

  /**
   * Get expected points based on field position and down
   */
  private getExpectedPoints(yardLine: number, down: number): number {
    const bucket = Math.floor(yardLine / 10) * 10;
    const clampedBucket = Math.max(1, Math.min(90, bucket));
    const clampedDown = Math.max(1, Math.min(4, down));

    return EP_TABLE[clampedBucket]?.[clampedDown] || 0;
  }

  /**
   * Get win probability based on game situation
   */
  private getWinProbability(
    quarter: number,
    timeRemaining: number,
    scoreDiff: number,
    yardLine: number
  ): number {
    // Simplified win probability model
    let baseProb = 0.5;

    // Adjust for score differential
    baseProb += scoreDiff * 0.04;

    // Adjust for time remaining
    const timeWeight = (4 - quarter + timeRemaining / 60) / 4;
    baseProb = baseProb * (1 - timeWeight) + 0.5 * timeWeight;

    // Adjust for field position
    baseProb += (yardLine - 50) * 0.002;

    return Math.max(0, Math.min(1, baseProb));
  }

  /**
   * Fetch play-by-play data from API
   * In production, this would call ESPN or SportsDataIO
   */
  private async fetchPlayByPlayData(gameId: string): Promise<PlayByPlayResponse> {
    // Mock data for demonstration
    const plays: NFLPlay[] = [
      {
        playId: `${gameId}-1`,
        gameId,
        quarter: 1,
        time: '15:00',
        down: 1,
        distance: 10,
        yardLine: 25,
        playType: 'rush',
        description: 'D.Henry rush to the left for 5 yards',
        yardsGained: 5,
        epa: 0.3,
        wpa: 0.01,
        cpoe: 0,
        successRate: true,
        isFirstDown: false,
        isTouchdown: false,
        isTurnover: false,
        rusherId: 'player-1',
      },
    ];

    const summary: GameSummary = {
      totalPlays: plays.length,
      totalYards: plays.reduce((sum, p) => sum + p.yardsGained, 0),
      averageEPA: plays.reduce((sum, p) => sum + p.epa, 0) / plays.length,
      averageWPA: plays.reduce((sum, p) => sum + p.wpa, 0) / plays.length,
      passingPlays: plays.filter((p) => p.playType === 'pass').length,
      rushingPlays: plays.filter((p) => p.playType === 'rush').length,
      touchdowns: plays.filter((p) => p.isTouchdown).length,
      turnovers: plays.filter((p) => p.isTurnover).length,
      thirdDownConversions: { made: 0, attempts: 0 },
      fourthDownConversions: { made: 0, attempts: 0 },
    };

    return {
      gameId,
      homeTeam: 'HOME',
      awayTeam: 'AWAY',
      plays,
      summary,
    };
  }
}

export const nflPlayByPlayService = new NFLPlayByPlayService();
