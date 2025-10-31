/**
 * College Baseball API Client
 * Wraps the edge API routes exposed under /api/college-baseball/* so the
 * front-end stays decoupled from upstream providers and always benefits from
 * caching + failover handled server-side.
 */

const DEFAULT_HEADERS = {
  'Accept': 'application/json'
};

async function handleResponse(response) {
  if (!response.ok) {
    const body = await safeJson(response);
    const error = new Error(body?.message || `Request failed with ${response.status}`);
    error.status = response.status;
    error.details = body;
    throw error;
  }

  return response.json();
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}

export async function fetchLiveGames({ date, conference, status, team } = {}) {
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  if (conference) params.set('conference', conference);
  if (status) params.set('status', status);
  if (team) params.set('team', team);

  const url = `/api/college-baseball/games${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url, { headers: DEFAULT_HEADERS });
  const payload = await handleResponse(response);

  return {
    games: payload.data ?? [],
    meta: {
      cached: payload.cached ?? false,
      timestamp: payload.timestamp ?? payload.cacheTime ?? new Date().toISOString(),
      source: payload.source ?? 'edge'
    }
  };
}

export async function fetchConferenceStandings({ conference = 'SEC', division = 'D1' } = {}) {
  const params = new URLSearchParams({ conference, division });
  const response = await fetch(`/api/college-baseball/standings?${params.toString()}`, {
    headers: DEFAULT_HEADERS
  });
  const payload = await handleResponse(response);

  return {
    standings: payload.data ?? [],
    conference: payload.conference ?? conference,
    division: payload.division ?? division,
    meta: {
      cached: payload.cached ?? false,
      timestamp: payload.timestamp ?? payload.cacheTime ?? new Date().toISOString()
    }
  };
}

export async function fetchHistoricalOverview({ season } = {}) {
  const params = new URLSearchParams();
  if (season) params.set('season', season.toString());

  const url = `/api/college-baseball/stats-historical${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url, { headers: DEFAULT_HEADERS });
  const payload = await handleResponse(response);

  return {
    season: payload.season,
    topTeams: payload.topTeams ?? [],
    battingLeaders: payload.battingLeaders ?? [],
    meta: {
      timestamp: payload.timestamp ?? new Date().toISOString(),
      source: payload.dataSource ?? 'D1 Historical Database'
    }
  };
}

export async function fetchDiamondInsightsSnapshot() {
  const response = await fetch('/api/analytics/diamond-insights', {
    headers: DEFAULT_HEADERS
  });

  if (response.status === 404) {
    return null; // Optional feature
  }

  const payload = await handleResponse(response);
  return payload;
}

export async function fetchTeamLeaders({ teamId, season }) {
  const params = new URLSearchParams();
  if (teamId) params.set('team', teamId);
  if (season) params.set('season', season.toString());

  const url = `/api/college-baseball/stats-historical?${params.toString()}`;
  const response = await fetch(url, { headers: DEFAULT_HEADERS });
  const payload = await handleResponse(response);

  return payload;
}

export async function fetchRecentGames({ teamId, limit = 6 } = {}) {
  if (!teamId) {
    return [];
  }

  const params = new URLSearchParams({ team: teamId, season: new Date().getFullYear().toString() });
  const response = await fetch(`/api/college-baseball/stats-historical?${params.toString()}`, {
    headers: DEFAULT_HEADERS
  });
  const payload = await handleResponse(response);

  const games = payload.recentGames ?? [];
  return games.slice(0, limit);
}
