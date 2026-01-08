/**
 * BSI College Baseball News API
 * Aggregates NCAA baseball news with recruiting and transfer portal focus
 *
 * GET /api/college-baseball/news
 * Query params:
 *   - category: recruiting | transfer | game | rankings | analysis | general (optional)
 *   - limit: number of articles (default: 20)
 */

interface ESPNArticle {
  headline?: string;
  title?: string;
  description?: string;
  published?: string;
  links?: {
    web?: { href?: string };
    api?: { self?: { href?: string } };
  };
  images?: Array<{ url?: string }>;
  categories?: Array<{ description?: string; type?: string }>;
}

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  category: 'recruiting' | 'transfer' | 'game' | 'rankings' | 'analysis' | 'general';
  team?: string;
  conference?: string;
}

// ESPN doesn't have a dedicated college baseball news endpoint, so we use the general college sports feed
const ESPN_COLLEGE_SPORTS =
  'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/news';

function categorizeArticle(
  article: ESPNArticle
): 'recruiting' | 'transfer' | 'game' | 'rankings' | 'analysis' | 'general' {
  const headline = (article.headline || article.title || '').toLowerCase();
  const description = (article.description || '').toLowerCase();
  const combined = `${headline} ${description}`;

  // Transfer portal detection
  if (
    combined.includes('transfer') ||
    combined.includes('portal') ||
    combined.includes('commit') ||
    combined.includes('decommit') ||
    combined.includes('flip') ||
    combined.includes('enters portal')
  ) {
    return 'transfer';
  }

  // Recruiting detection
  if (
    combined.includes('recruit') ||
    combined.includes('commit') ||
    combined.includes('sign') ||
    combined.includes('class of') ||
    combined.includes('top prospect') ||
    combined.includes('five-star') ||
    combined.includes('four-star') ||
    combined.includes('nli') ||
    combined.includes('verbal')
  ) {
    return 'recruiting';
  }

  // Rankings detection
  if (
    combined.includes('ranking') ||
    combined.includes('poll') ||
    combined.includes('top 25') ||
    combined.includes('d1baseball') ||
    combined.includes('coaches poll') ||
    combined.includes('#1') ||
    combined.includes('moves up') ||
    combined.includes('drops') ||
    combined.includes('ranked')
  ) {
    return 'rankings';
  }

  // Game recap/preview detection
  if (
    combined.includes('recap') ||
    combined.includes('preview') ||
    combined.includes('beat') ||
    combined.includes('defeat') ||
    combined.includes('win') ||
    combined.includes('walk-off') ||
    combined.includes('shutout') ||
    combined.includes('super regional') ||
    combined.includes('cws') ||
    combined.includes('college world series') ||
    combined.includes('regional')
  ) {
    return 'game';
  }

  // Analysis detection
  if (
    combined.includes('analysis') ||
    combined.includes('breakdown') ||
    combined.includes('projection') ||
    combined.includes('draft') ||
    combined.includes('prospect') ||
    combined.includes('outlook') ||
    combined.includes('preview') ||
    combined.includes('prediction')
  ) {
    return 'analysis';
  }

  return 'general';
}

function extractTeamAndConference(article: ESPNArticle): { team?: string; conference?: string } {
  const categories = article.categories || [];
  let team: string | undefined;
  let conference: string | undefined;

  for (const cat of categories) {
    if (cat.type === 'team' && cat.description) {
      team = cat.description;
    }
    if (cat.type === 'league' && cat.description) {
      conference = cat.description;
    }
  }

  return { team, conference };
}

export async function onRequest(context: { request: Request }): Promise<Response> {
  const { request } = context;

  // Handle CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const url = new URL(request.url);
  const categoryFilter = url.searchParams.get('category');
  const limit = parseInt(url.searchParams.get('limit') || '20');

  try {
    const response = await fetch(`${ESPN_COLLEGE_SPORTS}?limit=${Math.min(limit * 2, 50)}`, {
      headers: {
        'User-Agent': 'BlazeSportsIntel/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`ESPN API returned ${response.status}`);
    }

    const data = (await response.json()) as { articles?: ESPNArticle[] };
    const espnArticles = data.articles || [];

    let articles: NewsItem[] = espnArticles.map((article, index) => {
      const { team, conference } = extractTeamAndConference(article);
      return {
        id: `cbb-${Date.now()}-${index}`,
        title: article.headline || article.title || '',
        summary: article.description || '',
        source: 'ESPN / NCAA',
        url: article.links?.web?.href || article.links?.api?.self?.href || '#',
        publishedAt: article.published || new Date().toISOString(),
        category: categorizeArticle(article),
        team,
        conference,
      };
    });

    // Filter by category if specified
    if (categoryFilter && categoryFilter !== 'all') {
      articles = articles.filter((a) => a.category === categoryFilter);
    }

    // Limit results
    articles = articles.slice(0, limit);

    const timestamp =
      new Date().toLocaleString('en-US', {
        timeZone: 'America/Chicago',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }) + ' CT';

    return new Response(
      JSON.stringify({
        success: true,
        count: articles.length,
        articles,
        meta: {
          fetchedAt: timestamp,
          timezone: 'America/Chicago',
          source: 'D1Baseball / NCAA / Official Program Sources',
          category: categoryFilter || 'all',
          note: 'College baseball news coverage that ESPN ignores. Portal moves, recruiting, and game coverage for all 300+ D1 programs.',
        },
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=300',
        },
      }
    );
  } catch (error) {
    console.error('College Baseball News API error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch college baseball news',
        articles: [],
        meta: {
          fetchedAt: new Date().toISOString(),
          timezone: 'America/Chicago',
          source: 'D1Baseball / NCAA / Official Program Sources',
        },
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
