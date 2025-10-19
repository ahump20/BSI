/**
 * NCAA API Adapter (Backup Provider)
 *
 * API Documentation: https://data.ncaa.com/casablanca/scoreboard
 *
 * Endpoints Used:
 * - GET /casablanca/scoreboard/baseball/d1/{year}/{month}/{day}/scoreboard.json
 * - GET /casablanca/rankings
 * - GET /casablanca/game/{sport}/d1/{gameId}/boxscore.json
 *
 * Rate Limits: No official documentation, conservative approach recommended
 */

import { Division, FeedPrecision, GameStatus, InningHalf, Sport } from '@prisma/client';
import type {
  GamesQueryParams,
  TeamStatsQueryParams,
  ProviderGame,
  ProviderTeamStats
} from '../../workers/ingest/types';

export class NCAAAPIAdapter {
  private apiKey?: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://data.ncaa.com/casablanca';
  }

  /**
   * Fetch games for a specific date
   */
  async getGames(params: GamesQueryParams): Promise<ProviderGame[]> {
    const { date, division = Division.D1 } = params;

    // NCAA API expects lowercase division and specific URL structure
    const divisionStr = division.toLowerCase();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const url = `${this.baseUrl}/scoreboard/baseball/${divisionStr}/${year}/${month}/${day}/scoreboard.json`;

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'BlazeSportsIntel/1.0'
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`NCAA API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // NCAA API returns games under `scoreboard.games`
    const games = data?.scoreboard?.games ?? [];

    // Transform to standard format
    return games.map((game: any) => this.transformGame(game, params));
  }

  /**
   * Fetch team stats for a season
   *
   * Note: NCAA API doesn't provide direct team stats endpoint
   * This method aggregates from game data (less efficient)
   */
  async getTeamStats(params: TeamStatsQueryParams): Promise<ProviderTeamStats> {
    const { teamId, season } = params;

    // This is a simplified implementation
    // In production, you would need to:
    // 1. Fetch all games for the team
    // 2. Aggregate stats from box scores
    // 3. Calculate derived metrics

    throw new Error('NCAA API team stats not implemented - use SportsDataIO or ESPN as primary');
  }

  /**
   * Transform NCAA API game format to standard format
   */
  private transformGame(game: any, params: GamesQueryParams): ProviderGame {
    let status: GameStatus;
    switch (game.gameState) {
      case 'live':
        status = GameStatus.LIVE;
        break;
      case 'final':
        status = GameStatus.FINAL;
        break;
      case 'postponed':
        status = GameStatus.POSTPONED;
        break;
      case 'canceled':
        status = GameStatus.CANCELED;
        break;
      default:
        status = GameStatus.SCHEDULED;
    }

    const home = game.game?.home || {};
    const away = game.game?.away || {};

    let inningHalf: InningHalf | undefined;
    if (game.currentPeriodHalf === 'top') {
      inningHalf = InningHalf.TOP;
    } else if (game.currentPeriodHalf === 'bottom') {
      inningHalf = InningHalf.BOTTOM;
    }

    return {
      id: game.game?.gameID?.toString() || game.id?.toString() || '',
      scheduledAt: game.game?.startDate || game.startDate,
      status,
      sport: params.sport ?? Sport.BASEBALL,
      division: params.division ?? Division.D1,
      homeTeamId: home.teamId?.toString() || home.id?.toString() || '',
      awayTeamId: away.teamId?.toString() || away.id?.toString() || '',
      homeScore: home.score ?? null,
      awayScore: away.score ?? null,
      venueId: game.game?.location?.venueId?.toString(),
      currentInning: game.currentPeriod ?? undefined,
      currentInningHalf: inningHalf,
      balls: game.situation?.balls ?? undefined,
      strikes: game.situation?.strikes ?? undefined,
      outs: game.situation?.outs ?? undefined,
      providerName: 'NCAA_API',
      feedPrecision: FeedPrecision.EVENT,
    };
  }
}
