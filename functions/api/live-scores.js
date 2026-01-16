/**
 * Cloudflare Pages Functions - Live Scores API
 * blazesportsintel.com
 *
 * Real-time sports scores and game data
 * Deep South Sports Authority
 */

import { validateRequest } from './_validation.js';
import { liveScoresQuerySchema } from './_schemas.js';
import { rateLimit, rateLimitError, corsHeaders } from './_utils.js';

const FETCH_TIMEOUT_MS = 8000;

const espnHeaders = {
  'User-Agent': 'BlazeSportsIntel/1.0 (+https://blazesportsintel.com)',
  Accept: 'application/json',
};

export async function onRequestGet({ request, env, ctx }) {
  // Handle OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting: 100 requests per minute per IP
  const limit = await rateLimit(env, request, 100, 60000);
  if (!limit.allowed) {
    return rateLimitError(limit.resetAt, limit.retryAfter);
  }

  const headers = {
    ...corsHeaders,
    'Cache-Control': 'public, max-age=60', // 1 minute cache for live data
  };

  // Validate request parameters using Zod
  const validation = await validateRequest(request, {
    query: liveScoresQuerySchema,
  });

  if (!validation.success) {
    return validation.errorResponse;
  }

  const { query } = validation.data;
  const sport = query.sport || 'all';
  const date = query.date || new Date().toISOString().split('T')[0];

  try {
    const scores = await getLiveScores(sport, date, env);
    return new Response(JSON.stringify(scores), { headers });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Live scores fetch error',
        message: error.message,
      }),
      {
        status: 500,
        headers,
      }
    );
  }
}

