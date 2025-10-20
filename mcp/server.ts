import { setTimeout as delay } from 'node:timers/promises';

export const SUPPORTED_SPORTS = [
  'baseball',
  'football',
  'basketball',
  'track_and_field'
] as const;

export type SupportedSport = (typeof SUPPORTED_SPORTS)[number];

export interface ToolContext {
  requestId: string;
  source?: 'mobile' | 'web' | 'api';
}

export interface CacheScaffold {
  layer: {
    primary: 'cloudflare-kv';
    warm?: Array<'cloudflare-r2' | 'cloudflare-d1'>;
  };
  ttlSeconds: number;
  tags: string[];
  status: 'miss' | 'warm' | 'refresh';
  notes: string[];
}

export interface Citation {
  provider: 'Highlightly' | 'NCAA' | 'LonghornNetwork';
  route: string;
  accessed: string;
}

export interface ResponseMeta {
  sport?: SupportedSport;
  supportedSports: SupportedSport[];
  cache: CacheScaffold;
  citations: Citation[];
}

export interface MCPResponse<T> {
  data: T;
  meta: ResponseMeta;
}

export interface TeamSeasonPayload {
  team: string;
  sports: Array<{
    sport: SupportedSport;
    seasons: Array<{
      year: number;
      record: string;
      postseason: string;
      coach: string;
    }>;
  }>;
}

export interface SchedulePayload {
  season: number;
  games: Array<{
    sport: SupportedSport;
    opponent: string;
    venue: string;
    kickoff: string;
    result?: string;
    coverage: string;
  }>;
}

export interface BoxScorePayload {
  gameId: string;
  sport: SupportedSport;
  headline: string;
  status: 'scheduled' | 'in_progress' | 'final';
  scoring: Array<{
    period: string;
    texas: number;
    opponent: number;
  }>;
  leaders: Array<{
    label: string;
    player: string;
    value: string;
  }>;
}

export interface PlayerCareerPayload {
  player: string;
  stops: Array<{
    sport: SupportedSport;
    span: string;
    summary: string;
    nextSteps: string;
  }>;
}

export interface RankingsPayload {
  sport: SupportedSport;
  tables: Array<{
    poll: string;
    rank: number;
    trend: string;
    strengthOfSchedule: string;
  }>;
}

export interface ArchiveSearchPayload {
  query: string;
  hits: Array<{
    sport: SupportedSport;
    headline: string;
    summary: string;
    publishedAt: string;
    citation: Citation;
  }>;
}

export type Handler<P, R> = (params: P, context?: ToolContext) => Promise<MCPResponse<R>>;

const SPORT_PRIORITY = new Map<SupportedSport, number>(
  SUPPORTED_SPORTS.map((sport, index) => [sport, index])
);

