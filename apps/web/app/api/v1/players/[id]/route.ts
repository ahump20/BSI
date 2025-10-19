import { NextRequest, NextResponse } from 'next/server';
import { getPlayerById } from '@lib/api/v1/players';

export const runtime = 'nodejs';

type Params = {
  params: {
    id: string;
  };
};

export async function GET(_request: NextRequest, context: Params) {
  try {
    const player = await getPlayerById(context.params.id);

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json(player, {
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('[api] GET /api/v1/players/:id failed', error);
    return NextResponse.json(
      { error: 'Unable to load player profile.' },
      { status: 500 }
    );
  }
}
