import { NextRequest, NextResponse } from 'next/server';
import { getTeams } from '@lib/api/v1/teams';
import { Division } from '@prisma/client';

export const runtime = 'nodejs';

function parseInteger(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseDivision(value: string | null): Division | undefined {
  if (!value) return undefined;
  const candidate = value.toUpperCase() as Division;
  return Object.values(Division).includes(candidate) ? candidate : undefined;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const response = await getTeams({
      conference: searchParams.get('conference') ?? undefined,
      division: parseDivision(searchParams.get('division')),
      limit: parseInteger(searchParams.get('limit')),
      offset: parseInteger(searchParams.get('offset')),
    });

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('[api] GET /api/v1/teams failed', error);
    return NextResponse.json(
      { error: 'Unable to load teams.' },
      { status: 500 }
    );
  }
}
