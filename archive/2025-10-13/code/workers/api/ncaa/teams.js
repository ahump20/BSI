import { cache, createTimeoutSignal, err, ok, preflight } from '../_utils.js';

const DEFAULT_TEAM_ID = '251';
const DEFAULT_SEASON = new Date().getUTCFullYear().toString();
const FETCH_TIMEOUT_MS = 8000;
const BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football';

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
  const teamId = sanitizeTeamId(url.searchParams.get('teamId'));
  const season = sanitizeSeason(url.searchParams.get('season'));

  try {
    const ttl = env?.NODE_ENV === 'production' ? 300 : 60;
    const data = await cache(
      env,
      `ncaa:team:${teamId}:${season}`,
      async () => fetchTeamData(teamId, season),
      ttl,
    );

    return ok(data, {
      headers: {
        'Cache-Control': `public, max-age=${Math.min(ttl, 60)}, s-maxage=${ttl}`,
      },
    });
  } catch (error) {
    console.error('NCAA team fetch error', error);
    return err(error);
  }
}

async function fetchTeamData(teamId, season) {
  const signal = createTimeoutSignal(FETCH_TIMEOUT_MS);

  const [team, roster, schedule] = await Promise.all([
    fetchJson(`${BASE_URL}/teams/${teamId}`, signal, 'team'),
    fetchJson(`${BASE_URL}/teams/${teamId}/roster`, signal, 'roster'),
    fetchJson(`${BASE_URL}/teams/${teamId}/schedule?season=${season}`, signal, 'schedule'),
  ]);

  const stats = Array.isArray(team?.team?.statistics)
    ? team.team.statistics
    : Array.isArray(team?.team?.stats)
    ? team.team.stats
    : [];

  const recordItem = Array.isArray(team?.team?.record?.items)
    ? team.team.record.items[0]
    : null;

  const conference = Array.isArray(team?.team?.groups)
    ? sanitizeConference(team.team.groups[0])
    : null;

  const scheduleEvents = Array.isArray(schedule?.events) ? schedule.events : [];

  // Debug logging for troubleshooting

  return {
    team: {
      id: team?.team?.id ?? teamId,
      school: team?.team?.school ?? null,
      displayName: team?.team?.displayName ?? null,
      nickname: team?.team?.nickname ?? null,
      abbreviation: team?.team?.abbreviation ?? null,
      color: team?.team?.color ?? null,
      alternateColor: team?.team?.alternateColor ?? null,
      logos: sanitizeLogos(team?.team?.logos),
      venue: sanitizeVenue(team?.team?.venue),
      conference,
      record: buildRecord(recordItem),
    },
    roster: buildRoster(roster),
    schedule: scheduleEvents.map((event) => buildScheduleEvent(event, teamId)),
    analytics: {
      pythagoreanWins: calculatePythagorean(stats),
      strengthOfSchedule: calculateSOS(scheduleEvents, teamId),
      efficiency: calculateEfficiency(stats),
    },
    meta: {
      dataSource: 'ESPN College Football API',
      lastUpdated: new Date().toISOString(),
      season: schedule?.season?.year?.toString() || season,
    },
  };
}

async function fetchJson(url, signal, label) {
  const response = await fetch(url, {
    headers: defaultHeaders,
    signal,
  });

  if (!response.ok) {
    throw new Error(`ESPN ${label} request failed with status ${response.status}`);
  }

  return response.json();
}

function sanitizeTeamId(value) {
  if (!value) {
    return DEFAULT_TEAM_ID;
  }

  const normalized = value.trim();
  if (/^\d{1,6}$/.test(normalized)) {
    return normalized;
  }

  return DEFAULT_TEAM_ID;
}

function sanitizeSeason(value) {
  if (!value) {
    return DEFAULT_SEASON;
  }

  const normalized = Number.parseInt(value, 10);
  if (Number.isInteger(normalized) && normalized >= 2000 && normalized <= 2100) {
    return normalized.toString();
  }

  return DEFAULT_SEASON;
}

function sanitizeConference(group) {
  if (!group || typeof group !== 'object') {
    return null;
  }

  return {
    id: group.id ?? null,
    name: group.name ?? null,
    shortName: group.shortName ?? null,
    abbreviation: group.abbreviation ?? null,
  };
}

function sanitizeLogos(logos) {
  if (!Array.isArray(logos)) {
    return [];
  }

  return logos
    .filter((logo) => logo && typeof logo === 'object')
    .map((logo) => ({
      href: logo.href ?? null,
      width: logo.width ?? null,
      height: logo.height ?? null,
      alt: logo.alt ?? null,
    }));
}

function sanitizeVenue(venue) {
  if (!venue || typeof venue !== 'object') {
    return null;
  }

  return {
    id: venue.id ?? null,
    fullName: venue.fullName ?? null,
    address: venue.address ?? null,
    capacity: venue.capacity ?? null,
    indoor: venue.indoor ?? null,
  };
}

