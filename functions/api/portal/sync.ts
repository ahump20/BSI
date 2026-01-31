/* eslint-disable no-undef */
/**
 * Transfer Portal Live Data Sync
 *
 * Fetches real transfer portal data from Highlightly / RapidAPI,
 * normalizes it, and upserts into D1 via the ingest pipeline.
 *
 * POST /api/portal/sync — triggers manual sync
 * Also callable from scheduled cron via service binding.
 *
 * Requires env secrets:
 *   - RAPIDAPI_KEY (x-rapidapi-key for Highlightly Pro)
 *
 * Data flow:
 *   Highlightly API -> normalize -> D1 upsert -> KV freshness -> R2 snapshot
 */

interface Env {
  GAME_DB: D1Database;
  KV: KVNamespace;
  SPORTS_DATA: R2Bucket;
  RAPIDAPI_KEY: string;
}

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

const BASEBALL_API_BASE = 'https://baseball.highlightly.net';
const FOOTBALL_API_BASE = 'https://american-football.highlightly.net';
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1_000;

interface RawPlayer {
  id?: number | string;
  name?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  position?: string;
  team?: RawTeam;
  previousTeam?: RawTeam;
  fromTeam?: RawTeam;
  toTeam?: RawTeam;
  school?: string;
  previousSchool?: string;
  destinationSchool?: string;
  status?: string;
  transferStatus?: string;
  portalStatus?: string;
  entryDate?: string;
  portalDate?: string;
  commitDate?: string;
  commitmentDate?: string;
  year?: string;
  classYear?: string;
  eligibility?: string;
  ranking?: number;
  stars?: number;
  rating?: number;
  conference?: string;
  fromConference?: string;
  toConference?: string;
  statistics?: Record<string, unknown>;
  stats?: Record<string, unknown>;
}

interface RawTeam {
  id?: number | string;
  name?: string;
  displayName?: string;
  abbreviation?: string;
  conference?: string | { name?: string };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  apiKey: string,
  retries = MAX_RETRIES
): Promise<Response> {
  let lastError: Error = new Error('No attempts made');

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const response = await fetch(url, {
        headers: {
          'x-rapidapi-key': apiKey,
          Accept: 'application/json',
          'User-Agent': 'BSI-Portal-Sync/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
        await sleep(delay);
        continue;
      }

      if (response.ok) return response;

      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    if (attempt < retries - 1) {
      await sleep(RETRY_BASE_DELAY_MS * Math.pow(2, attempt));
    }
  }

  throw lastError;
}

function extractPlayerName(raw: RawPlayer): string {
  if (raw.fullName) return raw.fullName;
  if (raw.name) return raw.name;
  if (raw.firstName && raw.lastName) return `${raw.firstName} ${raw.lastName}`;
  return 'Unknown Player';
}

function extractTeamName(team?: RawTeam): string {
  if (!team) return '';
  return team.displayName || team.name || '';
}

function extractConference(team?: RawTeam): string {
  if (!team) return '';
  if (typeof team.conference === 'string') return team.conference;
  if (typeof team.conference === 'object' && team.conference?.name) return team.conference.name;
  return '';
}

function normalizeStatus(raw?: string): 'in_portal' | 'committed' | 'withdrawn' | 'signed' {
  if (!raw) return 'in_portal';
  const status = raw.toLowerCase();
  if (status.includes('commit')) return 'committed';
  if (status.includes('sign')) return 'signed';
  if (status.includes('withdraw')) return 'withdrawn';
  return 'in_portal';
}

function normalizeClassYear(raw?: string): 'Fr' | 'So' | 'Jr' | 'Sr' | 'Gr' {
  if (!raw) return 'Jr';
  const yr = raw.toLowerCase();
  if (yr.includes('fresh') || yr === 'fr') return 'Fr';
  if (yr.includes('soph') || yr === 'so') return 'So';
  if (yr.includes('jun') || yr === 'jr') return 'Jr';
  if (yr.includes('sen') || yr === 'sr') return 'Sr';
  if (yr.includes('grad') || yr === 'gr' || yr.includes('5th')) return 'Gr';
  return 'Jr';
}

function normalizeBaseballPosition(raw?: string): string {
  if (!raw) return 'UTL';
  const pos = raw.toUpperCase().trim();
  const valid = ['RHP', 'LHP', 'C', '1B', '2B', 'SS', '3B', 'OF', 'DH', 'UTL', 'P'];
  if (valid.includes(pos)) return pos;
  if (pos.includes('PITCH') || pos === 'SP' || pos === 'RP' || pos === 'CL') return 'RHP';
  if (pos.includes('CATCH')) return 'C';
  if (pos.includes('SHORT')) return 'SS';
  if (pos.includes('OUT')) return 'OF';
  return 'UTL';
}

function normalizeFootballPosition(raw?: string): string {
  if (!raw) return 'ATH';
  const pos = raw.toUpperCase().trim();
  const valid = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'EDGE', 'LB', 'CB', 'S', 'K', 'P'];
  if (valid.includes(pos)) return pos;
  if (pos === 'OT' || pos === 'OG' || pos === 'C') return 'OL';
  if (pos === 'DT' || pos === 'DE' || pos === 'NT') return 'DL';
  if (pos === 'ILB' || pos === 'OLB' || pos === 'MLB') return 'LB';
  if (pos === 'FS' || pos === 'SS') return 'S';
  if (pos === 'DB' || pos === 'NB') return 'CB';
  if (pos === 'ATH') return 'WR';
  return pos.slice(0, 4);
}

