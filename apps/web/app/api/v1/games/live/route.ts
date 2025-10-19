import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const dynamic = 'force-dynamic';

const CACHE_TTL_SECONDS = 60;
const DEFAULT_SCOREBOARD_URL =
  process.env.ESPN_SCOREBOARD_URL ??
  'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard';

const redis = createRedisClient();

export type GameStatus =
  | 'SCHEDULED'
  | 'LIVE'
  | 'FINAL'
  | 'POSTPONED'
  | 'CANCELLED'
  | 'DELAYED';

export type LiveGameTeam = {
  id: string;
  name: string;
  shortName: string;
  displayName: string;
  abbreviation: string | null;
  logo: string | null;
  record: string | null;
  score: number | null;
  rank: number | null;
  conferenceId: string | null;
  conferenceName: string | null;
};

export type LiveGame = {
  id: string;
  status: GameStatus;
  statusText: string | null;
  startTime: string | null;
  venue: string | null;
  location: {
    city: string | null;
    state: string | null;
  } | null;
  network: string | null;
  inning: number | null;
  inningHalf: 'TOP' | 'BOTTOM' | null;
  counts: {
    balls: number | null;
    strikes: number | null;
    outs: number | null;
  };
  conferenceCompetition: boolean;
  home: LiveGameTeam;
  away: LiveGameTeam;
  lineScore: Array<{
    inning: number;
    home: number | null;
    away: number | null;
  }>;
};

export type LiveGamesResponse = {
  meta: {
    cacheKey: string;
    cacheStatus: 'hit' | 'miss';
    cacheTTLSeconds: number;
    conference: string | null;
    date: string;
    fetchedAt: string;
    provider: 'espn';
    upstreamUrl: string;
  };
  games: LiveGame[];
};