function buildRecord(record) {
  if (!record || typeof record !== 'object') {
    return {
      overall: '0-0',
      conference: '0-0',
      home: '0-0',
      away: '0-0',
    };
  }

  const stats = Array.isArray(record.stats) ? record.stats : [];

  return {
    overall: record.summary ?? '0-0',
    conference: getDisplayValue(stats, 'vsConf'),
    home: getDisplayValue(stats, 'home'),
    away: getDisplayValue(stats, 'away'),
  };
}

function getDisplayValue(stats, name) {
  const stat = stats.find((item) => item?.name === name);
  return stat?.displayValue ?? '0-0';
}

function buildRoster(roster) {
  const athletes = roster?.athletes;
  if (!Array.isArray(athletes)) {
    return [];
  }

  return athletes
    .filter((athlete) => athlete)
    .map((athlete) => ({
      id: athlete.id ?? null,
      name: athlete.fullName ?? null,
      jersey: athlete.jersey ?? null,
      position: athlete.position?.abbreviation ?? null,
      height: athlete.displayHeight ?? null,
      weight: athlete.displayWeight ?? null,
      year: athlete.experience?.displayValue ?? null,
    }));
}

function buildScheduleEvent(event, teamId) {
  const competition = Array.isArray(event?.competitions) ? event.competitions[0] : null;
  const opponents = Array.isArray(competition?.competitors) ? competition.competitors : [];
  const opponent = opponents.find((entry) => entry && entry.id !== teamId) ?? null;

  return {
    id: event?.id ?? null,
    date: event?.date ?? null,
    name: event?.name ?? null,
    week: event?.week?.number ?? null,
    venue: sanitizeVenue(competition?.venue),
    opponent: opponent
      ? {
          id: opponent.id ?? null,
          name: opponent.team?.displayName ?? null,
          abbreviation: opponent.team?.abbreviation ?? null,
          score: opponent.score ?? null,
          record: Array.isArray(opponent.records) ? opponent.records : [],
        }
      : null,
    result: competition?.status ?? null,
    broadcast: Array.isArray(competition?.broadcasts)
      ? sanitizeBroadcast(competition.broadcasts[0])
      : null,
  };
}

function sanitizeBroadcast(broadcast) {
  if (!broadcast || typeof broadcast !== 'object') {
    return null;
  }

  return {
    name: broadcast.names?.[0] ?? null,
    type: broadcast.type ?? null,
    channel: broadcast.media?.shortName ?? null,
  };
}

function calculatePythagorean(stats) {
  const pointsFor = getNumericStat(stats, 'pointsFor');
  const pointsAgainst = getNumericStat(stats, 'pointsAgainst');
  const games = getNumericStat(stats, 'gamesPlayed');

  if (pointsFor === 0 && pointsAgainst === 0) {
    return 0;
  }

  const exponent = 2.37;
  const numerator = Math.pow(pointsFor, exponent);
  const denominator = numerator + Math.pow(pointsAgainst, exponent);

  if (denominator === 0) {
    return 0;
  }

  return Number(((numerator / denominator) * games).toFixed(1));
}

function calculateSOS(scheduleEvents, teamId) {
  const completedGames = scheduleEvents.filter((game) =>
    Boolean(game?.competitions?.[0]?.status?.type?.completed),
  );

  if (completedGames.length === 0) {
    return 0;
  }

  const winPctSum = completedGames.reduce((total, game) => {
    const competition = game.competitions?.[0];
    const opponent = competition?.competitors?.find((comp) => comp.id !== teamId);
    const summary = opponent?.records?.[0]?.summary;
    if (!summary || typeof summary !== 'string') {
      return total;
    }

    const [wins, losses] = summary.split('-').map((value) => Number.parseInt(value, 10));
    if (!Number.isFinite(wins) || !Number.isFinite(losses) || wins + losses === 0) {
      return total;
    }

    return total + wins / (wins + losses);
  }, 0);

  return Number((winPctSum / completedGames.length).toFixed(3));
}

function calculateEfficiency(stats) {
  const yardsPerPlay = getNumericStat(stats, 'yardsPerPlay');
  const turnovers = getNumericStat(stats, 'turnovers');
  const games = Math.max(getNumericStat(stats, 'gamesPlayed'), 1);

  const efficiency = yardsPerPlay * 10 - (turnovers / games) * 5;
  return Number(efficiency.toFixed(1));
}

function getNumericStat(stats, name) {
  if (!Array.isArray(stats)) {
    return 0;
  }

  const match = stats.find((stat) => stat?.name === name);
  const value = typeof match?.value === 'number' ? match.value : Number(match?.value);
  return Number.isFinite(value) ? value : 0;
}
