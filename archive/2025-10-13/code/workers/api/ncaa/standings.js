import { cache, createTimeoutSignal, err, ok, preflight } from '../_utils.js';

const BASE_URL = 'https://site.api.espn.com/apis/v2/sports/football/college-football/standings';
const RANKINGS_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/rankings';
const FETCH_TIMEOUT_MS = 8000;

const defaultHeaders = {
  'User-Agent': 'BlazeSportsIntel/1.0 (+https://blazesportsintel.com)',
  Accept: 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  Referer: 'https://blazesportsintel.com/',
};

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return preflight();
  }

  const url = new URL(request.url);
  const conference = sanitizeConference(url.searchParams.get('conference'));
  const division = sanitizeDivision(url.searchParams.get('division'));

  try {
    const data = await cache(
      env,
      `ncaa:standings:${conference}:${division}`,
      async () => fetchStandings(conference, division),
      300,
    );

    return ok(data, {
      headers: {
        'Cache-Control': 'public, max-age=120, s-maxage=300',
      },
    });
  } catch (error) {
    console.error('NCAA standings fetch error', error);
    return err(error);
  }
}

async function fetchStandings(conference, division) {
  const signal = createTimeoutSignal(FETCH_TIMEOUT_MS);
  const standingsUrl = conference === 'all' ? BASE_URL : `${BASE_URL}?group=${conference}`;
  const standings = await fetchJson(standingsUrl, signal, 'standings');

  const conferences = Array.isArray(standings?.children) ? standings.children : [];

  const standingsPayload = conferences
    .map((group) => buildConference(group, division))
    .filter(Boolean);

  return {
    standings: standingsPayload,
    rankings: {
      apTop25: await fetchRankings(`${RANKINGS_URL}`, signal),
      cfpRankings: await fetchRankings(`${RANKINGS_URL}?type=cfp`, signal),
    },
    meta: {
      dataSource: 'ESPN College Football API',
      lastUpdated: new Date().toISOString(),
    },
  };
}

async function fetchJson(url, signal, label) {
  const response = await fetch(url, { headers: defaultHeaders, signal });
  if (!response.ok) {
    throw new Error(`ESPN ${label} request failed with status ${response.status}`);
  }
  return response.json();
}

async function fetchRankings(url, signal) {
  try {
    const data = await fetchJson(url, signal, 'rankings');
    const ranks = Array.isArray(data?.rankings?.[0]?.ranks) ? data.rankings[0].ranks : [];
    return ranks.slice(0, 25).map((rank) => ({
      rank: rank?.current ?? null,
      team: {
        id: rank?.team?.id ?? null,
        name: rank?.team?.displayName ?? null,
        abbreviation: rank?.team?.abbreviation ?? null,
        logo: rank?.team?.logos?.[0]?.href ?? null,
      },
      record: rank?.record ?? null,
    }));
  } catch (error) {
    console.warn('Unable to fetch rankings', error);
    return [];
  }
}

function buildConference(group, divisionFilter) {
  if (!group || typeof group !== 'object') {
    return null;
  }

  const divisions = Array.isArray(group.children) ? group.children : [];

  return {
    name: group.name ?? null,
    abbreviation: group.abbreviation ?? null,
    divisions: divisions
      .filter((division) => !divisionFilter || matchesDivision(division, divisionFilter))
      .map((division) => ({
        name: division.name ?? null,
        teams: buildTeams(division?.standings?.entries),
      })),
  };
}

function buildTeams(entries) {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .filter((entry) => entry)
    .map((entry) => ({
      rank: getStat(entry, 'rank'),
      team: {
        id: entry.team?.id ?? null,
        name: entry.team?.displayName ?? null,
        abbreviation: entry.team?.abbreviation ?? null,
        logo: entry.team?.logos?.[0]?.href ?? null,
      },
      record: {
        overall: getDisplayStat(entry, 'overall'),
        conference: getDisplayStat(entry, 'vs. Conf.'),
        home: getDisplayStat(entry, 'home'),
        away: getDisplayStat(entry, 'road'),
      },
      stats: {
        wins: getStat(entry, 'wins'),
        losses: getStat(entry, 'losses'),
        winPercent: getStat(entry, 'winPercent'),
        gamesBack: getDisplayStat(entry, 'gamesBehind'),
        streak: getDisplayStat(entry, 'streak'),
        pointsFor: getStat(entry, 'pointsFor'),
        pointsAgainst: getStat(entry, 'pointsAgainst'),
      },
    }));
}

function getStat(entry, name) {
  const stats = Array.isArray(entry?.stats) ? entry.stats : [];
  const stat = stats.find((item) => item?.name === name);
  return stat?.value ?? null;
}

function getDisplayStat(entry, name) {
  const stats = Array.isArray(entry?.stats) ? entry.stats : [];
  const stat = stats.find((item) => item?.name === name);
  return stat?.displayValue ?? null;
}

function sanitizeConference(value) {
  if (!value || value === 'all') {
    return 'all';
  }

  return /^\d{1,4}$/.test(value) ? value : 'all';
}

function sanitizeDivision(value) {
  if (!value) {
    return '';
  }

  const normalized = value.trim().toLowerCase();
  return ['fbs', 'fcs', 'group of five', 'power five'].includes(normalized) ? normalized : '';
}

function matchesDivision(division, filter) {
  if (!filter) {
    return true;
  }

  const name = (division?.name || '').toLowerCase();
  return name.includes(filter);
}
