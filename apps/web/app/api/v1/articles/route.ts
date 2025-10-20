import { NextRequest, NextResponse } from 'next/server';
import { getArticles } from '@lib/api/v1/articles';

export const runtime = 'nodejs';

function parseInteger(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const tier = searchParams.get('tier') ?? undefined;
    if (tier === 'pro' && !request.headers.get('x-diamond-pro-token')) {
      return NextResponse.json(
        { error: 'Diamond Pro access token required.' },
        { status: 403 }
      );
    }

    const response = await getArticles({
      limit: parseInteger(searchParams.get('limit')),
      offset: parseInteger(searchParams.get('offset')),
      type: searchParams.get('type') ?? undefined,
      tier: tier as 'free' | 'pro' | undefined,
      publishedAfter: searchParams.get('publishedAfter') ?? undefined,
    });

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('[api] GET /api/v1/articles failed', error);
    return NextResponse.json(
      { error: 'Unable to load articles.' },
      { status: 500 }
    );
  }
}
