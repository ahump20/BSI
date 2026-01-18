/**
 * BSI CFB AI Preview/Recap Worker
 *
 * Integrates SportsDataIO Coded Content (premium articles) with Workers AI fallback.
 * Stores articles in D1 for persistence and serves via API endpoints.
 *
 * Data Priority:
 * 1. SportsDataIO Coded Content (when available)
 * 2. Workers AI generated content (fallback)
 *
 * Endpoints:
 * - GET /previews - List upcoming game previews
 * - GET /preview/:gameId - Get preview for specific game
 * - GET /recaps - List completed game recaps
 * - GET /recap/:gameId - Get recap for specific game
 * - GET /articles - List all articles with pagination
 * - GET /article/:slug - Get article by slug
 * - GET /games/today - Today's games with content
 * - GET /health - Service health check
 */

interface Env {
  AI: Ai;
  BSI_CFB_CACHE: KVNamespace;
  BSI_HISTORICAL_DB: D1Database;
  SPORTSDATAIO_API_KEY?: string;
}

interface ESPNGame {
  id: string;
  name: string;
  date: string;
  status: {
    type: {
      name: string;
      completed: boolean;
    };
  };
  competitions: Array<{
    competitors: Array<{
      team: {
        displayName: string;
        abbreviation: string;
        logo: string;
      };
      homeAway: string;
      score: string;
      winner?: boolean;
      records?: Array<{ summary: string }>;
    }>;
    venue?: {
      fullName: string;
      address?: { city: string; state: string };
    };
    broadcasts?: Array<{ names: string[] }>;
    headlines?: Array<{ shortLinkText: string }>;
  }>;
}

interface CodedContentArticle {
  id: number;
  article_type: 'preview' | 'recap' | 'analysis';
  game_id: number | null;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  home_team_id: number | null;
  home_team_name: string | null;
  away_team_id: number | null;
  away_team_name: string | null;
  game_date: string | null;
  sport: string;
  conference: string | null;
  published_at: string;
  expires_at: string | null;
  source_url: string | null;
  source_article_id: string | null;
  metadata: string | null;
  created_at: string;
  updated_at: string;
}

interface SportsDataIOArticle {
  ArticleID: number;
  Title: string;
  Source: string;
  Updated: string;
  Content: string;
  Url: string;
  TermsOfUse: string;
  Author: string;
  Players?: Array<{ PlayerID: number; Name: string }>;
  Team?: { TeamID: number; Name: string };
}

const ESPN_CFB_API = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football';
const SPORTSDATAIO_BASE = 'https://api.sportsdata.io/v3/cfb';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

// Get Chicago timezone timestamp
function getChicagoTimestamp(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
}

