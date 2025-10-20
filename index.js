// Cloudflare Worker - Backend API for College Baseball Tracker

import { mockLiveGames, mockStandings } from './mockData';

const ESPN_SCOREBOARD_URL =
  'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard';
const ESPN_SUMMARY_URL =
  'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/summary';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route: Get live games
      if (path === '/api/games/live') {
        const games = await fetchLiveGames(env);
        return jsonResponse({ games }, corsHeaders);
      }

      if (path === '/api/billing/entitlements') {
        const userId =
          request.headers.get('x-user-id') ||
          url.searchParams.get('userId') ||
          'anonymous';
        const entitlements = await fetchStripeEntitlements(userId, env);
        return jsonResponse(entitlements, corsHeaders);
      }

      // Route: Get box score for a specific game
      if (path.match(/^\/api\/games\/[^/]+\/boxscore$/)) {
        const gameId = path.split('/')[3];
        const boxScore = await fetchBoxScore(gameId, env);
        return jsonResponse(boxScore, corsHeaders);
      }

      // Route: Get conference standings
      if (path.match(/^\/api\/standings\/[^/]+$/)) {
        const conference = path.split('/')[3];
        const standings = await fetchStandings(conference, env);
        return jsonResponse(standings, corsHeaders);
      }

      return new Response('Not Found', { status: 404 });

    } catch (error) {
      console.error('API Error:', error);
      return jsonResponse(
        { error: error.message },
        corsHeaders,
        500
      );
    }
  },
};