function generateEntryId(sport: string, raw: RawPlayer, index: number): string {
  const prefix = sport === 'baseball' ? 'bb' : 'cfb';
  const sourceId = raw.id ? String(raw.id) : String(index);
  return `${prefix}-hl-${sourceId}`;
}

function extractStats(raw: RawPlayer, sport: string, position: string): string | null {
  const stats = raw.statistics || raw.stats;
  if (!stats || Object.keys(stats).length === 0) return null;

  if (sport === 'baseball') {
    const isPitcher = ['RHP', 'LHP', 'P'].includes(position);
    if (isPitcher) {
      return JSON.stringify({
        era: stats.era ?? stats.earnedRunAverage ?? undefined,
        wins: stats.wins ?? stats.w ?? undefined,
        losses: stats.losses ?? stats.l ?? undefined,
        strikeouts: stats.strikeouts ?? stats.so ?? stats.k ?? undefined,
        innings: stats.inningsPitched ?? stats.ip ?? undefined,
        whip: stats.whip ?? undefined,
      });
    }
    return JSON.stringify({
      avg: stats.battingAverage ?? stats.avg ?? stats.ba ?? undefined,
      hr: stats.homeRuns ?? stats.hr ?? undefined,
      rbi: stats.rbi ?? stats.runsBattedIn ?? undefined,
      sb: stats.stolenBases ?? stats.sb ?? undefined,
    });
  }

  if (sport === 'football') {
    return JSON.stringify({
      pass_yards: stats.passingYards ?? stats.passYards ?? undefined,
      pass_td: stats.passingTouchdowns ?? stats.passTd ?? undefined,
      rush_yards: stats.rushingYards ?? stats.rushYards ?? undefined,
      rush_td: stats.rushingTouchdowns ?? stats.rushTd ?? undefined,
      rec_yards: stats.receivingYards ?? stats.recYards ?? undefined,
      rec_td: stats.receivingTouchdowns ?? stats.recTd ?? undefined,
      tackles: stats.tackles ?? stats.totalTackles ?? undefined,
      sacks: stats.sacks ?? undefined,
      interceptions: stats.interceptions ?? stats.int ?? undefined,
    });
  }

  return null;
}

