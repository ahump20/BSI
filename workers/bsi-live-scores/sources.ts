/**
 * Multi-sport data source dispatcher.
 *
 * Routes live score fetches to the correct external API per sport.
 * College baseball → Highlightly (RapidAPI)
 * MLB, NFL, NBA → SportsDataIO
 */

import {
  HighlightlyApiClient,
  type HighlightlyMatch,
} from '../../lib/api-clients/highlightly-api';

// =============================================================================
// Types
// =============================================================================

export type Sport = 'college-baseball' | 'mlb' | 'nfl' | 'nba';

export const VALID_SPORTS: Sport[] = ['college-baseball', 'mlb', 'nfl', 'nba'];

export function isValidSport(s: string): s is Sport {
  return VALID_SPORTS.includes(s as Sport);
}

interface SportEnv {
  RAPIDAPI_KEY?: string;
  SPORTSDATAIO_KEY?: string;
}

/** Generic raw game from any source, normalized minimally. */
export interface RawLiveGame {
  id: string;
  status: 'pre' | 'in' | 'post' | 'postponed' | 'cancelled';
  detailedState: string;
  period?: number;
  periodLabel?: string;
  awayTeam: {
    id: number;
    name: string;
    shortName: string;
    score: number;
    record?: string;
  };
  homeTeam: {
    id: number;
    name: string;
    shortName: string;
    score: number;
    record?: string;
  };
  startTime: string;
  venue: string;
  // Baseball-specific
  inning?: number;
  inningHalf?: 'top' | 'bottom';
  outs?: number;
}

// =============================================================================
// Highlightly (College Baseball)
// =============================================================================

function highlightlyMatchToRaw(match: HighlightlyMatch): RawLiveGame {
  const statusType = match.status?.type ?? 'notstarted';
  const formatRecord = (r?: { wins: number; losses: number }) =>
    r ? `${r.wins}-${r.losses}` : undefined;

  return {
    id: String(match.id),
    status:
      statusType === 'inprogress'
        ? 'in'
        : statusType === 'finished'
          ? 'post'
          : statusType === 'postponed'
            ? 'postponed'
            : statusType === 'cancelled'
              ? 'cancelled'
              : 'pre',
    detailedState: match.status?.description ?? statusType,
    inning: match.currentInning,
    inningHalf: match.currentInningHalf,
    outs: match.outs,
    awayTeam: {
      id: match.awayTeam?.id ?? 0,
      name: match.awayTeam?.name ?? 'Away',
      shortName: match.awayTeam?.shortName ?? '',
      score: match.awayScore ?? 0,
      record: formatRecord(match.awayTeam?.record),
    },
    homeTeam: {
      id: match.homeTeam?.id ?? 0,
      name: match.homeTeam?.name ?? 'Home',
      shortName: match.homeTeam?.shortName ?? '',
      score: match.homeScore ?? 0,
      record: formatRecord(match.homeTeam?.record),
    },
    startTime: new Date(match.startTimestamp * 1000).toISOString(),
    venue: match.venue?.name ?? 'TBD',
  };
}

async function fetchCollegeBaseball(env: SportEnv): Promise<RawLiveGame[]> {
  if (!env.RAPIDAPI_KEY) return [];

  const client = new HighlightlyApiClient({ rapidApiKey: env.RAPIDAPI_KEY });
  const result = await client.getMatches('NCAA');

  if (!result.success || !result.data) return [];

  const matches: HighlightlyMatch[] = result.data.data ?? [];
  return matches.map(highlightlyMatchToRaw);
}

// =============================================================================
// SportsDataIO (MLB, NFL, NBA)
// =============================================================================

const SPORTSDATAIO_ENDPOINTS: Record<string, string> = {
  mlb: 'https://api.sportsdata.io/v3/mlb/scores/json/GamesByDate',
  nfl: 'https://api.sportsdata.io/v3/nfl/scores/json/ScoresByDate',
  nba: 'https://api.sportsdata.io/v3/nba/scores/json/GamesByDate',
};

function todayString(): string {
  // SportsDataIO expects YYYY-MMM-DD format for some endpoints, YYYY-MM-DD for others
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

async function fetchSportsDataIO(sport: string, env: SportEnv): Promise<RawLiveGame[]> {
  if (!env.SPORTSDATAIO_KEY) return [];

  const base = SPORTSDATAIO_ENDPOINTS[sport];
  if (!base) return [];

  const date = todayString();
  const url = `${base}/${date}`;

  const res = await fetch(url, {
    headers: { 'Ocp-Apim-Subscription-Key': env.SPORTSDATAIO_KEY },
  });

  if (!res.ok) return [];

  const games = (await res.json()) as Record<string, unknown>[];
  return games.map((g) => normalizeSportsDataIOGame(g, sport));
}

function normalizeSportsDataIOGame(g: Record<string, unknown>, sport: string): RawLiveGame {
  const rawStatus = String(g.Status ?? 'Scheduled');
  const status: RawLiveGame['status'] =
    rawStatus === 'InProgress' ? 'in' :
    rawStatus === 'Final' || rawStatus === 'F/OT' ? 'post' :
    rawStatus === 'Postponed' ? 'postponed' :
    rawStatus === 'Canceled' ? 'cancelled' : 'pre';

  return {
    id: String(g.GameID ?? g.ScoreID ?? ''),
    status,
    detailedState: rawStatus,
    period: g.Period != null ? Number(g.Period) : undefined,
    periodLabel: g.Quarter != null ? `Q${g.Quarter}` : g.Inning != null ? `${g.Inning}` : undefined,
    inning: sport === 'mlb' ? (g.Inning as number | undefined) : undefined,
    inningHalf: sport === 'mlb' ? (g.InningHalf as 'top' | 'bottom' | undefined) : undefined,
    awayTeam: {
      id: Number(g.AwayTeamID ?? 0),
      name: String(g.AwayTeam ?? 'Away'),
      shortName: String(g.AwayTeam ?? ''),
      score: Number(g.AwayTeamScore ?? g.AwayScore ?? 0),
      record: g.AwayTeamRecord ? String(g.AwayTeamRecord) : undefined,
    },
    homeTeam: {
      id: Number(g.HomeTeamID ?? 0),
      name: String(g.HomeTeam ?? 'Home'),
      shortName: String(g.HomeTeam ?? ''),
      score: Number(g.HomeTeamScore ?? g.HomeScore ?? 0),
      record: g.HomeTeamRecord ? String(g.HomeTeamRecord) : undefined,
    },
    startTime: String(g.DateTime ?? g.Date ?? ''),
    venue: String(g.StadiumName ?? g.Stadium ?? 'TBD'),
  };
}

// =============================================================================
// Dispatcher
// =============================================================================

export async function fetchLiveGames(sport: Sport, env: SportEnv): Promise<RawLiveGame[]> {
  switch (sport) {
    case 'college-baseball':
      return fetchCollegeBaseball(env);
    case 'mlb':
    case 'nfl':
    case 'nba':
      return fetchSportsDataIO(sport, env);
    default:
      return [];
  }
}
