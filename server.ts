import { randomUUID } from 'node:crypto';

export type Sport = 'baseball' | 'football' | 'basketball' | 'track';

export type CacheStatus = 'HIT' | 'MISS';

interface CacheMeta {
  provider: 'Cloudflare KV';
  status: CacheStatus;
  key: string;
}

interface ToolMeta {
  cache: CacheMeta;
  trace?: {
    requestId: string;
    fetchedFrom: string;
  };
}

export interface ToolResponse<T> {
  data: T;
  meta: ToolMeta;
}

interface SourceAttribution {
  provider: string;
  url: string;
  license: string;
  citation: string;
}

interface TeamSeasonSummary {
  teamId: string;
  sport: Sport;
  season: number;
  record: string;
  highlights: string[];
  sources: SourceAttribution[];
}

interface ScheduleGame {
  gameId: string;
  opponent: string;
  date: string;
  venue: string;
  result?: string;
  sources: SourceAttribution[];
}

interface PlayerCareerSummary {
  playerId: string;
  sport: Sport;
  seasons: Array<{
    season: number;
    summary: string;
    metrics: Record<string, number>;
  }>;
  sources: SourceAttribution[];
}

interface RankingsContext {
  season: number;
  sport: Sport;
  polls: Array<{
    week: number;
    rank: number;
    notes: string;
  }>;
  sources: SourceAttribution[];
}

interface ArchiveEntry {
  id: string;
  title: string;
  publishedAt: string;
  synopsis: string;
  sources: SourceAttribution[];
}

const LICENSED_ENDPOINTS: Record<Sport, string> = {
  baseball: 'https://stats.ncaa.org/sport/baseball',
  football: 'https://stats.ncaa.org/sport/football',
  basketball: 'https://stats.ncaa.org/sport/basketball',
  track: 'https://stats.ncaa.org/sport/track'
};

function assertSport(sport: string): asserts sport is Sport {
  const normalized = sport.toLowerCase();
  if (normalized === 'soccer') {
    throw new Error('Soccer is out of scope for the BlazeSportsIntel MCP.');
  }

  const allowed: Sport[] = ['baseball', 'football', 'basketball', 'track'];
  if (!allowed.includes(normalized as Sport)) {
    throw new Error(`Unsupported sport: ${sport}`);
  }
}

function createCacheMeta(keySeed: string, status: CacheStatus = 'MISS'): CacheMeta {
  return {
    provider: 'Cloudflare KV',
    status,
    key: `bsi:mcp:${keySeed}`
  };
}

async function fetchFromLicensedSource<T>(sport: Sport, path: string): Promise<{ payload: T; cacheStatus: CacheStatus; source: string; }>
{
  const endpoint = LICENSED_ENDPOINTS[sport];
  const source = `${endpoint}${path}`;

  // Placeholder for production fetch wired to BlazeSportsIntel's licensed feeds.
  // Replace with a fetch() call authenticated via Cloudflare Worker bindings.
  const payload = {} as T;

  return { payload, cacheStatus: 'MISS', source };
}

export interface GetTeamSeasonsInput {
  sport: Sport;
  team_id: string;
  season?: number;
}

export async function getTeamSeasons(input: GetTeamSeasonsInput): Promise<ToolResponse<{ seasons: TeamSeasonSummary[] }>> {
  assertSport(input.sport);

  const seasonYear = input.season ?? getGoldenSeason(input.sport);
  const { payload, cacheStatus, source } = await fetchFromLicensedSource<{ seasons: TeamSeasonSummary[] }>(
    input.sport,
    `/teams/${input.team_id}/seasons/${seasonYear}`
  );

  const data: { seasons: TeamSeasonSummary[] } = {
    seasons:
      payload?.seasons?.length
        ? payload.seasons
        : [
            {
              teamId: input.team_id,
              sport: input.sport,
              season: seasonYear,
              record: '0-0',
              highlights: ['Stub data pending licensed integration'],
              sources: [createSourceAttribution('NCAA Stats', source)]
            }
          ]
  };

  return {
    data,
    meta: {
      cache: createCacheMeta(`team-seasons:${input.sport}:${input.team_id}:${seasonYear}`, cacheStatus),
      trace: createTraceMeta(source)
    }
  };
}

export interface GetSeasonScheduleInput {
  sport: Sport;
  season: number;
}

export async function getSeasonSchedule(input: GetSeasonScheduleInput): Promise<ToolResponse<{ games: ScheduleGame[] }>> {
  assertSport(input.sport);

  const { payload, cacheStatus, source } = await fetchFromLicensedSource<{ games: ScheduleGame[] }>(
    input.sport,
    `/seasons/${input.season}/schedule`
  );

  const data: { games: ScheduleGame[] } = {
    games:
      payload?.games?.length
        ? payload.games
        : [
            {
              gameId: `${input.sport}-${input.season}-001`,
              opponent: 'TBD',
              date: `${input.season}-01-01`,
              venue: 'TBD',
              result: 'scheduled',
              sources: [createSourceAttribution('NCAA Stats', source)]
            }
          ]
  };

  return {
    data,
    meta: {
      cache: createCacheMeta(`schedule:${input.sport}:${input.season}`, cacheStatus),
      trace: createTraceMeta(source)
    }
  };
}

export interface GetGameBoxScoreInput {
  sport: Sport;
  game_id: string;
}

