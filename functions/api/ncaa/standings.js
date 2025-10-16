import { cache, createTimeoutSignal, err, ok, preflight } from '../_utils.js';

const SPORT_PATHS = {
  football: {
    standings: 'https://site.api.espn.com/apis/v2/sports/football/college-football/standings',
    rankings: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/rankings',
  },
  baseball: {
    standings: 'https://site.api.espn.com/apis/v2/sports/baseball/college-baseball/standings',
    rankings: 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/rankings',
  },
};

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
  const sportResult = resolveSport(url.searchParams.get('sport'));

  if (sportResult.error) {
    return err(new Error(sportResult.error), 400);
  }

  const { sport, endpoints } = sportResult;

  try {
    const data = await cache(
      env,
      `ncaa:standings:${sport}:${conference}:${division}`,
      async () => fetchStandings(conference, division, sport, endpoints),
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

async function fetchStandings(conference, division, sport, endpoints) {
  const signal = createTimeoutSignal(FETCH_TIMEOUT_MS);
  const standingsBase = endpoints.standings;
  const standingsUrl = conference === 'all' ? standingsBase : `${standingsBase}?group=${conference}`;
  const standings = await fetchJson(standingsUrl, signal, 'standings');

  const conferences = Array.isArray(standings?.children) ? standings.children : [];

  const standingsPayload = conferences
    .map((group) => buildConference(group, division))
    .filter(Boolean);

  return {
    standings: standingsPayload,
    rankings: {
      apTop25: await fetchRankings(endpoints.rankings, signal),
      cfpRankings:
        sport === 'football'
          ? await fetchRankings(`${endpoints.rankings}?type=cfp`, signal)
          : [],
    },
    meta: {
      sport,
      dataSource:
        sport === 'baseball'
          ? 'ESPN College Baseball API'
          : 'ESPN College Football API',
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
        overall: getDisplayStat(entry, ['overall']),
        conference: getDisplayStat(entry, ['vs. Conf.', 'vsConf']),
        home: getDisplayStat(entry, ['home']),
        away: getDisplayStat(entry, ['road', 'away']),
        neutral: getDisplayStat(entry, ['neutral', 'vsNeutral']),
      },
      stats: {
        wins: getStat(entry, 'wins'),
        losses: getStat(entry, 'losses'),
        winPercent: getStat(entry, 'winPercent'),
        gamesBack: getDisplayStat(entry, ['gamesBehind', 'gamesBack']),
        streak: getDisplayStat(entry, ['streak']),
        pointsFor: getStat(entry, 'pointsFor', 'runsFor', 'runsScored'),
        pointsAgainst: getStat(entry, 'pointsAgainst', 'runsAgainst', 'runsAllowed'),
      },
    }));
}

function getStat(entry, ...names) {
  const stats = Array.isArray(entry?.stats) ? entry.stats : [];
  for (const name of names) {
    const stat = stats.find((item) => item?.name === name);
    if (stat && stat.value !== undefined) {
      return stat.value;
    }
  }
  return null;
}

function getDisplayStat(entry, names) {
  const stats = Array.isArray(entry?.stats) ? entry.stats : [];
  const nameList = Array.isArray(names) ? names : [names];
  for (const name of nameList) {
    const stat = stats.find((item) => item?.name === name);
    if (stat?.displayValue) {
      return stat.displayValue;
    }
  }
  return null;
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

function resolveSport(rawSport) {
  const normalized = (rawSport || 'football').toLowerCase();
  if (Object.prototype.hasOwnProperty.call(SPORT_PATHS, normalized)) {
    return { sport: normalized, endpoints: SPORT_PATHS[normalized] };
  }

  return {
    error: 'Unsupported sport parameter. Supported values are football and baseball.',
  };
}