const highlightlyClient = {
  async getTeamSeasons(team: string) {
    await delay(5);
    return [
      {
        sport: 'football' as SupportedSport,
        seasons: [
          { year: 2024, record: '12-2', postseason: 'Sugar Bowl', coach: 'Steve Sarkisian' }
        ]
      },
      {
        sport: 'baseball' as SupportedSport,
        seasons: [
          { year: 2024, record: '52-14', postseason: 'College World Series', coach: 'David Pierce' },
          { year: 2023, record: '45-18', postseason: 'Super Regional', coach: 'David Pierce' }
        ]
      },
      {
        sport: 'track_and_field' as SupportedSport,
        seasons: [
          { year: 2024, record: 'N/A', postseason: 'NCAA Outdoor Champions', coach: 'Edrick Floréal' }
        ]
      },
      {
        sport: 'basketball' as SupportedSport,
        seasons: [
          { year: 2024, record: '27-9', postseason: 'Elite Eight', coach: 'Rodney Terry' }
        ]
      }
    ];
  },
  async getSeasonSchedule(team: string, season: number) {
    await delay(5);
    return [
      {
        sport: 'football' as SupportedSport,
        opponent: 'Oklahoma',
        venue: 'Cotton Bowl',
        kickoff: '2024-10-12T16:00:00Z',
        coverage: 'ABC'
      },
      {
        sport: 'baseball' as SupportedSport,
        opponent: 'LSU',
        venue: 'Disch-Falk Field',
        kickoff: '2024-03-15T23:00:00Z',
        result: 'W 6-2',
        coverage: 'Longhorn Network'
      },
      {
        sport: 'track_and_field' as SupportedSport,
        opponent: 'Texas Relays Field',
        venue: 'Mike A. Myers Stadium',
        kickoff: '2024-04-01T17:00:00Z',
        coverage: 'ESPN+'
      },
      {
        sport: 'basketball' as SupportedSport,
        opponent: 'Kansas',
        venue: 'Moody Center',
        kickoff: '2024-02-20T01:00:00Z',
        coverage: 'ESPN2'
      }
    ];
  },
  async getGameBoxScore(gameId: string) {
    await delay(5);
    return {
      sport: 'baseball' as SupportedSport,
      headline: 'Texas downs LSU behind late rally',
      status: 'final' as const,
      scoring: [
        { period: '1', texas: 0, opponent: 0 },
        { period: '5', texas: 2, opponent: 0 },
        { period: '8', texas: 4, opponent: 2 }
      ],
      leaders: [
        { label: 'Pitching', player: 'Tanner Witt', value: '6.0 IP, 9 K' },
        { label: 'Offense', player: 'Dylan Campbell', value: '2-4, 3 RBI' }
      ]
    };
  },
  async getPlayerCareer(player: string) {
    await delay(5);
    return [
      {
        sport: 'baseball' as SupportedSport,
        span: '2023-2025',
        summary: 'Everyday CF with .420 OBP and SEC-best range factor.',
        nextSteps: 'MLB Draft Round 1 projection.'
      },
      {
        sport: 'football' as SupportedSport,
        span: '2022-2023',
        summary: 'All-Big 12 slot receiver, 1.9 yards per route run.',
        nextSteps: 'NFL combine invite pending medicals.'
      },
      {
        sport: 'basketball' as SupportedSport,
        span: '2021-2022',
        summary: 'Rotational guard with 38% from deep.',
        nextSteps: 'Graduate transfer window closed.'
      },
      {
        sport: 'track_and_field' as SupportedSport,
        span: 'Spring 2021',
        summary: 'Ran 10.32 100m, placed 4th at Big 12 finals.',
        nextSteps: 'USA Trials standard review.'
      }
    ];
  },
  async getRankingsContext(sport: SupportedSport) {
    await delay(5);
    return [
      {
        sport: 'baseball' as SupportedSport,
        poll: 'D1Baseball',
        rank: 4,
        trend: '+2',
        strengthOfSchedule: 'Top 5 (0.670)'
      },
      {
        sport: 'basketball' as SupportedSport,
        poll: 'AP',
        rank: 12,
        trend: '-1',
        strengthOfSchedule: 'Top 15 (0.612)'
      },
      {
        sport: 'football' as SupportedSport,
        poll: 'CFP',
        rank: 7,
        trend: 'steady',
        strengthOfSchedule: 'Top 10 (0.645)'
      },
      {
        sport: 'track_and_field' as SupportedSport,
        poll: 'USTFCCCA',
        rank: 1,
        trend: '+1',
        strengthOfSchedule: 'National #1 sprint block'
      }
    ].filter((entry) => entry.sport === sport || sport === 'baseball');
  },
  async searchArchive(query: string) {
    await delay(5);
    return [
      {
        sport: 'basketball' as SupportedSport,
        headline: 'Texas clamps Baylor with switch-heavy defense',
        summary: 'Rodney Terry dialed up a 0.83 PPP stretch with length on the wings.',
        publishedAt: '2024-02-19T06:30:00Z',
        route: '/archive/basketball/2024/lockdown-baylor'
      },
      {
        sport: 'baseball' as SupportedSport,
        headline: 'Pitch-by-pitch: Longhorns carve up LSU',
        summary: 'Detailed look at 34% whiff rate night in Austin.',
        publishedAt: '2024-03-16T05:15:00Z',
        route: '/archive/baseball/2024/pitch-by-pitch-lsu'
      },
      {
        sport: 'track_and_field' as SupportedSport,
        headline: 'Relays preview: Texas chases sprint double',
        summary: 'Blocking assignments, baton exchanges, and wind splits preview.',
        publishedAt: '2024-03-20T12:00:00Z',
        route: '/archive/track/2024/relays-preview'
      }
    ].filter((hit) => hit.headline.toLowerCase().includes(query.toLowerCase()));
  }
};

function ensureSportAllowed(sport: SupportedSport | string): SupportedSport {
  const normalized = String(sport).toLowerCase();
  if (normalized === 'soccer') {
    throw new Error('Soccer is explicitly excluded from the MCP charter. Choose baseball, football, basketball, or track & field.');
  }

  if (!SUPPORTED_SPORTS.includes(normalized as SupportedSport)) {
    throw new Error(`Unsupported sport: ${sport}. Valid options: ${SUPPORTED_SPORTS.join(', ')}.`);
  }

  return normalized as SupportedSport;
}

function orderBySport<T extends { sport: SupportedSport }>(records: T[]): T[] {
  return [...records].sort((a, b) => {
    const orderA = SPORT_PRIORITY.get(a.sport) ?? Number.MAX_SAFE_INTEGER;
    const orderB = SPORT_PRIORITY.get(b.sport) ?? Number.MAX_SAFE_INTEGER;
    return orderA - orderB;
  });
}

