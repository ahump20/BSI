/**
 * BSI College Baseball Database Helpers
 * Entity source mapping, queries, and D1 utilities
 *
 * CRITICAL: Always use entity_sources for cross-source ID mapping
 * NEVER use name-based joins between different data sources
 */

import type { DataSource, EntityType } from "./types";

// =============================================================================
// ENTITY SOURCE MAPPING
// =============================================================================

export interface EntitySourceMapping {
  entityType: EntityType;
  entityId: string;
  source: DataSource;
  sourceId: string;
  sourceUrl?: string;
  confidence?: number;
  verified?: boolean;
}

/**
 * Get internal BSI entity ID from source ID
 * Returns null if no mapping exists
 */
export async function getEntityIdFromSource(
  db: D1Database,
  entityType: string,
  source: string,
  sourceId: string
): Promise<string | null> {
  const result = await db
    .prepare(
      "SELECT entity_id FROM entity_sources WHERE entity_type = ? AND source = ? AND source_id = ?"
    )
    .bind(entityType, source, sourceId)
    .first<{ entity_id: string }>();

  return result?.entity_id ?? null;
}

/**
 * Get source ID for an internal entity
 */
export async function getSourceIdForEntity(
  db: D1Database,
  entityType: string,
  entityId: string,
  source: string
): Promise<string | null> {
  const result = await db
    .prepare(
      "SELECT source_id FROM entity_sources WHERE entity_type = ? AND entity_id = ? AND source = ?"
    )
    .bind(entityType, entityId, source)
    .first<{ source_id: string }>();

  return result?.source_id ?? null;
}

/**
 * Get all source mappings for an entity
 */
export async function getEntitySources(
  db: D1Database,
  entityType: string,
  entityId: string
): Promise<EntitySourceMapping[]> {
  const results = await db
    .prepare(
      "SELECT entity_type, entity_id, source, source_id, source_url, confidence, verified FROM entity_sources WHERE entity_type = ? AND entity_id = ?"
    )
    .bind(entityType, entityId)
    .all<{
      entity_type: string;
      entity_id: string;
      source: string;
      source_id: string;
      source_url: string | null;
      confidence: number | null;
      verified: number | null;
    }>();

  return (results.results ?? []).map((r) => ({
    entityType: r.entity_type as EntityType,
    entityId: r.entity_id,
    source: r.source as DataSource,
    sourceId: r.source_id,
    sourceUrl: r.source_url ?? undefined,
    confidence: r.confidence ?? undefined,
    verified: r.verified === 1,
  }));
}

/**
 * Upsert entity source mapping
 */
