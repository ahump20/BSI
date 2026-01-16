import { createHash } from 'crypto';

import baseballFeedJson from './feeds/baseball.json' assert { type: 'json' };
import footballFeedJson from './feeds/football.json' assert { type: 'json' };
import basketballFeedJson from './feeds/basketball.json' assert { type: 'json' };
import trackFieldFeedJson from './feeds/track-field.json' assert { type: 'json' };
import archiveFeedJson from './feeds/archive.json' assert { type: 'json' };
import texasBaseballTeamJson from '../../data/college-baseball/teams/texas-longhorns.json' assert { type: 'json' };

export type Sport = 'baseball' | 'football' | 'basketball' | 'track_field';

const TEAM_NAME = 'Texas Longhorns';
const SPORT_ORDER: Sport[] = ['baseball', 'football', 'basketball', 'track_field'];
const SOCCER_KEYWORDS = ['soccer', 'fútbol', 'futbol'];

interface Citation {
  id: string;
  label: string;
  path: string;
  timestamp: string;
}

interface ToolPayload<T> {
  result: T;
  citations: Citation[];
  generatedAt: string;
}

export interface ToolResponse<T> extends ToolPayload<T> {
  meta: {
    cache: {
      key: string;
      status: 'HIT' | 'MISS';
    };
  };
}

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

interface R2ObjectBody {
  text(): Promise<string>;
}

interface R2Bucket {
  get(key: string): Promise<R2ObjectBody | null>;
  put(
    key: string,
    value: string,
    options?: { httpMetadata?: { contentType?: string; cacheControl?: string } }
  ): Promise<void>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T>(): Promise<T | null>;
  run(): Promise<unknown>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface DurableObjectId {}

interface DurableObjectStub {
  fetch(input: Request | string, init?: RequestInit): Promise<Response>;
}

interface DurableObjectNamespace {
  idFromName(name: string): DurableObjectId;
  get(id: DurableObjectId): DurableObjectStub;
}

export interface LonghornsEnv {
  LONGHORNS_KV?: KVNamespace;
  LONGHORNS_R2?: R2Bucket;
  LONGHORNS_D1?: D1Database;
  LONGHORNS_DO?: DurableObjectNamespace;
}

export interface ToolContext {
  env?: LonghornsEnv;
  cache?: CacheChain;
}

class LonghornsError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'BAD_REQUEST'
  ) {
    super(message);
    this.name = 'LonghornsError';
  }
}

class CacheChain {
  private readonly memory = new Map<string, string>();

  constructor(private readonly env?: LonghornsEnv) {}

  async get(key: string): Promise<string | undefined> {
    const kvHit = await this.tryKvGet(key);
    if (kvHit) return kvHit;

    const r2Hit = await this.tryR2Get(key);
    if (r2Hit) return r2Hit;

    const d1Hit = await this.tryD1Get(key);
    if (d1Hit) return d1Hit;

    const doHit = await this.tryDoGet(key);
    if (doHit) return doHit;

    return this.memory.get(key);
  }

  async put(key: string, value: string): Promise<void> {
    await this.tryKvPut(key, value);
    await this.tryR2Put(key, value);
    await this.tryD1Put(key, value);
    await this.tryDoPut(key, value);

    this.memory.set(key, value);
  }

  private async tryKvGet(key: string): Promise<string | undefined> {
    if (!this.env?.LONGHORNS_KV) return undefined;
    try {
      const value = await this.env.LONGHORNS_KV.get(key);
      return value ?? undefined;
    } catch (error) {
      console.warn('KV get failed', error);
      return undefined;
    }
  }

  private async tryKvPut(key: string, value: string): Promise<void> {
    if (!this.env?.LONGHORNS_KV) return;
    try {
      await this.env.LONGHORNS_KV.put(key, value, { expirationTtl: 300 });
    } catch (error) {
      console.warn('KV put failed', error);
    }
  }

  private async tryR2Get(key: string): Promise<string | undefined> {
    if (!this.env?.LONGHORNS_R2) return undefined;
    try {
      const object = await this.env.LONGHORNS_R2.get(key);
      if (!object) return undefined;
      return object.text();
    } catch (error) {
      console.warn('R2 get failed', error);
      return undefined;
    }
  }