interface NormalizedEntry {
  id: string;
  player_name: string;
  sport: string;
  position: string;
  class_year: string;
  from_team: string;
  to_team: string | null;
  from_conference: string;
  to_conference: string | null;
  status: string;
  event_timestamp: string;
  portal_date: string;
  commitment_date: string | null;
  stats_json: string | null;
  engagement_score: number | null;
  stars: number | null;
  overall_rank: number | null;
  source_url: string;
  source_id: string;
  source_name: string;
  source_confidence: number;
}

async function fetchBaseballPortalData(apiKey: string): Promise<RawPlayer[]> {
  const endpoints = [
    `${BASEBALL_API_BASE}/transfers?league=ncaa`,
    `${BASEBALL_API_BASE}/transfers?league=ncaa&season=2026`,
    `${BASEBALL_API_BASE}/players?league=ncaa&transfer=true`,
  ];

  for (const url of endpoints) {
    try {
      const response = await fetchWithRetry(url, apiKey);
      const data = (await response.json()) as Record<string, unknown>;
      const players = (data.transfers ||
        data.players ||
        data.data ||
        data.results ||
        []) as RawPlayer[];
      if (Array.isArray(players) && players.length > 0) return players;
    } catch {
      // Try next endpoint
    }
  }

  return [];
}

async function fetchFootballPortalData(apiKey: string): Promise<RawPlayer[]> {
  const endpoints = [
    `${FOOTBALL_API_BASE}/transfers?league=ncaa`,
    `${FOOTBALL_API_BASE}/transfers?league=ncaa&season=2026`,
    `${FOOTBALL_API_BASE}/players?league=ncaa&transfer=true`,
  ];

  for (const url of endpoints) {
    try {
      const response = await fetchWithRetry(url, apiKey);
      const data = (await response.json()) as Record<string, unknown>;
      const players = (data.transfers ||
        data.players ||
        data.data ||
        data.results ||
        []) as RawPlayer[];
      if (Array.isArray(players) && players.length > 0) return players;
    } catch {
      // Try next endpoint
    }
  }

  return [];
}

function normalizeRawPlayers(
  rawPlayers: RawPlayer[],
  sport: 'baseball' | 'football'
): NormalizedEntry[] {
  const now = new Date().toISOString();
  const entries: NormalizedEntry[] = [];
  const seenIds = new Set<string>();

  for (let i = 0; i < rawPlayers.length; i++) {
    const raw = rawPlayers[i];
    const id = generateEntryId(sport, raw, i);

    if (seenIds.has(id)) continue;
    seenIds.add(id);

    const playerName = extractPlayerName(raw);
    if (playerName === 'Unknown Player') continue;

    const position =
      sport === 'baseball'
        ? normalizeBaseballPosition(raw.position)
        : normalizeFootballPosition(raw.position);

    const fromTeam = extractTeamName(raw.previousTeam || raw.fromTeam || raw.team);
    if (!fromTeam) continue;

    const toTeamObj =
      raw.toTeam || (raw.destinationSchool ? { name: raw.destinationSchool } : undefined);
    const toTeam = extractTeamName(toTeamObj) || (raw.destinationSchool as string) || null;
    const status = normalizeStatus(raw.status || raw.transferStatus || raw.portalStatus);
    const portalDate = raw.entryDate || raw.portalDate || now;
    const commitDate = raw.commitDate || raw.commitmentDate || null;

    const fromConf =
      raw.fromConference || extractConference(raw.previousTeam || raw.fromTeam || raw.team);
    const toConf = raw.toConference || extractConference(raw.toTeam);

    entries.push({
      id,
      player_name: playerName,
      sport,
      position,
      class_year: normalizeClassYear(raw.year || raw.classYear || raw.eligibility),
      from_team: fromTeam,
      to_team: toTeam && toTeam !== fromTeam ? toTeam : null,
      from_conference: fromConf,
      to_conference: toConf || null,
      status,
      event_timestamp: commitDate || portalDate,
      portal_date: portalDate,
      commitment_date: status === 'committed' || status === 'signed' ? commitDate : null,
      stats_json: extractStats(raw, sport, position),
      engagement_score: raw.ranking ? Math.min(99, Math.max(30, 100 - (raw.ranking || 50))) : null,
      stars:
        raw.stars || (raw.rating ? Math.min(5, Math.max(1, Math.round(raw.rating / 20))) : null),
      overall_rank: raw.ranking || null,
      source_url:
        sport === 'baseball'
          ? 'https://baseball.highlightly.net'
          : 'https://american-football.highlightly.net',
      source_id: `highlightly:${id}`,
      source_name: 'highlightly.net',
      source_confidence: 0.92,
    });
  }

  return entries;
}