function getChicagoISO(): string {
  return new Date()
    .toLocaleString('en-CA', {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    .replace(', ', 'T');
}

// Generate URL-safe slug from title
function generateSlug(title: string, gameId?: number | string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80);
  return gameId ? `${base}-${gameId}` : base;
}

// Fetch games from ESPN API
async function fetchGames(date?: string): Promise<ESPNGame[]> {
  const dateParam = date ? `?dates=${date}` : '';
  const response = await fetch(`${ESPN_CFB_API}/scoreboard${dateParam}`);

  if (!response.ok) {
    throw new Error(`ESPN API error: ${response.status}`);
  }

  const data = (await response.json()) as { events: ESPNGame[] };
  return data.events || [];
}

// Fetch coded content from SportsDataIO
async function fetchCodedContent(env: Env): Promise<SportsDataIOArticle[]> {
  if (!env.SPORTSDATAIO_API_KEY) {
    console.log('SportsDataIO API key not configured, skipping coded content fetch');
    return [];
  }

  try {
    const response = await fetch(
      `${SPORTSDATAIO_BASE}/scores/json/News?key=${env.SPORTSDATAIO_API_KEY}`
    );

    if (!response.ok) {
      console.error(`SportsDataIO API error: ${response.status}`);
      return [];
    }

    return (await response.json()) as SportsDataIOArticle[];
  } catch (error) {
    console.error('Failed to fetch coded content:', error);
    return [];
  }
}

// Store article in D1
async function storeArticle(env: Env, article: Partial<CodedContentArticle>): Promise<void> {
  const slug =
    article.slug || generateSlug(article.title || 'untitled', article.game_id?.toString());

  await env.BSI_HISTORICAL_DB.prepare(
    `
    INSERT INTO coded_content_articles (
      article_type, game_id, title, slug, summary, content,
      home_team_id, home_team_name, away_team_id, away_team_name,
      game_date, sport, conference, published_at, expires_at,
      source_url, source_article_id, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      content = excluded.content,
      summary = excluded.summary,
      updated_at = datetime('now')
  `
  )
    .bind(
      article.article_type || 'analysis',
      article.game_id || null,
      article.title || 'Untitled',
      slug,
      article.summary || null,
      article.content || '',
      article.home_team_id || null,
      article.home_team_name || null,
      article.away_team_id || null,
      article.away_team_name || null,
      article.game_date || null,
      article.sport || 'CFB',
      article.conference || null,
      article.published_at || getChicagoISO(),
      article.expires_at || null,
      article.source_url || null,
      article.source_article_id || null,
      article.metadata || null
    )
    .run();
}

// Get articles from D1
async function getArticles(
  env: Env,
  options: {
    type?: 'preview' | 'recap' | 'analysis';
    limit?: number;
    offset?: number;
    conference?: string;
  } = {}
): Promise<CodedContentArticle[]> {
  const { type, limit = 20, offset = 0, conference } = options;

  let query = 'SELECT * FROM coded_content_articles WHERE sport = ?';
  const params: (string | number)[] = ['CFB'];

  if (type) {
    query += ' AND article_type = ?';
    params.push(type);
  }

  if (conference) {
    query += ' AND conference = ?';
    params.push(conference);
  }

  query += ' ORDER BY published_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const result = await env.BSI_HISTORICAL_DB.prepare(query)
    .bind(...params)
    .all<CodedContentArticle>();
  return result.results || [];
}

// Get article by slug
async function getArticleBySlug(env: Env, slug: string): Promise<CodedContentArticle | null> {
  const result = await env.BSI_HISTORICAL_DB.prepare(
    'SELECT * FROM coded_content_articles WHERE slug = ? AND sport = ?'
  )
    .bind(slug, 'CFB')
    .first<CodedContentArticle>();
  return result || null;
}

// Get article by game ID
async function getArticleByGameId(
  env: Env,
  gameId: string,
  type: 'preview' | 'recap'
): Promise<CodedContentArticle | null> {
  const result = await env.BSI_HISTORICAL_DB.prepare(
    'SELECT * FROM coded_content_articles WHERE game_id = ? AND article_type = ? AND sport = ?'
  )
    .bind(parseInt(gameId), type, 'CFB')
    .first<CodedContentArticle>();
  return result || null;
}

// Generate game preview using Workers AI (fallback)
async function generatePreview(env: Env, game: ESPNGame): Promise<string> {
  const competition = game.competitions[0];
  const homeTeam = competition.competitors.find((c) => c.homeAway === 'home');
  const awayTeam = competition.competitors.find((c) => c.homeAway === 'away');

  const homeRecord = homeTeam?.records?.[0]?.summary || 'N/A';
  const awayRecord = awayTeam?.records?.[0]?.summary || 'N/A';
  const venue = competition.venue?.fullName || 'TBD';
  const broadcast = competition.broadcasts?.[0]?.names?.[0] || 'TBD';

  const prompt = `You are a college football analyst writing a brief game preview. Write a 2-3 paragraph preview for this upcoming game. Be engaging but factual. Focus on what makes this matchup interesting.

Game: ${awayTeam?.team.displayName} (${awayRecord}) @ ${homeTeam?.team.displayName} (${homeRecord})
Date: ${new Date(game.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Chicago' })}
Venue: ${venue}
Broadcast: ${broadcast}

Write a preview that:
1. Sets up the matchup and what's at stake
2. Mentions any notable storylines or players to watch
3. Gives a sense of what to expect

Keep it under 200 words. Write in an engaging, direct style without clichés.`;

  const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
    prompt,
    max_tokens: 400,
  });

  return (response as { response: string }).response || 'Preview generation failed.';
}

