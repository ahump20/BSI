/**
 * College Baseball — stat ingestion, sync, and bulk sync handlers.
 * ESPN box scores → D1 accumulation pipeline.
 */

import type { Env } from './shared';
import { DateTime } from 'luxon';
import { json, cachedJson, kvGet, kvPut, dataHeaders, getHighlightlyClient, HTTP_CACHE, CACHE_TTL, getScoreboard, getGameSummary, parseInningsToThirds, teamMetadata, metaByEspnId, getLogoUrl } from './shared';
import { parseEspnBattingLine, parseEspnPitchingLine } from '../../../lib/api-clients/espn-college-baseball';

/**
 * Process finished college baseball games from today's scoreboard.
 * Fetches box scores for each final game not yet processed, and upserts
 * player stats into D1.
 *
 * Returns a summary of what was processed.
 */
export async function processFinishedGames(
  env: Env,
  dateStr?: string,
): Promise<{ processed: number; skipped: number; errors: string[]; affectedTeamIds: string[] }> {
  const date = dateStr || new Date().toLocaleString('en-CA', { timeZone: 'America/Chicago' }).split(',')[0];
  const espnDate = date.replace(/-/g, '');
  const result = { processed: 0, skipped: 0, errors: [] as string[], affectedTeamIds: [] as string[] };
  const affectedTeamIdSet = new Set<string>();

  // 1. Fetch today's scoreboard
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scoreboard = await getScoreboard('college-baseball', espnDate) as any;
  const events = scoreboard?.events || [];

  // 2. Filter for completed games
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finals = events.filter((e: any) => {
    const st = e?.status?.type || e?.competitions?.[0]?.status?.type || {};
    return st.completed === true;
  });

  if (finals.length === 0) return result;

  // 3. Check which games are already processed (chunk to stay under D1's 100-param limit)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gameIds = finals.map((e: any) => String(e.id));
  const processedSet = new Set<string>();
  const PARAM_CHUNK = 80;
  for (let i = 0; i < gameIds.length; i += PARAM_CHUNK) {
    const chunk = gameIds.slice(i, i + PARAM_CHUNK);
    const placeholders = chunk.map(() => '?').join(',');
    const existing = await env.DB.prepare(
      `SELECT game_id FROM processed_games WHERE game_id IN (${placeholders})`
    ).bind(...chunk).all<{ game_id: string }>();
    for (const r of existing.results) processedSet.add(r.game_id);
  }

  // 4. Process each unprocessed final
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const event of finals as any[]) {
    const gameId = String(event.id);
    if (processedSet.has(gameId)) {
      result.skipped++;
      continue;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const summary = await getGameSummary('college-baseball', gameId) as any;
      const boxPlayers = summary?.boxscore?.players || [];

      // Each entry in boxPlayers is a team: { team: {...}, statistics: [batting, pitching] }
      const stmts: D1PreparedStatement[] = [];
      const teamRunsFromBox = new Map<string, number>();
      const playerEspnIds = new Set<string>();

      // Parse box scores using centralized label-based parser
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const teamBox of boxPlayers as any[]) {
        const teamName = teamBox.team?.displayName || teamBox.team?.shortDisplayName || '';
        const teamId = String(teamBox.team?.id || '');

        for (const statGroup of (teamBox.statistics || [])) {
          const labels: string[] = statGroup.labels || [];
          const isBatting = labels.includes('AB') || labels.includes('H-AB');
          const isPitching = labels.includes('IP') || labels.includes('ERA');

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for (const athleteEntry of (statGroup.athletes || []) as any[]) {
            const athlete = athleteEntry.athlete || {};
            const espnId = String(athlete.id || '');
            if (!espnId) continue;

            const stats: string[] = athleteEntry.stats || [];

            if (isBatting && stats.length > 0) {
              const line = parseEspnBattingLine(labels, stats, athlete);
              if (!line) continue; // DNP entries filtered by parser

              // Track for box score proving
              teamRunsFromBox.set(teamId, (teamRunsFromBox.get(teamId) || 0) + line.r);
              playerEspnIds.add(espnId);

              stmts.push(env.DB.prepare(`
                INSERT INTO player_season_stats
                  (espn_id, season, sport, name, team, team_id, position, headshot,
                   games_bat, at_bats, runs, hits, rbis, home_runs, walks_bat, strikeouts_bat,
                   stolen_bases, doubles, triples, on_base_pct, slugging_pct, stats_source)
                VALUES (?, 2026, 'college-baseball', ?, ?, ?, ?, ?,
                        1, ?, ?, ?, ?, ?, ?, ?,
                        0, 0, 0, ?, ?, 'espn-box-score')
                ON CONFLICT(espn_id, season, sport) DO UPDATE SET
                  name = excluded.name,
                  team = excluded.team,
                  team_id = excluded.team_id,
                  position = excluded.position,
                  headshot = CASE WHEN excluded.headshot != '' THEN excluded.headshot ELSE player_season_stats.headshot END,
                  games_bat = player_season_stats.games_bat + 1,
                  at_bats = player_season_stats.at_bats + excluded.at_bats,
                  runs = player_season_stats.runs + excluded.runs,
                  hits = player_season_stats.hits + excluded.hits,
                  rbis = player_season_stats.rbis + excluded.rbis,
                  home_runs = player_season_stats.home_runs + excluded.home_runs,
                  walks_bat = player_season_stats.walks_bat + excluded.walks_bat,
                  strikeouts_bat = player_season_stats.strikeouts_bat + excluded.strikeouts_bat,
                  on_base_pct = excluded.on_base_pct,
                  slugging_pct = excluded.slugging_pct,
                  stats_source = COALESCE(player_season_stats.stats_source, 'espn-box-score'),
                  updated_at = datetime('now')
              `).bind(
                espnId, line.name, teamName, teamId, line.position, line.headshot,
                line.ab, line.r, line.h, line.rbi, line.hr, line.bb, line.k,
                line.obp, line.slg,
              ));
            }

            if (isPitching && stats.length > 0) {
              const line = parseEspnPitchingLine(labels, stats, athlete);
              if (!line) continue; // Filtered by parser (0 IP)

              stmts.push(env.DB.prepare(`
                INSERT INTO player_season_stats
                  (espn_id, season, sport, name, team, team_id, position, headshot,
                   games_pitch, innings_pitched_thirds, hits_allowed, runs_allowed,
                   earned_runs, walks_pitch, strikeouts_pitch, home_runs_allowed, stats_source)
                VALUES (?, 2026, 'college-baseball', ?, ?, ?, ?, ?,
                        1, ?, ?, ?, ?, ?, ?, ?, 'espn-box-score')
                ON CONFLICT(espn_id, season, sport) DO UPDATE SET
                  name = excluded.name,
                  team = excluded.team,
                  team_id = excluded.team_id,
                  position = CASE WHEN excluded.position != '' THEN excluded.position ELSE player_season_stats.position END,
                  headshot = CASE WHEN excluded.headshot != '' THEN excluded.headshot ELSE player_season_stats.headshot END,
                  games_pitch = player_season_stats.games_pitch + 1,
                  innings_pitched_thirds = player_season_stats.innings_pitched_thirds + excluded.innings_pitched_thirds,
                  hits_allowed = player_season_stats.hits_allowed + excluded.hits_allowed,
                  runs_allowed = player_season_stats.runs_allowed + excluded.runs_allowed,
                  earned_runs = player_season_stats.earned_runs + excluded.earned_runs,
                  walks_pitch = player_season_stats.walks_pitch + excluded.walks_pitch,
                  strikeouts_pitch = player_season_stats.strikeouts_pitch + excluded.strikeouts_pitch,
                  home_runs_allowed = player_season_stats.home_runs_allowed + excluded.home_runs_allowed,
                  stats_source = COALESCE(player_season_stats.stats_source, 'espn-box-score'),
                  updated_at = datetime('now')
              `).bind(
                espnId, line.name, teamName, teamId, line.position, line.headshot,
                line.ipThirds, line.h, line.r, line.er, line.bb, line.k, line.hr,
              ));
            }
          }
        }
      }

      // Batch upsert player stats + mark game as processed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const competitions = event.competitions || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const competitors = competitions[0]?.competitors || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const homeTeam = competitors.find((c: any) => c.homeAway === 'home')?.team?.displayName || '';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const awayTeam = competitors.find((c: any) => c.homeAway === 'away')?.team?.displayName || '';

      // Extract team IDs and scores for RPI/SOS computation
      const homeCompetitor = competitors.find((c: any) => c.homeAway === 'home');
      const awayCompetitor = competitors.find((c: any) => c.homeAway === 'away');
      const homeTeamId = String(homeCompetitor?.team?.id ?? '');
      const awayTeamId = String(awayCompetitor?.team?.id ?? '');
      const homeScore = Number(homeCompetitor?.score ?? 0);
      const awayScore = Number(awayCompetitor?.score ?? 0);

      // Track affected teams for cache invalidation
      if (homeTeamId) affectedTeamIdSet.add(homeTeamId);
      if (awayTeamId) affectedTeamIdSet.add(awayTeamId);

      // Box score proving — runs consistency check
      const homeRunsBox = teamRunsFromBox.get(homeTeamId) ?? 0;
      const awayRunsBox = teamRunsFromBox.get(awayTeamId) ?? 0;
      const homeMatch = homeRunsBox === homeScore;
      const awayMatch = awayRunsBox === awayScore;
      const validationStatus = playerEspnIds.size === 0
        ? 'unchecked'
        : (homeMatch && awayMatch ? 'proved' : homeMatch || awayMatch ? 'partial' : 'failed');
      const validationDetail = JSON.stringify({
        home: { runs_box: homeRunsBox, score: homeScore, match: homeMatch },
        away: { runs_box: awayRunsBox, score: awayScore, match: awayMatch },
        players_parsed: playerEspnIds.size,
      });

      stmts.push(env.DB.prepare(
        `INSERT OR IGNORE INTO processed_games (game_id, sport, game_date, home_team, away_team, home_team_id, away_team_id, home_score, away_score, validation_status, validation_detail) VALUES (?, 'college-baseball', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(gameId, date, homeTeam, awayTeam, homeTeamId, awayTeamId, homeScore, awayScore, validationStatus, validationDetail));

      // Provenance: tag game and player entity sources
      stmts.push(env.DB.prepare(
        `INSERT OR IGNORE INTO entity_source (entity_source_id, entity_type, entity_id, source_system_id) VALUES (?, 'game', ?, 'espn')`
      ).bind(`espn:game:${gameId}`, gameId));
      for (const pid of playerEspnIds) {
        stmts.push(env.DB.prepare(
          `INSERT OR IGNORE INTO entity_source (entity_source_id, entity_type, entity_id, source_system_id) VALUES (?, 'player', ?, 'espn')`
        ).bind(`espn:player:${pid}`, pid));
      }

      // Raw payload ledger (if R2 data lake is bound)
      if (env.DATA_LAKE) {
        try {
          const rawJson = JSON.stringify(summary);
          const r2Key = `espn/college-baseball/games/${gameId}/${date}.json`;
          await env.DATA_LAKE.put(r2Key, rawJson);
          const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawJson));
          const sha256Hex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
          stmts.push(env.DB.prepare(
            `INSERT OR IGNORE INTO source_payload (payload_id, source_system_id, entity_type, entity_id, received_at, r2_key, sha256, parsed_at, parse_status) VALUES (?, 'espn', 'game', ?, ?, ?, ?, ?, 'parsed')`
          ).bind(`espn:game:${gameId}:${date}`, gameId, new Date().toISOString(), r2Key, sha256Hex, new Date().toISOString()));
        } catch (err) {
          console.error(`[provenance] R2 payload store failed for game ${gameId}:`, err);
        }
      }

      // D1 batch limit is 100 statements; chunk conservatively
      for (let i = 0; i < stmts.length; i += 50) {
        await env.DB.batch(stmts.slice(i, i + 50));
      }

      result.processed++;
    } catch (err) {
      const msg = `Game ${gameId}: ${err instanceof Error ? err.message : 'unknown error'}`;
      result.errors.push(msg);
    }
  }

  result.affectedTeamIds = [...affectedTeamIdSet];
  return result;
}

/**
 * HTTP handler for manual stat ingestion trigger.
 * GET /api/college-baseball/ingest-stats?date=2026-02-21
 */
export async function handleIngestStats(env: Env, dateStr?: string): Promise<Response> {
  try {
    const result = await processFinishedGames(env, dateStr);
    return json({
      ...result,
      meta: { timestamp: new Date().toISOString(), source: 'espn-boxscores' },
    });
  } catch (err) {
    return json({
      error: err instanceof Error ? err.message : 'Ingestion failed',
      meta: { timestamp: new Date().toISOString() },
    }, 500);
  }
}

// ---------------------------------------------------------------------------
// Cumulative Stats Sync — backfill from scoreboard game summaries
// ---------------------------------------------------------------------------

/**
 * Backfill player stats for a team by iterating ESPN scoreboards day-by-day
 * and processing any games that haven't been ingested yet.
 *
 * ESPN's college baseball coverage is partial (~30% of games have per-player
 * box score data, concentrated in SEC/Big Ten/ACC home games). For games
 * ESPN covers, box scores include per-game AB/H/HR/BB/K/R/RBI plus
 * university-reported season OBP and SLG. The season OBP/SLG enable
 * sabermetric derivation of 2B/3B/HBP in downstream handlers.
 *
 * For games ESPN doesn't cover: scores and team data are available,
 * but individual player stats are not.
 */
export async function syncTeamCumulativeStats(
  teamId: string,
  env: Env,
): Promise<{ team: string; gamesProcessed: number; gamesSkipped: number; gamesNoData: number; timestamp: string; errors: string[] }> {
  const now = new Date().toISOString();
  const errors: string[] = [];
  let gamesProcessed = 0;
  let gamesSkipped = 0;
  let gamesNoData = 0;

  // Season start: college baseball typically starts mid-February
  const seasonStart = '20260214';
  const today = new Date().toLocaleString('en-CA', { timeZone: 'America/Chicago' }).split(',')[0].replace(/-/g, '');

  // Iterate scoreboards day-by-day to find this team's games
  const gameIds: Array<{ id: string; date: string }> = [];
  let currentDate = seasonStart;

  while (currentDate <= today) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scoreboard = await getScoreboard('college-baseball', currentDate) as any;
      const events = scoreboard?.events || [];

      for (const event of events) {
        const competitions = event.competitions || [];
        for (const comp of competitions) {
          const competitors = comp.competitors || [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const isTeamGame = competitors.some((c: any) => String(c.team?.id) === teamId);
          const isCompleted = comp.status?.type?.completed === true;

          if (isTeamGame && isCompleted) {
            const isoDate = currentDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
            gameIds.push({ id: String(event.id), date: isoDate });
          }
        }
      }
    } catch {
      errors.push(`Scoreboard fetch failed for ${currentDate}`);
    }

    // Increment date by 1 day — use America/Chicago to avoid UTC midnight drift
    currentDate = DateTime.fromFormat(currentDate, 'yyyyMMdd', { zone: 'America/Chicago' })
      .plus({ days: 1 })
      .toFormat('yyyyMMdd');

    // Rate limit: 50ms between scoreboard fetches
    await new Promise((r) => setTimeout(r, 50));
  }

  if (gameIds.length === 0) {
    return { team: `Team ${teamId}`, gamesProcessed: 0, gamesSkipped: 0, gamesNoData: 0, timestamp: now, errors };
  }

  // Check which games are already processed
  const processedSet = new Set<string>();
  const PARAM_CHUNK = 80;
  for (let i = 0; i < gameIds.length; i += PARAM_CHUNK) {
    const chunk = gameIds.slice(i, i + PARAM_CHUNK);
    const placeholders = chunk.map(() => '?').join(',');
    const existing = await env.DB.prepare(
      `SELECT game_id FROM processed_games WHERE game_id IN (${placeholders})`
    ).bind(...chunk.map((g) => g.id)).all<{ game_id: string }>();
    for (const r of existing.results) processedSet.add(r.game_id);
  }

  // Process each unprocessed game
  let teamName = `Team ${teamId}`;

  for (const game of gameIds) {
    if (processedSet.has(game.id)) {
      gamesSkipped++;
      continue;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const summary = await getGameSummary('college-baseball', game.id) as any;
      const boxPlayers = summary?.boxscore?.players || [];

      // Check if any team has athlete data (ESPN coverage varies)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hasAthletes = boxPlayers.some((tb: any) =>
        (tb.statistics || []).some((sg: { athletes?: unknown[] }) => (sg.athletes || []).length > 0)
      );

      if (!hasAthletes) {
        gamesNoData++;
        // Still mark as processed — extract scores from summary header even without athlete data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const noAthComps = summary?.header?.competitions?.[0]?.competitors || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const noAthHome = noAthComps.find((c: any) => c.homeAway === 'home');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const noAthAway = noAthComps.find((c: any) => c.homeAway === 'away');
        const noAthHomeTeam = noAthHome?.team?.displayName || '';
        const noAthAwayTeam = noAthAway?.team?.displayName || '';
        const noAthHomeId = String(noAthHome?.team?.id ?? '');
        const noAthAwayId = String(noAthAway?.team?.id ?? '');
        const noAthHomeScore = noAthHome?.score != null ? Number(noAthHome.score) : null;
        const noAthAwayScore = noAthAway?.score != null ? Number(noAthAway.score) : null;

        await env.DB.prepare(
          `INSERT INTO processed_games (game_id, sport, game_date, home_team, away_team, home_team_id, away_team_id, home_score, away_score)
           VALUES (?, 'college-baseball', ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(game_id) DO UPDATE SET
             home_team = COALESCE(NULLIF(excluded.home_team, ''), processed_games.home_team),
             away_team = COALESCE(NULLIF(excluded.away_team, ''), processed_games.away_team),
             home_team_id = COALESCE(NULLIF(excluded.home_team_id, ''), processed_games.home_team_id),
             away_team_id = COALESCE(NULLIF(excluded.away_team_id, ''), processed_games.away_team_id),
             home_score = COALESCE(excluded.home_score, processed_games.home_score),
             away_score = COALESCE(excluded.away_score, processed_games.away_score)`
        ).bind(game.id, game.date, noAthHomeTeam, noAthAwayTeam, noAthHomeId, noAthAwayId, noAthHomeScore, noAthAwayScore).run();
        continue;
      }

      // Parse box scores using centralized label-based parser
      const stmts: D1PreparedStatement[] = [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const teamBox of boxPlayers as any[]) {
        const tbName = teamBox.team?.displayName || teamBox.team?.shortDisplayName || '';
        const tbId = String(teamBox.team?.id || '');
        if (tbId === teamId) teamName = tbName;

        for (const statGroup of (teamBox.statistics || [])) {
          const labels: string[] = statGroup.labels || [];
          const isBatting = labels.includes('AB') || labels.includes('H-AB');
          const isPitching = labels.includes('IP') || labels.includes('ERA');

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for (const athleteEntry of (statGroup.athletes || []) as any[]) {
            const athlete = athleteEntry.athlete || {};
            const espnId = String(athlete.id || '');
            if (!espnId) continue;

            const stats: string[] = athleteEntry.stats || [];

            if (isBatting && stats.length > 0) {
              const line = parseEspnBattingLine(labels, stats, athlete);
              if (!line) continue;

              stmts.push(env.DB.prepare(`
                INSERT INTO player_season_stats
                  (espn_id, season, sport, name, team, team_id, position, headshot,
                   games_bat, at_bats, runs, hits, rbis, home_runs, walks_bat, strikeouts_bat,
                   stolen_bases, doubles, triples, on_base_pct, slugging_pct)
                VALUES (?, 2026, 'college-baseball', ?, ?, ?, ?, ?,
                        1, ?, ?, ?, ?, ?, ?, ?,
                        0, 0, 0, ?, ?)
                ON CONFLICT(espn_id, season, sport) DO UPDATE SET
                  name = excluded.name,
                  team = excluded.team,
                  team_id = excluded.team_id,
                  position = excluded.position,
                  headshot = CASE WHEN excluded.headshot != '' THEN excluded.headshot ELSE player_season_stats.headshot END,
                  games_bat = player_season_stats.games_bat + 1,
                  at_bats = player_season_stats.at_bats + excluded.at_bats,
                  runs = player_season_stats.runs + excluded.runs,
                  hits = player_season_stats.hits + excluded.hits,
                  rbis = player_season_stats.rbis + excluded.rbis,
                  home_runs = player_season_stats.home_runs + excluded.home_runs,
                  walks_bat = player_season_stats.walks_bat + excluded.walks_bat,
                  strikeouts_bat = player_season_stats.strikeouts_bat + excluded.strikeouts_bat,
                  on_base_pct = excluded.on_base_pct,
                  slugging_pct = excluded.slugging_pct,
                  updated_at = datetime('now')
              `).bind(
                espnId, line.name, tbName, tbId, line.position, line.headshot,
                line.ab, line.r, line.h, line.rbi, line.hr, line.bb, line.k,
                line.obp, line.slg,
              ));
            }

            if (isPitching && stats.length > 0) {
              const line = parseEspnPitchingLine(labels, stats, athlete);
              if (!line) continue;

              stmts.push(env.DB.prepare(`
                INSERT INTO player_season_stats
                  (espn_id, season, sport, name, team, team_id, position, headshot,
                   games_pitch, innings_pitched_thirds, hits_allowed, runs_allowed,
                   earned_runs, walks_pitch, strikeouts_pitch, home_runs_allowed)
                VALUES (?, 2026, 'college-baseball', ?, ?, ?, ?, ?,
                        1, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(espn_id, season, sport) DO UPDATE SET
                  name = excluded.name,
                  team = excluded.team,
                  team_id = excluded.team_id,
                  position = CASE WHEN excluded.position != '' THEN excluded.position ELSE player_season_stats.position END,
                  headshot = CASE WHEN excluded.headshot != '' THEN excluded.headshot ELSE player_season_stats.headshot END,
                  games_pitch = player_season_stats.games_pitch + 1,
                  innings_pitched_thirds = player_season_stats.innings_pitched_thirds + excluded.innings_pitched_thirds,
                  hits_allowed = player_season_stats.hits_allowed + excluded.hits_allowed,
                  runs_allowed = player_season_stats.runs_allowed + excluded.runs_allowed,
                  earned_runs = player_season_stats.earned_runs + excluded.earned_runs,
                  walks_pitch = player_season_stats.walks_pitch + excluded.walks_pitch,
                  strikeouts_pitch = player_season_stats.strikeouts_pitch + excluded.strikeouts_pitch,
                  home_runs_allowed = player_season_stats.home_runs_allowed + excluded.home_runs_allowed,
                  updated_at = datetime('now')
              `).bind(
                espnId, line.name, tbName, tbId, line.position, line.headshot,
                line.ipThirds, line.h, line.r, line.er, line.bb, line.k, line.hr,
              ));
            }
          }
        }
      }

      // Extract scores from summary header (mirrors processFinishedGames pattern)
      const syncComps = summary?.header?.competitions?.[0]?.competitors || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const syncHome = syncComps.find((c: any) => c.homeAway === 'home');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const syncAway = syncComps.find((c: any) => c.homeAway === 'away');
      const syncHomeTeam = syncHome?.team?.displayName || '';
      const syncAwayTeam = syncAway?.team?.displayName || '';
      const syncHomeId = String(syncHome?.team?.id ?? '');
      const syncAwayId = String(syncAway?.team?.id ?? '');
      const syncHomeScore = syncHome?.score != null ? Number(syncHome.score) : null;
      const syncAwayScore = syncAway?.score != null ? Number(syncAway.score) : null;

      // Mark game as processed — ON CONFLICT backfills scores for existing NULL-score rows
      stmts.push(env.DB.prepare(
        `INSERT INTO processed_games (game_id, sport, game_date, home_team, away_team, home_team_id, away_team_id, home_score, away_score)
         VALUES (?, 'college-baseball', ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(game_id) DO UPDATE SET
           home_team = COALESCE(NULLIF(excluded.home_team, ''), processed_games.home_team),
           away_team = COALESCE(NULLIF(excluded.away_team, ''), processed_games.away_team),
           home_team_id = COALESCE(NULLIF(excluded.home_team_id, ''), processed_games.home_team_id),
           away_team_id = COALESCE(NULLIF(excluded.away_team_id, ''), processed_games.away_team_id),
           home_score = COALESCE(excluded.home_score, processed_games.home_score),
           away_score = COALESCE(excluded.away_score, processed_games.away_score)`
      ).bind(game.id, game.date, syncHomeTeam, syncAwayTeam, syncHomeId, syncAwayId, syncHomeScore, syncAwayScore));

      // Batch upsert (D1 limit is 100)
      for (let i = 0; i < stmts.length; i += 50) {
        await env.DB.batch(stmts.slice(i, i + 50));
      }

      gamesProcessed++;
    } catch (err) {
      errors.push(`Game ${game.id}: ${err instanceof Error ? err.message : 'unknown error'}`);
    }

    // Rate limit: 200ms between game summary fetches
    await new Promise((r) => setTimeout(r, 200));
  }

  return { team: teamName, gamesProcessed, gamesSkipped, gamesNoData, timestamp: now, errors };
}

// ---------------------------------------------------------------------------
// Highlightly Sync — fills ESPN coverage gaps with cumulative season stats
// ---------------------------------------------------------------------------

/**
 * Sync player stats from Highlightly for teams ESPN doesn't cover.
 *
 * Highlightly provides cumulative season totals per player (not per-game),
 * including doubles, triples, OBP, SLG, wins, losses, saves — fields ESPN
 * box scores lack entirely. The upsert does a full SET (not additive)
 * since the data represents complete season totals.
 *
 * Players are keyed as `hl:{highlightly_id}` in the espn_id column to avoid
 * collisions with ESPN-sourced rows. Teams that already have >= 5 ESPN players
 * are skipped unless `force=true`.
 *
 * GET /api/college-baseball/sync-highlightly?conference=SEC&key={admin_key}
 * GET /api/college-baseball/sync-highlightly?team=auburn&key={admin_key}
 */
export async function handleHighlightlySync(
  url: URL,
  env: Env,
): Promise<Response> {
  const key = url.searchParams.get('key');
  const adminKey = (env as Env & { ADMIN_KEY?: string }).ADMIN_KEY;
  if (!adminKey || key !== adminKey) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const hl = getHighlightlyClient(env);
  if (!hl) {
    return json({ error: 'RAPIDAPI_KEY not configured' }, 500);
  }

  const conference = url.searchParams.get('conference');
  const teamSlug = url.searchParams.get('team');
  const force = url.searchParams.get('force') === 'true';
  const now = new Date().toISOString();

  if (!conference && !teamSlug) {
    return json({ error: 'Provide ?conference=<name> or ?team=<slug>' }, 400);
  }

  // Determine target teams from teamMetadata
  const targetTeams: Array<{ slug: string; name: string; shortName: string; conference: string; espnId: string }> = [];

  if (teamSlug) {
    const meta = teamMetadata[teamSlug];
    if (!meta) return json({ error: `Unknown team slug: ${teamSlug}` }, 404);
    targetTeams.push({ slug: teamSlug, name: meta.name, shortName: meta.shortName, conference: meta.conference, espnId: meta.espnId });
  } else if (conference) {
    for (const [slug, meta] of Object.entries(teamMetadata)) {
      if (meta.conference.toLowerCase() === conference.toLowerCase()) {
        targetTeams.push({ slug, name: meta.name, shortName: meta.shortName, conference: meta.conference, espnId: meta.espnId });
      }
    }
    if (targetTeams.length === 0) {
      return json({ error: `No teams found for conference: ${conference}` }, 404);
    }
  }

  // Fetch Highlightly team list for name → hlTeamId mapping
  const teamsRes = await hl.getTeams('NCAA');
  if (!teamsRes.success || !teamsRes.data) {
    return json({ error: 'Failed to fetch Highlightly teams', detail: teamsRes.error }, 502);
  }

  const hlTeams = teamsRes.data.data;

  // Match helper: finds the Highlightly team ID for a given BSI team name
  function findHlTeamId(name: string, shortName: string): number | null {
    const nameLower = name.toLowerCase();
    const shortLower = shortName.toLowerCase();

    // Exact full name match
    for (const t of hlTeams) {
      if (t.name.toLowerCase() === nameLower) return t.id;
    }
    // Exact short name match
    for (const t of hlTeams) {
      if (t.name.toLowerCase() === shortLower) return t.id;
      if (t.shortName?.toLowerCase() === shortLower) return t.id;
    }
    // Prefix: "Auburn" starts "Auburn Tigers" or vice versa
    for (const t of hlTeams) {
      const hlLower = t.name.toLowerCase();
      if (nameLower.startsWith(hlLower) || hlLower.startsWith(nameLower)) return t.id;
      if (shortLower.length >= 4 && (hlLower.startsWith(shortLower) || shortLower.startsWith(hlLower))) return t.id;
    }
    return null;
  }

  // Process each target team
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: Array<{
    team: string;
    slug: string;
    hlTeamId: number | null;
    playersUpserted: number;
    skippedEspnCoverage: boolean;
    error?: string;
  }> = [];

  for (const target of targetTeams) {
    const hlTeamId = findHlTeamId(target.name, target.shortName);

    if (hlTeamId === null) {
      results.push({ team: target.name, slug: target.slug, hlTeamId: null, playersUpserted: 0, skippedEspnCoverage: false, error: 'No Highlightly team match' });
      continue;
    }

    // Skip teams with existing ESPN data unless force=true
    if (!force) {
      const espnCount = await env.DB.prepare(
        `SELECT COUNT(*) as cnt FROM player_season_stats
         WHERE sport = 'college-baseball' AND season = 2026
           AND team_id = ? AND (stats_source IS NULL OR stats_source LIKE 'espn%' OR stats_source = 'box-score')`
      ).bind(target.espnId).first<{ cnt: number }>();

      if (espnCount && espnCount.cnt >= 5) {
        results.push({ team: target.name, slug: target.slug, hlTeamId, playersUpserted: 0, skippedEspnCoverage: true });
        continue;
      }
    }

    // Fetch roster with cumulative season stats
    try {
      const rosterRes = await hl.getTeamPlayers(hlTeamId);
      if (!rosterRes.success || !rosterRes.data) {
        results.push({ team: target.name, slug: target.slug, hlTeamId, playersUpserted: 0, skippedEspnCoverage: false, error: `Roster fetch failed: ${rosterRes.error}` });
        continue;
      }

      const players = rosterRes.data.data;
      const stmts: D1PreparedStatement[] = [];
      let upserted = 0;

      for (const player of players) {
        const batting = player.statistics?.batting;
        const pitching = player.statistics?.pitching;

        const hasBatting = batting && (batting.atBats > 0 || batting.games > 0);
        const hasPitching = pitching && (pitching.inningsPitched > 0 || pitching.games > 0);
        if (!hasBatting && !hasPitching) continue;

        const hlId = `hl:${player.id}`;
        const name = player.name || `${player.firstName || ''} ${player.lastName || ''}`.trim();
        const position = player.position || '';

        // Batting — cumulative season totals
        const gamesBat = batting?.games ?? 0;
        const atBats = batting?.atBats ?? 0;
        const runs = batting?.runs ?? 0;
        const hits = batting?.hits ?? 0;
        const rbis = batting?.rbi ?? 0;
        const hr = batting?.homeRuns ?? 0;
        const walksBat = batting?.walks ?? 0;
        const kBat = batting?.strikeouts ?? 0;
        const sb = batting?.stolenBases ?? 0;
        const doubles = batting?.doubles ?? 0;
        const triples = batting?.triples ?? 0;
        const cs = batting?.caughtStealing ?? 0;
        const obp = batting?.onBasePercentage ?? 0;
        const slg = batting?.sluggingPercentage ?? 0;
        const tb = hits + doubles + triples * 2 + hr * 3;

        // Pitching — cumulative season totals
        // Highlightly uses standard baseball IP notation (6.1 = 6⅓)
        const gamesPitch = pitching?.games ?? 0;
        const ipThirds = pitching ? parseInningsToThirds(String(pitching.inningsPitched)) : 0;
        const ha = pitching?.hits ?? 0;
        const ra = pitching?.runs ?? 0;
        const er = pitching?.earnedRuns ?? 0;
        const walksPitch = pitching?.walks ?? 0;
        const kPitch = pitching?.strikeouts ?? 0;
        const hra = pitching?.homeRunsAllowed ?? 0;
        const wins = pitching?.wins ?? 0;
        const losses = pitching?.losses ?? 0;
        const saves = pitching?.saves ?? 0;

        stmts.push(env.DB.prepare(`
          INSERT INTO player_season_stats
            (espn_id, season, sport, name, team, team_id, position, headshot,
             games_bat, at_bats, runs, hits, rbis, home_runs, walks_bat, strikeouts_bat,
             stolen_bases, doubles, triples, caught_stealing, total_bases,
             on_base_pct, slugging_pct,
             games_pitch, innings_pitched_thirds, hits_allowed, runs_allowed, earned_runs,
             walks_pitch, strikeouts_pitch, home_runs_allowed, wins, losses, saves,
             stats_source)
          VALUES (?, 2026, 'college-baseball', ?, ?, ?, ?, '',
                  ?, ?, ?, ?, ?, ?, ?, ?,
                  ?, ?, ?, ?, ?,
                  ?, ?,
                  ?, ?, ?, ?, ?,
                  ?, ?, ?, ?, ?, ?,
                  'highlightly')
          ON CONFLICT(espn_id, season, sport) DO UPDATE SET
            name = excluded.name,
            team = excluded.team,
            team_id = excluded.team_id,
            position = CASE WHEN excluded.position != '' THEN excluded.position ELSE player_season_stats.position END,
            games_bat = excluded.games_bat,
            at_bats = excluded.at_bats,
            runs = excluded.runs,
            hits = excluded.hits,
            rbis = excluded.rbis,
            home_runs = excluded.home_runs,
            walks_bat = excluded.walks_bat,
            strikeouts_bat = excluded.strikeouts_bat,
            stolen_bases = excluded.stolen_bases,
            doubles = excluded.doubles,
            triples = excluded.triples,
            caught_stealing = excluded.caught_stealing,
            total_bases = excluded.total_bases,
            on_base_pct = excluded.on_base_pct,
            slugging_pct = excluded.slugging_pct,
            games_pitch = excluded.games_pitch,
            innings_pitched_thirds = excluded.innings_pitched_thirds,
            hits_allowed = excluded.hits_allowed,
            runs_allowed = excluded.runs_allowed,
            earned_runs = excluded.earned_runs,
            walks_pitch = excluded.walks_pitch,
            strikeouts_pitch = excluded.strikeouts_pitch,
            home_runs_allowed = excluded.home_runs_allowed,
            wins = excluded.wins,
            losses = excluded.losses,
            saves = excluded.saves,
            stats_source = 'highlightly',
            updated_at = datetime('now')
        `).bind(
          hlId, name, target.name, target.espnId, position,
          gamesBat, atBats, runs, hits, rbis, hr, walksBat, kBat,
          sb, doubles, triples, cs, tb,
          obp, slg,
          gamesPitch, ipThirds, ha, ra, er,
          walksPitch, kPitch, hra, wins, losses, saves,
        ));

        // Provenance: tag player entity source as highlightly
        stmts.push(env.DB.prepare(
          `INSERT OR IGNORE INTO entity_source (entity_source_id, entity_type, entity_id, source_system_id) VALUES (?, 'player', ?, 'highlightly')`
        ).bind(`hl:player:${player.id}`, hlId));

        upserted++;
      }

      // D1 batch limit is 100 statements
      for (let i = 0; i < stmts.length; i += 50) {
        await env.DB.batch(stmts.slice(i, i + 50));
      }

      results.push({ team: target.name, slug: target.slug, hlTeamId, playersUpserted: upserted, skippedEspnCoverage: false });
    } catch (err) {
      results.push({ team: target.name, slug: target.slug, hlTeamId, playersUpserted: 0, skippedEspnCoverage: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }

    // Rate limit between Highlightly API calls
    await new Promise((r) => setTimeout(r, 300));
  }

  // Invalidate caches
  await env.KV.delete('cb:saber:league:2026');
  await env.KV.delete('cb:leaders');

  const totalUpserted = results.reduce((s, r) => s + r.playersUpserted, 0);
  const totalSkipped = results.filter((r) => r.skippedEspnCoverage).length;
  const totalErrors = results.filter((r) => r.error).length;
  const totalNoMatch = results.filter((r) => r.hlTeamId === null).length;

  return json({
    conference: conference || undefined,
    team: teamSlug || undefined,
    teamsProcessed: results.length,
    totalPlayersUpserted: totalUpserted,
    teamsSkippedEspnCoverage: totalSkipped,
    teamsNoMatch: totalNoMatch,
    errors: totalErrors,
    results,
    meta: { source: 'highlightly-sync', timestamp: now },
  });
}

/**
 * HTTP handler for bulk cumulative stats sync.
 * GET /api/college-baseball/sync-stats?team=251&key={admin_key}
 * GET /api/college-baseball/sync-stats?conference=SEC&key={admin_key}
 *
 * Requires ADMIN_KEY env binding for auth.
 */
export async function handleCBBBulkSync(
  url: URL,
  env: Env,
): Promise<Response> {
  // Auth gate
  const key = url.searchParams.get('key');
  const adminKey = (env as Env & { ADMIN_KEY?: string }).ADMIN_KEY;
  if (!adminKey || key !== adminKey) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const singleTeam = url.searchParams.get('team');
  const conference = url.searchParams.get('conference');
  const now = new Date().toISOString();

  // Single team sync
  if (singleTeam) {
    try {
      const result = await syncTeamCumulativeStats(singleTeam, env);
      // Invalidate caches
      await env.KV.delete(`cb:saber:team:${singleTeam}`);
      await env.KV.delete('cb:saber:league:2026');
      await env.KV.delete('cb:leaders');
      return json({ ...result, meta: { source: 'backfill-sync', timestamp: now } });
    } catch (err) {
      return json({ error: err instanceof Error ? err.message : 'Sync failed', team: singleTeam }, 500);
    }
  }

  // Conference sync: look up ESPN IDs from teamMetadata
  if (conference) {
    const teamsInConf = Object.entries(teamMetadata)
      .filter(([, meta]) => meta.conference.toLowerCase() === conference.toLowerCase())
      .map(([slug, meta]) => ({ slug, espnId: meta.espnId, name: meta.name }));

    if (teamsInConf.length === 0) {
      return json({ error: `No teams found for conference: ${conference}` }, 404);
    }

    const results: Array<{ team: string; espnId: string; gamesProcessed: number; gamesSkipped: number; gamesNoData: number; error?: string }> = [];

    for (const team of teamsInConf) {
      try {
        const result = await syncTeamCumulativeStats(team.espnId, env);
        results.push({ team: result.team, espnId: team.espnId, gamesProcessed: result.gamesProcessed, gamesSkipped: result.gamesSkipped, gamesNoData: result.gamesNoData });
        // Invalidate team cache
        await env.KV.delete(`cb:saber:team:${team.espnId}`);
        await env.KV.delete(`cb:saber:team:${team.slug}`);
      } catch (err) {
        results.push({ team: team.name, espnId: team.espnId, gamesProcessed: 0, gamesNoData: 0, error: err instanceof Error ? err.message : 'Failed' });
      }
    }

    // Invalidate league caches
    await env.KV.delete('cb:saber:league:2026');
    await env.KV.delete('cb:leaders');

    const totalProcessed = results.reduce((s, r) => s + r.gamesProcessed, 0);
    const totalSkipped = results.reduce((s, r) => s + r.gamesSkipped, 0);
    const totalNoData = results.reduce((s, r) => s + r.gamesNoData, 0);
    const errorCount = results.filter((r) => r.error).length;

    return json({
      conference,
      teamsProcessed: results.length,
      totalGamesProcessed: totalProcessed,
      totalGamesSkipped: totalSkipped,
      totalGamesNoData: totalNoData,
      errors: errorCount,
      results,
      meta: { source: 'backfill-sync', timestamp: now },
    });
  }

  return json({ error: 'Provide ?team=<espnId> or ?conference=<name>' }, 400);
}