async function getLiveScores(sport, date, env) {
  const cacheKey = `live-scores-${sport}-${date}`;

  // Check KV cache for recent data
  if (env.CACHE) {
    const cached = await env.CACHE.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      // Return cached data if less than 1 minute old
      if (Date.now() - data.cached_at < 60000) {
        return data;
      }
    }
  }

  // Fetch live scores from real APIs
  const scores = {
    timestamp: new Date().toISOString(),
    date,
    cached_at: Date.now(),
    sports: {},
  };

  // Parallel fetch for all requested sports
  const fetchPromises = [];

  if (sport === 'all' || sport === 'mlb') {
    fetchPromises.push(
      fetchMLBScoreboard(date)
        .then((data) => {
          scores.sports.mlb = data;
        })
        .catch((error) => {
          scores.sports.mlb = {
            games: [],
            meta: {
              sport: 'baseball',
              league: 'MLB',
              dataSource: 'ESPN MLB API',
              lastUpdated: new Date().toISOString(),
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          };
        })
    );
  }

  if (sport === 'all' || sport === 'nfl') {
    fetchPromises.push(
      fetchNFLScoreboard(date)
        .then((data) => {
          scores.sports.nfl = data;
        })
        .catch((error) => {
          scores.sports.nfl = {
            games: [],
            meta: {
              sport: 'football',
              league: 'NFL',
              dataSource: 'ESPN NFL API',
              lastUpdated: new Date().toISOString(),
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          };
        })
    );
  }

  if (sport === 'all' || sport === 'nba') {
    fetchPromises.push(
      fetchNBAScoreboard(date)
        .then((data) => {
          scores.sports.nba = data;
        })
        .catch((error) => {
          scores.sports.nba = {
            games: [],
            meta: {
              sport: 'basketball',
              league: 'NBA',
              dataSource: 'ESPN NBA API',
              lastUpdated: new Date().toISOString(),
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          };
        })
    );
  }

  if (sport === 'all' || sport === 'ncaa') {
    fetchPromises.push(
      fetchNCAAFootballScoreboard(date)
        .then((data) => {
          scores.sports.ncaa = { football: data };
        })
        .catch((error) => {
          scores.sports.ncaa = {
            football: {
              games: [],
              meta: {
                sport: 'football',
                league: 'NCAA',
                dataSource: 'ESPN College Football API',
                lastUpdated: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error',
              },
            },
          };
        })
    );
  }

  if (sport === 'all' || sport === 'ncaa-baseball') {
    fetchPromises.push(
      fetchCollegeBaseballScoreboard(date)
        .then((data) => {
          scores.sports.ncaaBaseball = data;
        })
        .catch((error) => {
          scores.sports.ncaaBaseball = {
            games: [],
            meta: {
              sport: 'baseball',
              league: 'NCAA',
              dataSource: 'ESPN College Baseball API',
              lastUpdated: new Date().toISOString(),
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          };
        })
    );
  }

  // Wait for all fetches to complete
  await Promise.allSettled(fetchPromises);

  // Cache the results
  if (env.CACHE) {
    await env.CACHE.put(cacheKey, JSON.stringify(scores), {
      expirationTtl: 60, // 1 minute TTL
    });
  }

  return scores;
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

async function fetchCollegeBaseballScoreboard(date) {
  const sanitizedDate = date ? date.replace(/-/g, '') : '';
  const url = sanitizedDate
    ? `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard?dates=${sanitizedDate}`
    : 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard';

  const signal = getTimeoutSignal(FETCH_TIMEOUT_MS);
  const response = await fetch(url, { headers: espnHeaders, signal });

  if (!response.ok) {
    throw new Error(`ESPN college baseball scoreboard failed with status ${response.status}`);
  }

  const data = await response.json();
  const events = Array.isArray(data?.events) ? data.events : [];

  return {
    games: events.map(mapBaseballEvent),
    meta: {
      sport: 'baseball',
      league: 'NCAA',
      dataSource: 'ESPN College Baseball API',
      lastUpdated: new Date().toISOString(),
      date: date || null,
    },
  };
}

/**
 * Fetch MLB scores from ESPN API
 */
async function fetchMLBScoreboard(date) {
  const sanitizedDate = date ? date.replace(/-/g, '') : '';
  const url = sanitizedDate
    ? `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard?dates=${sanitizedDate}`
    : 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard';

  const signal = getTimeoutSignal(FETCH_TIMEOUT_MS);
  const response = await fetch(url, { headers: espnHeaders, signal });

  if (!response.ok) {
    throw new Error(`ESPN MLB scoreboard failed with status ${response.status}`);
  }

  const data = await response.json();
  const events = Array.isArray(data?.events) ? data.events : [];

  return {
    games: events.map(mapBaseballEvent),
    meta: {
      sport: 'baseball',
      league: 'MLB',
      dataSource: 'ESPN MLB API',
      lastUpdated: new Date().toISOString(),
      date: date || null,
    },
  };
}

/**
 * Fetch NFL scores from ESPN API
 */
async function fetchNFLScoreboard(date) {
  const sanitizedDate = date ? date.replace(/-/g, '') : '';
  const url = sanitizedDate
    ? `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${sanitizedDate}`
    : 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';

  const signal = getTimeoutSignal(FETCH_TIMEOUT_MS);
  const response = await fetch(url, { headers: espnHeaders, signal });

  if (!response.ok) {
    throw new Error(`ESPN NFL scoreboard failed with status ${response.status}`);
  }

  const data = await response.json();
  const events = Array.isArray(data?.events) ? data.events : [];
  const week = data?.week?.number ?? null;

  return {
    week,
    games: events.map(mapFootballEvent),
    meta: {
      sport: 'football',
      league: 'NFL',
      dataSource: 'ESPN NFL API',
      lastUpdated: new Date().toISOString(),
      date: date || null,
    },
  };
}

/**
 * Fetch NBA scores from ESPN API
 */
async function fetchNBAScoreboard(date) {
  const sanitizedDate = date ? date.replace(/-/g, '') : '';
  const url = sanitizedDate
    ? `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${sanitizedDate}`
    : 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';

  const signal = getTimeoutSignal(FETCH_TIMEOUT_MS);
  const response = await fetch(url, { headers: espnHeaders, signal });

  if (!response.ok) {
    throw new Error(`ESPN NBA scoreboard failed with status ${response.status}`);
  }

  const data = await response.json();
  const events = Array.isArray(data?.events) ? data.events : [];

  return {
    games: events.map(mapBasketballEvent),
    meta: {
      sport: 'basketball',
      league: 'NBA',
      dataSource: 'ESPN NBA API',
      lastUpdated: new Date().toISOString(),
      date: date || null,
    },
  };
}

/**
 * Fetch NCAA Football scores from ESPN API
 */
async function fetchNCAAFootballScoreboard(date) {
  const sanitizedDate = date ? date.replace(/-/g, '') : '';
  const url = sanitizedDate
    ? `https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?dates=${sanitizedDate}&groups=80`
    : 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?groups=80';

  const signal = getTimeoutSignal(FETCH_TIMEOUT_MS);
  const response = await fetch(url, { headers: espnHeaders, signal });

  if (!response.ok) {
    throw new Error(`ESPN College Football scoreboard failed with status ${response.status}`);
  }

  const data = await response.json();
  const events = Array.isArray(data?.events) ? data.events : [];
  const week = data?.week?.number ?? null;

  return {
    week,
    games: events.map(mapFootballEvent),
    meta: {
      sport: 'football',
      league: 'NCAA',
      dataSource: 'ESPN College Football API',
      lastUpdated: new Date().toISOString(),
      date: date || null,
    },
  };
}

function mapBaseballEvent(event) {
  const competition = Array.isArray(event?.competitions) ? event.competitions[0] : null;
  const competitors = Array.isArray(competition?.competitors) ? competition.competitors : [];
  const status = competition?.status ?? event?.status ?? {};

  return {
    id: event?.id ?? null,
    name: event?.name ?? null,
    startTime: event?.date ?? null,
    status: {
      type: status?.type?.name ?? null,
      description: status?.type?.detail ?? status?.type?.description ?? null,
      shortDetail: status?.type?.shortDetail ?? null,
      completed: Boolean(status?.type?.completed),
      inning: status?.period ?? null,
      inningState: status?.type?.state ?? null,
      balls: status?.balls ?? null,
      strikes: status?.strikes ?? null,
      outs: status?.outs ?? null,
    },
    competitors: competitors.map((team) => ({
      id: team?.id ?? null,
      order: team?.order ?? null,
      homeAway: team?.homeAway ?? null,
      score: team?.score ?? null,
      winner: Boolean(team?.winner),
      team: {
        id: team?.team?.id ?? null,
        name: team?.team?.displayName ?? null,
        abbreviation: team?.team?.abbreviation ?? null,
        logo: team?.team?.logos?.[0]?.href ?? null,
      },
      records: team?.records ?? [],
    })),
    venue: competition?.venue ?? null,
    broadcasts: competition?.broadcasts ?? [],
    links: event?.links ?? [],
  };
}

function mapFootballEvent(event) {
  const competition = Array.isArray(event?.competitions) ? event.competitions[0] : null;
  const competitors = Array.isArray(competition?.competitors) ? competition.competitors : [];
  const status = competition?.status ?? event?.status ?? {};
  const situation = competition?.situation ?? {};

  return {
    id: event?.id ?? null,
    name: event?.name ?? null,
    startTime: event?.date ?? null,
    status: {
      type: status?.type?.name ?? null,
      description: status?.type?.detail ?? status?.type?.description ?? null,
      shortDetail: status?.type?.shortDetail ?? null,
      completed: Boolean(status?.type?.completed),
      quarter: status?.period ?? null,
      clock: status?.displayClock ?? null,
      down: situation?.down ?? null,
      distance: situation?.distance ?? null,
      yardLine: situation?.yardLine ?? null,
      possession: situation?.possession ?? null,
      isRedZone: Boolean(situation?.isRedZone),
    },
    competitors: competitors.map((team) => ({
      id: team?.id ?? null,
      order: team?.order ?? null,
      homeAway: team?.homeAway ?? null,
      score: team?.score ?? null,
      winner: Boolean(team?.winner),
      team: {
        id: team?.team?.id ?? null,
        name: team?.team?.displayName ?? null,
        abbreviation: team?.team?.abbreviation ?? null,
        logo: team?.team?.logos?.[0]?.href ?? null,
        rank: team?.curatedRank?.current ?? null,
      },
      records: team?.records ?? [],
      linescores: team?.linescores ?? [],
    })),
    venue: competition?.venue ?? null,
    broadcasts: competition?.broadcasts ?? [],
    odds: competition?.odds?.[0] ?? null,
    links: event?.links ?? [],
  };
}

function mapBasketballEvent(event) {
  const competition = Array.isArray(event?.competitions) ? event.competitions[0] : null;
  const competitors = Array.isArray(competition?.competitors) ? competition.competitors : [];
  const status = competition?.status ?? event?.status ?? {};

  return {
    id: event?.id ?? null,
    name: event?.name ?? null,
    startTime: event?.date ?? null,
    status: {
      type: status?.type?.name ?? null,
      description: status?.type?.detail ?? status?.type?.description ?? null,
      shortDetail: status?.type?.shortDetail ?? null,
      completed: Boolean(status?.type?.completed),
      period: status?.period ?? null,
      clock: status?.displayClock ?? null,
    },
    competitors: competitors.map((team) => ({
      id: team?.id ?? null,
      order: team?.order ?? null,
      homeAway: team?.homeAway ?? null,
      score: team?.score ?? null,
      winner: Boolean(team?.winner),
      team: {
        id: team?.team?.id ?? null,
        name: team?.team?.displayName ?? null,
        abbreviation: team?.team?.abbreviation ?? null,
        logo: team?.team?.logos?.[0]?.href ?? null,
      },
      records: team?.records ?? [],
      linescores: team?.linescores ?? [],
    })),
    venue: competition?.venue ?? null,
    broadcasts: competition?.broadcasts ?? [],
    odds: competition?.odds?.[0] ?? null,
    links: event?.links ?? [],
  };
}

function getTimeoutSignal(timeoutMs) {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(timeoutMs);
  }

  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs).unref?.();
  return controller.signal;
}