  private async tryR2Put(key: string, value: string): Promise<void> {
    if (!this.env?.LONGHORNS_R2) return;
    try {
      await this.env.LONGHORNS_R2.put(key, value, {
        httpMetadata: { contentType: 'application/json', cacheControl: 'max-age=300' },
      });
    } catch (error) {
      console.warn('R2 put failed', error);
    }
  }

  private async tryD1Get(key: string): Promise<string | undefined> {
    if (!this.env?.LONGHORNS_D1) return undefined;
    try {
      const row = await this.env.LONGHORNS_D1.prepare(
        'SELECT payload FROM longhorns_cache WHERE cache_key = ? LIMIT 1;'
      )
        .bind(key)
        .first<{ payload: string }>();
      return row?.payload;
    } catch (error) {
      console.warn('D1 get failed', error);
      return undefined;
    }
  }

  private async tryD1Put(key: string, value: string): Promise<void> {
    if (!this.env?.LONGHORNS_D1) return;
    try {
      await this.env.LONGHORNS_D1.prepare(
        'INSERT OR REPLACE INTO longhorns_cache (cache_key, payload, updated_at) VALUES (?, ?, ?);'
      )
        .bind(key, value, new Date().toISOString())
        .run();
    } catch (error) {
      console.warn('D1 put failed', error);
    }
  }

  private async tryDoGet(key: string): Promise<string | undefined> {
    if (!this.env?.LONGHORNS_DO) return undefined;
    try {
      const id = this.env.LONGHORNS_DO.idFromName('longhorns-cache');
      const stub = this.env.LONGHORNS_DO.get(id);
      const response = await stub.fetch(`https://longhorns/cache?key=${encodeURIComponent(key)}`, {
        method: 'GET',
      });
      if (!response.ok) return undefined;
      return response.text();
    } catch (error) {
      console.warn('Durable Object get failed', error);
      return undefined;
    }
  }

  private async tryDoPut(key: string, value: string): Promise<void> {
    if (!this.env?.LONGHORNS_DO) return;
    try {
      const id = this.env.LONGHORNS_DO.idFromName('longhorns-cache');
      const stub = this.env.LONGHORNS_DO.get(id);
      await stub.fetch('https://longhorns/cache', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key, value, ttl: 300 }),
      });
    } catch (error) {
      console.warn('Durable Object put failed', error);
    }
  }
}

const defaultCache = new CacheChain();

function selectCache(context?: ToolContext): CacheChain {
  if (context?.cache) return context.cache;
  if (context?.env) return new CacheChain(context.env);
  return defaultCache;
}