// Generate game recap using Workers AI (fallback)
async function generateRecap(env: Env, game: ESPNGame): Promise<string> {
  const competition = game.competitions[0];
  const homeTeam = competition.competitors.find((c) => c.homeAway === 'home');
  const awayTeam = competition.competitors.find((c) => c.homeAway === 'away');

  const winner = competition.competitors.find((c) => c.winner);
  const headline = competition.headlines?.[0]?.shortLinkText || '';

  const prompt = `You are a college football analyst writing a game recap. Write a 2-3 paragraph recap of this completed game. Be factual and analytical.

Final Score: ${awayTeam?.team.displayName} ${awayTeam?.score} @ ${homeTeam?.team.displayName} ${homeTeam?.score}
Winner: ${winner?.team.displayName}
Headline: ${headline}

Write a recap that:
1. Summarizes the key moments and turning points
2. Highlights standout performances
3. Discusses what this means for both teams going forward

Keep it under 200 words. Write in an engaging, analytical style.`;

  const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
    prompt,
    max_tokens: 400,
  });

  return (response as { response: string }).response || 'Recap generation failed.';
}

// Main request handler
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // GET /articles - List all articles with pagination
      if (path === '/articles') {
        const type = url.searchParams.get('type') as 'preview' | 'recap' | 'analysis' | null;
        const conference = url.searchParams.get('conference');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const offset = parseInt(url.searchParams.get('offset') || '0');

        const articles = await getArticles(env, {
          type: type || undefined,
          conference: conference || undefined,
          limit: Math.min(limit, 50),
          offset,
        });

        return new Response(
          JSON.stringify({
            meta: {
              source: 'BSI CFB Content',
              fetched_at: getChicagoTimestamp(),
              timezone: 'America/Chicago',
              count: articles.length,
            },
            articles: articles.map((a) => ({
              ...a,
              metadata: a.metadata ? JSON.parse(a.metadata) : null,
            })),
          }),
          { headers: corsHeaders }
        );
      }

      // GET /article/:slug - Get article by slug
      if (path.startsWith('/article/')) {
        const slug = path.split('/')[2];
        const article = await getArticleBySlug(env, slug);

        if (!article) {
          return new Response(JSON.stringify({ error: 'Article not found' }), {
            status: 404,
            headers: corsHeaders,
          });
        }

        return new Response(
          JSON.stringify({
            meta: { source: 'BSI CFB Content', timezone: 'America/Chicago' },
            article: {
              ...article,
              metadata: article.metadata ? JSON.parse(article.metadata) : null,
            },
          }),
          { headers: corsHeaders }
        );
      }

      // GET /previews - List upcoming game previews
      if (path === '/previews') {
        const articles = await getArticles(env, { type: 'preview', limit: 20 });

        return new Response(
          JSON.stringify({
            meta: {
              source: 'BSI CFB Content',
              fetched_at: getChicagoTimestamp(),
              timezone: 'America/Chicago',
            },
            previews: articles,
          }),
          { headers: corsHeaders }
        );
      }

      // GET /recaps - List completed game recaps
      if (path === '/recaps') {
        const articles = await getArticles(env, { type: 'recap', limit: 20 });

        return new Response(
          JSON.stringify({
            meta: {
              source: 'BSI CFB Content',
              fetched_at: getChicagoTimestamp(),
              timezone: 'America/Chicago',
            },
            recaps: articles,
          }),
          { headers: corsHeaders }
        );
      }

      // GET /preview/:gameId - Single game preview
      if (path.startsWith('/preview/')) {
        const gameId = path.split('/')[2];

        // Check D1 first
        const dbArticle = await getArticleByGameId(env, gameId, 'preview');
        if (dbArticle) {
          return new Response(
            JSON.stringify({
              meta: { source: 'SportsDataIO Coded Content', timezone: 'America/Chicago' },
              gameId,
              type: 'preview',
              title: dbArticle.title,
              content: dbArticle.content,
              summary: dbArticle.summary,
              published_at: dbArticle.published_at,
            }),
            { headers: { ...corsHeaders, 'X-Content-Source': 'D1' } }
          );
        }

        // Check KV cache for AI-generated content
        const cacheKey = `cfb-preview-${gameId}`;
        const cached = await env.BSI_CFB_CACHE.get(cacheKey);
        if (cached) {
          return new Response(
            JSON.stringify({
              meta: { source: 'Workers AI', timezone: 'America/Chicago' },
              gameId,
              type: 'preview',
              content: cached,
            }),
            { headers: { ...corsHeaders, 'X-Content-Source': 'KV-Cache' } }
          );
        }

        return new Response(JSON.stringify({ error: 'Preview not found' }), {
          status: 404,
          headers: corsHeaders,
        });
      }

      // GET /recap/:gameId - Single game recap
      if (path.startsWith('/recap/')) {
        const gameId = path.split('/')[2];

        // Check D1 first
        const dbArticle = await getArticleByGameId(env, gameId, 'recap');
        if (dbArticle) {
          return new Response(
            JSON.stringify({
              meta: { source: 'SportsDataIO Coded Content', timezone: 'America/Chicago' },
              gameId,
              type: 'recap',
              title: dbArticle.title,
              content: dbArticle.content,
              summary: dbArticle.summary,
              published_at: dbArticle.published_at,
            }),
            { headers: { ...corsHeaders, 'X-Content-Source': 'D1' } }
          );
        }

        // Check KV cache
        const cacheKey = `cfb-recap-${gameId}`;
        const cached = await env.BSI_CFB_CACHE.get(cacheKey);
        if (cached) {
          return new Response(
            JSON.stringify({
              meta: { source: 'Workers AI', timezone: 'America/Chicago' },
              gameId,
              type: 'recap',
              content: cached,
            }),
            { headers: { ...corsHeaders, 'X-Content-Source': 'KV-Cache' } }
          );
        }

        return new Response(JSON.stringify({ error: 'Recap not found' }), {
          status: 404,
          headers: corsHeaders,
        });
      }

      // GET /games/today - Today's games with AI content
      if (path === '/games/today' || path === '/') {
        const today = getChicagoTimestamp().replace(/-/g, '');
        const cacheKey = `cfb-games-${today}`;

        // Check cache
        const cached = await env.BSI_CFB_CACHE.get(cacheKey);
        if (cached) {
          return new Response(cached, {
            headers: { ...corsHeaders, 'X-Cache': 'HIT' },
          });
        }

        const games = await fetchGames(today);
        const gamesWithContent = await Promise.all(
          games.slice(0, 10).map(async (game) => {
            const competition = game.competitions[0];
            const homeTeam = competition.competitors.find((c) => c.homeAway === 'home');
            const awayTeam = competition.competitors.find((c) => c.homeAway === 'away');

            const isCompleted = game.status.type.completed;
            const contentType = isCompleted ? 'recap' : 'preview';

            // Check D1 for coded content first
            const dbArticle = await getArticleByGameId(env, game.id, contentType);
            let content = dbArticle?.content;
            let source = 'SportsDataIO';

            // Fall back to KV cache / AI generation
            if (!content) {
              const contentCacheKey = `cfb-${contentType}-${game.id}`;
              content = await env.BSI_CFB_CACHE.get(contentCacheKey);

              if (!content) {
                content = isCompleted
                  ? await generateRecap(env, game)
                  : await generatePreview(env, game);
                await env.BSI_CFB_CACHE.put(contentCacheKey, content, { expirationTtl: 3600 });
              }
              source = 'Workers AI';
            }

            return {
              gameId: game.id,
              homeTeam: homeTeam?.team.displayName,
              homeScore: homeTeam?.score,
              homeLogo: homeTeam?.team.logo,
              awayTeam: awayTeam?.team.displayName,
              awayScore: awayTeam?.score,
              awayLogo: awayTeam?.team.logo,
              status: game.status.type.name,
              completed: isCompleted,
              contentType,
              content,
              contentSource: source,
              date: game.date,
            };
          })
        );

        const response = {
          meta: {
            source: 'ESPN + BSI Content',
            fetched_at: getChicagoTimestamp(),
            timezone: 'America/Chicago',
            ai_model: '@cf/meta/llama-3-8b-instruct',
          },
          games: gamesWithContent,
        };

        const json = JSON.stringify(response);
        await env.BSI_CFB_CACHE.put(cacheKey, json, { expirationTtl: 300 });

        return new Response(json, {
          headers: { ...corsHeaders, 'X-Cache': 'MISS' },
        });
      }

      // GET /health - Health check
      if (path === '/health') {
        return new Response(
          JSON.stringify({
            status: 'healthy',
            service: 'bsi-cfb-ai',
            timestamp: getChicagoTimestamp(),
            features: {
              workersAI: true,
              codedContent: !!env.SPORTSDATAIO_API_KEY,
              d1Storage: true,
            },
          }),
          { headers: corsHeaders }
        );
      }

      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: corsHeaders,
      });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        { status: 500, headers: corsHeaders }
      );
    }
  },

  // Scheduled handler for pre-generating content and ingesting coded content
  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    const cronName = event.cron;
    console.log(`Running scheduled job: ${cronName}`);

    try {
      // Every 4 hours: Ingest coded content from SportsDataIO
      if (cronName === '0 */4 * * *') {
        console.log('Ingesting coded content from SportsDataIO...');

        const articles = await fetchCodedContent(env);
        let stored = 0;

        for (const article of articles) {
          try {
            await storeArticle(env, {
              article_type: 'analysis',
              title: article.Title,
              slug: generateSlug(article.Title, article.ArticleID),
              content: article.Content,
              published_at: article.Updated,
              source_url: article.Url,
              source_article_id: article.ArticleID.toString(),
              metadata: JSON.stringify({
                author: article.Author,
                source: article.Source,
                players: article.Players,
                team: article.Team,
              }),
            });
            stored++;
          } catch (err) {
            console.error(`Failed to store article ${article.ArticleID}:`, err);
          }
        }

        console.log(`Stored ${stored} coded content articles`);
        return;
      }

      // 6 AM: Pre-generate AI content for today's games
      if (cronName === '0 6 * * *') {
        console.log("Pre-generating AI content for today's games...");

        const today = getChicagoTimestamp().replace(/-/g, '');
        const games = await fetchGames(today);

        for (const game of games.slice(0, 20)) {
          const isCompleted = game.status.type.completed;
          const contentType = isCompleted ? 'recap' : 'preview';
          const cacheKey = `cfb-${contentType}-${game.id}`;

          const existing = await env.BSI_CFB_CACHE.get(cacheKey);
          if (!existing) {
            const content = isCompleted
              ? await generateRecap(env, game)
              : await generatePreview(env, game);
            await env.BSI_CFB_CACHE.put(cacheKey, content, { expirationTtl: 86400 });

            // Also store in D1 for persistence
            const competition = game.competitions[0];
            const homeTeam = competition.competitors.find((c) => c.homeAway === 'home');
            const awayTeam = competition.competitors.find((c) => c.homeAway === 'away');

            await storeArticle(env, {
              article_type: contentType,
              game_id: parseInt(game.id),
              title: `${awayTeam?.team.displayName} vs ${homeTeam?.team.displayName} ${contentType === 'preview' ? 'Preview' : 'Recap'}`,
              content,
              home_team_name: homeTeam?.team.displayName,
              away_team_name: awayTeam?.team.displayName,
              game_date: game.date,
              metadata: JSON.stringify({
                source: 'Workers AI',
                model: '@cf/meta/llama-3-8b-instruct',
              }),
            });

            console.log(`Generated ${contentType} for game ${game.id}`);
          }
        }

        console.log('Scheduled AI content generation complete.');
      }
    } catch (error) {
      console.error('Scheduled job error:', error);
    }
  },
};
