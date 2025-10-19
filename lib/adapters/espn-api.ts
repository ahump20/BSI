/**
 * ESPN API Adapter (Tertiary Provider)
 *
 * API Documentation: https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball
 *
 * Endpoints Used:
 * - GET /apis/site/v2/sports/baseball/college-baseball/scoreboard
 * - GET /apis/site/v2/sports/baseball/college-baseball/teams
 * - GET /apis/site/v2/sports/baseball/college-baseball/teams/{id}/statistics
 *
 * Rate Limits: No official documentation, aggressive rate limiting observed
 * Note: ESPN API is less reliable for college baseball than SportsDataIO
 */

import { Division, FeedPrecision, GameStatus, Sport } from '@prisma/client';
import type {
  GamesQueryParams,
  TeamStatsQueryParams,
  ProviderGame,
  ProviderTeamStats
} from '../../workers/ingest/types';

export class ESPNAPIAdapter {
  private apiKey?: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball';
  }

  /**
   * Fetch games for a specific date
   */
  async getGames(params: GamesQueryParams): Promise<ProviderGame[]> {
    const { date } = params;

    // Format date as YYYYMMDD
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');

    const url = `${this.baseUrl}/scoreboard?dates=${dateStr}`;

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'BlazeSportsIntel/1.0',
      'Referer': 'https://blazesportsintel.com/'
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // ESPN API returns games under `events`
    const events = data?.events ?? [];

    // Transform to standard format
    return events.map((event: any) => this.transformGame(event, params));
  }

  /**
   * Fetch team stats for a season
   */
  async getTeamStats(params: TeamStatsQueryParams): Promise<ProviderTeamStats> {
    const { teamId, season } = params;

    const url = `${this.baseUrl}/teams/${teamId}/statistics?season=${season}`;

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'BlazeSportsIntel/1.0',
      'Referer': 'https://blazesportsintel.com/'
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Transform to standard format
    return this.transformTeamStats(data);
  }

  /**
   * Transform ESPN API game format to standard format
   */
  private transformGame(event: any, params: GamesQueryParams): ProviderGame {
    // ESPN uses competitions array
    const competition = event.competitions?.[0] || {};
    const competitors = competition.competitors || [];

    // Find home and away teams
    const homeTeam = competitors.find((c: any) => c.homeAway === 'home') || {};
    const awayTeam = competitors.find((c: any) => c.homeAway === 'away') || {};

    // Map ESPN status to standard status
    const statusType = competition.status?.type?.name?.toLowerCase() || '';
    let status: GameStatus;
    if (statusType.includes('scheduled') || statusType.includes('pre')) {
      status = GameStatus.SCHEDULED;
    } else if (statusType.includes('in progress') || statusType.includes('live')) {
      status = GameStatus.LIVE;
    } else if (statusType.includes('final')) {
      status = GameStatus.FINAL;
    } else if (statusType.includes('postponed')) {
      status = GameStatus.POSTPONED;
    } else if (statusType.includes('canceled') || statusType.includes('cancelled')) {
      status = GameStatus.CANCELED;
    } else {
      status = GameStatus.SCHEDULED;
    }

    return {
      id: event.id?.toString() || '',
      scheduledAt: event.date,
      status,
      sport: params.sport ?? Sport.BASEBALL,
      division: params.division ?? Division.D1,
      homeTeamId: homeTeam.team?.id?.toString() || homeTeam.id?.toString() || '',
      awayTeamId: awayTeam.team?.id?.toString() || awayTeam.id?.toString() || '',
      homeScore: parseFloat(homeTeam.score) || null,
      awayScore: parseFloat(awayTeam.score) || null,
      venueId: competition.venue?.id?.toString(),
      currentInning: competition.status?.period ?? undefined,
      currentInningHalf: undefined, // ESPN doesn't always provide inning half
      balls: competition.situation?.balls ?? undefined,
      strikes: competition.situation?.strikes ?? undefined,
      outs: competition.situation?.outs ?? undefined,
      providerName: 'ESPN_API',
      feedPrecision: FeedPrecision.EVENT,
    };
  }

  /**
   * Transform ESPN API team stats format to standard format
   */
  private transformTeamStats(data: any): ProviderTeamStats {
    // ESPN stats structure: data.team.record and data.team.statistics
    const record = data?.team?.record?.items?.[0] || {};
    const stats = data?.team?.statistics || [];

    // Helper to find stat by name
    const findStat = (name: string): number => {
      const stat = stats.find((s: any) => s.name === name);
      return parseFloat(stat?.value || '0') || 0;
    };

    return {
      wins: findStat('wins'),
      losses: findStat('losses'),
      confWins: findStat('confWins'),
      confLosses: findStat('confLosses'),
      homeWins: findStat('homeWins'),
      homeLosses: findStat('homeLosses'),
      awayWins: findStat('awayWins'),
      awayLosses: findStat('awayLosses'),
      runsScored: findStat('runsScored'),
      runsAllowed: findStat('runsAllowed'),
      hitsTotal: findStat('hits'),
      doubles: findStat('doubles'),
      triples: findStat('triples'),
      homeRuns: findStat('homeRuns'),
      stolenBases: findStat('stolenBases'),
      caughtStealing: findStat('caughtStealing'),
      battingAvg: findStat('battingAverage'),
      era: findStat('earnedRunAverage'),
      fieldingPct: findStat('fieldingPercentage'),
      onBasePct: findStat('onBasePercentage') || undefined,
      sluggingPct: findStat('sluggingPercentage') || undefined,
      ops: findStat('onBasePlusSlugging') || undefined,
      hitsAllowed: findStat('hitsAllowed') || undefined,
      strikeouts: findStat('strikeouts') || undefined,
      walks: findStat('walks') || undefined,
      whip: findStat('whip') || undefined,
      rpi: undefined,
      strengthOfSched: undefined,
      pythagWins: undefined,
      recentForm: record.standingSummary || undefined,
      injuryImpact: undefined,
    };
  }
}
