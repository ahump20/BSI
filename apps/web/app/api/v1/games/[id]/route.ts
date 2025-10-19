import { NextRequest, NextResponse } from 'next/server';
import { getGameById } from '@lib/api/v1/games';

export const runtime = 'nodejs';

type Params = {
  params: {
    id: string;
  };
};

export async function GET(_request: NextRequest, context: Params) {
  try {
    const game = await getGameById(context.params.id);

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json(game, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('[api] GET /api/v1/games/:id failed', error);
    return NextResponse.json(
      { error: 'Unable to load game details.' },
      { status: 500 }
    );
  }
}
