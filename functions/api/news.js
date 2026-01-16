/**
 * BSI News API - Aggregates sports news from ESPN
 *
 * GET /api/news
 * Query params:
 *   - sport: mlb, nfl, nba, ncaaf (default: all)
 *   - limit: number of articles per sport (default: 3)
 */

const SPORT_ENDPOINTS = {
  mlb: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/news',
  nfl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/news',
  nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news',
  ncaaf: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/news',
  ncaab: 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/news',
};

export async function onRequest(context) {
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
  const sport = url.searchParams.get('sport');
  const limit = parseInt(url.searchParams.get('limit')) || 3;

  try {
    const headlines = [];
    const sportsToFetch = sport ? [sport] : Object.keys(SPORT_ENDPOINTS);

    const fetchPromises = sportsToFetch.map(async (sportKey) => {
      const endpoint = SPORT_ENDPOINTS[sportKey];
      if (!endpoint) return [];

      try {
        const response = await fetch(`${endpoint}?limit=${limit}`, {
          headers: {
            'User-Agent': 'BlazeSportsIntel/1.0',
          },
        });

        if (!response.ok) return [];

        const data = await response.json();
        const articles = data.articles || [];

        return articles.slice(0, limit).map((article) => ({
          sport: sportKey.toUpperCase(),
          title: article.headline || article.title || '',
          description: article.description || '',
          published: article.published || new Date().toISOString(),
          link: article.links?.web?.href || article.links?.api?.self?.href || '#',
          source: 'ESPN',
          image: article.images?.[0]?.url || null,
        }));
      } catch (err) {
        console.warn(`Failed to fetch ${sportKey} news:`, err.message);
        return [];
      }
    });

    const results = await Promise.all(fetchPromises);
    results.forEach((articles) => headlines.push(...articles));

    // Sort by published date, most recent first
    headlines.sort((a, b) => new Date(b.published) - new Date(a.published));

    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return new Response(
      JSON.stringify({
        success: true,
        count: headlines.length,
        headlines,
        meta: {
          fetchedAt: timestamp,
          timezone: 'America/Chicago',
          source: 'ESPN Public API',
        },
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=300', // 5 minute cache
        },
      }
    );
  } catch (error) {
    console.error('News API error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch news',
        headlines: [],
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
