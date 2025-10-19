import { NextRequest, NextResponse } from 'next/server';
import { getArticleBySlug } from '@lib/api/v1/articles';

export const runtime = 'nodejs';

type Params = {
  params: {
    slug: string;
  };
};

export async function GET(request: NextRequest, context: Params) {
  try {
    const tier = request.nextUrl.searchParams.get('tier');
    if (tier === 'pro' && !request.headers.get('x-diamond-pro-token')) {
      return NextResponse.json(
        { error: 'Diamond Pro access token required.' },
        { status: 403 }
      );
    }

    const article = await getArticleBySlug(context.params.slug);

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json(article, {
      headers: {
        'Cache-Control': 's-maxage=900, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('[api] GET /api/v1/articles/:slug failed', error);
    return NextResponse.json(
      { error: 'Unable to load article.' },
      { status: 500 }
    );
  }
}
