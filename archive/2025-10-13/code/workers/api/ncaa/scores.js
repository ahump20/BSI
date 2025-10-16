import { createTimeoutSignal, err, ok, preflight } from '../_utils.js';

const BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard';
const FETCH_TIMEOUT_MS = 6000;

const defaultHeaders = {
  'User-Agent': 'BlazeSportsIntel/1.0 (+https://blazesportsintel.com)',
  Accept: 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  Referer: 'https://blazesportsintel.com/',
};

export async function onRequest(context) {
  const { request, waitUntil } = context;

  if (request.method === 'OPTIONS') {
    return preflight();
  }

  const url = new URL(request.url);
  const week = sanitizeWeek(url.searchParams.get('week'));
  const conference = sanitizeConference(url.searchParams.get('conference'));

  try {
    const edgeCache = caches?.default;

    if (edgeCache) {
      const cachedResponse = await edgeCache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    const data = await fetchScores(week, conference);
    const response = ok(data, {
      headers: {
        'Cache-Control': buildCacheControlHeader(data.games),
      },
    });

    if (edgeCache && typeof waitUntil === 'function') {
      waitUntil(edgeCache.put(request, response.clone()));
    }

    return response;
  } catch (error) {
    console.error('NCAA scores fetch error', error);
    return err(error);
  }
}

async function fetchScores(week, conference) {
  const signal = createTimeoutSignal(FETCH_TIMEOUT_MS);
  const query = buildQueryString(week, conference);
  const response = await fetch(`${BASE_URL}${query}`, { headers: defaultHeaders, signal });

  if (!response.ok) {
    throw new Error(`ESPN scoreboard request failed with status ${response.status}`);
  }

  const data = await response.json();
  const events = Array.isArray(data?.events) ? data.events : [];

  return {
    week: data?.week?.number ?? week,
    season: data?.season?.year ?? null,
    games: events.map(formatEvent),
    meta: {
      dataSource: 'ESPN Live Scores',
      lastUpdated: new Date().toISOString(),
    },
  };
}

function formatEvent(event) {
  const competition = Array.isArray(event?.competitions) ? event.competitions[0] : null;
  const competitors = Array.isArray(competition?.competitors) ? competition.competitors : [];

  return {
    id: event?.id ?? null,
    name: event?.name ?? null,
    date: event?.date ?? null,
    status: buildStatus(event?.status),
    competition,
    teams: competitors.map((team) => ({
      id: team?.id ?? null,
      team: team?.team ?? null,
      homeAway: team?.homeAway ?? null,
      rank: team?.rank ?? null,
      score: team?.score ?? null,
      winner: Boolean(team?.winner),
      records: team?.records ?? [],
      statistics: team?.statistics ?? [],
      leaders: team?.leaders ?? [],
    })),
    odds: competition?.odds?.[0] ?? null,
    broadcast: Array.isArray(competition?.broadcasts)
      ? competition.broadcasts[0]
      : null,
    venue: competition?.venue ?? null,
    weather: event?.weather ?? null,
  };
}

function buildStatus(status) {
  if (!status || typeof status !== 'object') {
    return null;
  }

  return {
    type: status?.type?.name ?? null,
    completed: Boolean(status?.type?.completed),
    detail: status?.type?.detail ?? null,
    period: status?.period ?? null,
    clock: status?.displayClock ?? null,
  };
}

function buildCacheControlHeader(games) {
  const completed = Array.isArray(games)
    ? games.every((game) => game?.status?.completed)
    : false;

  const ttl = completed ? 300 : 30;
  return `public, max-age=${ttl}`;
}

function buildQueryString(week, conference) {
  const params = new URLSearchParams();
  if (week && week !== 'current') {
    params.set('week', week);
  }
  if (conference) {
    params.set('group', conference);
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

function sanitizeWeek(value) {
  if (!value || value === 'current') {
    return 'current';
  }

  const numeric = Number.parseInt(value, 10);
  return Number.isInteger(numeric) && numeric > 0 && numeric <= 20 ? numeric.toString() : 'current';
}

function sanitizeConference(value) {
  if (!value) {
    return '';
  }

  return /^\d{1,4}$/.test(value) ? value : '';
}