function formatChicagoTimestamp(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short',
  });
  const parts = formatter.formatToParts(date);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${lookup.year}-${lookup.month}-${lookup.day} ${lookup.hour}:${lookup.minute}:${lookup.second} ${lookup.timeZoneName}`;
}

function createCitation(id: string, path: string, label: string): Citation {
  return {
    id,
    path,
    label,
    timestamp: formatChicagoTimestamp(),
  };
}

function buildCacheKey(tool: string, args: unknown): string {
  const hash = createHash('sha256')
    .update(JSON.stringify(args ?? {}))
    .digest('hex')
    .slice(0, 16);
  return `longhorns:${tool}:${hash}`;
}

function enforceSportGuard(sport?: string): asserts sport is Sport | undefined {
  if (!sport) return;
  if (SOCCER_KEYWORDS.some((keyword) => sport.toLowerCase().includes(keyword))) {
    throw new LonghornsError(
      'Texas Longhorns MCP server does not cover soccer. Choose baseball, football, basketball, or track & field.',
      'SOCCER_FORBIDDEN'
    );
  }
  if (!SPORT_ORDER.includes(sport as Sport)) {
    throw new LonghornsError(`Unsupported sport: ${sport}.`, 'UNKNOWN_SPORT');
  }
}

function enforceQueryPolicy(query: string): void {
  if (SOCCER_KEYWORDS.some((keyword) => query.toLowerCase().includes(keyword))) {
    throw new LonghornsError(
      'Soccer queries are rejected. Blaze Sports Intel focuses on baseball, football, basketball, and track & field.',
      'SOCCER_FORBIDDEN'
    );
  }
}

type BaseballFeed = typeof baseballFeedJson;
type FootballFeed = typeof footballFeedJson;
type BasketballFeed = typeof basketballFeedJson;
type TrackFieldFeed = typeof trackFieldFeedJson;
type ArchiveFeed = typeof archiveFeedJson;
type TexasBaseballTeamDoc = typeof texasBaseballTeamJson;

type ToolName =
  | 'get_team_seasons'
  | 'get_season_schedule'
  | 'get_game_box_score'
  | 'get_player_career'
  | 'get_rankings_context'
  | 'search_archive';

type Resolver<T> = () => Promise<Omit<ToolPayload<T>, 'generatedAt'>>;

async function withCache<T>(
  tool: ToolName,
  args: unknown,
  context: ToolContext | undefined,
  resolver: Resolver<T>
): Promise<ToolResponse<T>> {
  const cache = selectCache(context);
  const key = buildCacheKey(tool, args);
  const cached = await cache.get(key);
  if (cached) {
    const payload = JSON.parse(cached) as ToolPayload<T>;
    return {
      ...payload,
      meta: { cache: { key, status: 'HIT' } },
    };
  }

  const freshPayload = await resolver();
  const generatedAt = formatChicagoTimestamp();
  const payload: ToolPayload<T> = {
    ...freshPayload,
    generatedAt,
  };
  await cache.put(key, JSON.stringify(payload));
  return {
    ...payload,
    meta: { cache: { key, status: 'MISS' } },
  };
}

const baseballFeed: BaseballFeed = baseballFeedJson;
const footballFeed: FootballFeed = footballFeedJson;
const basketballFeed: BasketballFeed = basketballFeedJson;
const trackFieldFeed: TrackFieldFeed = trackFieldFeedJson;
const archiveFeed: ArchiveFeed = archiveFeedJson;
const texasBaseballDoc: TexasBaseballTeamDoc = texasBaseballTeamJson;

const CITATION_SOURCES: Record<Sport, Citation[]> = {
  baseball: [
    createCitation(
      'baseball-feed',
      'mcp/texas-longhorns/feeds/baseball.json',
      'Texas baseball feed'
    ),
    createCitation(
      'baseball-dossier',
      'data/college-baseball/teams/texas-longhorns.json',
      'Texas baseball dossier'
    ),
  ],
  football: [
    createCitation(
      'football-feed',
      'mcp/texas-longhorns/feeds/football.json',
      'Texas football feed'
    ),
  ],
  basketball: [
    createCitation(
      'basketball-feed',
      'mcp/texas-longhorns/feeds/basketball.json',
      'Texas basketball feed'
    ),
  ],
  track_field: [
    createCitation(
      'track-feed',
      'mcp/texas-longhorns/feeds/track-field.json',
      'Texas track & field feed'
    ),
  ],
};

const ARCHIVE_CITATION = createCitation(
  'archive-feed',
  'mcp/texas-longhorns/feeds/archive.json',
  'Texas Longhorns archive feed'
);

function collectCitations(sports: Sport[]): Citation[] {
  const seen = new Map<string, Citation>();
  for (const sport of sports) {
    for (const citation of CITATION_SOURCES[sport]) {
      if (!seen.has(citation.id)) {
        seen.set(citation.id, { ...citation, timestamp: formatChicagoTimestamp() });
      }
    }
  }
  return Array.from(seen.values());
}

interface GetTeamSeasonsArgs {
  sport?: Sport;
  team?: string;
}

interface TeamSeasonsResponse {
  team: string;
  sports: Array<{
    sport: Sport;
    seasons: Array<Record<string, unknown>>;
  }>;
}

function buildBaseballSeasons(): Array<Record<string, unknown>> {
  return baseballFeed.seasons.map((season) => ({
    year: season.year,
    record: season.record,
    conferenceRecord: season.conferenceRecord,
    postseason: season.postseason,
    achievements: season.achievements ?? [],
    seasonSummary:
      season.year === texasBaseballDoc.season ? texasBaseballDoc.seasonSummary : undefined,
  }));
}

function buildFootballSeasons(): Array<Record<string, unknown>> {
  return footballFeed.seasons.map((season) => ({
    year: season.year,
    record: season.record,
    conference: season.conference,
    postseason: season.postseason,
    headlineWins: season.headlineWins,
    finalRankings: season.finalRankings,
  }));
}

function buildBasketballSeasons(): Array<Record<string, unknown>> {
  return basketballFeed.programs.map((program) => ({
    program: program.program,
    seasons: program.seasons,
  }));
}

function buildTrackSeasons(): Array<Record<string, unknown>> {
  return trackFieldFeed.programs.map((program) => ({
    program: program.program,
    seasons: program.seasons,
  }));
}

function seasonsBySport(sport: Sport): Array<Record<string, unknown>> {
  switch (sport) {
    case 'baseball':
      return buildBaseballSeasons();
    case 'football':
      return buildFootballSeasons();
    case 'basketball':
      return buildBasketballSeasons();
    case 'track_field':
      return buildTrackSeasons();
    default:
      return [];
  }
}

export async function get_team_seasons(
  args: GetTeamSeasonsArgs = {},
  context?: ToolContext
): Promise<ToolResponse<TeamSeasonsResponse>> {
  const { sport, team } = args;
  if (team && team !== TEAM_NAME) {
    throw new LonghornsError(`Unsupported team: ${team}`, 'UNKNOWN_TEAM');
  }
  enforceSportGuard(sport);

  const sportsToReturn = sport ? [sport] : SPORT_ORDER;

  return withCache('get_team_seasons', args, context, async () => ({
    result: {
      team: TEAM_NAME,
      sports: sportsToReturn.map((sportKey) => ({
        sport: sportKey,
        seasons: seasonsBySport(sportKey),
      })),
    },
    citations: collectCitations(sportsToReturn),
  }));
}

interface GetSeasonScheduleArgs {
  sport: Sport;
  season: string;
  program?: string;
}

interface ScheduleEntry {
  id: string;
  date: string;
  opponent?: string;
  location: string;
  note?: string;
  network?: string;
  result?: string;
  focus?: string;
}

interface SeasonScheduleResponse {
  sport: Sport;
  season: string;
  schedule: ScheduleEntry[];
}

function getBaseballSchedule(season: string): ScheduleEntry[] {
  const schedule = baseballFeed.schedule[season as keyof typeof baseballFeed.schedule];
  if (!schedule) return [];
  return schedule
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((game) => ({
      id: game.gameId,
      date: game.date,
      opponent: game.opponent,
      location: game.location,
      note: game.note,
    }));
}

function getFootballSchedule(season: string): ScheduleEntry[] {
  const schedule = footballFeed.schedule[season as keyof typeof footballFeed.schedule];
  if (!schedule) return [];
  return schedule
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((game) => ({
      id: game.gameId,
      date: game.date,
      opponent: game.opponent,
      location: game.location,
      network: game.network,
      result: game.result,
    }));
}

function getBasketballSchedule(season: string, program?: string): ScheduleEntry[] {
  const schedules: ScheduleEntry[] = [];
  for (const prog of basketballFeed.programs) {
    if (program && prog.program.toLowerCase() !== program.toLowerCase()) continue;
    const seasonSchedule = prog.schedule?.[season as keyof typeof prog.schedule];
    if (!seasonSchedule) continue;
    schedules.push(
      ...seasonSchedule.map((game) => ({
        id: game.gameId,
        date: game.date,
        opponent: game.opponent,
        location: game.location,
        result: game.result,
        note: prog.program,
      }))
    );
  }
  return schedules.sort((a, b) => a.date.localeCompare(b.date));
}

function getTrackSchedule(season: string, program?: string): ScheduleEntry[] {
  const entries: ScheduleEntry[] = [];
  for (const prog of trackFieldFeed.programs) {
    if (program && prog.program.toLowerCase() !== program.toLowerCase()) continue;
    const seasonSchedule = prog.schedule?.[season as keyof typeof prog.schedule];
    if (!seasonSchedule) continue;
    entries.push(
      ...seasonSchedule.map((meet) => ({
        id: meet.meetId,
        date: meet.date,
        location: meet.location,
        note: meet.focus,
        opponent: meet.meet,
      }))
    );
  }
  return entries.sort((a, b) => a.date.localeCompare(b.date));
}

export async function get_season_schedule(
  args: GetSeasonScheduleArgs,
  context?: ToolContext
): Promise<ToolResponse<SeasonScheduleResponse>> {
  enforceSportGuard(args?.sport);

  const schedule = (() => {
    switch (args.sport) {
      case 'baseball':
        return getBaseballSchedule(args.season);
      case 'football':
        return getFootballSchedule(args.season);
      case 'basketball':
        return getBasketballSchedule(args.season, args.program);
      case 'track_field':
        return getTrackSchedule(args.season, args.program);
      default:
        return [];
    }
  })();

  return withCache('get_season_schedule', args, context, async () => ({
    result: {
      sport: args.sport,
      season: args.season,
      schedule,
    },
    citations: collectCitations([args.sport]),
  }));
}

interface GetGameBoxScoreArgs {
  sport: Sport;
  gameId: string;
  program?: string;
}

interface GameBoxScoreResponse {
  sport: Sport;
  gameId: string;
  data: Record<string, unknown>;
}

function findBaseballBoxScore(gameId: string): Record<string, unknown> | undefined {
  return baseballFeed.boxScores[gameId as keyof typeof baseballFeed.boxScores];
}

function findFootballBoxScore(gameId: string): Record<string, unknown> | undefined {
  return footballFeed.boxScores[gameId as keyof typeof footballFeed.boxScores];
}

function findBasketballBoxScore(
  gameId: string,
  program?: string
): Record<string, unknown> | undefined {
  const entry = basketballFeed.boxScores[gameId as keyof typeof basketballFeed.boxScores];
  if (!entry) return undefined;
  if (program && entry.program.toLowerCase() !== program.toLowerCase()) return undefined;
  return entry;
}

function findTrackResult(gameId: string, program?: string): Record<string, unknown> | undefined {
  for (const prog of trackFieldFeed.programs) {
    if (program && prog.program.toLowerCase() !== program.toLowerCase()) continue;
    const result = prog.results?.[gameId as keyof typeof prog.results];
    if (result) {
      return { program: prog.program, ...result };
    }
  }
  return undefined;
}

export async function get_game_box_score(
  args: GetGameBoxScoreArgs,
  context?: ToolContext
): Promise<ToolResponse<GameBoxScoreResponse>> {
  enforceSportGuard(args?.sport);

  const data = (() => {
    switch (args.sport) {
      case 'baseball':
        return findBaseballBoxScore(args.gameId);
      case 'football':
        return findFootballBoxScore(args.gameId);
      case 'basketball':
        return findBasketballBoxScore(args.gameId, args.program);
      case 'track_field':
        return findTrackResult(args.gameId, args.program);
      default:
        return undefined;
    }
  })();

  if (!data) {
    throw new LonghornsError(`Box score not found for ${args.gameId}`, 'NOT_FOUND');
  }

  return withCache('get_game_box_score', args, context, async () => ({
    result: {
      sport: args.sport,
      gameId: args.gameId,
      data,
    },
    citations: collectCitations([args.sport]),
  }));
}

interface GetPlayerCareerArgs {
  playerId: string;
  sport?: Sport;
}

interface PlayerCareerResponse {
  playerId: string;
  sport: Sport;
  profile: Record<string, unknown>;
}

function normalizeId(value: string): string {
  return value.toLowerCase();
}

function findPlayer(
  args: GetPlayerCareerArgs
): { sport: Sport; profile: Record<string, unknown> } | undefined {
  const requestedSport = args.sport;

  const searchSports = requestedSport ? [requestedSport] : SPORT_ORDER;

  for (const sport of searchSports) {
    switch (sport) {
      case 'baseball': {
        const match = baseballFeed.players.find(
          (player) => normalizeId(player.id) === normalizeId(args.playerId)
        );
        if (match) {
          return { sport, profile: match };
        }
        break;
      }
      case 'football': {
        const match = footballFeed.impactPlayers.find(
          (player) => normalizeId(player.id) === normalizeId(args.playerId)
        );
        if (match) {
          return { sport, profile: match };
        }
        break;
      }
      case 'basketball': {
        for (const program of basketballFeed.programs) {
          const match = program.impactPlayers.find(
            (player) => normalizeId(player.id) === normalizeId(args.playerId)
          );
          if (match) {
            return { sport, profile: { program: program.program, ...match } };
          }
        }
        break;
      }
      case 'track_field': {
        for (const program of trackFieldFeed.programs) {
          const match = program.athletes.find(
            (athlete) => normalizeId(athlete.id) === normalizeId(args.playerId)
          );
          if (match) {
            return { sport, profile: { program: program.program, ...match } };
          }
        }
        break;
      }
      default:
        break;
    }
  }

  return undefined;
}

export async function get_player_career(
  args: GetPlayerCareerArgs,
  context?: ToolContext
): Promise<ToolResponse<PlayerCareerResponse>> {
  enforceSportGuard(args?.sport);
  const player = findPlayer(args);
  if (!player) {
    throw new LonghornsError(`Player ${args.playerId} not found in approved feeds.`, 'NOT_FOUND');
  }

  return withCache('get_player_career', args, context, async () => ({
    result: {
      playerId: args.playerId,
      sport: player.sport,
      profile: player.profile,
    },
    citations: collectCitations([player.sport]),
  }));
}

interface RankingsContextArgs {
  sport?: Sport;
  season?: string;
}

interface RankingsContextResponse {
  sports: Array<{
    sport: Sport;
    context: Record<string, unknown>;
  }>;
}

function buildRankingsContext(sport: Sport, season?: string): Record<string, unknown> {
  switch (sport) {
    case 'baseball':
      return {
        latest: baseballFeed.seasons[0]?.achievements,
        d1baseballRanking: '#5',
        rpiRanking: '#6',
        dossierTimestamp: texasBaseballDoc.lastUpdated,
      };
    case 'football':
      return {
        rankings: footballFeed.rankings,
        season: season ?? '2025Preseason',
      };
    case 'basketball':
      return {
        men: basketballFeed.programs.find((program) => program.program === 'Men')?.rankings,
        women: basketballFeed.programs.find((program) => program.program === 'Women')?.rankings,
        season: season ?? '2025Preseason',
      };
    case 'track_field':
      return {
        women: trackFieldFeed.programs.find((program) => program.program === 'Women')?.seasons,
        men: trackFieldFeed.programs.find((program) => program.program === 'Men')?.seasons,
        lastUpdated: trackFieldFeed.lastUpdated,
      };
    default:
      return {};
  }
}

export async function get_rankings_context(
  args: RankingsContextArgs = {},
  context?: ToolContext
): Promise<ToolResponse<RankingsContextResponse>> {
  enforceSportGuard(args?.sport);

  const sportsToReturn = args.sport ? [args.sport] : SPORT_ORDER;

  return withCache('get_rankings_context', args, context, async () => ({
    result: {
      sports: sportsToReturn.map((sportKey) => ({
        sport: sportKey,
        context: buildRankingsContext(sportKey, args.season),
      })),
    },
    citations: collectCitations(sportsToReturn),
  }));
}

interface SearchArchiveArgs {
  query: string;
  limit?: number;
}

interface ArchiveEntry {
  id: string;
  sport: Sport;
  date: string;
  headline: string;
  summary: string;
  source: string;
}

interface SearchArchiveResponse {
  query: string;
  results: ArchiveEntry[];
}

function aggregateArchiveEntries(): ArchiveEntry[] {
  const combined: ArchiveEntry[] = archiveFeed.entries.map((entry) => ({
    ...entry,
    sport: entry.sport as Sport,
  }));

  if (Array.isArray(trackFieldFeed.archive)) {
    combined.push(
      ...trackFieldFeed.archive.map((entry) => ({
        id: entry.id,
        sport: 'track_field' as Sport,
        date: entry.date,
        headline: entry.title,
        summary: entry.summary,
        source: 'Track & Field Archive',
      }))
    );
  }

  return combined;
}

const ARCHIVE_ENTRIES = aggregateArchiveEntries();

export async function search_archive(
  args: SearchArchiveArgs,
  context?: ToolContext
): Promise<ToolResponse<SearchArchiveResponse>> {
  enforceQueryPolicy(args.query);

  const limit = Math.min(Math.max(args.limit ?? 5, 1), 20);
  const results = ARCHIVE_ENTRIES.filter(
    (entry) =>
      entry.headline.toLowerCase().includes(args.query.toLowerCase()) ||
      entry.summary.toLowerCase().includes(args.query.toLowerCase())
  )
    .sort((a, b) => {
      const sportRank = SPORT_ORDER.indexOf(a.sport) - SPORT_ORDER.indexOf(b.sport);
      if (sportRank !== 0) return sportRank;
      return b.date.localeCompare(a.date);
    })
    .slice(0, limit);

  return withCache('search_archive', args, context, async () => ({
    result: {
      query: args.query,
      results,
    },
    citations: [
      { ...ARCHIVE_CITATION, timestamp: formatChicagoTimestamp() },
      ...collectCitations(Array.from(new Set(results.map((entry) => entry.sport)))),
    ],
  }));
}

export { CacheChain, LonghornsError, buildCacheKey, collectCitations, formatChicagoTimestamp };