function createCacheScaffold(tags: string[]): CacheScaffold {
  return {
    layer: {
      primary: 'cloudflare-kv',
      warm: ['cloudflare-r2', 'cloudflare-d1']
    },
    ttlSeconds: 60,
    tags,
    status: 'miss',
    notes: [
      'Hydrate via Cloudflare Worker ingestion task.',
      'Promote to warm cache after initial sync.'
    ]
  };
}

export function formatCitationTimestamp(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(date);

  const lookup = parts.reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});

  if (!lookup.year || !lookup.month || !lookup.day || !lookup.hour || !lookup.minute || !lookup.second) {
    return date.toISOString();
  }

  return `${lookup.year}-${lookup.month}-${lookup.day}T${lookup.hour}:${lookup.minute}:${lookup.second} CDT`;
}

function buildMeta(sport: SupportedSport, route: string, tags: string[], citationOverrides?: Partial<Citation>): ResponseMeta {
  return {
    sport,
    supportedSports: [...SUPPORTED_SPORTS],
    cache: createCacheScaffold(tags),
    citations: [
      {
        provider: 'Highlightly',
        route,
        accessed: formatCitationTimestamp(),
        ...citationOverrides
      }
    ]
  };
}

export const get_team_seasons: Handler<{ sport: SupportedSport; team: string }, TeamSeasonPayload> = async (
  params
) => {
  const sport = ensureSportAllowed(params.sport);
  const rawSeasons = await highlightlyClient.getTeamSeasons(params.team);
  const sports = orderBySport(rawSeasons);

  return {
    data: {
      team: params.team,
      sports
    },
    meta: buildMeta(sport, `/teams/${params.team}/seasons`, [params.team, 'seasons'])
  };
};

export const get_season_schedule: Handler<{ sport: SupportedSport; team: string; season: number }, SchedulePayload> = async (
  params
) => {
  const sport = ensureSportAllowed(params.sport);
  const rawGames = await highlightlyClient.getSeasonSchedule(params.team, params.season);
  const games = orderBySport(rawGames);

  return {
    data: {
      season: params.season,
      games
    },
    meta: buildMeta(sport, `/teams/${params.team}/schedule/${params.season}`, [params.team, 'schedule', String(params.season)])
  };
};

export const get_game_box_score: Handler<{ sport: SupportedSport; gameId: string }, BoxScorePayload> = async (
  params
) => {
  const sport = ensureSportAllowed(params.sport);
  const boxScore = await highlightlyClient.getGameBoxScore(params.gameId);

  return {
    data: {
      gameId: params.gameId,
      sport: boxScore.sport,
      headline: boxScore.headline,
      status: boxScore.status,
      scoring: boxScore.scoring,
      leaders: boxScore.leaders
    },
    meta: buildMeta(sport, `/games/${params.gameId}/box`, ['game', params.gameId])
  };
};

export const get_player_career: Handler<{ sport: SupportedSport; player: string }, PlayerCareerPayload> = async (
  params
) => {
  const sport = ensureSportAllowed(params.sport);
  const stops = orderBySport(await highlightlyClient.getPlayerCareer(params.player));

  return {
    data: {
      player: params.player,
      stops
    },
    meta: buildMeta(sport, `/players/${params.player}/career`, ['player', params.player])
  };
};

export const get_rankings_context: Handler<{ sport: SupportedSport }, RankingsPayload> = async (
  params
) => {
  const sport = ensureSportAllowed(params.sport);
  const tables = orderBySport(await highlightlyClient.getRankingsContext(sport));

  return {
    data: {
      sport,
      tables
    },
    meta: buildMeta(sport, `/rankings/${sport}`, ['rankings', sport])
  };
};

export const search_archive: Handler<{ sport: SupportedSport; query: string }, ArchiveSearchPayload> = async (
  params
) => {
  const sport = ensureSportAllowed(params.sport);
  const hits = orderBySport(
    (await highlightlyClient.searchArchive(params.query)).map((hit) => ({
      sport: hit.sport,
      headline: hit.headline,
      summary: hit.summary,
      publishedAt: hit.publishedAt,
      citation: {
        provider: 'Highlightly' as const,
        route: hit.route,
        accessed: formatCitationTimestamp(new Date(hit.publishedAt))
      }
    }))
  );

  return {
    data: {
      query: params.query,
      hits
    },
    meta: buildMeta(sport, `/archive/search?q=${encodeURIComponent(params.query)}`, ['archive', params.query], {
      provider: 'Highlightly'
    })
  };
};