export async function getGameBoxScore(input: GetGameBoxScoreInput): Promise<ToolResponse<{ box_score: Record<string, unknown> }>> {
  assertSport(input.sport);

  const { payload, cacheStatus, source } = await fetchFromLicensedSource<Record<string, unknown>>(
    input.sport,
    `/games/${input.game_id}/boxscore`
  );

  const data = {
    box_score:
      payload && Object.keys(payload).length > 0
        ? payload
        : {
            summary: 'Stub box score awaiting data contract hookup',
            citations: [createCDTCitation(source)]
          }
  };

  return {
    data,
    meta: {
      cache: createCacheMeta(`boxscore:${input.sport}:${input.game_id}`, cacheStatus),
      trace: createTraceMeta(source)
    }
  };
}

export interface GetPlayerCareerInput {
  sport: Sport;
  player_id: string;
}

export async function getPlayerCareer(input: GetPlayerCareerInput): Promise<ToolResponse<{ career: PlayerCareerSummary }>> {
  assertSport(input.sport);

  const { payload, cacheStatus, source } = await fetchFromLicensedSource<PlayerCareerSummary>(
    input.sport,
    `/players/${input.player_id}/career`
  );

  const season = getGoldenSeason(input.sport);
  const data: { career: PlayerCareerSummary } = {
    career:
      payload && Object.keys(payload).length > 0
        ? payload
        : {
            playerId: input.player_id,
            sport: input.sport,
            seasons: [
              {
                season,
                summary: 'Stub scouting delta profile',
                metrics: {}
              }
            ],
            sources: [createSourceAttribution('NCAA Stats', source)]
          }
  };

  return {
    data,
    meta: {
      cache: createCacheMeta(`career:${input.sport}:${input.player_id}`, cacheStatus),
      trace: createTraceMeta(source)
    }
  };
}

export interface GetRankingsContextInput {
  sport: Sport;
  season: number;
}

export async function getRankingsContext(input: GetRankingsContextInput): Promise<ToolResponse<{ rankings: RankingsContext }>> {
  assertSport(input.sport);

  const { payload, cacheStatus, source } = await fetchFromLicensedSource<RankingsContext>(
    input.sport,
    `/seasons/${input.season}/rankings`
  );

  const data: { rankings: RankingsContext } = {
    rankings:
      payload && Object.keys(payload).length > 0
        ? payload
        : {
            sport: input.sport,
            season: input.season,
            polls: [
              {
                week: 1,
                rank: 25,
                notes: 'Stub ranking movement'
              }
            ],
            sources: [createSourceAttribution('NCAA Stats', source)]
          }
  };

  return {
    data,
    meta: {
      cache: createCacheMeta(`rankings:${input.sport}:${input.season}`, cacheStatus),
      trace: createTraceMeta(source)
    }
  };
}

export interface SearchArchiveInput {
  sport: Sport;
  query: string;
  limit?: number;
}

export async function searchArchive(input: SearchArchiveInput): Promise<ToolResponse<{ results: ArchiveEntry[] }>> {
  assertSport(input.sport);
  const limit = clampLimit(input.limit ?? 10);

  const { payload, cacheStatus, source } = await fetchFromLicensedSource<{ results: ArchiveEntry[] }>(
    input.sport,
    `/archive/search?q=${encodeURIComponent(input.query)}&limit=${limit}`
  );

  const data: { results: ArchiveEntry[] } = {
    results:
      payload?.results?.length
        ? payload.results
        : [
            {
              id: `${input.sport}-${randomUUID()}`,
              title: 'Stub archive result',
              publishedAt: new Date().toISOString(),
              synopsis: 'Mobile-first clipping metadata placeholder',
              sources: [createSourceAttribution('AP Licensed', source)]
            }
          ]
  };

  return {
    data,
    meta: {
      cache: createCacheMeta(`archive:${input.sport}:${hashQuery(input.query)}:${limit}`, cacheStatus),
      trace: createTraceMeta(source)
    }
  };
}

function clampLimit(limit: number): number {
  if (Number.isNaN(limit) || limit < 1) {
    return 1;
  }

  if (limit > 50) {
    return 50;
  }

  return Math.floor(limit);
}

function getGoldenSeason(sport: Sport): number {
  switch (sport) {
    case 'baseball':
      return 2005;
    case 'football':
      return 2008;
    case 'basketball':
      return 2023;
    case 'track':
      return 2024;
    default: {
      const exhaustiveCheck: never = sport;
      throw new Error(`Unhandled sport ${exhaustiveCheck}`);
    }
  }
}

function createSourceAttribution(provider: string, url: string): SourceAttribution {
  return {
    provider,
    url,
    license: 'Licensed for BlazeSportsIntel MCP distribution',
    citation: createCDTCitation(url)
  };
}

function createCDTCitation(url: string): string {
  const timestamp = new Date().toISOString();
  return `CDT:${timestamp}|${url}`;
}

function createTraceMeta(source: string): ToolMeta['trace'] {
  return {
    requestId: randomUUID(),
    fetchedFrom: source
  };
}

function hashQuery(query: string): string {
  const normalized = query.trim().toLowerCase();
  let hash = 0;

  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }

  return Math.abs(hash).toString(36);
}

export type ToolHandlerMap = {
  get_team_seasons: typeof getTeamSeasons;
  get_season_schedule: typeof getSeasonSchedule;
  get_game_box_score: typeof getGameBoxScore;
  get_player_career: typeof getPlayerCareer;
  get_rankings_context: typeof getRankingsContext;
  search_archive: typeof searchArchive;
};

export const handlers: ToolHandlerMap = {
  get_team_seasons: getTeamSeasons,
  get_season_schedule: getSeasonSchedule,
  get_game_box_score: getGameBoxScore,
  get_player_career: getPlayerCareer,
  get_rankings_context: getRankingsContext,
  search_archive: searchArchive
};

