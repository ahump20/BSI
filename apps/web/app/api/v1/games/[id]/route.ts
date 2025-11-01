import type { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { createCacheKey, getCachedOrHydrate } from '@/lib/cache';
import { getPrismaClient } from '@/lib/db';

const HALF_MINUTE = 30;

type GameDetailPayload = Prisma.GameGetPayload<{
  include: {
    homeTeam: {
      include: {
        players: true;
      };
    };
    awayTeam: {
      include: {
        players: true;
      };
    };
    conference: true;
  };
}>;

type GameDetailResponse = {
  data: ReturnType<typeof mapGameDetail>;
};

function mapPlayer(player: GameDetailPayload['homeTeam']['players'][number]) {
  return {
    id: player.id,
    firstName: player.firstName,
    lastName: player.lastName,
    number: player.number ?? null,
    position: player.position,
    classYear: player.classYear ?? null,
  };
}

function mapTeam(team: GameDetailPayload['homeTeam']) {
  return {
    id: team.id,
    name: team.name,
    slug: team.slug,
    record: team.record ?? null,
    logoUrl: team.logoUrl ?? null,
    players: team.players
      .slice()
      .sort((a, b) => a.lastName.localeCompare(b.lastName))
      .map(mapPlayer),
  };
}

function mapGameDetail(game: GameDetailPayload) {
  return {
    id: game.id,
    sport: game.sport,
    status: game.status,
    startsAt: game.startsAt.toISOString(),
    venue: game.venue ?? null,
    conference: game.conference
      ? {
          id: game.conference.id,
          name: game.conference.name,
          slug: game.conference.slug,
        }
      : null,
    homeTeam: mapTeam(game.homeTeam),
    awayTeam: mapTeam(game.awayTeam),
  };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  const gameId = params.id;
  if (!gameId) {
    return NextResponse.json({ error: 'Missing game identifier.' }, { status: 400 });
  }

  try {
    const prisma = getPrismaClient();
    const cacheKey = createCacheKey('api:games:detail', { id: gameId });

    const game = await getCachedOrHydrate(cacheKey, HALF_MINUTE, async () =>
      prisma.game.findUnique({
        where: { id: gameId },
        include: {
          homeTeam: {
            include: { players: true },
          },
          awayTeam: {
            include: { players: true },
          },
          conference: true,
        },
      }),
    );

    if (!game) {
      return NextResponse.json({ error: 'Game not found.' }, { status: 404 });
    }

    const payload: GameDetailResponse = {
      data: mapGameDetail(game),
    };

    return NextResponse.json(payload, {
      headers: {
        'cache-control': `public, max-age=${HALF_MINUTE}`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load game detail. Please retry shortly.' },
      { status: 500 },
    );
  }
}

export type { GameDetailResponse };
