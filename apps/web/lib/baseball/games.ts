import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

const ROLLING_WINDOW_PAST_DAYS = 2;
const ROLLING_WINDOW_FUTURE_DAYS = 1;
const CACHE_TAG = 'games:d1-baseball';
const CACHE_REVALIDATE_SECONDS = 60;

export type SubscriptionTier = 'free' | 'diamond_pro';

export type GameStatus = 'SCHEDULED' | 'LIVE' | 'FINAL' | 'POSTPONED' | 'DELAYED';

export interface TeamSnapshot {
  id: string;
  name: string;
  shortName: string;
  record?: string | null;
  logo?: string | null;
  conference?: string | null;
  runs: number;
  hits: number;
  errors: number;
  leverageIndex?: number | null;
  tendencies: Array<{
    label: string;
    value: string;
    trend?: 'up' | 'down' | 'steady';
  }>;
}

export interface InningState {
  inning: number | null;
  half: 'TOP' | 'BOTTOM' | null;
  outs: number | null;
}

export interface PlaySummary {
  description: string;
  createdAt: string;
  leverageIndex?: number | null;
}

export interface BaseballGame {
  id: string;
  slug: string;
  status: GameStatus;
  statusLabel: string;
  startTimeUtc: string;
  subscriptionTier: SubscriptionTier;
  leverageIndex: number | null;
  inningState: InningState;
  home: TeamSnapshot;
  away: TeamSnapshot;
  plays: PlaySummary[];
  lastUpdated: string;
}

interface RawTeam {
  id: string;
  name: string;
  shortName?: string | null;
  record?: string | null;
  logo?: string | null;
  conference?: string | null;
}

interface RawTeamStat {
  id: string;
  teamId: string;
  runs?: number | null;
  hits?: number | null;
  errors?: number | null;
  leverageIndex?: number | null;
  bullpenWhip?: number | null;
  stolenBaseAttempts?: number | null;
  stolenBaseSuccess?: number | null;
  aggressionIndex?: number | null;
  recentForm?: string | null;
}

interface RawGame {
  id: string;
  slug: string;
  startTime: Date;
  status: string;
  statusText?: string | null;
  division?: string | null;
  sport?: string | null;
  inning?: number | null;
  inningHalf?: 'TOP' | 'BOTTOM' | null;
  outs?: number | null;
  leverageIndex?: number | null;
  subscriptionTier?: string | null;
  updatedAt?: Date | null;
  homeTeam: RawTeam;
  awayTeam: RawTeam;
  teamStats?: RawTeamStat[];
  plays?: Array<{
    id: string;
    description: string;
    createdAt: Date;
    leverageIndex?: number | null;
  }>;
}

export interface GamesResponse {
  generatedAt: string;
  games: BaseballGame[];
}

function normaliseTier(tier?: string | null): SubscriptionTier {
  if (!tier) return 'free';
  return tier.toLowerCase() === 'diamond_pro' || tier.toLowerCase() === 'diamond-pro' ? 'diamond_pro' : 'free';
}

function formatDecimal(value?: number | null, precision = 2): string | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return value.toFixed(precision);
}

function calculateTendencies(stat: RawTeamStat | undefined): TeamSnapshot['tendencies'] {
  if (!stat) {
    return [];
  }

  const tendencies: TeamSnapshot['tendencies'] = [];

  const leverage = formatDecimal(stat.leverageIndex);
  if (leverage) {
    tendencies.push({ label: 'Leverage Index', value: leverage, trend: 'steady' });
  }

  if (typeof stat.aggressionIndex === 'number') {
    tendencies.push({
      label: 'Aggression Index',
      value: formatDecimal(stat.aggressionIndex) ?? '0.00',
      trend: stat.aggressionIndex > 1 ? 'up' : stat.aggressionIndex < 1 ? 'down' : 'steady'
    });
  }

  if (typeof stat.bullpenWhip === 'number') {
    tendencies.push({
      label: 'Bullpen WHIP',
      value: formatDecimal(stat.bullpenWhip) ?? '0.00',
      trend: stat.bullpenWhip <= 1.2 ? 'up' : 'down'
    });
  }

  if (typeof stat.stolenBaseAttempts === 'number' && typeof stat.stolenBaseSuccess === 'number') {
    const attempts = stat.stolenBaseAttempts;
    const successRate = attempts > 0 ? (stat.stolenBaseSuccess / attempts) * 100 : 0;
    tendencies.push({
      label: 'SB Success %',
      value: `${successRate.toFixed(0)}%`,
      trend: successRate >= 65 ? 'up' : 'down'
    });
  }

  if (stat.recentForm) {
    tendencies.push({ label: 'Recent Form', value: stat.recentForm, trend: 'steady' });
  }

  return tendencies;
}

