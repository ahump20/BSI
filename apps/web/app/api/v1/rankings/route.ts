import { NextRequest, NextResponse } from 'next/server';
import { getCompositeRankings, getRankings } from '@lib/api/v1/rankings';
import { PollType } from '@prisma/client';

export const runtime = 'nodejs';

function parseInteger(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parsePollType(value: string | null): PollType | undefined {
  if (!value) return undefined;
  const candidate = value.toUpperCase() as PollType;
  return Object.values(PollType).includes(candidate) ? candidate : undefined;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const mode = searchParams.get('mode');
    const season = parseInteger(searchParams.get('season'));
    const week = parseInteger(searchParams.get('week'));

    if (mode === 'composite') {
      const composite = await getCompositeRankings(season, week);
      return NextResponse.json(composite, {
        headers: {
          'Cache-Control': 's-maxage=900, stale-while-revalidate=300',
        },
      });
    }

    const rankings = await getRankings({
      pollType: parsePollType(searchParams.get('pollType')),
      season,
      week,
      limit: parseInteger(searchParams.get('limit')),
    });

    return NextResponse.json(rankings, {
      headers: {
        'Cache-Control': 's-maxage=900, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('[api] GET /api/v1/rankings failed', error);
    return NextResponse.json(
      { error: 'Unable to load rankings.' },
      { status: 500 }
    );
  }
}
