import { NextRequest, NextResponse } from 'next/server';
import { getRankingsHistory } from '@lib/api/v1/rankings';
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
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json(
        { error: 'teamId query parameter is required.' },
        { status: 400 }
      );
    }

    const history = await getRankingsHistory({
      teamId,
      pollType: parsePollType(searchParams.get('pollType')),
      season: parseInteger(searchParams.get('season')),
      limit: parseInteger(searchParams.get('limit')),
    });

    if (!history) {
      return NextResponse.json(
        { error: 'Ranking history not available for this team.' },
        { status: 404 }
      );
    }

    return NextResponse.json(history, {
      headers: {
        'Cache-Control': 's-maxage=900, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('[api] GET /api/v1/rankings/history failed', error);
    return NextResponse.json(
      { error: 'Unable to load ranking history.' },
      { status: 500 }
    );
  }
}