export async function GET(request: NextRequest): Promise<NextResponse<LiveGamesResponse | { error: string }>> {
  const searchParams = request.nextUrl.searchParams;
  const dateParam = searchParams.get('date');
  const conferenceParam = searchParams.get('conference');

  if (dateParam && !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return NextResponse.json(
      { error: 'Invalid date. Expected format: YYYY-MM-DD.' },
      { status: 400 }
    );
  }

  const isoDate = dateParam ? new Date(`${dateParam}T00:00:00Z`) : new Date();

  if (Number.isNaN(isoDate.getTime())) {
    return NextResponse.json(
      { error: 'Invalid date. Expected format: YYYY-MM-DD.' },
      { status: 400 }
    );
  }

  const normalizedDate = isoDate.toISOString().slice(0, 10);
  const scoreboardDate = normalizedDate.replace(/-/g, '');
  const normalizedConference = conferenceParam?.trim() ? conferenceParam.trim().toLowerCase() : null;

  const cacheKey = createCacheKey(normalizedDate, normalizedConference);

  const cachedResponse = await readFromCache(cacheKey);
  if (cachedResponse) {
    return NextResponse.json(
      {
        ...cachedResponse,
        meta: {
          ...cachedResponse.meta,
          cacheStatus: 'hit'
        }
      },
      {
        headers: cacheHeaders()
      }
    );
  }

  const upstreamUrl = new URL(DEFAULT_SCOREBOARD_URL);
  upstreamUrl.searchParams.set('limit', '50');
  upstreamUrl.searchParams.set('dates', scoreboardDate);
  if (normalizedConference) {
    upstreamUrl.searchParams.set('groups', normalizedConference);
  }

  const headers = buildUpstreamHeaders();

  let upstreamPayload: any;
  try {
    const response = await fetch(upstreamUrl.toString(), {
      headers,
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Upstream responded with ${response.status} ${response.statusText}`);
    }

    upstreamPayload = await response.json();
  } catch (error) {
    console.error('Failed to fetch live games from upstream provider', error);
    return NextResponse.json(
      { error: 'Failed to load live games from upstream provider.' },
      {
        status: 502,
        headers: cacheHeaders()
      }
    );
  }

  const normalized = normalizeScoreboard(upstreamPayload, {
    cacheKey,
    cacheTTL: CACHE_TTL_SECONDS,
    conference: normalizedConference,
    date: normalizedDate,
    fetchedAt: new Date().toISOString(),
    upstreamUrl: upstreamUrl.toString()
  });

  await writeToCache(cacheKey, normalized);

  return NextResponse.json(
    normalized,
    {
      headers: cacheHeaders()
    }
  );
}

function createRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  try {
    return new Redis({ url, token });
  } catch (error) {
    console.error('Failed to initialize Upstash Redis client', error);
    return null;
  }
}

async function readFromCache(cacheKey: string): Promise<LiveGamesResponse | null> {
  if (!redis) {
    return null;
  }

  try {
    const cached = await redis.get<LiveGamesResponse>(cacheKey);
    if (!cached) {
      return null;
    }
    return cached;
  } catch (error) {
    console.warn('Live games cache read failed', error);
    return null;
  }
}

async function writeToCache(cacheKey: string, payload: LiveGamesResponse): Promise<void> {
  if (!redis) {
    return;
  }

  try {
    await redis.set(cacheKey, payload, { ex: CACHE_TTL_SECONDS });
  } catch (error) {
    console.warn('Live games cache write failed', error);
  }
}

function cacheHeaders(): Record<string, string> {
  return {
    'Cache-Control': 'public, max-age=30, s-maxage=30, stale-while-revalidate=30'
  };
}

function createCacheKey(date: string, conference: string | null): string {
  const conferenceKey = conference ?? 'all';
  return `live-games:${date}:${conferenceKey}`;
}

function buildUpstreamHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Accept': 'application/json',
    'User-Agent': 'BlazeSports Intel/1.0 (+https://blazesportsintel.com)'
  };

  if (process.env.ESPN_API_KEY) {
    headers['Authorization'] = `Bearer ${process.env.ESPN_API_KEY}`;
  }

  return headers;
}

function normalizeScoreboard(
  payload: any,
  context: {
    cacheKey: string;
    cacheTTL: number;
    conference: string | null;
    date: string;
    fetchedAt: string;
    upstreamUrl: string;
  }
): LiveGamesResponse {
  const events: any[] = Array.isArray(payload?.events) ? payload.events : [];

  const games: LiveGame[] = events.map((event) => normalizeEvent(event));

  return {
    meta: {
      cacheKey: context.cacheKey,
      cacheStatus: 'miss',
      cacheTTLSeconds: context.cacheTTL,
      conference: context.conference,
      date: context.date,
      fetchedAt: context.fetchedAt,
      provider: 'espn',
      upstreamUrl: context.upstreamUrl
    },
    games
  };
}

function mapStatus(status: any): { code: GameStatus; detail: string | null } {
  const typeName = typeof status?.type?.name === 'string' ? status.type.name : '';
  const state = typeof status?.type?.state === 'string' ? status.type.state : '';
  const detail =
    typeof status?.type?.detail === 'string'
      ? status.type.detail
      : typeof status?.type?.shortDetail === 'string'
        ? status.type.shortDetail
        : typeof status?.type?.description === 'string'
          ? status.type.description
          : null;

  if (typeName.includes('CANCEL')) {
    return { code: 'CANCELLED', detail: detail ?? 'Cancelled' };
  }

  if (typeName.includes('POSTPONE')) {
    return { code: 'POSTPONED', detail: detail ?? 'Postponed' };
  }

  if (typeName.includes('DELAY')) {
    return { code: 'DELAYED', detail: detail ?? 'Delayed' };
  }

  switch (state) {
    case 'in':
      return { code: 'LIVE', detail };
    case 'post':
      return { code: 'FINAL', detail: detail ?? 'Final' };
    case 'pre':
      return { code: 'SCHEDULED', detail: detail ?? 'Scheduled' };
    default:
      return { code: 'SCHEDULED', detail };
  }
}

function normalizeEvent(event: any): LiveGame {
  const competition = event?.competitions?.[0] ?? {};
  const status = mapStatus(competition?.status);
  const venue = competition?.venue ?? {};
  const competitors: any[] = Array.isArray(competition?.competitors) ? competition.competitors : [];

  const home = normalizeCompetitor(competitors, 'home');
  const away = normalizeCompetitor(competitors, 'away');

  const inning = typeof competition?.status?.period === 'number' ? competition.status.period : null;
  const inningDetail = competition?.status?.type?.detail ?? competition?.status?.type?.shortDetail ?? null;
  const inningHalf = deriveInningHalf(inningDetail);

  const situation = competition?.situation ?? {};

  return {
    id: String(event?.id ?? competition?.id ?? ''),
    status: status.code,
    statusText: status.detail,
    startTime: competition?.startDate ?? event?.date ?? null,
    venue: venue?.fullName ?? null,
    location: venue?.address
      ? {
          city: venue.address?.city ?? null,
          state: venue.address?.state ?? null
        }
      : null,
    network: extractNetwork(competition),
    inning,
    inningHalf,
    counts: {
      balls: typeof situation?.balls === 'number' ? situation.balls : null,
      strikes: typeof situation?.strikes === 'number' ? situation.strikes : null,
      outs: typeof situation?.outs === 'number' ? situation.outs : null
    },
    conferenceCompetition: Boolean(competition?.conferenceCompetition),
    home: home.team,
    away: away.team,
    lineScore: buildLineScore(home.raw, away.raw)
  };
}

function normalizeCompetitor(
  competitors: any[],
  homeAway: 'home' | 'away'
): { team: LiveGameTeam; raw: any } {
  const competitor = competitors.find((team) => team?.homeAway === homeAway) ?? {};
  const team = competitor?.team ?? {};

  const logo = Array.isArray(team?.logos) && team.logos.length > 0 ? team.logos[0]?.href : team?.logo ?? null;
  const conferenceLink = extractConferenceLink(team?.links);

  return {
    team: {
      id: String(team?.id ?? competitor?.id ?? ''),
      name: team?.displayName ?? team?.name ?? '',
      shortName: team?.shortDisplayName ?? team?.abbreviation ?? team?.name ?? '',
      displayName: team?.displayName ?? team?.name ?? '',
      abbreviation: team?.abbreviation ?? null,
      logo,
      record: extractRecord(competitor?.records),
      score: parseScore(competitor?.score),
      rank: extractRank(competitor),
      conferenceId: conferenceLink?.id ?? null,
      conferenceName: conferenceLink?.name ?? null
    },
    raw: competitor
  };
}

function extractRecord(records: any): string | null {
  if (!Array.isArray(records) || records.length === 0) {
    return null;
  }

  const overall = records.find((record) => record?.type === 'total' || record?.name === 'overall');
  const primary = overall ?? records[0];
  return typeof primary?.summary === 'string' ? primary.summary : null;
}

function parseScore(score: unknown): number | null {
  if (typeof score === 'number') {
    return score;
  }

  if (typeof score === 'string' && score.trim().length > 0) {
    const parsed = Number.parseInt(score, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}

function extractRank(competitor: any): number | null {
  if (typeof competitor?.curatedRank?.current === 'number') {
    return competitor.curatedRank.current;
  }

  if (typeof competitor?.rank === 'number') {
    return competitor.rank;
  }

  return null;
}

function extractConferenceLink(links: any): { id: string | null; name: string | null } | null {
  if (!Array.isArray(links)) {
    return null;
  }

  for (const link of links) {
    const rel: string[] = Array.isArray(link?.rel) ? link.rel : [];
    if (rel.includes('conference') && typeof link?.href === 'string') {
      const idMatch = link.href.match(/groups\/(\d+)/);
      const id = idMatch ? idMatch[1] : null;
      const name = typeof link?.text === 'string' ? link.text : null;
      return { id, name };
    }
  }

  return null;
}

function extractNetwork(competition: any): string | null {
  const broadcast = Array.isArray(competition?.broadcasts) ? competition.broadcasts[0] : competition?.broadcast;
  if (!broadcast) {
    return null;
  }

  if (Array.isArray(broadcast?.names) && broadcast.names.length > 0) {
    return broadcast.names[0];
  }

  if (typeof broadcast?.shortName === 'string') {
    return broadcast.shortName;
  }

  if (typeof broadcast?.name === 'string') {
    return broadcast.name;
  }

  return null;
}

function deriveInningHalf(detail: string | null): 'TOP' | 'BOTTOM' | null {
  if (!detail) {
    return null;
  }

  const normalized = detail.toLowerCase();
  if (normalized.includes('top')) {
    return 'TOP';
  }

  if (normalized.includes('bot')) {
    return 'BOTTOM';
  }

  return null;
}

function buildLineScore(homeCompetitor: any, awayCompetitor: any): Array<{ inning: number; home: number | null; away: number | null }> {
  const maxInning = Math.max(
    extractMaxInning(homeCompetitor?.linescores),
    extractMaxInning(awayCompetitor?.linescores)
  );

  if (!Number.isFinite(maxInning) || maxInning <= 0) {
    return [];
  }

  const innings: Array<{ inning: number; home: number | null; away: number | null }> = [];

  for (let inning = 1; inning <= maxInning; inning += 1) {
    innings.push({
      inning,
      home: extractLinescoreValue(homeCompetitor?.linescores, inning),
      away: extractLinescoreValue(awayCompetitor?.linescores, inning)
    });
  }

  return innings;
}

function extractMaxInning(linescores: any): number {
  if (!Array.isArray(linescores)) {
    return 0;
  }

  return linescores.reduce((max, entry) => {
    const period = typeof entry?.period === 'number' ? entry.period : 0;
    return Math.max(max, period);
  }, 0);
}

function extractLinescoreValue(linescores: any, inning: number): number | null {
  if (!Array.isArray(linescores)) {
    return null;
  }

  const entry = linescores.find((line) => line?.period === inning);
  if (!entry) {
    return null;
  }

  if (typeof entry?.value === 'number') {
    return entry.value;
  }

  if (typeof entry?.displayValue === 'string') {
    const parsed = Number.parseFloat(entry.displayValue);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}
