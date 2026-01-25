/**
 * NFL Scores API - ESPN Data
 *
 * GET /api/nfl/scores - Current week's games
 * GET /api/nfl/scores?week=5 - Specific week
 * GET /api/nfl/scores?season=2025&week=5 - Historical
 */

import { corsHeaders, generateCorrelationId, badRequest } from '../_utils.js';

interface Env {
  KV?: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async ({ request }) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(request.url);
  const seasonParam = url.searchParams.get('season');
  const weekParam = url.searchParams.get('week');

  const season = seasonParam ? parseInt(seasonParam) : new Date().getFullYear();
  const week = weekParam ? parseInt(weekParam) : undefined;

  // Validate week (1-18 regular season, 19-22 playoffs)
  if (week !== undefined && (week < 1 || week > 22)) {
    return badRequest(`Invalid week: ${week}. Week must be between 1 and 22.`);
  }

  try {
    const data = await fetchESPNScores(season, week);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': data.hasLiveGames ? 'public, max-age=30' : 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('NFL Scores Error:', error);
    const correlationId = generateCorrelationId();
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch NFL scores',
        message: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Correlation-ID': correlationId,
        },
      }
    );
  }
};

async function fetchESPNScores(season: number, week?: number): Promise<any> {
  const headers = {
    'User-Agent': 'BlazeSportsIntel/1.0 (https://blazesportsintel.com)',
    Accept: 'application/json',
  };

  // ESPN scoreboard endpoint
  let url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&season=${season}`;
  if (week) {
    url += `&week=${week}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`ESPN API returned ${response.status}`);
  }

  const data = await response.json();
  const events = data.events || [];

  const games = events.map((event: any) => {
    const competition = event.competitions?.[0] || {};
    const competitors = competition.competitors || [];
    const homeTeam = competitors.find((c: any) => c.homeAway === 'home');
    const awayTeam = competitors.find((c: any) => c.homeAway === 'away');

    // Map ESPN status to our status enum
    const espnStatus = event.status?.type?.name || 'STATUS_SCHEDULED';
    let status: 'scheduled' | 'in_progress' | 'final' | 'postponed' = 'scheduled';

    if (espnStatus === 'STATUS_FINAL' || espnStatus === 'STATUS_FINAL_OVERTIME') {
      status = 'final';
    } else if (
      espnStatus === 'STATUS_IN_PROGRESS' ||
      espnStatus === 'STATUS_HALFTIME' ||
      espnStatus === 'STATUS_END_PERIOD'
    ) {
      status = 'in_progress';
    } else if (espnStatus === 'STATUS_POSTPONED' || espnStatus === 'STATUS_CANCELED') {
      status = 'postponed';
    }

    return {
      id: parseInt(event.id) || 0,
      week: data.week?.number || week || 1,
      season,
      homeTeam: {
        id: parseInt(homeTeam?.team?.id) || 0,
        name: homeTeam?.team?.displayName || homeTeam?.team?.name || 'Unknown',
        score: parseInt(homeTeam?.score) || undefined,
      },
      awayTeam: {
        id: parseInt(awayTeam?.team?.id) || 0,
        name: awayTeam?.team?.displayName || awayTeam?.team?.name || 'Unknown',
        score: parseInt(awayTeam?.score) || undefined,
      },
      status,
      startTime: event.date || new Date().toISOString(),
      venue: competition.venue?.fullName || undefined,
    };
  });

  const hasLiveGames = games.some((g: any) => g.status === 'in_progress');

  return {
    week: data.week?.number || week || 1,
    season,
    games,
    hasLiveGames,
    meta: {
      dataSource: 'ESPN API',
      lastUpdated: new Date().toISOString(),
      timezone: 'America/Chicago',
    },
  };
}
