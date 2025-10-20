import { NextRequest, NextResponse } from 'next/server';
import { GameStatus } from '@prisma/client';

import { getGames, type GamesQueryParams } from '../../../../../lib/api/v1';
import { recordRuntimeEvent } from '../../../../lib/observability/datadog-runtime';
import type {
  DiamondProSnapshot,
  GameSummary,
  GamesApiResponse,
  TeamSummary,
} from '../../../baseball/ncaab/games/types';

const CACHE_TTL_SECONDS = 60;
const STALE_WHILE_REVALIDATE_SECONDS = 30;

const DIAMOND_PRO_FLAG = (process.env.DIAMOND_PRO_FIELDS_ENABLED ?? 'true').toLowerCase() !== 'false';

const TIER_HEADER_KEYS = ['x-bsi-tier', 'x-user-tier', 'x-tier'];

type UserTier = 'free' | 'diamond-pro' | 'staff';

function resolveUserTier(request: NextRequest): UserTier {
  for (const key of TIER_HEADER_KEYS) {
    const headerValue = request.headers.get(key);
    if (headerValue) {
      const normalized = headerValue.toLowerCase();
      if (normalized === 'diamond-pro' || normalized === 'pro') {
        return 'diamond-pro';
      }
      if (normalized === 'staff' || normalized === 'internal') {
        return 'staff';
      }
    }
  }

  const cookieTier = request.cookies.get('bsi_user_tier')?.value?.toLowerCase();
  if (cookieTier === 'diamond-pro' || cookieTier === 'pro') {
    return 'diamond-pro';
  }
  if (cookieTier === 'staff') {
    return 'staff';
  }

  return 'free';
}

