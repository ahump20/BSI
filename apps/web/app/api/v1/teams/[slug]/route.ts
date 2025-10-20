import { NextRequest, NextResponse } from 'next/server';
import { getTeamBySlug } from '@lib/api/v1/teams';

export const runtime = 'nodejs';

type Params = {
  params: {
    slug: string;
  };
};

export async function GET(_request: NextRequest, context: Params) {
  try {
    const team = await getTeamBySlug(context.params.slug);

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json(team, {
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('[api] GET /api/v1/teams/:slug failed', error);
    return NextResponse.json(
      { error: 'Unable to load team details.' },
      { status: 500 }
    );
  }
}
