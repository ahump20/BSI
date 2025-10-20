import { NextRequest, NextResponse } from 'next/server';
import { getConferenceBySlug } from '@lib/api/v1/conferences';

export const runtime = 'nodejs';

type Params = {
  params: {
    slug: string;
  };
};

export async function GET(_request: NextRequest, context: Params) {
  try {
    const conference = await getConferenceBySlug(context.params.slug);

    if (!conference) {
      return NextResponse.json(
        { error: 'Conference not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json(conference, {
      headers: {
        'Cache-Control': 's-maxage=1800, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('[api] GET /api/v1/conferences/:slug failed', error);
    return NextResponse.json(
      { error: 'Unable to load conference details.' },
      { status: 500 }
    );
  }
}