function coerceStatus(status: string): GameStatus {
  switch (status.toUpperCase()) {
    case 'LIVE':
    case 'IN_PROGRESS':
      return 'LIVE';
    case 'FINAL':
    case 'COMPLETE':
      return 'FINAL';
    case 'POSTPONED':
    case 'DELAYED':
      return 'POSTPONED';
    case 'SCHEDULED':
    default:
      return 'SCHEDULED';
  }
}

function buildStatusLabel(game: RawGame, status: GameStatus): string {
  if (game.statusText) {
    return game.statusText;
  }

  if (status === 'LIVE') {
    const inning = game.inning ? ` ${game.inning}` : '';
    const half = game.inningHalf ? `${game.inningHalf === 'TOP' ? 'Top' : 'Bottom'}${inning}` : 'Live';
    const outs = typeof game.outs === 'number' ? ` · ${game.outs} out${game.outs === 1 ? '' : 's'}` : '';
    return `${half}${outs}`.trim();
  }

  if (status === 'FINAL') {
    return 'Final';
  }

  if (status === 'POSTPONED') {
    return 'Postponed';
  }

  return 'Scheduled';
}

function pickTeamStat(teamId: string, stats?: RawTeamStat[]): RawTeamStat | undefined {
  if (!stats) return undefined;
  return stats.find((item) => item.teamId === teamId);
}

function toTeamSnapshot(team: RawTeam, stat?: RawTeamStat): TeamSnapshot {
  return {
    id: team.id,
    name: team.name,
    shortName: team.shortName ?? team.name,
    record: team.record ?? null,
    logo: team.logo ?? null,
    conference: team.conference ?? null,
    runs: stat?.runs ?? 0,
    hits: stat?.hits ?? 0,
    errors: stat?.errors ?? 0,
    leverageIndex: stat?.leverageIndex ?? null,
    tendencies: calculateTendencies(stat)
  };
}

export function mapGameRecord(game: RawGame): BaseballGame {
  const status = coerceStatus(game.status);
  const homeStat = pickTeamStat(game.homeTeam.id, game.teamStats);
  const awayStat = pickTeamStat(game.awayTeam.id, game.teamStats);
  const tier = normaliseTier(game.subscriptionTier);
  const leverageIndex =
    game.leverageIndex ?? homeStat?.leverageIndex ?? awayStat?.leverageIndex ?? null;
  const inningState: InningState = {
    inning: game.inning ?? null,
    half: game.inningHalf ?? null,
    outs: game.outs ?? null
  };

  const plays: PlaySummary[] = Array.isArray(game.plays)
    ? game.plays.map((play) => ({
        description: play.description,
        createdAt: play.createdAt.toISOString(),
        leverageIndex: play.leverageIndex ?? null
      }))
    : [];

  return {
    id: game.id,
    slug: game.slug,
    status,
    statusLabel: buildStatusLabel(game, status),
    startTimeUtc: game.startTime.toISOString(),
    subscriptionTier: tier,
    leverageIndex,
    inningState,
    home: toTeamSnapshot(game.homeTeam, homeStat),
    away: toTeamSnapshot(game.awayTeam, awayStat),
    plays,
    lastUpdated: (game.updatedAt ?? new Date()).toISOString()
  };
}

