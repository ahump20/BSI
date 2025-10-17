import crypto from 'node:crypto';
import { S3Client, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { BoxScoreSchema, type BoxScore, type TeamBoxScore } from '../../../schema/boxscore.js';
import { GameSchema, type Game } from '../../../schema/game.js';
import { TeamSchema, type Team } from '../../../schema/team.js';
import { PlayerSchema, type Player } from '../../../schema/player.js';

const HighlightlyResponseSchema = z.object({
  games: z.array(z.unknown()).default([]),
});

const SportsRadarResponseSchema = z.object({
  games: z.array(z.unknown()).default([]),
});

type Env = Record<string, string | undefined> & {
  HIGHLIGHTLY_API_KEY?: string;
  HIGHLIGHTLY_API_BASE_URL?: string;
  SPORTSRADAR_API_KEY?: string;
  SPORTSRADAR_API_BASE_URL?: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_ACCOUNT_ID?: string;
  R2_BUCKET_NAME?: string;
  R2_ENDPOINT?: string;
};

type ProviderBoxScore = BoxScore & { externalId?: string };

type IngestOptions = {
  date?: string;
};

export async function ingestBaseballBoxscores(env: Env, options: IngestOptions = {}) {
  const [highlightly, sportsradar] = await Promise.all([
    fetchHighlightlyBoxscores(env, options),
    fetchSportsRadarBoxscores(env, options),
  ]);

  const merged = mergeBoxscores([...highlightly, ...sportsradar]);
  if (!merged.length) {
    return { processed: 0, skipped: true };
  }

  const supabase = createSupabase(env);
  const r2 = createR2(env);

  let persisted = 0;
  for (const boxscore of merged) {
    if (supabase) {
      await persistToSupabase(supabase, boxscore);
    }
    if (r2) {
      await persistToR2(r2, env, boxscore);
    }
    persisted += 1;
  }

  return { processed: merged.length, persisted };
}

export default async function handler(event: any, context: any) {
  const env: Env = context?.env ?? process?.env ?? {};
  const date = event?.queryStringParameters?.date ?? undefined;

  try {
    const result = await ingestBaseballBoxscores(env, { date });
    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'ok', ...result }),
      headers: { 'content-type': 'application/json' },
    };
  } catch (error) {
    console.error('[INGEST][BOX SCORES]', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ status: 'error', message: (error as Error).message }),
      headers: { 'content-type': 'application/json' },
    };
  }
}

