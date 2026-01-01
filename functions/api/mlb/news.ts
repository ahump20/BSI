/**
 * BSI MLB News API
 * Fetches MLB news from ESPN and categorizes by type
 *
 * GET /api/mlb/news
 * Query params:
 *   - category: trade | injury | game | analysis | general (optional, default: all)
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
  type?: string;
}

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  category: 'trade' | 'injury' | 'game' | 'analysis' | 'general';
  team?: string;
}

const ESPN_MLB_NEWS = 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/news';

function categorizeArticle(
  article: ESPNArticle
): 'trade' | 'injury' | 'game' | 'analysis' | 'general' {
  const headline = (article.headline || article.title || '').toLowerCase();
  const description = (article.description || '').toLowerCase();
  const combined = `${headline} ${description}`;

  // Trade detection
  if (
    combined.includes('trade') ||
    combined.includes('acquire') ||
    combined.includes('sign') ||
    combined.includes('deal') ||
    combined.includes('waiver') ||
    combined.includes('dfa')
  ) {
    return 'trade';
  }

  // Injury detection
  if (
    combined.includes('injury') ||
    combined.includes('injured') ||
    combined.includes('il') ||
    combined.includes('disabled list') ||
    combined.includes('surgery') ||
    combined.includes('rehab') ||
    combined.includes('out for') ||
    combined.includes('miss') ||
    combined.includes('day-to-day')
  ) {
    return 'injury';
  }

  // Game recap/preview detection
  if (
    combined.includes('recap') ||
    combined.includes('preview') ||
    combined.includes('beat') ||
    combined.includes('defeat') ||
    combined.includes('win') ||
    combined.includes('lose') ||
    combined.includes('walk-off') ||
    combined.includes('shutout') ||
    combined.includes('no-hitter')
  ) {
    return 'game';
  }

  // Analysis detection
  if (
    combined.includes('analysis') ||
    combined.includes('breakdown') ||
    combined.includes('why') ||
    combined.includes('how') ||
    combined.includes('ranking') ||
    combined.includes('power rankings') ||
    combined.includes('prospect') ||
    combined.includes('outlook')
  ) {
    return 'analysis';
  }

  return 'general';
}

function extractTeam(article: ESPNArticle): string | undefined {
  const categories = article.categories || [];
  for (const cat of categories) {
    if (cat.type === 'team' && cat.description) {
      return cat.description;
    }
  }
  return undefined;
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
    const response = await fetch(`${ESPN_MLB_NEWS}?limit=${Math.min(limit * 2, 50)}`, {
      headers: {
        'User-Agent': 'BlazeSportsIntel/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`ESPN API returned ${response.status}`);
    }

    const data = (await response.json()) as { articles?: ESPNArticle[] };
    const espnArticles = data.articles || [];

    let articles: NewsItem[] = espnArticles.map((article, index) => ({
      id: `mlb-${Date.now()}-${index}`,
      title: article.headline || article.title || '',
      summary: article.description || '',
      source: 'ESPN',
      url: article.links?.web?.href || article.links?.api?.self?.href || '#',
      publishedAt: article.published || new Date().toISOString(),
      category: categorizeArticle(article),
      team: extractTeam(article),
    }));

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
          source: 'ESPN MLB News',
          category: categoryFilter || 'all',
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
    console.error('MLB News API error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch MLB news',
        articles: [],
        meta: {
          fetchedAt: new Date().toISOString(),
          timezone: 'America/Chicago',
          source: 'ESPN MLB News',
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