function generateChangelogId(): string {
  return `cl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function upsertEntries(
  db: D1Database,
  entries: NormalizedEntry[],
  now: string
): Promise<{ inserted: number; updated: number; changelogBatch: D1PreparedStatement[] }> {
  let inserted = 0;
  let updated = 0;
  const changelogBatch: D1PreparedStatement[] = [];

  const changeStmt = db.prepare(`
    INSERT INTO transfer_portal_changelog (id, portal_entry_id, change_type, description, old_value, new_value, event_timestamp, created_at)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
  `);

  for (const entry of entries) {
    const existing = await db
      .prepare('SELECT id, status, to_team FROM transfer_portal WHERE id = ?1')
      .bind(entry.id)
      .first<{ id: string; status: string; to_team: string | null }>();

    if (existing) {
      await db
        .prepare(
          `
        UPDATE transfer_portal SET
          player_name = ?2, status = ?3, to_team = ?4, to_conference = ?5,
          commitment_date = ?6, stats_json = ?7, engagement_score = ?8,
          stars = ?9, overall_rank = ?10,
          source_url = ?11, source_confidence = ?12, last_verified_at = ?13,
          updated_at = ?13
        WHERE id = ?1
      `
        )
        .bind(
          entry.id,
          entry.player_name,
          entry.status,
          entry.to_team,
          entry.to_conference,
          entry.commitment_date,
          entry.stats_json,
          entry.engagement_score,
          entry.stars,
          entry.overall_rank,
          entry.source_url,
          entry.source_confidence,
          now
        )
        .run();

      if (existing.status !== entry.status) {
        changelogBatch.push(
          changeStmt.bind(
            generateChangelogId(),
            entry.id,
            entry.status,
            `${entry.player_name} ${entry.status === 'committed' ? 'committed to ' + (entry.to_team || 'TBD') : entry.status}`,
            existing.status,
            entry.status,
            now,
            now
          )
        );
      }
      updated++;
    } else {
      await db
        .prepare(
          `
        INSERT INTO transfer_portal (
          id, player_name, sport, position, class_year,
          from_team, to_team, from_conference, to_conference,
          status, event_timestamp, portal_date, commitment_date,
          stats_json, engagement_score, stars, overall_rank,
          source_url, source_id, source_name,
          is_partial, needs_review, source_confidence, verified,
          raw_snapshot_key, last_verified_at, created_at, updated_at
        ) VALUES (
          ?1, ?2, ?3, ?4, ?5,
          ?6, ?7, ?8, ?9,
          ?10, ?11, ?12, ?13,
          ?14, ?15, ?16, ?17,
          ?18, ?19, ?20,
          0, 0, ?21, 0,
          NULL, ?22, ?22, ?22
        )
      `
        )
        .bind(
          entry.id,
          entry.player_name,
          entry.sport,
          entry.position,
          entry.class_year,
          entry.from_team,
          entry.to_team,
          entry.from_conference,
          entry.to_conference,
          entry.status,
          entry.event_timestamp,
          entry.portal_date,
          entry.commitment_date,
          entry.stats_json,
          entry.engagement_score,
          entry.stars,
          entry.overall_rank,
          entry.source_url,
          entry.source_id,
          entry.source_name,
          entry.source_confidence,
          now
        )
        .run();

      changelogBatch.push(
        changeStmt.bind(
          generateChangelogId(),
          entry.id,
          'entered',
          `${entry.player_name} entered the transfer portal from ${entry.from_team}`,
          null,
          entry.from_team,
          now,
          now
        )
      );
      inserted++;
    }
  }

  return { inserted, updated, changelogBatch };
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: HEADERS });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST required' }), {
      status: 405,
      headers: HEADERS,
    });
  }

  // Auth gate: require API key or internal cron header
  const authHeader = request.headers.get('Authorization');
  const cronHeader = request.headers.get('X-BSI-Cron');
  if (!authHeader && !cronHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: HEADERS,
    });
  }

  if (!env.RAPIDAPI_KEY) {
    return new Response(JSON.stringify({ error: 'RAPIDAPI_KEY secret not configured' }), {
      status: 500,
      headers: HEADERS,
    });
  }

  try {
    const now = new Date().toISOString();

    // Fetch from Highlightly API for both sports
    const [rawBaseball, rawFootball] = await Promise.allSettled([
      fetchBaseballPortalData(env.RAPIDAPI_KEY),
      fetchFootballPortalData(env.RAPIDAPI_KEY),
    ]);

    const baseballPlayers = rawBaseball.status === 'fulfilled' ? rawBaseball.value : [];
    const footballPlayers = rawFootball.status === 'fulfilled' ? rawFootball.value : [];

    // Normalize
    const baseballEntries = normalizeRawPlayers(baseballPlayers, 'baseball');
    const footballEntries = normalizeRawPlayers(footballPlayers, 'football');
    const allEntries = [...baseballEntries, ...footballEntries];

    // Store raw snapshot in R2
    const snapshotKey = `portal/snapshots/sync-${Date.now()}.json`;
    await env.SPORTS_DATA.put(
      snapshotKey,
      JSON.stringify({
        synced_at: now,
        source: 'highlightly',
        baseball_raw_count: baseballPlayers.length,
        football_raw_count: footballPlayers.length,
        baseball_normalized: baseballEntries.length,
        football_normalized: footballEntries.length,
        baseball_error: rawBaseball.status === 'rejected' ? String(rawBaseball.reason) : null,
        football_error: rawFootball.status === 'rejected' ? String(rawFootball.reason) : null,
      })
    );

    // Upsert into D1
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalChangelog = 0;

    if (allEntries.length > 0) {
      const result = await upsertEntries(env.GAME_DB, allEntries, now);
      totalInserted = result.inserted;
      totalUpdated = result.updated;
      totalChangelog = result.changelogBatch.length;

      if (result.changelogBatch.length > 0) {
        // Batch in groups of 50
        for (let i = 0; i < result.changelogBatch.length; i += 50) {
          await env.GAME_DB.batch(result.changelogBatch.slice(i, i + 50));
        }
      }
    }

    // Update KV freshness marker
    await env.KV.put('portal:last_updated', now);
    await env.KV.put(
      'portal:last_sync',
      JSON.stringify({
        timestamp: now,
        source: 'highlightly',
        baseball_count: baseballEntries.length,
        football_count: footballEntries.length,
        inserted: totalInserted,
        updated: totalUpdated,
      })
    );

    return new Response(
      JSON.stringify({
        success: true,
        source: 'highlightly',
        baseball: {
          raw: baseballPlayers.length,
          normalized: baseballEntries.length,
          error: rawBaseball.status === 'rejected' ? 'fetch failed' : null,
        },
        football: {
          raw: footballPlayers.length,
          normalized: footballEntries.length,
          error: rawFootball.status === 'rejected' ? 'fetch failed' : null,
        },
        inserted: totalInserted,
        updated: totalUpdated,
        changelog_events: totalChangelog,
        snapshot_key: snapshotKey,
        synced_at: now,
      }),
      { headers: HEADERS }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: HEADERS });
  }
};
