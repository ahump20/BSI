import { NextRequest, NextResponse } from 'next/server';
import { getConferences } from '@lib/api/v1/conferences';
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

    const response = await getConferences({
      division: parseDivision(searchParams.get('division')),
      limit: parseInteger(searchParams.get('limit')),
      offset: parseInteger(searchParams.get('offset')),
    });

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 's-maxage=1800, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('[api] GET /api/v1/conferences failed', error);
    return NextResponse.json(
      { error: 'Unable to load conferences.' },
      { status: 500 }
    );
  }
}
