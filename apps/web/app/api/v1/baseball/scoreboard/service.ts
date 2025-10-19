import { Redis } from '@upstash/redis';
import { z } from 'zod';

export const SCOREBOARD_TTL_SECONDS = 45;
export const ESPN_SCOREBOARD_URL =
  'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard';
export const SCOREBOARD_SPORT = 'baseball';
export const SCOREBOARD_LEAGUE = 'ncaab';

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const EspnAddressSchema = z
  .object({
    city: z.string().optional(),
    state: z.string().optional(),
  })
  .partial();

const EspnVenueSchema = z
  .object({
    fullName: z.string().optional(),
    address: EspnAddressSchema.optional(),
  })
  .partial();

const EspnLinkSchema = z
  .object({
    href: z.string().url(),
    rel: z.array(z.string()).optional(),
  })
  .partial();

const EspnBroadcastSchema = z
  .object({
    names: z.array(z.string()).optional(),
  })
  .partial();

const EspnTeamSchema = z.object({
  id: z.string(),
  uid: z.string().optional(),
  displayName: z.string(),
  shortDisplayName: z.string().optional(),
  abbreviation: z.string().optional(),
  logo: z.string().optional(),
});

const EspnRecordSchema = z
  .object({
    summary: z.string().optional(),
  })
  .partial();

const EspnRankSchema = z
  .object({
    current: z.number().optional(),
  })
  .partial();

const EspnCompetitorSchema = z.object({
  homeAway: z.enum(['home', 'away']),
  score: z.string().optional(),
  team: EspnTeamSchema,
  records: z.array(EspnRecordSchema).optional(),
  rank: EspnRankSchema.optional(),
  curatedRank: EspnRankSchema.optional(),
});

const EspnStatusTypeSchema = z.object({
  state: z.string().optional(),
  completed: z.boolean().optional(),
  detail: z.string().optional(),
  shortDetail: z.string().optional(),
  description: z.string().optional(),
});

const EspnStatusSchema = z.object({
  type: EspnStatusTypeSchema,
  period: z.number().optional(),
});

const EspnCompetitionSchema = z.object({
  id: z.string().optional(),
  date: z.string().optional(),
  status: EspnStatusSchema,
  competitors: z.array(EspnCompetitorSchema),
  venue: EspnVenueSchema.optional(),
  broadcasts: z.array(EspnBroadcastSchema).optional(),
});

const EspnEventSchema = z.object({
  id: z.string(),
  uid: z.string().optional(),
  date: z.string(),
  competitions: z.array(EspnCompetitionSchema),
  links: z.array(EspnLinkSchema).optional(),
});

const EspnScoreboardSchema = z.object({
  events: z.array(EspnEventSchema).default([]),
  day: z
    .object({
      date: z.string().optional(),
    })
    .partial()
    .optional(),
});

const ScoreboardTeamSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  shortDisplayName: z.string(),
  abbreviation: z.string(),
  record: z.string().nullable(),
  rank: z.number().int().nullable(),
  score: z.number().int().nullable(),
  logo: z.string().nullable(),
  homeAway: z.enum(['home', 'away']),
});

const ScoreboardStatusSchema = z.object({
  state: z.enum(['scheduled', 'in_progress', 'final', 'postponed', 'delayed', 'canceled']),
  detail: z.string(),
  shortDetail: z.string(),
  completed: z.boolean(),
  inning: z.number().int().nullable(),
  inningHalf: z.enum(['Top', 'Middle', 'Bottom', 'End']).nullable(),
});

const ScoreboardGameSchema = z.object({
  id: z.string(),
  uid: z.string().nullable(),
  startTime: z.string(),
  venue: z
    .object({
      name: z.string().nullable(),
      location: z.string().nullable(),
    })
    .strict(),
  status: ScoreboardStatusSchema,
  broadcasters: z.array(z.string()),
  links: z
    .object({
      boxscore: z.string().url().nullable(),
      gamecast: z.string().url().nullable(),
      tickets: z.string().url().nullable(),
    })
    .strict(),
  teams: z.object({
    home: ScoreboardTeamSchema,
    away: ScoreboardTeamSchema,
  }),
});

export const ScoreboardDataSchema = z.object({
  sport: z.literal(SCOREBOARD_SPORT),
  league: z.literal(SCOREBOARD_LEAGUE),
  provider: z.literal('ESPN'),
  scoreboardDate: z.string(),
  fetchedAt: z.string(),
  ingestionKey: z.string(),
  gameCount: z.number().int(),
  games: z.array(ScoreboardGameSchema),
});

export type ScoreboardData = z.infer<typeof ScoreboardDataSchema>;
export type ScoreboardGame = z.infer<typeof ScoreboardGameSchema>;
export type ScoreboardTeam = z.infer<typeof ScoreboardTeamSchema>;
export type ScoreboardStatus = z.infer<typeof ScoreboardStatusSchema>;
export type CacheState = 'hit' | 'miss' | 'skip';
type ScoreboardInningHalf = ScoreboardStatus['inningHalf'];
type ScoreboardState = ScoreboardStatus['state'];