function computeWindowBounds(reference = new Date()) {
  const start = new Date(reference);
  start.setDate(start.getDate() - ROLLING_WINDOW_PAST_DAYS);
  start.setHours(0, 0, 0, 0);

  const end = new Date(reference);
  end.setDate(end.getDate() + ROLLING_WINDOW_FUTURE_DAYS);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

async function fetchGames(windowStartIso: string, windowEndIso: string): Promise<GamesResponse> {
  const games = (await prisma.game.findMany({
    where: {
      sport: 'BASEBALL',
      division: 'D1',
      startTime: {
        gte: new Date(windowStartIso),
        lte: new Date(windowEndIso)
      }
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      teamStats: true,
      plays: {
        orderBy: { createdAt: 'desc' },
        take: 6
      }
    },
    orderBy: [{ startTime: 'asc' }]
  })) as unknown as RawGame[];

  return {
    generatedAt: new Date().toISOString(),
    games: games.map(mapGameRecord)
  };
}

const cachedFetch = unstable_cache(fetchGames, ['d1-baseball-games'], {
  revalidate: CACHE_REVALIDATE_SECONDS,
  tags: [CACHE_TAG]
});

export async function getD1BaseballGames(options: { referenceDate?: Date } = {}): Promise<GamesResponse> {
  const { referenceDate = new Date() } = options;
  const { start, end } = computeWindowBounds(referenceDate);
  return cachedFetch(start.toISOString(), end.toISOString());
}

export function buildFallbackGamesPayload(reference = new Date()): GamesResponse {
  const isoNow = reference.toISOString();
  const makeGame = (
    overrides: Partial<BaseballGame> & { id: string; slug: string; status: GameStatus }
  ): BaseballGame => ({
    id: overrides.id,
    slug: overrides.slug,
    status: overrides.status,
    statusLabel: overrides.statusLabel ?? overrides.status,
    startTimeUtc: overrides.startTimeUtc ?? isoNow,
    subscriptionTier: overrides.subscriptionTier ?? 'free',
    leverageIndex: overrides.leverageIndex ?? null,
    inningState: overrides.inningState ?? { inning: null, half: null, outs: null },
    home:
      overrides.home ??
      ({
        id: `${overrides.id}-home`,
        name: 'Home Team',
        shortName: 'HOME',
        record: '0-0',
        logo: null,
        conference: 'D1',
        runs: 0,
        hits: 0,
        errors: 0,
        leverageIndex: null,
        tendencies: []
      } as TeamSnapshot),
    away:
      overrides.away ??
      ({
        id: `${overrides.id}-away`,
        name: 'Away Team',
        shortName: 'AWAY',
        record: '0-0',
        logo: null,
        conference: 'D1',
        runs: 0,
        hits: 0,
        errors: 0,
        leverageIndex: null,
        tendencies: []
      } as TeamSnapshot),
    plays: overrides.plays ?? [],
    lastUpdated: overrides.lastUpdated ?? isoNow
  });

  return {
    generatedAt: isoNow,
    games: [
      makeGame({
        id: 'fallback-live',
        slug: 'fallback-live',
        status: 'LIVE',
        statusLabel: 'Top 5 · 1 out',
        startTimeUtc: reference.toISOString(),
        subscriptionTier: 'diamond_pro',
        leverageIndex: 3.4,
        inningState: { inning: 5, half: 'TOP', outs: 1 },
        home: {
          id: 'fallback-live-home',
          name: 'LSU Tigers',
          shortName: 'LSU',
          record: '21-6',
          logo: null,
          conference: 'SEC',
          runs: 3,
          hits: 4,
          errors: 0,
          leverageIndex: 2.9,
          tendencies: [
            { label: 'Bullpen WHIP', value: '1.12', trend: 'up' },
            { label: 'SB Success %', value: '71%', trend: 'up' }
          ]
        },
        away: {
          id: 'fallback-live-away',
          name: 'Vanderbilt Commodores',
          shortName: 'VU',
          record: '19-8',
          logo: null,
          conference: 'SEC',
          runs: 2,
          hits: 5,
          errors: 1,
          leverageIndex: 3.4,
          tendencies: [{ label: 'Aggression Index', value: '1.15', trend: 'up' }]
        },
        plays: [
          {
            description: 'Morgan singles to right, Crews scores',
            createdAt: new Date(reference.getTime() - 120000).toISOString(),
            leverageIndex: 3.8
          },
          {
            description: 'Little strikes out looking',
            createdAt: new Date(reference.getTime() - 60000).toISOString(),
            leverageIndex: 3.1
          }
        ]
      }),
      makeGame({
        id: 'fallback-final',
        slug: 'fallback-final',
        status: 'FINAL',
        statusLabel: 'Final',
        subscriptionTier: 'free',
        home: {
          id: 'fallback-final-home',
          name: 'Wake Forest Demon Deacons',
          shortName: 'WAKE',
          record: '24-4',
          logo: null,
          conference: 'ACC',
          runs: 6,
          hits: 9,
          errors: 0,
          leverageIndex: 1.9,
          tendencies: [{ label: 'Leverage Index', value: '1.90', trend: 'steady' }]
        },
        away: {
          id: 'fallback-final-away',
          name: 'NC State Wolfpack',
          shortName: 'NCST',
          record: '17-11',
          logo: null,
          conference: 'ACC',
          runs: 4,
          hits: 7,
          errors: 1,
          leverageIndex: 1.3,
          tendencies: []
        }
      }),
      makeGame({
        id: 'fallback-postponed',
        slug: 'fallback-postponed',
        status: 'POSTPONED',
        statusLabel: 'Postponed · Weather',
        subscriptionTier: 'free',
        home: {
          id: 'fallback-postponed-home',
          name: 'Arkansas Razorbacks',
          shortName: 'ARK',
          record: '20-6',
          logo: null,
          conference: 'SEC',
          runs: 0,
          hits: 0,
          errors: 0,
          leverageIndex: null,
          tendencies: []
        },
        away: {
          id: 'fallback-postponed-away',
          name: 'Ole Miss Rebels',
          shortName: 'MISS',
          record: '14-13',
          logo: null,
          conference: 'SEC',
          runs: 0,
          hits: 0,
          errors: 0,
          leverageIndex: null,
          tendencies: []
        }
      })
    ]
  };
}

export const __testing = {
  normaliseTier,
  coerceStatus,
  buildStatusLabel,
  calculateTendencies,
  computeWindowBounds
};
