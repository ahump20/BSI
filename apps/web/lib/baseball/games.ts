'use server';

import 'server-only';
import { cache } from 'react';

export type LiveGameTeam = {
  id: string;
  name: string;
  abbreviation?: string;
  record?: string;
  score: number;
  logo?: string;
};

export type LiveGamePlay = {
  id: string;
  description: string;
  inning: number;
  half: 'Top' | 'Bottom';
  leverage: number;
  createdAt: string;
};

export type LiveGameSnapshot = {
  id: string;
  slug: string;
  status: 'scheduled' | 'live' | 'in_progress' | 'final';
  league?: string;
  startsAt: string;
  updatedAt: string;
  venue?: string;
  inning?: number;
  half?: 'Top' | 'Bottom';
  leverageIndex?: number;
  home: LiveGameTeam;
  away: LiveGameTeam;
  plays: LiveGamePlay[];
};

const NCAAB_LEAGUE_CODES = new Set(['ncaab', 'ncaa-baseball', 'ncaa']);

function normaliseHalf(value: unknown): 'Top' | 'Bottom' {
  const normalized = typeof value === 'string' ? value.toLowerCase() : '';
  if (normalized.includes('bot')) {
    return 'Bottom';
  }
  return 'Top';
}

function toLiveGameSnapshot(raw: any): LiveGameSnapshot {
  const plays: LiveGamePlay[] = Array.isArray(raw?.plays)
    ? raw.plays.map((play: any, index: number) => ({
        id: String(play?.id ?? `${raw?.id ?? raw?.gameId ?? 'game'}-play-${index}`),
        description: String(play?.description ?? play?.text ?? 'Play update unavailable'),
        inning: Number(play?.inning ?? play?.period ?? raw?.inning ?? 0),
        half: normaliseHalf(play?.half ?? play?.inningHalf ?? raw?.half ?? 'Top'),
        leverage: Number(play?.leverage ?? play?.winProbability ?? raw?.leverageIndex ?? 0),
        createdAt: new Date(play?.createdAt ?? play?.timestamp ?? raw?.updatedAt ?? Date.now()).toISOString(),
      }))
    : [];

  const gameStatus = (raw?.status ?? raw?.gameStatus ?? 'scheduled') as LiveGameSnapshot['status'];

  return {
    id: String(raw?.id ?? raw?.gameId ?? raw?.slug ?? crypto.randomUUID()),
    slug: String(raw?.slug ?? raw?.gameSlug ?? raw?.id ?? raw?.gameId ?? ''),
    status: gameStatus,
    league: raw?.league ?? raw?.sportLeague ?? raw?.category ?? undefined,
    startsAt: new Date(raw?.startsAt ?? raw?.startTime ?? raw?.scheduled ?? Date.now()).toISOString(),
    updatedAt: new Date(raw?.updatedAt ?? Date.now()).toISOString(),
    venue: raw?.venue ?? raw?.stadium ?? raw?.location ?? undefined,
    inning: typeof raw?.inning === 'number' ? raw.inning : Number(raw?.currentInning ?? raw?.inningNumber ?? 0) || undefined,
    half: raw?.half ? normaliseHalf(raw.half) : raw?.inningHalf ? normaliseHalf(raw.inningHalf) : plays[0]?.half,
    leverageIndex: raw?.leverageIndex !== undefined ? Number(raw.leverageIndex) : raw?.winProbability !== undefined ? Number(raw.winProbability) : undefined,
    home: {
      id: String(raw?.homeTeamId ?? raw?.home?.id ?? raw?.home_id ?? 'home'),
      name: String(raw?.homeTeamName ?? raw?.home?.name ?? raw?.home_team ?? 'Home Team'),
      abbreviation: raw?.homeTeamAbbreviation ?? raw?.home?.abbreviation ?? raw?.home?.code ?? undefined,
      record: raw?.homeTeamRecord ?? raw?.home?.record ?? undefined,
      score: Number(raw?.homeTeamScore ?? raw?.home?.score ?? raw?.home_score ?? 0),
      logo: raw?.homeTeamLogo ?? raw?.home?.logo ?? undefined,
    },
    away: {
      id: String(raw?.awayTeamId ?? raw?.away?.id ?? raw?.away_id ?? 'away'),
      name: String(raw?.awayTeamName ?? raw?.away?.name ?? raw?.away_team ?? 'Away Team'),
      abbreviation: raw?.awayTeamAbbreviation ?? raw?.away?.abbreviation ?? raw?.away?.code ?? undefined,
      record: raw?.awayTeamRecord ?? raw?.away?.record ?? undefined,
      score: Number(raw?.awayTeamScore ?? raw?.away?.score ?? raw?.away_score ?? 0),
      logo: raw?.awayTeamLogo ?? raw?.away?.logo ?? undefined,
    },
    plays,
  };
}

async function fetchFromPrisma(): Promise<LiveGameSnapshot[]> {
  const prismaClient = await loadPrisma();

  if (!prismaClient) {
    return [];
  }

  const client = prismaClient as unknown as {
    baseballLiveGameSnapshot?: {
      findMany: (args?: Record<string, unknown>) => Promise<any[]>;
    };
    game?: {
      findMany: (args?: Record<string, unknown>) => Promise<any[]>;
    };
  };

  if (client.baseballLiveGameSnapshot) {
    const rows = await client.baseballLiveGameSnapshot.findMany({
      where: {
        status: { in: ['live', 'in_progress'] },
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });
    return rows.map(toLiveGameSnapshot);
  }

  if (client.game) {
    const rows = await client.game.findMany({
      where: {
        sport: 'baseball',
        league: { in: Array.from(NCAAB_LEAGUE_CODES) },
        status: { in: ['live', 'in_progress'] },
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });
    return rows.map(toLiveGameSnapshot);
  }

  return [];
}

let prismaInstancePromise: Promise<unknown | null> | undefined;

async function loadPrisma(): Promise<unknown | null> {
  if (!prismaInstancePromise) {
    prismaInstancePromise = (async () => {
      if (!process.env.DATABASE_URL) {
        return null;
      }
      try {
        const dynamicRequire = eval('require') as (id: string) => unknown;
        const module = dynamicRequire('../../../../lib/db/prisma') as { prisma?: unknown };
        return module.prisma ?? null;
      } catch (error) {
        console.error('Prisma client unavailable', error);
        return null;
      }
    })();
  }

  return prismaInstancePromise;
}

async function fetchFromApi(): Promise<LiveGameSnapshot[]> {
  const baseUrl = process.env.BSI_API_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (!baseUrl) {
    return [];
  }

  try {
    const url = new URL('/api/v1/baseball/games', baseUrl);
    url.searchParams.set('status', 'live');
    const response = await fetch(url.toString(), {
      next: { revalidate: 60, tags: ['baseball:live-games'] },
    });

    if (!response.ok) {
      console.error('Failed to fetch live games via API', response.status, response.statusText);
      return [];
    }

    const payload = await response.json();
    const games = Array.isArray(payload?.games) ? payload.games : Array.isArray(payload) ? payload : [];
    return games.map(toLiveGameSnapshot);
  } catch (error) {
    console.error('Failed to fetch live games via API', error);
    return [];
  }
}

export const getLiveGames = cache(async (): Promise<LiveGameSnapshot[]> => {
  try {
    const fromPrisma = await fetchFromPrisma();
    if (fromPrisma.length > 0) {
      return fromPrisma;
    }
  } catch (error) {
    console.error('Failed to fetch live games via Prisma', error);
  }

  const fromApi = await fetchFromApi();
  return fromApi;
});