export interface ScoreboardRedisClient {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T = unknown>(key: string, value: T, opts: { ex: number }): Promise<unknown>;
}

export class ScoreboardBaseError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class ScoreboardProviderError extends ScoreboardBaseError {
  constructor(message: string, details?: unknown) {
    super(message, 'UPSTREAM_ERROR', 502, details);
  }
}

export class ScoreboardValidationError extends ScoreboardBaseError {
  constructor(details: unknown) {
    super('Received invalid payload from provider', 'INVALID_PROVIDER_PAYLOAD', 502, details);
  }
}

export const buildCacheKey = (dateParam: string | undefined): string => {
  const suffix = dateParam ?? 'today';
  return `v1:scoreboard:${SCOREBOARD_SPORT}:${SCOREBOARD_LEAGUE}:${suffix}`;
};

export const resolveScoreboardDate = (dateParam: string | null | undefined, now: Date = new Date()) => {
  if (dateParam && /^\d{8}$/.test(dateParam)) {
    return {
      queryParam: dateParam,
      canonicalDate: `${dateParam.slice(0, 4)}-${dateParam.slice(4, 6)}-${dateParam.slice(6, 8)}`,
    } as const;
  }

  const iso = now.toISOString().slice(0, 10);
  return {
    queryParam: iso.replace(/-/g, ''),
    canonicalDate: iso,
  } as const;
};

export const createRedisClient = (env: NodeJS.ProcessEnv = process.env): ScoreboardRedisClient | null => {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  return new Redis({ url, token });
};

const parseInningDetail = (detail?: string | null): { inning: number | null; inningHalf: ScoreboardInningHalf } => {
  if (!detail) {
    return { inning: null, inningHalf: null };
  }

  const match = detail.match(/\b(Top|Bottom|Middle|End)\s+(\d{1,2})/i);
  if (match) {
    const half = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
    return {
      inning: Number.parseInt(match[2], 10),
      inningHalf: half as ScoreboardInningHalf,
    };
  }

  return { inning: null, inningHalf: null };
};

const normalizeState = (state?: string): ScoreboardState => {
  switch (state) {
    case 'in':
      return 'in_progress';
    case 'post':
      return 'final';
    case 'postponed':
      return 'postponed';
    case 'delayed':
      return 'delayed';
    case 'canceled':
      return 'canceled';
    default:
      return 'scheduled';
  }
};

const formatLocation = (venue?: z.infer<typeof EspnVenueSchema> | null): { name: string | null; location: string | null } => {
  if (!venue) {
    return { name: null, location: null };
  }

  const name = venue.fullName ?? null;
  const parts = [venue.address?.city, venue.address?.state].filter(Boolean);
  const location = parts.length > 0 ? parts.join(', ') : null;
  return { name, location };
};

const pickRank = (competitor: z.infer<typeof EspnCompetitorSchema>): number | null => {
  const rankValue = competitor.rank?.current ?? competitor.curatedRank?.current;
  return typeof rankValue === 'number' ? rankValue : null;
};

const mapLinks = (links: z.infer<typeof EspnLinkSchema>[] | undefined) => {
  let boxscore: string | null = null;
  let gamecast: string | null = null;
  let tickets: string | null = null;

  (links ?? []).forEach((link) => {
    if (!link.href) {
      return;
    }

    const rel = link.rel ?? [];
    if (rel.includes('boxscore') && !boxscore) {
      boxscore = link.href;
    }
    if (rel.includes('gamecast') && !gamecast) {
      gamecast = link.href;
    }
    if (rel.includes('tickets') && !tickets) {
      tickets = link.href;
    }
  });

  return { boxscore, gamecast, tickets };
};

const mapTeam = (competitor: z.infer<typeof EspnCompetitorSchema>): ScoreboardTeam => {
  const record = competitor.records?.find((entry) => entry.summary)?.summary ?? null;
  const score = competitor.score ? Number.parseInt(competitor.score, 10) : null;
  const normalizedScore = Number.isFinite(score) ? (score as number) : null;

  return {
    id: competitor.team.id,
    displayName: competitor.team.displayName,
    shortDisplayName: competitor.team.shortDisplayName ?? competitor.team.displayName,
    abbreviation: competitor.team.abbreviation ?? competitor.team.displayName,
    record,
    rank: pickRank(competitor),
    score: normalizedScore,
    logo: competitor.team.logo ?? null,
    homeAway: competitor.homeAway,
  };
};

