import { NextRequest, NextResponse } from 'next/server';
import { getConferenceStandings } from '@lib/api/v1/conferences';

export const runtime = 'nodejs';

type Params = {
  params: {
    slug: string;
  };
};

type SortField = 'wins' | 'winPct' | 'confWins' | 'confWinPct' | 'rpi';
type OrderField = 'asc' | 'desc';

const SORT_FIELDS: ReadonlyArray<SortField> = ['wins', 'winPct', 'confWins', 'confWinPct', 'rpi'];
const ORDER_FIELDS: ReadonlyArray<OrderField> = ['asc', 'desc'];

function parseInteger(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseSort(value: string | null): SortField | undefined {
  if (!value) return undefined;
  return SORT_FIELDS.includes(value as SortField) ? (value as SortField) : undefined;
}

function parseOrder(value: string | null): OrderField | undefined {
  if (!value) return undefined;
  return ORDER_FIELDS.includes(value as OrderField) ? (value as OrderField) : undefined;
}

export async function GET(request: NextRequest, context: Params) {
  try {
    const { searchParams } = new URL(request.url);

    const standings = await getConferenceStandings(context.params.slug, {
      season: parseInteger(searchParams.get('season')),
      sortBy: parseSort(searchParams.get('sortBy')),
      order: parseOrder(searchParams.get('order')),
    });

    if (!standings) {
      return NextResponse.json(
        { error: 'Conference standings not available.' },
        { status: 404 }
      );
    }

    return NextResponse.json(standings, {
      headers: {
        'Cache-Control': 's-maxage=14400, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('[api] GET /api/v1/conferences/:slug/standings failed', error);
    return NextResponse.json(
      { error: 'Unable to load standings.' },
      { status: 500 }
    );
  }
}
