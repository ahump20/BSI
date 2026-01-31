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

/**
 * Get the current NFL season year.
 * NFL season starts in September and ends in February.
 * So in Jan-Aug, we use previous year's season.
 */
function getCurrentNFLSeason(): number {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const year = now.getFullYear();
  return month < 8 ? year - 1 : year;
}

/**
 * Determine if we're in postseason (Jan-Feb) or regular season (Sept-Dec).
 * Returns the appropriate ESPN seasontype: 2 = regular, 3 = postseason
 */
function getCurrentSeasonType(): number {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  // Jan-Feb is postseason (month 0-1), Sept-Dec is regular season
  return month <= 1 ? 3 : 2;
}

export const onRequest: PagesFunction<Env> = async ({ request }) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(request.url);
  const seasonParam = url.searchParams.get('season');
  const weekParam = url.searchParams.get('week');

  // NFL season runs Sept-Feb, so in Jan-Aug use previous year
  const season = seasonParam ? parseInt(seasonParam) : getCurrentNFLSeason();
  const week = weekParam ? parseInt(weekParam) : undefined;

  // Validate week (1-18 regular season, 19-22 playoffs)
  if (week !== undefined && (week < 1 || week > 22)) {
    return badRequest(`Invalid week: ${week}. Week must be between 1 and 22.`);
  }

  try {
    const data = await fetchESPNScores(season, week, seasonParam !== null);

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

interface TeamData {
  id: string;
  name: string;
  abbreviation: string;
  score: number | null;
  record: string;
}

interface GameData {
  id: string;
  date: string;
  time: string;
  week: number;
  season: number;
  status: 'scheduled' | 'live' | 'final' | 'postponed';
  quarter?: number;
  timeRemaining?: string;
  possession?: 'home' | 'away';
  homeTeam: TeamData;
  awayTeam: TeamData;
  venue: string;
  broadcast?: string;
}

interface ScoreData {
  week: number;
  season: number;
  games: GameData[];
  hasLiveGames: boolean;
  meta: {
    dataSource: string;
    lastUpdated: string;
    timezone: string;
  };
}

async function fetchESPNScores(
  season: number,
  week?: number,
  explicitSeason?: boolean
): Promise<ScoreData> {
  const headers = {
    'User-Agent': 'BlazeSportsIntel/1.0 (https://blazesportsintel.com)',
    Accept: 'application/json',
  };

  // ESPN uses seasontype=2 for regular season (weeks 1-18)
  // and seasontype=3 for postseason (ESPN weeks 1-4 = WC/DIV/CONF/SB)
  let espnSeasonType: number;
  let espnWeek: number | undefined;

  if (week && week > 18) {
    // Playoff weeks: our 19-22 maps to ESPN postseason weeks 1-4
    espnSeasonType = 3;
    espnWeek = week - 18;
  } else if (week) {
    espnSeasonType = 2;
    espnWeek = week;
  } else {
    // No week specified: use current season type
    espnSeasonType = getCurrentSeasonType();
  }

  let url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=${espnSeasonType}`;

  if (explicitSeason) {
    url += `&season=${season}`;
  }

  if (espnWeek) {
    url += `&week=${espnWeek}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`ESPN API returned ${response.status}`);
  }

  const data = await response.json();
  const events = data.events || [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const games: GameData[] = events.map((event: any) => {
    const competition = event.competitions?.[0] || {};
    const competitors = competition.competitors || [];
    const status_obj = competition.status || event.status || {};
    const homeTeam = competitors.find((c: any) => c.homeAway === 'home');
    const awayTeam = competitors.find((c: any) => c.homeAway === 'away');

    // Map ESPN status to frontend status enum
    const espnStatus = status_obj?.type?.name || 'STATUS_SCHEDULED';
    let status: 'scheduled' | 'live' | 'final' | 'postponed' = 'scheduled';

    if (espnStatus === 'STATUS_FINAL' || espnStatus === 'STATUS_FINAL_OVERTIME') {
      status = 'final';
    } else if (
      espnStatus === 'STATUS_IN_PROGRESS' ||
      espnStatus === 'STATUS_HALFTIME' ||
      espnStatus === 'STATUS_END_PERIOD'
    ) {
      status = 'live';
    } else if (espnStatus === 'STATUS_POSTPONED' || espnStatus === 'STATUS_CANCELED') {
      status = 'postponed';
    }

    const gameTime = new Date(event.date || Date.now()).toLocaleTimeString('en-US', {
      timeZone: 'America/Chicago',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    // Determine possession from situation data
    let possession: 'home' | 'away' | undefined;
    if (competition.situation?.possession) {
      const possTeamId = competition.situation.possession;
      if (possTeamId === homeTeam?.id || possTeamId === homeTeam?.team?.id) {
        possession = 'home';
      } else {
        possession = 'away';
      }
    }

    return {
      id: event.id || '0',
      date: event.date || new Date().toISOString(),
      time: gameTime,
      week: (data.week as { number?: number })?.number || week || 1,
      season,
      status,
      quarter: status_obj?.period,
      timeRemaining: status_obj?.displayClock,
      possession,
      homeTeam: {
        id: homeTeam?.team?.id || homeTeam?.id || '0',
        name: homeTeam?.team?.displayName || homeTeam?.team?.name || 'Unknown',
        abbreviation: homeTeam?.team?.abbreviation || '',
        score: homeTeam?.score ? parseInt(homeTeam.score) : null,
        record: homeTeam?.records?.[0]?.summary || '0-0',
      },
      awayTeam: {
        id: awayTeam?.team?.id || awayTeam?.id || '0',
        name: awayTeam?.team?.displayName || awayTeam?.team?.name || 'Unknown',
        abbreviation: awayTeam?.team?.abbreviation || '',
        score: awayTeam?.score ? parseInt(awayTeam.score) : null,
        record: awayTeam?.records?.[0]?.summary || '0-0',
      },
      venue: competition.venue?.fullName || 'TBD',
      broadcast: competition.broadcasts?.[0]?.names?.join(', '),
    };
  });

  const hasLiveGames = games.some((g) => g.status === 'live');

  return {
    week: (data.week as { number?: number })?.number || week || 1,
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