export const normalizeEspnScoreboard = (
  raw: unknown,
  options: {
    now?: Date;
    requestedDate?: string;
    canonicalDate?: string;
  } = {},
): ScoreboardData => {
  const parsed = EspnScoreboardSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ScoreboardValidationError(parsed.error.issues);
  }

  const now = options.now ?? new Date();
  const fallbackDate = options.canonicalDate ?? now.toISOString().slice(0, 10);

  const gamesMap = new Map<string, ScoreboardGame>();

  parsed.data.events.forEach((event) => {
    const competition = event.competitions[0];
    if (!competition) {
      return;
    }

    const competitionId = competition.id ?? event.id;
    if (!competitionId) {
      return;
    }

    if (gamesMap.has(competitionId)) {
      return;
    }

    const statusType = competition.status.type;
    const state = normalizeState(statusType.state);
    const detail = statusType.detail ?? statusType.description ?? 'Scheduled';
    const shortDetail = statusType.shortDetail ?? detail;
    const inningDetail = parseInningDetail(detail);
    const inning = competition.status.period ?? inningDetail.inning;
    const inningHalf = inningDetail.inningHalf;
    const startTime = competition.date ?? event.date;

    const broadcasters = new Set<string>();
    (competition.broadcasts ?? []).forEach((broadcast) => {
      (broadcast.names ?? []).forEach((name) => {
        if (name) {
          broadcasters.add(name);
        }
      });
    });

    const teams = competition.competitors.reduce(
      (acc, competitor) => {
        const mapped = mapTeam(competitor);
        if (competitor.homeAway === 'home') {
          acc.home = mapped;
        } else {
          acc.away = mapped;
        }
        return acc;
      },
      { home: undefined as ScoreboardTeam | undefined, away: undefined as ScoreboardTeam | undefined },
    );

    if (!teams.home || !teams.away) {
      return;
    }

    const venue = formatLocation(competition.venue ?? undefined);
    const links = mapLinks(event.links ?? []);

    gamesMap.set(competitionId, {
      id: competitionId,
      uid: event.uid ?? null,
      startTime,
      venue,
      status: {
        state,
        detail,
        shortDetail,
        completed: Boolean(statusType.completed ?? state === 'final'),
        inning: Number.isFinite(inning) ? (inning as number) : null,
        inningHalf: inningHalf ?? null,
      },
      broadcasters: Array.from(broadcasters.values()),
      links,
      teams: {
        home: teams.home,
        away: teams.away,
      },
    });
  });

  const games = Array.from(gamesMap.values()).sort((a, b) => {
    const timeDiff = new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    if (timeDiff !== 0) {
      return timeDiff;
    }
    return a.id.localeCompare(b.id);
  });

  const ingestionKey = games.length > 0 ? games.map((game) => game.id).sort().join(':') : `${fallbackDate}:empty`;

  const data: ScoreboardData = {
    sport: SCOREBOARD_SPORT,
    league: SCOREBOARD_LEAGUE,
    provider: 'ESPN',
    scoreboardDate: parsed.data.day?.date ?? fallbackDate,
    fetchedAt: now.toISOString(),
    ingestionKey,
    gameCount: games.length,
    games,
  };

  return ScoreboardDataSchema.parse(data);
};

export const fetchEspnScoreboard = async (
  options: {
    fetchImpl?: FetchLike;
    dateParam?: string;
    signal?: AbortSignal;
  } = {},
): Promise<unknown> => {
  const fetchFn = options.fetchImpl ?? fetch;
  const url = new URL(ESPN_SCOREBOARD_URL);
  url.searchParams.set('limit', '300');
  if (options.dateParam) {
    url.searchParams.set('dates', options.dateParam);
  }

  let response: Response;
  try {
    response = await fetchFn(url.toString(), {
      headers: {
        'User-Agent': 'BlazeSportsIntel/1.0 (+https://blazesportsintel.com)',
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: options.signal,
    });
  } catch (error) {
    throw new ScoreboardProviderError('Failed to reach ESPN scoreboard endpoint', {
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  if (!response.ok) {
    throw new ScoreboardProviderError('ESPN returned an error response', {
      status: response.status,
      statusText: response.statusText,
      url: url.toString(),
    });
  }

  try {
    return await response.json();
  } catch (error) {
    throw new ScoreboardProviderError('Unable to parse ESPN response body', {
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getScoreboardData = async (
  options: {
    dateParam?: string;
    now?: Date;
    fetchImpl?: FetchLike;
    redis?: ScoreboardRedisClient | null;
  } = {},
): Promise<{ data: ScoreboardData; cacheState: CacheState }> => {
  const { dateParam, now = new Date(), fetchImpl, redis = null } = options;
  const cacheKey = buildCacheKey(dateParam);

  if (redis) {
    const cached = await redis.get<ScoreboardData>(cacheKey);
    if (cached) {
      const parsed = ScoreboardDataSchema.safeParse(cached);
      if (parsed.success) {
        return { data: parsed.data, cacheState: 'hit' };
      }
    }
  }

  const raw = await fetchEspnScoreboard({ fetchImpl, dateParam });
  const normalized = normalizeEspnScoreboard(raw, {
    now,
    requestedDate: dateParam,
    canonicalDate: dateParam ? `${dateParam.slice(0, 4)}-${dateParam.slice(4, 6)}-${dateParam.slice(6, 8)}` : undefined,
  });

  if (redis) {
    await redis.set(cacheKey, normalized, { ex: SCOREBOARD_TTL_SECONDS });
    return { data: normalized, cacheState: 'miss' };
  }

  return { data: normalized, cacheState: 'skip' };
};