function jsonResponse(data, headers = {}, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

// Fetch live games from NCAA or D1Baseball
async function fetchLiveGames(env) {
  const cacheKey = 'live-games';
  const cached = await readJsonFromKV(env.KV, cacheKey);
  if (cached) {
    return cached;
  }

  let games = [];

  try {
    const response = await fetchWithTimeout(ESPN_SCOREBOARD_URL, {
      headers: {
        'User-Agent':
          'DiamondInsights/1.0 (+https://github.com/ahump20/BSI; college-baseball-live)',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`ESPN scoreboard request failed: ${response.status}`);
    }

    const payload = await response.json();
    const events = Array.isArray(payload?.events) ? payload.events : [];
    games = events
      .map((event) => transformEspnEvent(event))
      .filter(Boolean);
  } catch (error) {
    console.error('Failed to load live games from ESPN. Falling back to mock data.', error);
    games = mockLiveGames;
  }

  const sorted = sortGames(games);

  await writeJsonToKV(env.KV, cacheKey, sorted, 30);

  return sorted;
}

// Fetch detailed box score for a game
async function fetchBoxScore(gameId, env) {
  const cacheKey = `boxscore-${gameId}`;
  const cached = await readJsonFromKV(env.KV, cacheKey);
  if (cached) {
    return cached;
  }

  let boxScore;

  try {
    const summaryUrl = `${ESPN_SUMMARY_URL}?event=${encodeURIComponent(gameId)}`;
    const response = await fetchWithTimeout(summaryUrl, {
      headers: {
        'User-Agent':
          'DiamondInsights/1.0 (+https://github.com/ahump20/BSI; college-baseball-live)',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`ESPN summary request failed: ${response.status}`);
    }

    const payload = await response.json();
    boxScore = transformEspnBoxScore(payload, gameId);

    if (!boxScore) {
      throw new Error('Unable to transform ESPN summary payload');
    }
  } catch (error) {
    console.error(
      `Failed to load box score for ${gameId} from ESPN. Falling back to blank template.`,
      error,
    );
    boxScore = createFallbackBoxScore(gameId);
  }

  const enriched = await enrichBoxScoreWithAdvanced(boxScore, env);

  await writeJsonToKV(env.KV, cacheKey, enriched, 15);

  return enriched;
}

// Fetch conference standings
async function fetchStandings(conference, env) {
  // TODO: Implement actual data fetching
  // Would aggregate from:
  // - Conference websites
  // - Warren Nolan RPI data
  // - Boyd's World statistics
  // - NCAA official standings
  
  const cached = await env.KV?.get(`standings-${conference}`, 'json');
  if (cached) return cached;

  const standings = mockStandings;
  
  await env.KV?.put(`standings-${conference}`, JSON.stringify(standings), {
    expirationTtl: 300, // Cache for 5 minutes
  });

  return standings;
}

// Helper function to scrape NCAA.com (example)
async function scrapeNCAAScoreboard() {
  // Example implementation
  const response = await fetch('https://www.ncaa.com/scoreboard/baseball/d1');
  const html = await response.text();
  
  // Parse HTML to extract:
  // - Game scores
  // - Current inning/status
  // - Team records
  // - Venue information
  
  return []; // Return parsed games
}

// Helper function to scrape D1Baseball scores
async function scrapeD1Baseball() {
  const response = await fetch('https://d1baseball.com/scores/');
  const html = await response.text();

  // Parse live scores and game details

  return [];
}

async function enrichBoxScoreWithAdvanced(boxScore, env) {
  const clone = typeof structuredClone === 'function'
    ? structuredClone(boxScore)
    : JSON.parse(JSON.stringify(boxScore));

  if (!clone.advanced) {
    return clone;
  }

  if (Array.isArray(clone.advanced.media)) {
    const signedMedia = [];
    for (const mediaItem of clone.advanced.media) {
      const signedUrl = await signMediaUrl(mediaItem.assetUrl, env);
      signedMedia.push({
        ...mediaItem,
        signedUrl,
        expiresAt: Math.floor(Date.now() / 1000) + 300,
      });
    }
    clone.advanced.media = signedMedia;
  }

  clone.advanced.generatedAt = new Date().toISOString();

  return clone;
}

async function signMediaUrl(url, env, ttlSeconds = 300) {
  if (!url) return url;

  const secret = env.MEDIA_SIGNING_SECRET || 'dev-diamond-insights-secret';
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${url}:${expires}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signature = signatureArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}expires=${expires}&sig=${signature}`;
}

async function fetchWithTimeout(resource, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

async function readJsonFromKV(kv, key) {
  if (!kv) return null;

  try {
    const value = await kv.get(key);
    if (!value) return null;
    return JSON.parse(value);
  } catch (error) {
    console.error(`KV read failure for key ${key}`, error);
    return null;
  }
}

async function writeJsonToKV(kv, key, value, ttl) {
  if (!kv) return;

  try {
    await kv.put(key, JSON.stringify(value), {
      expirationTtl: ttl,
    });
  } catch (error) {
    console.error(`KV write failure for key ${key}`, error);
  }
}

function transformEspnEvent(event) {
  const competition = event?.competitions?.[0];
  if (!competition) return null;

  const statusType = competition.status?.type || {};
  const status = normalizeStatus(statusType);
  const statusText = deriveStatusText(statusType);
  const inning = deriveInning(statusType, competition.status?.period);
  const venue = formatVenue(competition.venue);
  const situation = formatSituation(competition.situation);
  const awayTeam = formatCompetitor(competition.competitors, 'away');
  const homeTeam = formatCompetitor(competition.competitors, 'home');

  if (!awayTeam || !homeTeam) {
    return null;
  }

  return {
    id: String(event.id),
    status,
    statusText,
    date: event.date,
    scheduledTime: formatScheduledTime(event.date),
    venue,
    inning,
    situation,
    awayTeam,
    homeTeam,
    currentPitcher: formatPitcher(competition.situation?.currentPitcher),
    currentBatter: formatBatter(competition.situation?.currentBatter),
    lastPlay: competition.situation?.lastPlay?.text || null,
    updatedAt: new Date().toISOString(),
  };
}

function normalizeStatus(statusType) {
  if (!statusType) return 'scheduled';
  if (statusType.completed || statusType.state === 'post') return 'final';
  if (statusType.state === 'in') return 'live';
  if (statusType.name === 'STATUS_DELAYED') return 'delayed';
  return 'scheduled';
}

function deriveStatusText(statusType) {
  if (!statusType) return 'Scheduled';
  return (
    statusType.detail ||
    statusType.description ||
    statusType.shortDetail ||
    statusType.state ||
    'Scheduled'
  );
}

function deriveInning(statusType, period) {
  if (!statusType) return null;
  const detail = statusType.detail || statusType.shortDetail;
  if (!detail) {
    if (typeof period === 'number' && period > 0) {
      return { number: period, half: null };
    }
    return null;
  }

  const match = detail.match(/(Top|Bottom|Mid|End)\s+(\d+)/i);
  if (!match) {
    if (typeof period === 'number' && period > 0) {
      return { number: period, half: null };
    }
    return null;
  }

  return {
    number: Number.parseInt(match[2], 10),
    half:
      match[1].toLowerCase() === 'top'
        ? 'Top'
        : match[1].toLowerCase() === 'bottom'
          ? 'Bottom'
          : match[1],
  };
}

function formatVenue(venue) {
  if (!venue) return null;
  const parts = [venue.fullName, venue.address?.city, venue.address?.state];
  const filtered = parts.filter(Boolean);
  return filtered.length ? filtered.join(' • ') : null;
}

function formatCompetitor(competitors = [], homeAway) {
  const competitor = competitors.find((team) => team.homeAway === homeAway);
  if (!competitor?.team) return null;

  const totalRecord = competitor.records?.find((record) => record.type === 'total');
  const conferenceRecord = competitor.records?.find(
    (record) => record.type === 'conference' || record.name === 'conference'
  );

  const recordSummary = [totalRecord?.summary, conferenceRecord?.summary]
    .filter(Boolean)
    .join(', ');

  return {
    id: String(competitor.team.id || competitor.id || ''),
    name: competitor.team.displayName || competitor.team.name,
    abbreviation: competitor.team.abbreviation || competitor.team.shortDisplayName,
    conference: competitor.team.conference?.name || null,
    record: recordSummary || totalRecord?.summary || null,
    score: Number.parseInt(competitor.score ?? '0', 10),
    ranking:
      competitor.curatedRank?.current ??
      competitor.rank ??
      (competitor.records?.find((record) => record.type === 'ranking')?.value ?? null),
  };
}

function formatSituation(situation) {
  if (!situation) return null;

  const runners = describeRunners(situation);

  return {
    outs: typeof situation.outs === 'number' ? situation.outs : null,
    balls: typeof situation.balls === 'number' ? situation.balls : null,
    strikes: typeof situation.strikes === 'number' ? situation.strikes : null,
    runners,
  };
}

function describeRunners(situation) {
  const bases = [];
  if (situation.onFirst) bases.push('1st');
  if (situation.onSecond) bases.push('2nd');
  if (situation.onThird) bases.push('3rd');

  if (bases.length === 0) return 'Bases empty';
  if (bases.length === 3) return 'Bases loaded';
  if (bases.length === 1) return `Runner on ${bases[0]}`;
  return `Runners on ${bases.join(' & ')}`;
}

function formatPitcher(slot) {
  if (!slot?.athlete) return null;

  const statMap = normalizeStats(slot.statistics);

  return {
    name: slot.athlete.displayName,
    number: slot.athlete.jersey ? Number.parseInt(slot.athlete.jersey, 10) : null,
    pitches: slot.pitchCount ?? (statMap.pitchcount ? Number(statMap.pitchcount) : null),
    era: statMap.era || null,
  };
}

function formatBatter(slot) {
  if (!slot?.athlete) return null;

  const statMap = normalizeStats(slot.statistics);

  return {
    name: slot.athlete.displayName,
    number: slot.athlete.jersey ? Number.parseInt(slot.athlete.jersey, 10) : null,
    avg: statMap.avg || statMap.battingaverage || null,
  };
}

function normalizeStats(statistics = []) {
  return statistics.reduce((acc, stat) => {
    if (!stat || !stat.name) return acc;
    const key = String(stat.name).toLowerCase();
    acc[key] = stat.displayValue ?? stat.value ?? null;
    return acc;
  }, {});
}

function sortGames(games) {
  const order = {
    live: 0,
    delayed: 1,
    scheduled: 2,
    final: 3,
  };

  return [...games].sort((a, b) => {
    const statusDiff = (order[a.status] ?? 99) - (order[b.status] ?? 99);
    if (statusDiff !== 0) return statusDiff;

    const aDate = new Date(a.date).getTime();
    const bDate = new Date(b.date).getTime();
    return aDate - bDate;
  });
}

function transformEspnBoxScore(payload, gameId) {
  const boxscore = payload?.boxscore;
  if (!boxscore) {
    return createFallbackBoxScore(gameId);
  }

  const teams = boxscore.teams || [];
  const [awayTeamData, homeTeamData] = teams;

  const lineScore = buildLineScore(awayTeamData, homeTeamData);
  const batting = buildBattingSplits(payload?.players, awayTeamData, homeTeamData);
  const pitching = buildPitchingSplits(payload?.players, awayTeamData, homeTeamData);

  return {
    gameId,
    lineScore: lineScore || createBlankLineScore(),
    batting: batting || createEmptySplits(),
    pitching: pitching || createEmptySplits(),
    advanced: null,
  };
}

function createFallbackBoxScore(gameId) {
  return {
    gameId,
    lineScore: createBlankLineScore(),
    batting: createEmptySplits(),
    pitching: createEmptySplits(),
    advanced: null,
  };
}

function createEmptySplits() {
  return {
    away: [],
    home: [],
  };
}

function createBlankLineScore() {
  const innings = Array.from({ length: 9 }, (_, index) => index + 1);
  return {
    innings,
    away: {
      innings: Array(innings.length).fill('—'),
      runs: 0,
      hits: 0,
      errors: 0,
    },
    home: {
      innings: Array(innings.length).fill('—'),
      runs: 0,
      hits: 0,
      errors: 0,
    },
  };
}

function buildLineScore(awayTeamData, homeTeamData) {
  if (!awayTeamData || !homeTeamData) return null;

  const innings = calculateInnings(awayTeamData.linescores, homeTeamData.linescores);

  return {
    innings,
    away: {
      innings: extractRunsByInning(awayTeamData.linescores, innings.length),
      runs: safeNumber(awayTeamData.statistics, 'R'),
      hits: safeNumber(awayTeamData.statistics, 'H'),
      errors: safeNumber(awayTeamData.statistics, 'E'),
    },
    home: {
      innings: extractRunsByInning(homeTeamData.linescores, innings.length),
      runs: safeNumber(homeTeamData.statistics, 'R'),
      hits: safeNumber(homeTeamData.statistics, 'H'),
      errors: safeNumber(homeTeamData.statistics, 'E'),
    },
  };
}

function calculateInnings(awayLinescores = [], homeLinescores = []) {
  const innings = new Set();
  for (const line of [...awayLinescores, ...homeLinescores]) {
    if (line && line.period) {
      innings.add(Number.parseInt(line.period, 10));
    }
  }

  if (innings.size === 0) {
    // Default to 9 innings to preserve table layout
    return Array.from({ length: 9 }, (_, index) => index + 1);
  }

  return Array.from(innings)
    .sort((a, b) => a - b);
}

function extractRunsByInning(linescores = [], inningCount) {
  const byInning = new Array(inningCount).fill('—');
  for (const line of linescores) {
    if (!line?.period) continue;
    const inningIndex = Number.parseInt(line.period, 10) - 1;
    if (inningIndex >= 0 && inningIndex < byInning.length) {
      byInning[inningIndex] = line.score ?? '0';
    }
  }
  return byInning;
}

function safeNumber(statistics = [], label) {
  const match = statistics.find((stat) => stat.name === label || stat.abbreviation === label);
  if (!match) return 0;
  const value = Number.parseInt(match.value ?? match.displayValue ?? '0', 10);
  return Number.isNaN(value) ? 0 : value;
}

function buildBattingSplits(playersPayload = [], awayTeamData, homeTeamData) {
  if (!Array.isArray(playersPayload)) return null;

  const battingGroups = playersPayload.filter((group) => group.statistics?.some((stat) => stat.type === 'batting'));

  if (!battingGroups.length) return null;

  const awayTeamId = String(awayTeamData?.team?.id ?? '');
  const homeTeamId = String(homeTeamData?.team?.id ?? '');

  return {
    away: formatBattingPlayers(battingGroups, awayTeamId),
    home: formatBattingPlayers(battingGroups, homeTeamId),
  };
}

function formatBattingPlayers(groups, teamId) {
  const group = groups.find((entry) => String(entry.team?.id ?? '') === teamId);
  if (!group) return [];

  const battingStats = group.statistics.find((stat) => stat.type === 'batting');
  if (!battingStats?.athletes) return [];

  return battingStats.athletes.map((athlete) => ({
    id: String(athlete.athlete?.id ?? generateId()),
    name: athlete.athlete?.displayName || athlete.athlete?.shortName || 'Unknown',
    position: athlete.athlete?.position?.abbreviation || '',
    ab: toIntegerStat(athlete.stats?.[0]),
    r: toIntegerStat(athlete.stats?.[1]),
    h: toIntegerStat(athlete.stats?.[2]),
    rbi: toIntegerStat(athlete.stats?.[3]),
    bb: toIntegerStat(athlete.stats?.[4]),
    k: toIntegerStat(athlete.stats?.[5]),
    seasonAvg: formatDecimalStat(athlete.stats?.[6]),
  }));
}

function buildPitchingSplits(playersPayload = [], awayTeamData, homeTeamData) {
  if (!Array.isArray(playersPayload)) return null;

  const pitchingGroups = playersPayload.filter((group) => group.statistics?.some((stat) => stat.type === 'pitching'));
  if (!pitchingGroups.length) return null;

  const awayTeamId = String(awayTeamData?.team?.id ?? '');
  const homeTeamId = String(homeTeamData?.team?.id ?? '');

  return {
    away: formatPitchingPlayers(pitchingGroups, awayTeamId),
    home: formatPitchingPlayers(pitchingGroups, homeTeamId),
  };
}

function formatPitchingPlayers(groups, teamId) {
  const group = groups.find((entry) => String(entry.team?.id ?? '') === teamId);
  if (!group) return [];

  const pitchingStats = group.statistics.find((stat) => stat.type === 'pitching');
  if (!pitchingStats?.athletes) return [];

  return pitchingStats.athletes.map((athlete) => ({
    id: String(athlete.athlete?.id ?? generateId()),
    name: athlete.athlete?.displayName || athlete.athlete?.shortName || 'Unknown',
    position: athlete.athlete?.position?.abbreviation || 'P',
    ...parsePitchingLine(athlete.stats),
    decision: athlete.summary || undefined,
  }));
}

function parsePitchingLine(stats = []) {
  const [ip, h, r, er, bb, k, , pitchCountRaw, era] = stats;
  const { pitches, strikes } = parsePitchCount(pitchCountRaw);

  return {
    ip: typeof ip === 'string' ? ip : '0.0',
    h: toIntegerStat(h),
    r: toIntegerStat(r),
    er: toIntegerStat(er),
    bb: toIntegerStat(bb),
    k: toIntegerStat(k),
    pitches,
    strikes,
    seasonEra: formatDecimalStat(era),
  };
}

function parsePitchCount(value) {
  if (typeof value !== 'string') {
    return { pitches: null, strikes: null };
  }

  const [pitchPart, strikePart] = value.split('-');
  const pitches = toIntegerStat(pitchPart);
  const strikes = toIntegerStat(strikePart);
  return { pitches, strikes };
}

function toIntegerStat(value) {
  if (value === null || value === undefined || value === '—') return 0;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatDecimalStat(value) {
  if (typeof value !== 'string') return '—';
  if (!value.trim()) return '—';
  return value;
}

function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}

function formatScheduledTime(date) {
  if (!date) return null;
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(date));
  } catch (error) {
    console.error('Failed to format scheduled time', error);
    return null;
  }
}

async function fetchStripeEntitlements(userId, env) {
  const cacheKey = `entitlements-${userId}`;
  const cached = await env.KV?.get(cacheKey, 'json');
  if (cached) {
    return cached;
  }

  const proUsers = (env.STRIPE_PRO_USERS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  const isPro = proUsers.includes(userId);
  const entitlement = {
    userId,
    isPro,
    plan: isPro ? 'diamond_pro' : 'free',
    features: isPro
      ? ['advanced_box_score', 'video_highlights', 'diamond_pro_insights']
      : [],
    refreshedAt: new Date().toISOString(),
    ttlSeconds: 60,
  };

  await env.KV?.put(cacheKey, JSON.stringify(entitlement), {
    expirationTtl: entitlement.ttlSeconds,
  });

  return entitlement;
}
