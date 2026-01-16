/**
 * BSI NFL News API
 * Fetches NFL news from ESPN with category classification
 *
 * GET /api/nfl/news
 * Query params:
 *   - category: trade | injury | game | draft | free-agency | analysis | general (optional)
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
  category: 'trade' | 'injury' | 'game' | 'draft' | 'free-agency' | 'analysis' | 'general';
  team?: string;
  division?: string;
}

const ESPN_NFL_NEWS = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/news';

const NFL_DIVISIONS: Record<string, string> = {
  // AFC East
  'Buffalo Bills': 'AFC East',
  'Miami Dolphins': 'AFC East',
  'New England Patriots': 'AFC East',
  'New York Jets': 'AFC East',
  // AFC North
  'Baltimore Ravens': 'AFC North',
  'Cincinnati Bengals': 'AFC North',
  'Cleveland Browns': 'AFC North',
  'Pittsburgh Steelers': 'AFC North',
  // AFC South
  'Houston Texans': 'AFC South',
  'Indianapolis Colts': 'AFC South',
  'Jacksonville Jaguars': 'AFC South',
  'Tennessee Titans': 'AFC South',
  // AFC West
  'Denver Broncos': 'AFC West',
  'Kansas City Chiefs': 'AFC West',
  'Las Vegas Raiders': 'AFC West',
  'Los Angeles Chargers': 'AFC West',
  // NFC East
  'Dallas Cowboys': 'NFC East',
  'New York Giants': 'NFC East',
  'Philadelphia Eagles': 'NFC East',
  'Washington Commanders': 'NFC East',
  // NFC North
  'Chicago Bears': 'NFC North',
  'Detroit Lions': 'NFC North',
  'Green Bay Packers': 'NFC North',
  'Minnesota Vikings': 'NFC North',
  // NFC South
  'Atlanta Falcons': 'NFC South',
  'Carolina Panthers': 'NFC South',
  'New Orleans Saints': 'NFC South',
  'Tampa Bay Buccaneers': 'NFC South',
  // NFC West
  'Arizona Cardinals': 'NFC West',
  'Los Angeles Rams': 'NFC West',
  'San Francisco 49ers': 'NFC West',
  'Seattle Seahawks': 'NFC West',
};

function categorizeArticle(
  article: ESPNArticle
): 'trade' | 'injury' | 'game' | 'draft' | 'free-agency' | 'analysis' | 'general' {
  const headline = (article.headline || article.title || '').toLowerCase();
  const description = (article.description || '').toLowerCase();
  const combined = `${headline} ${description}`;

  // Draft detection
  if (
    combined.includes('draft') ||
    combined.includes('pick') ||
    combined.includes('combine') ||
    combined.includes('pro day') ||
    combined.includes('mock') ||
    combined.includes('scouting')
  ) {
    return 'draft';
  }

  // Free agency detection
  if (
    combined.includes('free agent') ||
    combined.includes('free-agent') ||
    combined.includes('free agency') ||
    combined.includes('unrestricted') ||
    combined.includes('franchise tag') ||
    combined.includes('contract extension')
  ) {
    return 'free-agency';
  }

  // Trade detection
  if (
    combined.includes('trade') ||
    combined.includes('acquire') ||
    combined.includes('deal') ||
    combined.includes('waiver') ||
    combined.includes('release') ||
    combined.includes('cut')
  ) {
    return 'trade';
  }

  // Injury detection
  if (
    combined.includes('injury') ||
    combined.includes('injured') ||
    combined.includes('ir') ||
    combined.includes('surgery') ||
    combined.includes('rehab') ||
    combined.includes('out for') ||
    combined.includes('miss') ||
    combined.includes('questionable') ||
    combined.includes('doubtful') ||
    combined.includes('concussion') ||
    combined.includes('acl') ||
    combined.includes('torn')
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
    combined.includes('touchdown') ||
    combined.includes('overtime') ||
    combined.includes('playoff') ||
    combined.includes('super bowl') ||
    combined.includes('wild card') ||
    combined.includes('divisional')
  ) {
    return 'game';
  }

  // Analysis detection
  if (
    combined.includes('analysis') ||
    combined.includes('breakdown') ||
    combined.includes('power rankings') ||
    combined.includes('projection') ||
    combined.includes('prediction') ||
    combined.includes('outlook') ||
    combined.includes('what went wrong') ||
    combined.includes('what went right')
  ) {
    return 'analysis';
  }

  return 'general';
}

function extractTeamAndDivision(article: ESPNArticle): { team?: string; division?: string } {
  const categories = article.categories || [];
  let team: string | undefined;
  let division: string | undefined;

  for (const cat of categories) {
    if (cat.type === 'team' && cat.description) {
      team = cat.description;
      division = NFL_DIVISIONS[cat.description];
      break;
    }
  }

  return { team, division };
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
    const response = await fetch(`${ESPN_NFL_NEWS}?limit=${Math.min(limit * 2, 50)}`, {
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
      const { team, division } = extractTeamAndDivision(article);
      return {
        id: `nfl-${Date.now()}-${index}`,
        title: article.headline || article.title || '',
        summary: article.description || '',
        source: 'ESPN',
        url: article.links?.web?.href || article.links?.api?.self?.href || '#',
        publishedAt: article.published || new Date().toISOString(),
        category: categorizeArticle(article),
        team,
        division,
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
          source: 'NFL News API / Official Team Sources',
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
    console.error('NFL News API error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch NFL news',
        articles: [],
        meta: {
          fetchedAt: new Date().toISOString(),
          timezone: 'America/Chicago',
          source: 'NFL News API / Official Team Sources',
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
