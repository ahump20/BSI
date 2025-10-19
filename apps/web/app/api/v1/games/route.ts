import { NextRequest, NextResponse } from 'next/server';
import { getGames } from '@lib/api/v1/games';
import { GameStatus } from '@prisma/client';

export const runtime = 'nodejs';

function parseInteger(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseStatus(value: string | null): GameStatus | undefined {
  if (!value) return undefined;
  const normalised = value.toUpperCase() as GameStatus;
  return Object.values(GameStatus).includes(normalised) ? normalised : undefined;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const response = await getGames({
      date: searchParams.get('date') ?? undefined,
      status: parseStatus(searchParams.get('status')),
      conference: searchParams.get('conference') ?? undefined,
      teamId: searchParams.get('teamId') ?? undefined,
      limit: parseInteger(searchParams.get('limit')),
      offset: parseInteger(searchParams.get('offset')),
    });

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('[api] GET /api/v1/games failed', error);
    return NextResponse.json(
      {
        error: 'Unable to load games at this time.',
      },
      { status: 500 }
    );
  }
}
