/**
 * Blaze Sports Intel - CFB AI Game Previews & Recaps
 * Fetches CFB games and generates AI-powered previews/recaps
 */

export interface Env {
  AI: any;
  SPORTS_CACHE?: KVNamespace;
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
    };
    broadcasts?: Array<{ names: string[] }>;
    headlines?: Array<{ shortLinkText: string }>;
  }>;
}

const ESPN_CFB_API = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football';

function getChicagoDate(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
}

async function generatePreview(env: Env, game: ESPNGame): Promise<string> {
  const competition = game.competitions[0];
  const homeTeam = competition.competitors.find((c) => c.homeAway === 'home');
  const awayTeam = competition.competitors.find((c) => c.homeAway === 'away');

  const homeRecord = homeTeam?.records?.[0]?.summary || 'N/A';
  const awayRecord = awayTeam?.records?.[0]?.summary || 'N/A';
  const venue = competition.venue?.fullName || 'TBD';
  const broadcast = competition.broadcasts?.[0]?.names?.[0] || 'TBD';

  const gameDate = new Date(game.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Chicago',
  });

  const prompt = `You are a college football analyst writing a game preview. Write a 2-paragraph preview.

Game: ${awayTeam?.team.displayName} (${awayRecord}) at ${homeTeam?.team.displayName} (${homeRecord})
Date: ${gameDate}
Venue: ${venue}
TV: ${broadcast}

Write an engaging preview covering:
1. What makes this matchup interesting
2. Key players or storylines to watch

Keep it under 150 words. Be direct, no clichés. Write in present tense where appropriate.`;

  try {
    const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
      prompt,
      max_tokens: 300,
    });
    return response?.response || 'Preview unavailable.';
  } catch (error) {
    console.error('AI preview error:', error);
    return `${awayTeam?.team.displayName} travels to face ${homeTeam?.team.displayName} in this matchup. Game time details available closer to kickoff.`;
  }
}

async function generateRecap(env: Env, game: ESPNGame): Promise<string> {
  const competition = game.competitions[0];
  const homeTeam = competition.competitors.find((c) => c.homeAway === 'home');
  const awayTeam = competition.competitors.find((c) => c.homeAway === 'away');
  const winner = competition.competitors.find((c) => c.winner);
  const headline = competition.headlines?.[0]?.shortLinkText || '';

  const prompt = `You are a college football analyst writing a game recap. Write a 2-paragraph summary.

Final: ${awayTeam?.team.displayName} ${awayTeam?.score} at ${homeTeam?.team.displayName} ${homeTeam?.score}
Winner: ${winner?.team.displayName}
${headline ? `Headline: ${headline}` : ''}

Write a recap covering:
1. How the game was decided
2. What this means for both teams going forward

Keep it under 150 words. Be analytical and direct.`;

  try {
    const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
      prompt,
      max_tokens: 300,
    });
    return response?.response || 'Recap unavailable.';
  } catch (error) {
    console.error('AI recap error:', error);
    return `${winner?.team.displayName} defeated ${winner === homeTeam ? awayTeam?.team.displayName : homeTeam?.team.displayName} by a final score of ${homeTeam?.score}-${awayTeam?.score}.`;
  }
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers,
    });
  }

  try {
    const dateParam = url.searchParams.get('date');
    const date = dateParam || getChicagoDate().replace(/-/g, '');
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);

    // Check cache first
    const cacheKey = `cfb:games:${date}:${limit}`;
    if (env.SPORTS_CACHE) {
      const cached = await env.SPORTS_CACHE.get(cacheKey);
      if (cached) {
        return new Response(cached, {
          headers: { ...headers, 'X-Cache': 'HIT' },
        });
      }
    }

    // Fetch games from ESPN
    const response = await fetch(`${ESPN_CFB_API}/scoreboard?dates=${date}`);
    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status}`);
    }

    const data = (await response.json()) as { events: ESPNGame[] };
    const games = data.events || [];

    // Process games with AI content
    const processedGames = await Promise.all(
      games.slice(0, limit).map(async (game) => {
        const competition = game.competitions[0];
        const homeTeam = competition.competitors.find((c) => c.homeAway === 'home');
        const awayTeam = competition.competitors.find((c) => c.homeAway === 'away');
        const isCompleted = game.status.type.completed;

        // Check for cached content
        const contentType = isCompleted ? 'recap' : 'preview';
        const contentCacheKey = `cfb:${contentType}:${game.id}`;
        let aiContent: string | null = null;

        if (env.SPORTS_CACHE) {
          aiContent = await env.SPORTS_CACHE.get(contentCacheKey);
        }

        if (!aiContent) {
          aiContent = isCompleted
            ? await generateRecap(env, game)
            : await generatePreview(env, game);

          if (env.SPORTS_CACHE) {
            await env.SPORTS_CACHE.put(contentCacheKey, aiContent, {
              expirationTtl: isCompleted ? 86400 : 3600,
            });
          }
        }

        return {
          id: game.id,
          name: game.name,
          date: game.date,
          status: game.status.type.name,
          completed: isCompleted,
          homeTeam: {
            name: homeTeam?.team.displayName,
            abbreviation: homeTeam?.team.abbreviation,
            logo: homeTeam?.team.logo,
            score: homeTeam?.score,
            record: homeTeam?.records?.[0]?.summary,
          },
          awayTeam: {
            name: awayTeam?.team.displayName,
            abbreviation: awayTeam?.team.abbreviation,
            logo: awayTeam?.team.logo,
            score: awayTeam?.score,
            record: awayTeam?.records?.[0]?.summary,
          },
          venue: competition.venue?.fullName,
          broadcast: competition.broadcasts?.[0]?.names?.[0],
          contentType,
          aiContent,
        };
      })
    );

    const result = {
      meta: {
        source: 'ESPN college-football',
        fetched_at: getChicagoDate(),
        timezone: 'America/Chicago',
        ai_model: '@cf/meta/llama-3-8b-instruct',
        total: games.length,
        returned: processedGames.length,
      },
      games: processedGames,
    };

    const json = JSON.stringify(result);

    // Cache for 5 minutes
    if (env.SPORTS_CACHE) {
      await env.SPORTS_CACHE.put(cacheKey, json, { expirationTtl: 300 });
    }

    return new Response(json, {
      headers: { ...headers, 'X-Cache': 'MISS' },
    });
  } catch (error: any) {
    console.error('CFB Games API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch games',
        message: error.message,
      }),
      {
        status: 500,
        headers,
      }
    );
  }
};
