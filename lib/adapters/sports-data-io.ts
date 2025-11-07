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
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`SportsDataIO API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Transform to standard format
    return data.map((game: any) => this.transformGame(game));
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
        Accept: 'application/json'
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
  private transformGame(game: any): ProviderGame {
    // Map SportsDataIO status to standard status
    let status: ProviderGame['status'];
    if (game.Status === 'Scheduled') {
      status = 'SCHEDULED';
    } else if (game.Status === 'InProgress') {
      status = 'LIVE';
    } else if (game.Status === 'Final') {
      status = 'FINAL';
    } else if (game.Status === 'Postponed') {
      status = 'POSTPONED';
    } else if (game.Status === 'Canceled') {
      status = 'CANCELLED';
    } else {
      status = 'SCHEDULED'; // Default fallback
    }

    return {
      id: game.GameID.toString(),
      scheduledAt: game.DateTime,
      status,
      homeTeamId: game.HomeTeamID?.toString() || '',
      awayTeamId: game.AwayTeamID?.toString() || '',
      homeScore: game.HomeTeamScore ?? null,
      awayScore: game.AwayTeamScore ?? null,
      venueId: game.StadiumID?.toString(),
      currentInning: game.Inning ?? undefined,
      currentInningHalf: game.InningHalf === 'T' ? 'TOP' : game.InningHalf === 'B' ? 'BOTTOM' : undefined,
      balls: game.Balls ?? undefined,
      strikes: game.Strikes ?? undefined,
      outs: game.Outs ?? undefined,
      providerName: 'SportsDataIO',
      feedPrecision: 'EVENT' // SportsDataIO provides event-level data
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
      battingAvg: teamData.BattingAverage ?? 0,
      era: teamData.EarnedRunAverage ?? 0,
      fieldingPct: teamData.FieldingPercentage ?? 0,
      rpi: undefined, // SportsDataIO doesn't provide RPI directly
      strengthOfSched: undefined, // SportsDataIO doesn't provide SOS directly
      pythagWins: undefined // Will be calculated separately
    };
  }
}