export async function upsertEntitySource(
  db: D1Database,
  mapping: EntitySourceMapping
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO entity_sources (entity_type, entity_id, source, source_id, source_url, confidence, verified, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"))
       ON CONFLICT(source, source_id) DO UPDATE SET
         entity_id = excluded.entity_id,
         source_url = excluded.source_url,
         confidence = excluded.confidence,
         verified = excluded.verified,
         updated_at = datetime("now")`
    )
    .bind(
      mapping.entityType,
      mapping.entityId,
      mapping.source,
      mapping.sourceId,
      mapping.sourceUrl ?? null,
      mapping.confidence ?? 1.0,
      mapping.verified ? 1 : 0
    )
    .run();
}

/**
 * Batch upsert entity source mappings
 */
export async function batchUpsertEntitySources(
  db: D1Database,
  mappings: EntitySourceMapping[]
): Promise<void> {
  if (mappings.length === 0) return;

  const stmt = db.prepare(
    `INSERT INTO entity_sources (entity_type, entity_id, source, source_id, source_url, confidence, verified, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"))
     ON CONFLICT(source, source_id) DO UPDATE SET
       entity_id = excluded.entity_id,
       source_url = excluded.source_url,
       confidence = excluded.confidence,
       verified = excluded.verified,
       updated_at = datetime("now")`
  );

  const batch = mappings.map((m) =>
    stmt.bind(
      m.entityType,
      m.entityId,
      m.source,
      m.sourceId,
      m.sourceUrl ?? null,
      m.confidence ?? 1.0,
      m.verified ? 1 : 0
    )
  );

  await db.batch(batch);
}

// =============================================================================
// TEAM QUERIES
// =============================================================================

export interface TeamRow {
  id: string;
  name: string;
  mascot: string | null;
  abbreviation: string | null;
  conference: string;
  division: string | null;
  city: string | null;
  state: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  logo_url: string | null;
  stadium_name: string | null;
  ncaa_id: string | null;
  highlightly_id: string | null;
  espn_id: string | null;
  updated_at: string;
}

export async function getTeamById(db: D1Database, id: string): Promise<TeamRow | null> {
  return db
    .prepare("SELECT * FROM college_baseball_teams WHERE id = ?")
    .bind(id)
    .first<TeamRow>();
}

export async function getTeamByNcaaId(db: D1Database, ncaaId: string): Promise<TeamRow | null> {
  return db
    .prepare("SELECT * FROM college_baseball_teams WHERE ncaa_id = ?")
    .bind(ncaaId)
    .first<TeamRow>();
}

export async function getTeamByHighlightlyId(db: D1Database, highlightlyId: string): Promise<TeamRow | null> {
  return db
    .prepare("SELECT * FROM college_baseball_teams WHERE highlightly_id = ?")
    .bind(highlightlyId)
    .first<TeamRow>();
}

export async function getAllTeams(db: D1Database, conference?: string): Promise<TeamRow[]> {
  if (conference) {
    const results = await db
      .prepare("SELECT * FROM college_baseball_teams WHERE conference = ? ORDER BY name")
      .bind(conference)
      .all<TeamRow>();
    return results.results ?? [];
  }
  const results = await db
    .prepare("SELECT * FROM college_baseball_teams ORDER BY conference, name")
    .all<TeamRow>();
  return results.results ?? [];
}

// =============================================================================
// PLAYER QUERIES
// =============================================================================

export interface PlayerRow {
  id: string;
  team_id: string;
  name: string;
  jersey_number: string | null;
  position: string | null;
  class_year: string | null;
  height: string | null;
  weight: number | null;
  bats: string | null;
  throws: string | null;
  hometown: string | null;
  is_transfer: number;
  transfer_from: string | null;
  is_active: number;
  ncaa_id: string | null;
  highlightly_id: string | null;
  updated_at: string;
}

export async function getPlayerById(db: D1Database, id: string): Promise<PlayerRow | null> {
  return db
    .prepare("SELECT * FROM college_baseball_players WHERE id = ?")
    .bind(id)
    .first<PlayerRow>();
}

export async function getPlayersByTeam(db: D1Database, teamId: string): Promise<PlayerRow[]> {
  const results = await db
    .prepare("SELECT * FROM college_baseball_players WHERE team_id = ? AND is_active = 1 ORDER BY jersey_number")
    .bind(teamId)
    .all<PlayerRow>();
  return results.results ?? [];
}

export async function searchPlayers(
  db: D1Database,
  query: string,
  limit: number = 20
): Promise<PlayerRow[]> {
  const results = await db
    .prepare(
      "SELECT * FROM college_baseball_players WHERE name LIKE ? ORDER BY name LIMIT ?"
    )
    .bind("%" + query + "%", limit)
    .all<PlayerRow>();
  return results.results ?? [];
}

// =============================================================================
// GAME QUERIES
// =============================================================================

export interface GameRow {
  id: string;
  date: string;
  time: string | null;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  inning: number | null;
  inning_half: string | null;
  venue: string | null;
  tv_broadcast: string | null;
  attendance: number | null;
  is_conference_game: number;
  is_tournament_game: number;
  tournament_name: string | null;
  season: number | null;
  ncaa_id: string | null;
  highlightly_id: string | null;
  updated_at: string;
}

export async function getGameById(db: D1Database, id: string): Promise<GameRow | null> {
  return db
    .prepare("SELECT * FROM college_baseball_games WHERE id = ?")
    .bind(id)
    .first<GameRow>();
}

export async function getGamesByDate(db: D1Database, date: string): Promise<GameRow[]> {
  const results = await db
    .prepare("SELECT * FROM college_baseball_games WHERE game_date = ? ORDER BY game_time")
    .bind(date)
    .all<GameRow>();
  return results.results ?? [];
}

export async function getLiveGames(db: D1Database): Promise<GameRow[]> {
  const results = await db
    .prepare(
      "SELECT * FROM college_baseball_games WHERE status IN (\"in_progress\", \"pre_game\", \"delayed\") ORDER BY game_date, game_time"
    )
    .all<GameRow>();
  return results.results ?? [];
}

export async function getGamesByTeam(
  db: D1Database,
  teamId: string,
  season?: number,
  limit: number = 20
): Promise<GameRow[]> {
  let query = "SELECT * FROM college_baseball_games WHERE (home_team_id = ? OR away_team_id = ?)";
  const params: (string | number)[] = [teamId, teamId];

  if (season) {
    query += " AND season = ?";
    params.push(season);
  }

  // SQLite-safe ordering: (field IS NULL) sorts NULLs last
  query += " ORDER BY game_date DESC, (game_time IS NULL), game_time DESC LIMIT ?";
  params.push(limit);

  const results = await db.prepare(query).bind(...params).all<GameRow>();
  return results.results ?? [];
}

// =============================================================================
// STANDINGS QUERIES
// =============================================================================

export interface StandingsRow {
  team_id: string;
  season: number;
  overall_wins: number;
  overall_losses: number;
  conference_wins: number;
  conference_losses: number;
  home_wins: number;
  home_losses: number;
  away_wins: number;
  away_losses: number;
  streak_type: string | null;
  streak_count: number;
  rpi: number | null;
  sos: number | null;
}

export async function getStandings(
  db: D1Database,
  season: number,
  conference?: string
): Promise<(StandingsRow & { team_name: string; team_conference: string })[]> {
  let query = `
    SELECT r.*, t.name as team_name, t.conference as team_conference
    FROM college_baseball_records r
    JOIN college_baseball_teams t ON r.team_id = t.id
    WHERE r.season = ?
  `;
  const params: (string | number)[] = [season];

  if (conference) {
    query += " AND t.conference = ?";
    params.push(conference);
  }

  // SQLite-safe: sort NULLs last for win percentage
  query += " ORDER BY (r.conference_wins * 1.0 / NULLIF(r.conference_wins + r.conference_losses, 0)) DESC, r.overall_wins DESC";

  const results = await db.prepare(query).bind(...params).all();
  return (results.results ?? []) as unknown as (StandingsRow & { team_name: string; team_conference: string })[];
}

// =============================================================================
// NIL QUERIES
// =============================================================================

export interface NilDealRow {
  id: string;
  player_id: string;
  team_id: string;
  brand_name: string;
  deal_type: string;
  deal_value: number | null;
  deal_value_tier: string | null;
  announced_date: string | null;
  status: string;
  source: string | null;
  verified: number;
}

export async function getNilDealsByPlayer(db: D1Database, playerId: string): Promise<NilDealRow[]> {
  const results = await db
    .prepare(
      "SELECT * FROM nil_deals WHERE player_id = ? AND status = \"active\" ORDER BY (announced_date IS NULL), announced_date DESC"
    )
    .bind(playerId)
    .all<NilDealRow>();
  return results.results ?? [];
}

export async function getNilDealsByTeam(db: D1Database, teamId: string): Promise<NilDealRow[]> {
  const results = await db
    .prepare(
      "SELECT * FROM nil_deals WHERE team_id = ? AND status = \"active\" ORDER BY (deal_value IS NULL), deal_value DESC"
    )
    .bind(teamId)
    .all<NilDealRow>();
  return results.results ?? [];
}

export async function getRecentNilDeals(db: D1Database, limit: number = 20): Promise<NilDealRow[]> {
  const results = await db
    .prepare(
      "SELECT * FROM nil_deals WHERE status = \"active\" ORDER BY (announced_date IS NULL), announced_date DESC LIMIT ?"
    )
    .bind(limit)
    .all<NilDealRow>();
  return results.results ?? [];
}

// =============================================================================
// SYNC LOG
// =============================================================================

export interface SyncLogEntry {
  worker: string;
  source: string;
  entityType: string;
  operation: string;
  status: string;
  recordsFetched: number;
  recordsInserted: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errorMessage?: string;
  errorDetails?: Record<string, unknown>;
  durationMs: number;
}

export async function logSync(db: D1Database, entry: SyncLogEntry): Promise<void> {
  await db
    .prepare(
      `INSERT INTO cbb_sync_log 
       (worker, source, entity_type, operation, status, records_fetched, records_inserted, records_updated, records_skipped, error_message, error_details, duration_ms, started_at, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now", "-" || ? || " milliseconds"), datetime("now"))`
    )
    .bind(
      entry.worker,
      entry.source,
      entry.entityType,
      entry.operation,
      entry.status,
      entry.recordsFetched,
      entry.recordsInserted,
      entry.recordsUpdated,
      entry.recordsSkipped,
      entry.errorMessage ?? null,
      entry.errorDetails ? JSON.stringify(entry.errorDetails) : null,
      entry.durationMs,
      entry.durationMs
    )
    .run();
}

export async function getLatestSync(
  db: D1Database,
  source: string,
  entityType: string
): Promise<{ startedAt: string; status: string } | null> {
  const result = await db
    .prepare(
      "SELECT started_at, status FROM cbb_sync_log WHERE source = ? AND entity_type = ? ORDER BY started_at DESC LIMIT 1"
    )
    .bind(source, entityType)
    .first<{ started_at: string; status: string }>();

  return result ? { startedAt: result.started_at, status: result.status } : null;
}

// =============================================================================
// ID GENERATION
// =============================================================================

/**
 * Generate a unique ID for a new entity
 * Format: {prefix}_{timestamp}_{random}
 */
export function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return prefix + "_" + timestamp + "_" + random;
}

// =============================================================================
// ADVANCED PLAYER SEARCH & COMPARISON
// =============================================================================

export interface PlayerSearchFilters {
  query?: string;
  position?: string | string[];
  classYear?: string | string[];
  teamId?: string;
  conference?: string;
  isTransfer?: boolean;
  bats?: "L" | "R" | "S";
  throws?: "L" | "R";
  limit?: number;
  offset?: number;
}

/**
 * Advanced player search with multiple filters
 * Supports filtering by position, class year, team, conference, transfer status
 */
export async function searchPlayersAdvanced(
  db: D1Database,
  filters: PlayerSearchFilters
): Promise<{ players: PlayerRow[]; total: number }> {
  const conditions: string[] = ["p.is_active = 1"];
  const params: (string | number)[] = [];

  // Name search (LIKE)
  if (filters.query && filters.query.length >= 2) {
    conditions.push("p.name LIKE ?");
    params.push("%" + filters.query + "%");
  }

  // Position filter (exact match or array)
  if (filters.position) {
    if (Array.isArray(filters.position)) {
      const placeholders = filters.position.map(() => "?").join(", ");
      conditions.push(`p.position IN (${placeholders})`);
      params.push(...filters.position);
    } else {
      conditions.push("p.position = ?");
      params.push(filters.position);
    }
  }

  // Class year filter
  if (filters.classYear) {
    if (Array.isArray(filters.classYear)) {
      const placeholders = filters.classYear.map(() => "?").join(", ");
      conditions.push(`p.class_year IN (${placeholders})`);
      params.push(...filters.classYear);
    } else {
      conditions.push("p.class_year = ?");
      params.push(filters.classYear);
    }
  }

  // Team filter
  if (filters.teamId) {
    conditions.push("p.team_id = ?");
    params.push(filters.teamId);
  }

  // Conference filter (requires join with teams table)
  if (filters.conference) {
    conditions.push("t.conference = ?");
    params.push(filters.conference);
  }

  // Transfer filter
  if (filters.isTransfer !== undefined) {
    conditions.push("p.is_transfer = ?");
    params.push(filters.isTransfer ? 1 : 0);
  }

  // Bats/Throws filter
  if (filters.bats) {
    conditions.push("p.bats = ?");
    params.push(filters.bats);
  }
  if (filters.throws) {
    conditions.push("p.throws = ?");
    params.push(filters.throws);
  }

  const whereClause = conditions.join(" AND ");
  const limit = Math.min(filters.limit ?? 50, 100);
  const offset = filters.offset ?? 0;

  // Count query for pagination
  const countQuery = `
    SELECT COUNT(*) as total
    FROM college_baseball_players p
    LEFT JOIN college_baseball_teams t ON p.team_id = t.id
    WHERE ${whereClause}
  `;

  // Main query with team info
  const mainQuery = `
    SELECT p.*, t.name as team_name, t.conference as team_conference, t.abbreviation as team_abbreviation
    FROM college_baseball_players p
    LEFT JOIN college_baseball_teams t ON p.team_id = t.id
    WHERE ${whereClause}
    ORDER BY p.name
    LIMIT ? OFFSET ?
  `;

  const [countResult, playersResult] = await Promise.all([
    db.prepare(countQuery).bind(...params).first<{ total: number }>(),
    db.prepare(mainQuery).bind(...params, limit, offset).all<PlayerRow>(),
  ]);

  return {
    players: playersResult.results ?? [],
    total: countResult?.total ?? 0,
  };
}

/**
 * Get multiple players by their IDs for comparison
 */
export async function getPlayersForComparison(
  db: D1Database,
  playerIds: string[]
): Promise<(PlayerRow & { team_name: string; team_conference: string })[]> {
  if (playerIds.length === 0) return [];
  if (playerIds.length > 10) {
    playerIds = playerIds.slice(0, 10); // Limit to 10 players
  }

  const placeholders = playerIds.map(() => "?").join(", ");
  const query = `
    SELECT p.*, t.name as team_name, t.conference as team_conference, t.abbreviation as team_abbreviation
    FROM college_baseball_players p
    LEFT JOIN college_baseball_teams t ON p.team_id = t.id
    WHERE p.id IN (${placeholders})
  `;

  const results = await db.prepare(query).bind(...playerIds).all();
  return (results.results ?? []) as unknown as (PlayerRow & { team_name: string; team_conference: string })[];
}

/**
 * Find players similar to a given player
 * Matches on position, class year, and optionally team conference
 */
export async function findSimilarPlayers(
  db: D1Database,
  playerId: string,
  limit: number = 10
): Promise<(PlayerRow & { team_name: string; similarity_score: number })[]> {
  // First get the reference player
  const player = await getPlayerById(db, playerId);
  if (!player) return [];

  // Get player's team for conference matching
  const team = player.team_id ? await getTeamById(db, player.team_id) : null;

  // Build similarity query
  // Score based on: same position (+3), same class year (+2), same conference (+1), same bats/throws (+1 each)
  const query = `
    SELECT p.*, t.name as team_name, t.conference as team_conference,
      (CASE WHEN p.position = ? THEN 3 ELSE 0 END +
       CASE WHEN p.class_year = ? THEN 2 ELSE 0 END +
       CASE WHEN t.conference = ? THEN 1 ELSE 0 END +
       CASE WHEN p.bats = ? THEN 1 ELSE 0 END +
       CASE WHEN p.throws = ? THEN 1 ELSE 0 END) as similarity_score
    FROM college_baseball_players p
    LEFT JOIN college_baseball_teams t ON p.team_id = t.id
    WHERE p.id != ? AND p.is_active = 1
    ORDER BY similarity_score DESC, p.name
    LIMIT ?
  `;

  const results = await db
    .prepare(query)
    .bind(
      player.position ?? "",
      player.class_year ?? "",
      team?.conference ?? "",
      player.bats ?? "",
      player.throws ?? "",
      playerId,
      limit
    )
    .all();

  return (results.results ?? []) as unknown as (PlayerRow & { team_name: string; similarity_score: number })[];
}

/**
 * Get transfer portal players (players marked as transfers)
 */
export async function getTransferPortalPlayers(
  db: D1Database,
  filters?: {
    position?: string;
    fromTeam?: string;
    toConference?: string;
    limit?: number;
  }
): Promise<(PlayerRow & { team_name: string; from_team_name?: string })[]> {
  const conditions = ["p.is_transfer = 1", "p.is_active = 1"];
  const params: (string | number)[] = [];

  if (filters?.position) {
    conditions.push("p.position = ?");
    params.push(filters.position);
  }

  if (filters?.toConference) {
    conditions.push("t.conference = ?");
    params.push(filters.toConference);
  }

  const limit = Math.min(filters?.limit ?? 50, 100);

  const query = `
    SELECT p.*, t.name as team_name, t.conference as team_conference
    FROM college_baseball_players p
    LEFT JOIN college_baseball_teams t ON p.team_id = t.id
    WHERE ${conditions.join(" AND ")}
    ORDER BY p.name
    LIMIT ?
  `;

  const results = await db.prepare(query).bind(...params, limit).all();
  return (results.results ?? []) as unknown as (PlayerRow & { team_name: string; from_team_name?: string })[];
}

/**
 * Get position group breakdown for a team
 */
export async function getTeamPositionBreakdown(
  db: D1Database,
  teamId: string
): Promise<{ position: string; count: number; players: string[] }[]> {
  const query = `
    SELECT position, COUNT(*) as count, GROUP_CONCAT(name) as player_names
    FROM college_baseball_players
    WHERE team_id = ? AND is_active = 1
    GROUP BY position
    ORDER BY count DESC
  `;

  const results = await db.prepare(query).bind(teamId).all<{
    position: string;
    count: number;
    player_names: string;
  }>();

  return (results.results ?? []).map((row) => ({
    position: row.position ?? "Unknown",
    count: row.count,
    players: row.player_names?.split(",") ?? [],
  }));
}

/**
 * Get class year breakdown for a team (freshman, sophomore, etc.)
 */
export async function getTeamClassBreakdown(
  db: D1Database,
  teamId: string
): Promise<{ classYear: string; count: number }[]> {
  const query = `
    SELECT class_year, COUNT(*) as count
    FROM college_baseball_players
    WHERE team_id = ? AND is_active = 1
    GROUP BY class_year
    ORDER BY
      CASE class_year
        WHEN 'Fr.' THEN 1
        WHEN 'So.' THEN 2
        WHEN 'Jr.' THEN 3
        WHEN 'Sr.' THEN 4
        WHEN 'Gr.' THEN 5
        ELSE 6
      END
  `;

  const results = await db.prepare(query).bind(teamId).all<{
    class_year: string;
    count: number;
  }>();

  return (results.results ?? []).map((row) => ({
    classYear: row.class_year ?? "Unknown",
    count: row.count,
  }));
}

// =============================================================================
// RANKINGS QUERIES
// =============================================================================

export interface RankingRow {
  id: number;
  team_id: string;
  team_name: string | null;
  team_logo: string | null;
  source: string;
  rank: number;
  previous_rank: number | null;
  week: number | null;
  season: number;
  points: number | null;
  first_place_votes: number | null;
  record: string | null;
  updated_at: string;
}

export async function getRankings(
  db: D1Database,
  pollType?: string,
  season?: number,
  week?: number,
  limit: number = 25
): Promise<(RankingRow & { conference: string | null })[]> {
  const currentSeason = season ?? new Date().getFullYear();
  let query = `
    SELECT r.*, t.conference
    FROM college_baseball_rankings r
    LEFT JOIN college_baseball_teams t ON LOWER(r.team_name) = LOWER(t.name)
    WHERE r.season = ?
  `;
  const params: (string | number)[] = [currentSeason];

  if (pollType) {
    query += " AND r.source LIKE ?";
    params.push(`%${pollType}%`);
  }

  if (week !== undefined && week !== null) {
    query += " AND r.week = ?";
    params.push(week);
  }

  query += " ORDER BY r.rank ASC LIMIT ?";
  params.push(limit);

  const results = await db.prepare(query).bind(...params).all();
  return (results.results ?? []) as unknown as (RankingRow & { conference: string | null })[];
}

export async function getLatestRankingsWeek(
  db: D1Database,
  season?: number,
  pollType?: string
): Promise<number | null> {
  const currentSeason = season ?? new Date().getFullYear();
  let query = "SELECT MAX(week) as max_week FROM college_baseball_rankings WHERE season = ?";
  const params: (string | number)[] = [currentSeason];

  if (pollType) {
    query += " AND source = ?";
    params.push(pollType);
  }

  const result = await db.prepare(query).bind(...params).first<{ max_week: number | null }>();
  return result?.max_week ?? null;
}

export async function getTeamRankingHistory(
  db: D1Database,
  teamId: string,
  season?: number,
  pollType?: string
): Promise<RankingRow[]> {
  const currentSeason = season ?? new Date().getFullYear();
  let query = `
    SELECT * FROM college_baseball_rankings
    WHERE team_id = ? AND season = ?
  `;
  const params: (string | number)[] = [teamId, currentSeason];

  if (pollType) {
    query += " AND source = ?";
    params.push(pollType);
  }

  query += " ORDER BY week ASC";

  const results = await db.prepare(query).bind(...params).all<RankingRow>();
  return results.results ?? [];
}

// =============================================================================
// PLAYER STATS QUERIES
// =============================================================================

export interface PlayerStatsRow {
  id: number;
  player_id: string;
  season: number;
  split_type: string;
  games_batting: number | null;
  at_bats: number | null;
  runs: number | null;
  hits: number | null;
  doubles: number | null;
  triples: number | null;
  home_runs: number | null;
  rbi: number | null;
  walks: number | null;
  strikeouts: number | null;
  stolen_bases: number | null;
  caught_stealing: number | null;
  batting_avg: number | null;
  on_base_pct: number | null;
  slugging_pct: number | null;
  ops: number | null;
  games_pitching: number | null;
  innings_pitched: number | null;
  wins: number | null;
  losses: number | null;
  saves: number | null;
  earned_runs: number | null;
  era: number | null;
  whip: number | null;
  strikeouts_pitching: number | null;
  walks_pitching: number | null;
  updated_at: string;
}

export async function getPlayerStats(
  db: D1Database,
  playerId: string,
  season?: number
): Promise<PlayerStatsRow | null> {
  const currentSeason = season ?? new Date().getFullYear();
  return db
    .prepare("SELECT * FROM cbb_player_season_stats WHERE player_id = ? AND season = ? AND split_type = 'season'")
    .bind(playerId, currentSeason)
    .first<PlayerStatsRow>();
}

export async function getPlayerCareerStats(
  db: D1Database,
  playerId: string
): Promise<PlayerStatsRow[]> {
  const results = await db
    .prepare("SELECT * FROM cbb_player_season_stats WHERE player_id = ? AND split_type = 'season' ORDER BY season DESC")
    .bind(playerId)
    .all<PlayerStatsRow>();
  return results.results ?? [];
}

export async function getTeamBattingLeaders(
  db: D1Database,
  teamId: string,
  season?: number,
  stat: "batting_avg" | "home_runs" | "rbi" | "stolen_bases" | "hits" = "batting_avg",
  limit: number = 10
): Promise<(PlayerStatsRow & { player_name: string })[]> {
  const currentSeason = season ?? new Date().getFullYear();
  const query = `
    SELECT s.*, p.name as player_name
    FROM cbb_player_season_stats s
    JOIN college_baseball_players p ON s.player_id = p.id
    WHERE p.team_id = ? AND s.season = ? AND s.split_type = 'season' AND s.at_bats > 0
    ORDER BY s.${stat} DESC NULLS LAST
    LIMIT ?
  `;

  const results = await db.prepare(query).bind(teamId, currentSeason, limit).all();
  return (results.results ?? []) as unknown as (PlayerStatsRow & { player_name: string })[];
}

export async function getTeamPitchingLeaders(
  db: D1Database,
  teamId: string,
  season?: number,
  stat: "era" | "wins" | "strikeouts_pitching" | "saves" = "era",
  limit: number = 10
): Promise<(PlayerStatsRow & { player_name: string })[]> {
  const currentSeason = season ?? new Date().getFullYear();
  const order = stat === "era" ? "ASC" : "DESC";
  const query = `
    SELECT s.*, p.name as player_name
    FROM cbb_player_season_stats s
    JOIN college_baseball_players p ON s.player_id = p.id
    WHERE p.team_id = ? AND s.season = ? AND s.split_type = 'season' AND s.innings_pitched > 0
    ORDER BY s.${stat} ${order} NULLS LAST
    LIMIT ?
  `;

  const results = await db.prepare(query).bind(teamId, currentSeason, limit).all();
  return (results.results ?? []) as unknown as (PlayerStatsRow & { player_name: string })[];
}