async function fetchHighlightlyBoxscores(env: Env, options: IngestOptions): Promise<ProviderBoxScore[]> {
  if (!env.HIGHLIGHTLY_API_KEY || !env.HIGHLIGHTLY_API_BASE_URL) {
    console.warn('[INGEST][HIGHLIGHTLY] Missing API configuration – skipping');
    return [];
  }

  const url = new URL('/v1/baseball/boxscores', env.HIGHLIGHTLY_API_BASE_URL);
  if (options.date) {
    url.searchParams.set('date', options.date);
  }

  const response = await fetch(url.toString(), {
    headers: {
      'x-api-key': env.HIGHLIGHTLY_API_KEY,
      accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Highlightly boxscore request failed: ${response.status}`);
  }

  const payload = HighlightlyResponseSchema.parse(await response.json());
  const mapped: ProviderBoxScore[] = [];

  for (const raw of payload.games) {
    const normalized = mapHighlightlyBoxscore(raw);
    const parsed = BoxScoreSchema.parse({ ...normalized, source: 'highlightly' });
    mapped.push({ ...parsed, externalId: parsed.game.metadata?.externalIds?.sportsradar });
  }

  return mapped;
}

async function fetchSportsRadarBoxscores(env: Env, options: IngestOptions): Promise<ProviderBoxScore[]> {
  if (!env.SPORTSRADAR_API_KEY || !env.SPORTSRADAR_API_BASE_URL) {
    console.warn('[INGEST][SPORTSRADAR] Missing API configuration – skipping');
    return [];
  }

  const url = new URL('/games/US/college-baseball/boxscores', env.SPORTSRADAR_API_BASE_URL);
  if (options.date) {
    url.searchParams.set('date', options.date);
  }
  url.searchParams.set('api_key', env.SPORTSRADAR_API_KEY);

  const response = await fetch(url.toString(), {
    headers: {
      accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`SportsRadar boxscore request failed: ${response.status}`);
  }

  const payload = SportsRadarResponseSchema.parse(await response.json());
  const mapped: ProviderBoxScore[] = [];

  for (const raw of payload.games) {
    const normalized = mapSportsRadarBoxscore(raw);
    const parsed = BoxScoreSchema.parse({ ...normalized, source: 'sportsradar' });
    mapped.push({ ...parsed, externalId: parsed.game.metadata?.externalIds?.sportsradar ?? parsed.game.id });
  }

  return mapped;
}

function mapHighlightlyBoxscore(raw: any): Omit<BoxScore, 'source'> {
  const gameInfo = raw?.game ?? raw;
  const homeTeam = findTeam(raw, 'home');
  const awayTeam = findTeam(raw, 'away');

  const game: Game = GameSchema.parse({
    id: String(gameInfo?.id ?? gameInfo?.gameId ?? crypto.randomUUID()),
    provider: 'highlightly',
    sport: 'baseball',
    league: String(gameInfo?.league ?? 'ncaa'),
    season: String(gameInfo?.season ?? new Date().getFullYear()),
    scheduled: new Date(gameInfo?.scheduled ?? gameInfo?.start ?? Date.now()).toISOString(),
    status: normalizeGameStatus(gameInfo?.status),
    homeTeamId: String(homeTeam?.team?.id ?? homeTeam?.id ?? 'home'),
    awayTeamId: String(awayTeam?.team?.id ?? awayTeam?.id ?? 'away'),
    venue: toVenue(gameInfo?.venue),
    metadata: {
      externalIds: {
        sportsradar: gameInfo?.external_ids?.sportsradar ?? gameInfo?.sportRadarId,
      },
      raw,
    },
  });

  return {
    game,
    teams: {
      home: mapTeamBoxscore(homeTeam, 'highlightly'),
      away: mapTeamBoxscore(awayTeam, 'highlightly'),
    },
    lastUpdated: new Date(gameInfo?.updated ?? Date.now()).toISOString(),
  };
}

function mapSportsRadarBoxscore(raw: any): Omit<BoxScore, 'source'> {
  const gameInfo = raw?.summary ?? raw;
  const game: Game = GameSchema.parse({
    id: String(raw?.id ?? gameInfo?.id ?? crypto.randomUUID()),
    provider: 'sportsradar',
    sport: 'baseball',
    league: String(raw?.league?.alias ?? 'ncaa'),
    season: String(raw?.season?.year ?? new Date().getFullYear()),
    scheduled: new Date(raw?.scheduled ?? raw?.start_time ?? Date.now()).toISOString(),
    status: normalizeGameStatus(raw?.status),
    homeTeamId: String(raw?.home?.id ?? 'home'),
    awayTeamId: String(raw?.away?.id ?? 'away'),
    venue: toVenue(raw?.venue),
    metadata: {
      externalIds: {
        sportsradar: raw?.id,
      },
      raw,
    },
  });

  return {
    game,
    teams: {
      home: mapTeamBoxscore(raw?.home, 'sportsradar'),
      away: mapTeamBoxscore(raw?.away, 'sportsradar'),
    },
    lastUpdated: new Date(raw?.last_updated ?? Date.now()).toISOString(),
  };
}

function findTeam(raw: any, side: 'home' | 'away') {
  if (!raw) return null;
  if (raw?.teams) {
    return raw.teams.find((team: any) => team?.side === side || team?.homeAway === side) ?? null;
  }
  return raw?.[side] ?? null;
}

function mapTeamBoxscore(raw: any, provider: 'highlightly' | 'sportsradar'): TeamBoxScore {
  if (!raw) {
    const fallbackTeam: Team = TeamSchema.parse({
      id: crypto.randomUUID(),
      provider,
      sport: 'baseball',
      league: 'ncaa',
      name: provider === 'highlightly' ? 'Unknown Highlightly Team' : 'Unknown SportsRadar Team',
    });

    return {
      team: fallbackTeam,
    };
  }

  const team: Team = TeamSchema.parse({
    id: String(raw?.team?.id ?? raw?.id ?? crypto.randomUUID()),
    provider,
    sport: 'baseball',
    league: String(raw?.team?.league ?? raw?.league ?? 'ncaa'),
    name: String(raw?.team?.name ?? raw?.name ?? 'Unknown Team'),
    market: raw?.team?.market ?? raw?.market,
    nickname: raw?.team?.nickname ?? raw?.nickname,
    abbreviation: raw?.team?.abbr ?? raw?.abbr,
    metadata: { raw },
  });

  const stats = raw?.statistics ?? raw?.stats ?? {};
  const batting = Array.isArray(stats?.batters)
    ? stats.batters.map((entry: any) => mapPlayerLine(entry, provider, team.id))
    : Array.isArray(raw?.batters)
    ? raw.batters.map((entry: any) => mapPlayerLine(entry, provider, team.id))
    : undefined;

  const pitching = Array.isArray(stats?.pitchers)
    ? stats.pitchers.map((entry: any) => mapPlayerLine(entry, provider, team.id))
    : Array.isArray(raw?.pitchers)
    ? raw.pitchers.map((entry: any) => mapPlayerLine(entry, provider, team.id))
    : undefined;

  const scoreByInning = Array.isArray(raw?.scoring?.innings)
    ? raw.scoring.innings.map((inning: any) => Number(inning?.runs ?? inning ?? 0))
    : Array.isArray(raw?.innings)
    ? raw.innings.map((inning: any) => Number(inning?.runs ?? inning ?? 0))
    : undefined;

  const totals = pruneEmpty({
    runs: toNumber(raw?.totals?.runs ?? raw?.runs),
    hits: toNumber(raw?.totals?.hits ?? raw?.hits),
    errors: toNumber(raw?.totals?.errors ?? raw?.errors),
  });

  return {
    team,
    scoreByInning,
    totals,
    batters: batting,
    pitchers: pitching,
    lastUpdated: new Date(raw?.updated ?? raw?.last_updated ?? Date.now()).toISOString(),
  };
}

function mapPlayerLine(raw: any, provider: 'highlightly' | 'sportsradar', teamId: string) {
  const player: Player = PlayerSchema.parse({
    id: String(raw?.player?.id ?? raw?.id ?? crypto.randomUUID()),
    teamId,
    provider,
    firstName: String(raw?.player?.first_name ?? raw?.first_name ?? raw?.firstName ?? 'Unknown'),
    lastName: String(raw?.player?.last_name ?? raw?.last_name ?? raw?.lastName ?? ''),
    fullName: raw?.player?.full_name ?? raw?.full_name ?? raw?.fullName,
    position: raw?.player?.position ?? raw?.position,
    jerseyNumber: raw?.player?.jersey_number ?? raw?.jersey_number ?? raw?.jerseyNumber,
    bats: raw?.player?.bats ?? raw?.bats,
    throws: raw?.player?.throws ?? raw?.throws,
    metadata: { raw },
  });

  const batting = raw?.batting ?? raw;
  const pitching = raw?.pitching ?? raw;
  const fielding = raw?.fielding ?? raw;

  const battingLine = pruneEmpty({
    atBats: toNumber(batting?.at_bats ?? batting?.ab),
    runs: toNumber(batting?.runs ?? batting?.r),
    hits: toNumber(batting?.hits ?? batting?.h),
    doubles: toNumber(batting?.doubles ?? batting?.d),
    triples: toNumber(batting?.triples ?? batting?.t),
    homeRuns: toNumber(batting?.home_runs ?? batting?.hr),
    rbi: toNumber(batting?.rbi ?? batting?.rbis),
    walks: toNumber(batting?.walks ?? batting?.bb),
    strikeOuts: toNumber(batting?.strikeouts ?? batting?.so),
    stolenBases: toNumber(batting?.stolen_bases ?? batting?.sb),
  });

  const pitchingLine = pruneEmpty({
    inningsPitched: toNumber(pitching?.innings ?? pitching?.ip),
    hits: toNumber(pitching?.hits_allowed ?? pitching?.h),
    runs: toNumber(pitching?.runs ?? pitching?.r),
    earnedRuns: toNumber(pitching?.earned_runs ?? pitching?.er),
    walks: toNumber(pitching?.walks ?? pitching?.bb),
    strikeOuts: toNumber(pitching?.strikeouts ?? pitching?.so),
    pitches: toNumber(pitching?.pitches ?? pitching?.pc),
  });

  const fieldingLine = pruneEmpty({
    assists: toNumber(fielding?.assists ?? fielding?.a),
    putOuts: toNumber(fielding?.putouts ?? fielding?.po),
    errors: toNumber(fielding?.errors ?? fielding?.e),
  });

  return {
    player,
    batting: battingLine,
    pitching: pitchingLine,
    fielding: fieldingLine,
  };
}

function normalizeGameStatus(status?: string): Game['status'] {
  const normalized = (status ?? 'scheduled').toLowerCase();
  if (['scheduled', 'created', 'preview'].includes(normalized)) return 'scheduled';
  if (['in progress', 'live', 'in_progress', 'ongoing'].includes(normalized)) return 'in_progress';
  if (['delayed', 'suspended'].includes(normalized)) return 'delayed';
  if (['postponed'].includes(normalized)) return 'postponed';
  if (['cancelled', 'canceled'].includes(normalized)) return 'cancelled';
  return 'final';
}

function toVenue(raw: any) {
  if (!raw) return undefined;
  return {
    name: raw?.name ?? raw?.venue_name,
    city: raw?.city,
    state: raw?.state ?? raw?.state_abbr,
  };
}

function toNumber(value: any): number | undefined {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return undefined;
  }
  return Number(value);
}

function pruneEmpty<T extends Record<string, unknown>>(value: T): T | undefined {
  const entries = Object.entries(value).filter(([, v]) => v !== undefined && v !== null);
  if (!entries.length) return undefined;
  return Object.fromEntries(entries) as T;
}

function mergeBoxscores(boxscores: ProviderBoxScore[]): BoxScore[] {
  const merged = new Map<string, ProviderBoxScore>();

  for (const boxscore of boxscores) {
    const key = boxscore.externalId ?? boxscore.game.id;
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, boxscore);
      continue;
    }

    merged.set(key, mergeProviderBoxscore(existing, boxscore));
  }

  return Array.from(merged.values()).map((entry) => ({ ...entry }));
}

function mergeProviderBoxscore(primary: ProviderBoxScore, incoming: ProviderBoxScore): ProviderBoxScore {
  const newer = new Date(incoming.lastUpdated).getTime() > new Date(primary.lastUpdated).getTime();
  const base = newer ? incoming : primary;
  const secondary = newer ? primary : incoming;

  return {
    ...base,
    teams: {
      home: mergeTeamBoxScore(base.teams.home, secondary.teams.home),
      away: mergeTeamBoxScore(base.teams.away, secondary.teams.away),
    },
    lastUpdated: new Date(Math.max(new Date(base.lastUpdated).getTime(), new Date(secondary.lastUpdated).getTime())).toISOString(),
    externalId: base.externalId ?? secondary.externalId,
    game: {
      ...base.game,
      metadata: {
        ...secondary.game.metadata,
        ...base.game.metadata,
      },
    },
  };
}

function mergeTeamBoxScore(primary: TeamBoxScore, secondary?: TeamBoxScore): TeamBoxScore {
  if (!secondary) return primary;

  const chooseArray = (a?: any[], b?: any[]) => {
    if (a && a.length) return a;
    if (b && b.length) return b;
    return undefined;
  };

  return {
    ...primary,
    team: {
      ...secondary.team,
      ...primary.team,
      metadata: {
        ...secondary.team.metadata,
        ...primary.team.metadata,
      },
    },
    scoreByInning: primary.scoreByInning?.length ? primary.scoreByInning : secondary.scoreByInning,
    totals: {
      runs: primary.totals?.runs ?? secondary.totals?.runs,
      hits: primary.totals?.hits ?? secondary.totals?.hits,
      errors: primary.totals?.errors ?? secondary.totals?.errors,
    },
    batters: chooseArray(primary.batters, secondary.batters),
    pitchers: chooseArray(primary.pitchers, secondary.pitchers),
    lastUpdated: primary.lastUpdated ?? secondary.lastUpdated,
  };
}

function createSupabase(env: Env): SupabaseClient | null {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[INGEST][SUPABASE] Missing credentials – skipping persistence');
    return null;
  }

  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

function createR2(env: Env): S3Client | null {
  if (!env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET_NAME) {
    console.warn('[INGEST][R2] Missing credentials – skipping persistence');
    return null;
  }

  const endpoint = env.R2_ENDPOINT ?? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
}

async function persistToSupabase(client: SupabaseClient, boxscore: BoxScore) {
  const payload = {
    game_id: boxscore.game.id,
    provider: boxscore.source,
    last_updated: boxscore.lastUpdated,
    data: boxscore,
  };

  const { error } = await client
    .from('baseball_boxscores')
    .upsert(payload, { onConflict: 'game_id,provider' });

  if (error) {
    throw new Error(`Supabase upsert failed for game ${boxscore.game.id}: ${error.message}`);
  }
}

async function persistToR2(client: S3Client, env: Env, boxscore: BoxScore) {
  const bucket = env.R2_BUCKET_NAME!;
  const key = `baseball/boxscores/${boxscore.game.id}.json`;
  const body = JSON.stringify(boxscore);
  const hash = crypto.createHash('sha256').update(body).digest('hex');

  try {
    const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    const existingHash = head.Metadata?.hash;
    if (existingHash === hash) {
      return;
    }
  } catch (error: any) {
    if (error?.$metadata?.httpStatusCode !== 404 && error?.Code !== 'NoSuchKey') {
      throw error;
    }
  }

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: 'application/json',
      Metadata: { hash },
    }),
  );
}