function parseNumber(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseStatus(value: string | null): GameStatus | undefined {
  if (!value) {
    return undefined;
  }
  const normalized = value.toUpperCase() as GameStatus;
  return Object.values(GameStatus).includes(normalized) ? normalized : undefined;
}

function normaliseDate(value: string | null): string | undefined {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.toISOString().slice(0, 10);
}

function buildQueryParams(request: NextRequest): GamesQueryParams {
  const { searchParams } = request.nextUrl;
  const date = normaliseDate(searchParams.get('date'));
  const status = parseStatus(searchParams.get('status'));
  const conference = searchParams.get('conference') ?? undefined;
  const teamId = searchParams.get('teamId') ?? undefined;
  const limit = parseNumber(searchParams.get('limit'));
  const offset = parseNumber(searchParams.get('offset'));

  return {
    ...(date ? { date } : {}),
    ...(status ? { status } : {}),
    ...(conference ? { conference } : {}),
    ...(teamId ? { teamId } : {}),
    ...(limit ? { limit } : {}),
    ...(offset ? { offset } : {}),
  };
}

function toIsoString(value: unknown): string | null {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  const parsed = new Date(value as string);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
}

function simplifyTeam(team: unknown): TeamSummary | null {
  if (!team || typeof team !== 'object') {
    return null;
  }
  const record = team as Record<string, unknown>;
  const conference = record.conference && typeof record.conference === 'object'
    ? record.conference as Record<string, unknown>
    : null;

  return {
    id: String(record.id ?? ''),
    name: String(record.name ?? record.school ?? 'Unknown Team'),
    slug: record.slug ? String(record.slug) : null,
    school: record.school ? String(record.school) : null,
    abbreviation: record.abbreviation ? String(record.abbreviation) : null,
    logoUrl: record.logoUrl ? String(record.logoUrl) : null,
    conference: conference
      ? {
          id: conference.id ? String(conference.id) : null,
          name: conference.name ? String(conference.name) : null,
          slug: conference.slug ? String(conference.slug) : null,
        }
      : null,
  };
}

function computeDiamondProSnapshot(game: Record<string, unknown>): DiamondProSnapshot {
  const homeScore = Number(game.homeScore ?? 0);
  const awayScore = Number(game.awayScore ?? 0);
  const runDifferential = homeScore - awayScore;
  const absoluteDiff = Math.abs(runDifferential);
  const totalRuns = Math.max(homeScore + awayScore, 1);
  const homeWinProbability = Math.min(Math.max(homeScore / totalRuns, 0), 1);
  const leverageIndex = absoluteDiff <= 2 ? 2.6 - absoluteDiff * 0.6 : 1.0;

  return {
    runDifferential,
    leverageIndex: Number(leverageIndex.toFixed(2)),
    homeWinProbability: Number(homeWinProbability.toFixed(2)),
    awayWinProbability: Number((1 - homeWinProbability).toFixed(2)),
    highLeverage: absoluteDiff <= 2,
  };
}

function maskDiamondProFields(game: Record<string, unknown>, allowDiamondPro: boolean): DiamondProSnapshot | undefined {
  if (!allowDiamondPro) {
    return undefined;
  }
  return computeDiamondProSnapshot(game);
}

export async function GET(request: NextRequest): Promise<NextResponse<GamesApiResponse>> {
  const tier = resolveUserTier(request);
  const allowDiamondPro = DIAMOND_PRO_FLAG && (tier === 'diamond-pro' || tier === 'staff');
  const queryParams = buildQueryParams(request);

  try {
    const gamesResponse = await getGames(queryParams);

    const data: GameSummary[] = gamesResponse.games.map((game) => {
      const record = game as unknown as Record<string, unknown>;
      const homeTeam = simplifyTeam(record.homeTeam);
      const awayTeam = simplifyTeam(record.awayTeam);
      const scheduledAt = toIsoString(record.scheduledAt ?? record.startTime ?? null);
      const completedAt = toIsoString(record.completedAt ?? record.endTime ?? null);
      const slug = record.slug ? String(record.slug) : null;
      const venue = record.venueName || record.venueCity || record.venueState
        ? {
            name: record.venueName ? String(record.venueName) : null,
            city: record.venueCity ? String(record.venueCity) : null,
            state: record.venueState ? String(record.venueState) : null,
          }
        : null;

      return {
        id: String(record.id ?? `${record.awayTeamId ?? 'unknown'}-at-${record.homeTeamId ?? 'unknown'}`),
        slug,
        status: String(record.status ?? 'SCHEDULED'),
        scheduledAt,
        completedAt,
        updatedAt: toIsoString(record.updatedAt ?? null),
        homeScore: record.homeScore != null ? Number(record.homeScore) : null,
        awayScore: record.awayScore != null ? Number(record.awayScore) : null,
        inning: record.currentInning != null ? Number(record.currentInning) : null,
        inningHalf: record.currentInningHalf ? String(record.currentInningHalf) : null,
        homeTeam,
        awayTeam,
        venue,
        tournament: record.tournamentName ? String(record.tournamentName) : null,
        conferenceGame: Boolean(record.isConferenceGame ?? false),
        diamondPro: maskDiamondProFields(record, allowDiamondPro),
      } satisfies GameSummary;
    });

    const body: GamesApiResponse = {
      data,
      pagination: gamesResponse.pagination,
      permissions: {
        diamondPro: allowDiamondPro,
        diamondProFeatureFlag: DIAMOND_PRO_FLAG,
      },
      meta: {
        generatedAt: new Date().toISOString(),
        query: queryParams,
      },
    };

    void recordRuntimeEvent('api.v1.games.success', {
      tier,
      count: data.length,
      diamondPro: allowDiamondPro,
    });

    return NextResponse.json(body, {
      status: 200,
      headers: {
        'Cache-Control': `public, max-age=0, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=${STALE_WHILE_REVALIDATE_SECONDS}`,
      },
    });
  } catch (error) {
    void recordRuntimeEvent('api.v1.games.error', {
      tier,
      message: error instanceof Error ? error.message : 'unknown_error',
    });

    const body: GamesApiResponse = {
      data: [],
      pagination: { total: 0, limit: 0, offset: 0, hasMore: false },
      permissions: {
        diamondPro: allowDiamondPro,
        diamondProFeatureFlag: DIAMOND_PRO_FLAG,
      },
      meta: {
        generatedAt: new Date().toISOString(),
        query: queryParams,
      },
      error: 'Unable to load games at this time. Please try again shortly.',
    };

    return NextResponse.json(body, {
      status: 503,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }
}

export const dynamic = 'force-dynamic';
