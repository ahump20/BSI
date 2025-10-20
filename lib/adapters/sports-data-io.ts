/**
 * SportsDataIO Adapter (Primary Provider)
 *
 * API Documentation: https://sportsdata.io/developers/api-documentation/ncaa-baseball
 *
 * Endpoints Used:
 * - GET /scores/json/Games/{season}
 * - GET /scores/json/TeamSeasonStats/{season}
 * - GET /scores/json/TeamGameStatsByDate/{date}
 *
 * Rate Limits: 10 requests per second (tier-dependent)
 */

import { Division, FeedPrecision, GameStatus, InningHalf, Sport } from '@prisma/client';
import type {
  GamesQueryParams,
  TeamStatsQueryParams,
  ProviderGame,
  ProviderTeamStats
} from '../../workers/ingest/types';

export class SportsDataIOAdapter {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.sportsdata.io/v3/cbb/scores/json'; // College Baseball
  }

  /**
   * Fetch games for a specific date
   */
  async getGames(params: GamesQueryParams): Promise<ProviderGame[]> {
    const { date } = params;

    // Format date as YYYY-MM-DD
    const dateStr = date.toISOString().split('T')[0];

    const url = `${this.baseUrl}/GamesByDate/${dateStr}`;

    const response = await fetch(url, {
      headers: {
        'Ocp-Apim-Subscription-Key': this.apiKey,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`SportsDataIO API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Transform to standard format
    return data.map((game: any) => this.transformGame(game, params));
  }

  /**
   * Fetch team stats for a season
   */
  async getTeamStats(params: TeamStatsQueryParams): Promise<ProviderTeamStats> {
    const { teamId, season } = params;

    const url = `${this.baseUrl}/TeamSeasonStats/${season}`;

    const response = await fetch(url, {
      headers: {
        'Ocp-Apim-Subscription-Key': this.apiKey,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`SportsDataIO API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Find team by ID
    const teamData = data.find((team: any) => team.TeamID.toString() === teamId);

    if (!teamData) {
      throw new Error(`Team ${teamId} not found in SportsDataIO response`);
    }

    // Transform to standard format
    return this.transformTeamStats(teamData);
  }

  /**
   * Transform SportsDataIO game format to standard format
   */
  private transformGame(game: any, params: GamesQueryParams): ProviderGame {
    let status: GameStatus;
    switch (game.Status) {
      case 'InProgress':
        status = GameStatus.LIVE;
        break;
      case 'Final':
        status = GameStatus.FINAL;
        break;
      case 'Postponed':
        status = GameStatus.POSTPONED;
        break;
      case 'Canceled':
        status = GameStatus.CANCELED;
        break;
      default:
        status = GameStatus.SCHEDULED;
    }

    let inningHalf: InningHalf | undefined;
    if (game.InningHalf === 'T') {
      inningHalf = InningHalf.TOP;
    } else if (game.InningHalf === 'B') {
      inningHalf = InningHalf.BOTTOM;
    }

    return {
      id: game.GameID.toString(),
      scheduledAt: game.DateTime,
      status,
      sport: params.sport ?? Sport.BASEBALL,
      division: params.division ?? Division.D1,
      homeTeamId: game.HomeTeamID?.toString() || '',
      awayTeamId: game.AwayTeamID?.toString() || '',
      homeScore: game.HomeTeamScore ?? null,
      awayScore: game.AwayTeamScore ?? null,
      venueId: game.StadiumID?.toString(),
      currentInning: game.Inning ?? undefined,
      currentInningHalf: inningHalf,
      balls: game.Balls ?? undefined,
      strikes: game.Strikes ?? undefined,
      outs: game.Outs ?? undefined,
      providerName: 'SportsDataIO',
      feedPrecision: FeedPrecision.EVENT,
    };
  }

  /**
   * Transform SportsDataIO team stats format to standard format
   */
  private transformTeamStats(teamData: any): ProviderTeamStats {
    return {
      wins: teamData.Wins ?? 0,
      losses: teamData.Losses ?? 0,
      confWins: teamData.ConferenceWins ?? 0,
      confLosses: teamData.ConferenceLosses ?? 0,
      homeWins: teamData.HomeWins ?? 0,
      homeLosses: teamData.HomeLosses ?? 0,
      awayWins: teamData.AwayWins ?? 0,
      awayLosses: teamData.AwayLosses ?? 0,
      runsScored: teamData.RunsScored ?? 0,
      runsAllowed: teamData.RunsAllowed ?? 0,
      hitsTotal: teamData.Hits ?? 0,
      doubles: teamData.Doubles ?? 0,
      triples: teamData.Triples ?? 0,
      homeRuns: teamData.HomeRuns ?? 0,
      stolenBases: teamData.StolenBases ?? 0,
      caughtStealing: teamData.CaughtStealing ?? 0,
      battingAvg: teamData.BattingAverage ?? 0,
      era: teamData.EarnedRunAverage ?? 0,
      fieldingPct: teamData.FieldingPercentage ?? 0,
      onBasePct: teamData.OnBasePercentage ?? undefined,
      sluggingPct: teamData.SluggingPercentage ?? undefined,
      ops: teamData.OnBasePlusSlugging ?? undefined,
      hitsAllowed: teamData.HitsAllowed ?? undefined,
      strikeouts: teamData.Strikeouts ?? undefined,
      walks: teamData.Walks ?? undefined,
      whip: teamData.WalksHitsPerInningPitched ?? undefined,
      rpi: undefined,
      strengthOfSched: undefined,
      pythagWins: undefined,
      recentForm: undefined,
      injuryImpact: undefined,
    };
  }
}
