/**
 * Blaze Sports Intel - NFL AI Game Previews & Recaps
 * Fetches NFL games and generates AI-powered previews/recaps
 */

export interface Env {
  AI: any;
  SPORTS_CACHE?: KVNamespace;
}

interface ESPNGame {
  id: string;
  name: string;
  date: string;
  week?: { number: number };
  status: {
    type: {
      name: string;
      completed: boolean;
    };
    displayClock?: string;
    period?: number;
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
    odds?: Array<{ details: string; overUnder: number }>;
  }>;
}

const ESPN_NFL_API = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';

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
  const odds = competition.odds?.[0];

  const gameDate = new Date(game.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Chicago',
  });

  const prompt = `You are an NFL analyst writing a game preview. Write a 2-paragraph preview.

Game: ${awayTeam?.team.displayName} (${awayRecord}) at ${homeTeam?.team.displayName} (${homeRecord})
Week: ${game.week?.number || 'Playoffs'}
Date: ${gameDate}
Venue: ${venue}
TV: ${broadcast}
${odds ? `Line: ${odds.details}, O/U: ${odds.overUnder}` : ''}

Write an engaging preview covering:
1. The key matchup—offense vs defense, or specific position battles
2. Playoff/division implications and what's at stake for each team

Keep it under 150 words. Be analytical and direct—no clichés about "wanting it more."`;

  try {
    const response = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
      prompt,
      max_tokens: 300,
    });
    return response?.response || 'Preview unavailable.';
  } catch (error) {
    console.error('AI preview error:', error);
    return `${awayTeam?.team.displayName} travels to ${venue} to face the ${homeTeam?.team.displayName}. Kickoff details available closer to game time.`;
  }
}

async function generateRecap(env: Env, game: ESPNGame): Promise<string> {
  const competition = game.competitions[0];
  const homeTeam = competition.competitors.find((c) => c.homeAway === 'home');
  const awayTeam = competition.competitors.find((c) => c.homeAway === 'away');
  const winner = competition.competitors.find((c) => c.winner);
  const headline = competition.headlines?.[0]?.shortLinkText || '';

  const prompt = `You are an NFL analyst writing a game recap. Write a 2-paragraph summary.

Final: ${awayTeam?.team.displayName} ${awayTeam?.score} at ${homeTeam?.team.displayName} ${homeTeam?.score}
Winner: ${winner?.team.displayName}
${headline ? `Headline: ${headline}` : ''}

Write a recap covering:
1. The decisive plays—touchdowns, turnovers, or fourth-quarter heroics
2. Playoff/standings implications for both teams

Keep it under 150 words. Write like you're on NFL Network—direct, insightful, no fluff.`;

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
    const weekParam = url.searchParams.get('week');
    const limit = parseInt(url.searchParams.get('limit') || '16', 10);

    // Build ESPN API URL
    let apiUrl = `${ESPN_NFL_API}/scoreboard`;
    if (weekParam) {
      apiUrl += `?week=${weekParam}`;
    }

    // Check cache first
    const cacheKey = `nfl:games:${weekParam || 'current'}:${limit}`;
    if (env.SPORTS_CACHE) {
      const cached = await env.SPORTS_CACHE.get(cacheKey);
      if (cached) {
        return new Response(cached, {
          headers: { ...headers, 'X-Cache': 'HIT' },
        });
      }
    }

    // Fetch games from ESPN
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status}`);
    }

    const data = (await response.json()) as { events: ESPNGame[]; week?: { number: number } };
    const games = data.events || [];
    const currentWeek = data.week?.number;

    // Process games with AI content
    const processedGames = await Promise.all(
      games.slice(0, limit).map(async (game) => {
        const competition = game.competitions[0];
        const homeTeam = competition.competitors.find((c) => c.homeAway === 'home');
        const awayTeam = competition.competitors.find((c) => c.homeAway === 'away');
        const isCompleted = game.status.type.completed;
        const isLive = game.status.type.name === 'STATUS_IN_PROGRESS';

        // Check for cached content
        const contentType = isCompleted ? 'recap' : 'preview';
        const contentCacheKey = `nfl:${contentType}:${game.id}`;
        let aiContent: string | null = null;

        if (env.SPORTS_CACHE) {
          aiContent = await env.SPORTS_CACHE.get(contentCacheKey);
        }

        // Only generate AI content for completed or scheduled games, not live
        if (!aiContent && !isLive) {
          aiContent = isCompleted
            ? await generateRecap(env, game)
            : await generatePreview(env, game);

          if (env.SPORTS_CACHE) {
            await env.SPORTS_CACHE.put(contentCacheKey, aiContent, {
              expirationTtl: isCompleted ? 86400 * 7 : 3600, // 7 days for recaps, 1 hour for previews
            });
          }
        }

        return {
          id: game.id,
          name: game.name,
          date: game.date,
          week: game.week?.number || currentWeek,
          status: game.status.type.name,
          completed: isCompleted,
          isLive,
          quarter: game.status.period,
          clock: game.status.displayClock,
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
          odds: competition.odds?.[0]?.details,
          contentType: isLive ? 'live' : contentType,
          aiContent: isLive ? 'Game in progress—check back for the full recap.' : aiContent,
        };
      })
    );

    const result = {
      meta: {
        source: 'ESPN NFL',
        week: currentWeek,
        fetched_at: new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }),
        timezone: 'America/Chicago',
        ai_model: '@cf/meta/llama-3-8b-instruct',
        total: games.length,
        returned: processedGames.length,
      },
      games: processedGames,
    };

    const json = JSON.stringify(result);

    // Cache for 10 minutes (NFL has fewer updates)
    if (env.SPORTS_CACHE) {
      await env.SPORTS_CACHE.put(cacheKey, json, { expirationTtl: 600 });
    }

    return new Response(json, {
      headers: { ...headers, 'X-Cache': 'MISS' },
    });
  } catch (error: any) {
    console.error('NFL Games API error:', error);
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
