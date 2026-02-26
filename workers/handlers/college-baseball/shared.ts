/**
 * College Baseball — shared state, types, and internal helpers.
 *
 * Every domain module (scores, standings, teams, etc.) imports from here.
 * External imports are re-exported so domain modules only need one import source.
 */

import type { Env } from '../../shared/types';
import { json, cachedJson, kvGet, kvPut, dataHeaders, getCollegeClient, getHighlightlyClient } from '../../shared/helpers';
import { HTTP_CACHE, CACHE_TTL } from '../../shared/constants';
import type {
  HighlightlyMatch,
  HighlightlyTeamDetail,
  HighlightlyPlayer,
  HighlightlyPlayerStats,
  HighlightlyBoxScore,
} from '../../../lib/api-clients/highlightly-api';
import { teamMetadata, getLogoUrl } from '../../../lib/data/team-metadata';
import { getLeaders, getScoreboard, getGameSummary } from '../../../lib/api-clients/espn-api';

// Re-export everything domain modules need
export type { Env };
export type { HighlightlyMatch, HighlightlyTeamDetail, HighlightlyPlayer, HighlightlyPlayerStats, HighlightlyBoxScore };
export { json, cachedJson, kvGet, kvPut, dataHeaders, getCollegeClient, getHighlightlyClient };
export { HTTP_CACHE, CACHE_TTL };
export { teamMetadata, getLogoUrl };
export { getLeaders, getScoreboard, getGameSummary };

/** Current season — single source of truth for all D1 queries across college-baseball handlers. */
export const SEASON = 2026;


/**
 * ESPN doesn't include conference in scoreboard responses.
 * Build a lowercase display name → conference lookup from teamMetadata.
 * Also build espnId → metadata lookup for standings conference filtering.
 */
export const conferenceByName: Record<string, string> = {};
export const metaByEspnId: Record<string, { slug: string; conference: string; logoId?: string; espnId: string; shortName: string }> = {};
for (const [slug, meta] of Object.entries(teamMetadata)) {
  conferenceByName[meta.name.toLowerCase()] = meta.conference;
  conferenceByName[meta.shortName.toLowerCase()] = meta.conference;
  metaByEspnId[meta.espnId] = { slug, conference: meta.conference, logoId: meta.logoId, espnId: meta.espnId, shortName: meta.shortName };
}
export function lookupConference(displayName: string): string {
  if (!displayName) return '';
  const lower = displayName.toLowerCase();
  return conferenceByName[lower] || conferenceByName[lower.replace(/ (university|college)$/i, '')] || '';
}

// ---------------------------------------------------------------------------
// D1 Stats Enrichment — query accumulated season stats for a player
// ---------------------------------------------------------------------------

export interface D1PlayerStats {
  espn_id: string;
  name: string;
  team: string;
  team_id: string;
  position: string;
  headshot: string;
  // Batting (original + migration 040/042)
  games_bat: number;
  at_bats: number;
  runs: number;
  hits: number;
  rbis: number;
  home_runs: number;
  walks_bat: number;
  strikeouts_bat: number;
  stolen_bases: number;
  doubles: number;
  triples: number;
  hit_by_pitch: number;
  sacrifice_flies: number;
  sacrifice_hits: number;
  caught_stealing: number;
  total_bases: number;
  on_base_pct: number;
  slugging_pct: number;
  // Pitching (original)
  games_pitch: number;
  innings_pitched_thirds: number;
  hits_allowed: number;
  runs_allowed: number;
  earned_runs: number;
  walks_pitch: number;
  strikeouts_pitch: number;
  home_runs_allowed: number;
  wins: number;
  losses: number;
  saves: number;
}

/**
 * Query D1 for a player's accumulated season stats and format them
 * to match the statistics shape the PlayerDetailClient expects.
 */
export async function getD1PlayerStats(
  espnId: string,
  env: Env,
): Promise<Record<string, unknown> | null> {
  try {
    const row = await env.DB.prepare(
      `SELECT * FROM player_season_stats
       WHERE espn_id = ? AND sport = 'college-baseball' AND season = ?`
    ).bind(espnId, SEASON).first<D1PlayerStats>();

    if (!row) return null;

    const stats: Record<string, unknown> = {};

    if (row.at_bats > 0 || row.games_bat > 0) {
      const avg = row.at_bats > 0 ? row.hits / row.at_bats : 0;
      const pa = row.at_bats + row.walks_bat + (row.hit_by_pitch ?? 0) + (row.sacrifice_flies ?? 0);
      const obp = row.on_base_pct > 0 ? row.on_base_pct
        : pa > 0 ? (row.hits + row.walks_bat + (row.hit_by_pitch ?? 0)) / pa : 0;
      const slg = row.slugging_pct > 0 ? row.slugging_pct
        : row.at_bats > 0 ? (row.total_bases ?? 0) / row.at_bats : 0;
      stats.batting = {
        games: row.games_bat,
        atBats: row.at_bats,
        runs: row.runs,
        hits: row.hits,
        doubles: row.doubles ?? 0,
        triples: row.triples ?? 0,
        homeRuns: row.home_runs,
        rbi: row.rbis,
        walks: row.walks_bat,
        strikeouts: row.strikeouts_bat,
        stolenBases: row.stolen_bases,
        caughtStealing: row.caught_stealing ?? 0,
        hitByPitch: row.hit_by_pitch ?? 0,
        sacrificeFlies: row.sacrifice_flies ?? 0,
        sacrificeHits: row.sacrifice_hits ?? 0,
        totalBases: row.total_bases ?? 0,
        battingAverage: Math.round(avg * 1000) / 1000,
        onBasePercentage: Math.round(obp * 1000) / 1000,
        sluggingPercentage: Math.round(slg * 1000) / 1000,
        ops: Math.round((obp + slg) * 1000) / 1000,
      };
    }

    if (row.innings_pitched_thirds > 0 || row.games_pitch > 0) {
      const ip = row.innings_pitched_thirds / 3;
      const era = ip > 0 ? (row.earned_runs * 9) / ip : 0;
      const whip = ip > 0 ? (row.hits_allowed + row.walks_pitch) / ip : 0;
      // BAA requires at-bats-faced, which D1 doesn't store — approximate from IP
      const approxBF = Math.round(ip * 3 + row.hits_allowed + row.walks_pitch);
      const baa = approxBF > 0 ? row.hits_allowed / approxBF : 0;
      stats.pitching = {
        games: row.games_pitch,
        wins: row.wins ?? 0,
        losses: row.losses ?? 0,
        saves: row.saves ?? 0,
        inningsPitched: Math.round(ip * 10) / 10,
        hits: row.hits_allowed,
        runs: row.runs_allowed ?? 0,
        earnedRuns: row.earned_runs,
        walks: row.walks_pitch,
        strikeouts: row.strikeouts_pitch,
        homeRunsAllowed: row.home_runs_allowed ?? 0,
        era: Math.round(era * 100) / 100,
        whip: Math.round(whip * 100) / 100,
        battingAvgAgainst: Math.round(baa * 1000) / 1000,
      };
    }

    return Object.keys(stats).length > 0 ? stats : null;
  } catch (err) {
    console.error('[d1] player stats lookup failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Build the full stats object for a roster player from a D1 row.
 * Returns both batting and pitching sub-objects when applicable.
 */
function buildPlayerStats(d1: D1PlayerStats): Record<string, unknown> {
  const stats: Record<string, unknown> = {};

  if (d1.at_bats > 0 || d1.games_bat > 0) {
    const avg = d1.at_bats > 0 ? Math.round((d1.hits / d1.at_bats) * 1000) / 1000 : 0;
    const pa = d1.at_bats + d1.walks_bat + (d1.hit_by_pitch ?? 0) + (d1.sacrifice_flies ?? 0);
    const obp = (d1.on_base_pct ?? 0) > 0 ? d1.on_base_pct
      : pa > 0 ? Math.round(((d1.hits + d1.walks_bat + (d1.hit_by_pitch ?? 0)) / pa) * 1000) / 1000 : 0;
    const slg = (d1.slugging_pct ?? 0) > 0 ? d1.slugging_pct
      : d1.at_bats > 0 ? Math.round(((d1.total_bases ?? 0) / d1.at_bats) * 1000) / 1000 : 0;

    stats.avg = avg;
    stats.obp = Math.round(obp * 1000) / 1000;
    stats.slg = Math.round(slg * 1000) / 1000;
    stats.ops = Math.round((obp + slg) * 1000) / 1000;
    stats.hr = d1.home_runs;
    stats.rbi = d1.rbis;
    stats.r = d1.runs;
    stats.h = d1.hits;
    stats.ab = d1.at_bats;
    stats.doubles = d1.doubles ?? 0;
    stats.triples = d1.triples ?? 0;
    stats.bb = d1.walks_bat;
    stats.k = d1.strikeouts_bat;
    stats.sb = d1.stolen_bases;
    stats.cs = d1.caught_stealing ?? 0;
    stats.hbp = d1.hit_by_pitch ?? 0;
    stats.sf = d1.sacrifice_flies ?? 0;
    stats.sh = d1.sacrifice_hits ?? 0;
    stats.tb = d1.total_bases ?? 0;
    stats.gp = d1.games_bat;
  }

  if (d1.innings_pitched_thirds > 0 || d1.games_pitch > 0) {
    const ip = d1.innings_pitched_thirds / 3;
    const era = ip > 0 ? Math.round((d1.earned_runs * 9 / ip) * 100) / 100 : 0;
    const whip = ip > 0 ? Math.round(((d1.hits_allowed + d1.walks_pitch) / ip) * 100) / 100 : 0;

    stats.era = era;
    stats.whip = whip;
    stats.w = d1.wins ?? 0;
    stats.l = d1.losses ?? 0;
    stats.sv = d1.saves ?? 0;
    stats.ip = Math.round(ip * 10) / 10;
    stats.ha = d1.hits_allowed;
    stats.ra = d1.runs_allowed ?? 0;
    stats.er = d1.earned_runs;
    stats.pitchBB = d1.walks_pitch;
    stats.so = d1.strikeouts_pitch;
    stats.hra = d1.home_runs_allowed ?? 0;
    stats.gpPitch = d1.games_pitch;
  }

  return stats;
}

/** Normalize a player name for matching — strips accents, parenthesized suffixes, non-alpha chars. */
function normalizeName(raw: string): string {
  return raw
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')     // strip accents
    .replace(/\s*\([^)]*\)\s*/g, ' ')                      // strip (P), (H), (RHP), etc.
    .toLowerCase().replace(/[^a-z ]/g, '').trim();
}

/**
 * Enrich a team payload with D1 accumulated stats.
 * - Merges per-player stats onto the roster
 * - Adds team-level aggregate stats as `teamStats`
 */
export async function enrichTeamWithD1Stats(
  payload: Record<string, unknown>,
  espnTeamId: string,
  env: Env,
): Promise<void> {
  try {
    // D1 stores ESPN box-score team IDs (e.g. 251 for Texas) while the handler
    // may pass the Highlightly ID (e.g. 126). Extract the ESPN site ID from the
    // team logo URL as a fallback lookup key.
    const teamObj = payload.team as Record<string, unknown> | undefined;
    const logoUrl = (teamObj?.logo ?? '') as string;
    const logoMatch = logoUrl.match(/\/(\d+)\.png/);
    const espnSiteId = logoMatch?.[1];

    const idsToTry = [espnTeamId];
    if (espnSiteId && espnSiteId !== espnTeamId) idsToTry.push(espnSiteId);

    let playerRows: D1PlayerStats[] = [];
    for (const tid of idsToTry) {
      const { results } = await env.DB.prepare(
        `SELECT espn_id, name, team, team_id, position, headshot,
                games_bat, at_bats, runs, hits, home_runs, rbis,
                walks_bat, strikeouts_bat, stolen_bases,
                doubles, triples, hit_by_pitch, sacrifice_flies,
                sacrifice_hits, caught_stealing, total_bases,
                on_base_pct, slugging_pct,
                games_pitch, innings_pitched_thirds, earned_runs,
                strikeouts_pitch, walks_pitch, hits_allowed,
                runs_allowed, home_runs_allowed, wins, losses, saves
         FROM player_season_stats
         WHERE sport = 'college-baseball' AND season = ? AND team_id = ?`
      ).bind(SEASON, tid).all<D1PlayerStats>();
      if (results && results.length > 0) {
        playerRows = results;
        break;
      }
    }

    // Build lookup by ESPN ID and by normalized name (fallback)
    const statsById = new Map<string, D1PlayerStats>();
    const statsByName = new Map<string, D1PlayerStats>();
    for (const r of playerRows) {
      statsById.set(r.espn_id, r);
      const nn = normalizeName(r.name);
      if (nn) statsByName.set(nn, r);
    }

    // Enrich roster players — try ID match first, then name match
    const team = payload.team as Record<string, unknown> | undefined;
    const roster = (team?.roster ?? []) as Record<string, unknown>[];
    const matchedD1Ids = new Set<string>();

    for (const player of roster) {
      const pid = String(player.id || '');
      const playerName = normalizeName((player.name ?? player.displayName ?? '') as string);
      const d1 = statsById.get(pid) ?? (playerName ? statsByName.get(playerName) : undefined);
      if (!d1) continue;

      matchedD1Ids.add(d1.espn_id);
      player.stats = buildPlayerStats(d1);

      if (!player.headshot && d1.headshot) {
        (player as Record<string, unknown>).headshot = d1.headshot;
      }
    }

    // Append D1 players who weren't matched to the roster (current season players
    // often missing from ESPN's historical roster endpoint).
    // Build name set from current roster to prevent duplicates.
    const rosterNames = new Set(
      roster.map(p => normalizeName((p.name ?? '') as string)).filter(Boolean)
    );

    for (const r of playerRows) {
      if (matchedD1Ids.has(r.espn_id)) continue;

      // Skip if a roster entry with similar name already exists
      const normName = normalizeName(r.name);
      if (normName && rosterNames.has(normName)) continue;

      const entry: Record<string, unknown> = {
        id: r.espn_id,
        name: r.name,
        position: r.position || 'UN',
        headshot: r.headshot || undefined,
        source: 'd1',
        stats: buildPlayerStats(r),
      };

      roster.push(entry);
      rosterNames.add(normName);
    }

    // Final dedup pass — forward scan, keep the entry with stats when names collide
    const dedupMap = new Map<string, number>();
    const toRemove = new Set<number>();
    for (let i = 0; i < roster.length; i++) {
      const rawName = normalizeName((roster[i].name ?? '') as string);
      if (!rawName) continue;
      if (dedupMap.has(rawName)) {
        const prev = dedupMap.get(rawName)!;
        // Keep whichever entry has stats; if both or neither have stats, keep first
        if (roster[i].stats && !roster[prev].stats) {
          toRemove.add(prev);
          dedupMap.set(rawName, i);
        } else {
          toRemove.add(i);
        }
      } else {
        dedupMap.set(rawName, i);
      }
    }
    if (toRemove.size > 0) {
      const indices = [...toRemove].sort((a, b) => b - a);
      for (const idx of indices) roster.splice(idx, 1);
    }

    // Filter out historical players from multi-season Highlightly dumps.
    // Strategy depends on whether D1 has data for this team.
    if (playerRows.length > 0) {
      // D1 path: keep players with stats or whose name matches a D1 row (current season)
      const d1Names = new Set(playerRows.map(r => normalizeName(r.name)));
      const filtered = roster.filter((p: Record<string, unknown>) => {
        if (p.stats && typeof p.stats === 'object' && Object.keys(p.stats as object).length > 0) return true;
        const name = normalizeName((p.name ?? '') as string);
        if (name && d1Names.has(name)) return true;
        return false;
      });
      if (filtered.length >= Math.min(roster.length, 10)) {
        roster.length = 0;
        roster.push(...filtered);
      }
    } else if (roster.length > 60) {
      // No D1 data but roster is oversized — Highlightly returned historical dump.
      // Keep players with: stats, jersey number, or a real position (not UN/empty).
      const filtered = roster.filter((p: Record<string, unknown>) => {
        if (p.stats && typeof p.stats === 'object' && Object.keys(p.stats as object).length > 0) return true;
        const num = String(p.number ?? p.jersey ?? '').trim();
        if (num && num !== '0') return true;
        const pos = String(p.position ?? '').toUpperCase().trim();
        if (pos && pos !== 'UN' && pos !== 'UNKNOWN') return true;
        return false;
      });
      if (filtered.length >= 10) {
        roster.length = 0;
        roster.push(...filtered);
      } else {
        // Highlightly returned no usable metadata — truncate to reasonable roster size.
        // Highlightly tends to return most recent players first.
        const MAX_ROSTER = 50;
        if (roster.length > MAX_ROSTER) {
          roster.length = MAX_ROSTER;
        }
      }
    }

    // Compute team aggregate stats (only meaningful when D1 data exists)
    if (playerRows.length === 0) return;
    let teamAB = 0, teamH = 0, teamHR = 0, teamRBI = 0, teamR = 0, teamK = 0;
    let teamBB = 0, teamSB = 0, team2B = 0, team3B = 0, teamTB = 0, teamHBP = 0;
    let teamIP3 = 0, teamER = 0, teamPitchK = 0, teamPitchBB = 0, teamHA = 0;
    let teamW = 0, teamL = 0, teamSV = 0, teamRA = 0, teamHRA = 0;

    for (const r of playerRows) {
      teamAB += r.at_bats; teamH += r.hits; teamHR += r.home_runs;
      teamRBI += r.rbis; teamR += r.runs; teamK += r.strikeouts_bat;
      teamBB += r.walks_bat; teamSB += r.stolen_bases;
      team2B += r.doubles ?? 0; team3B += r.triples ?? 0;
      teamTB += r.total_bases ?? 0; teamHBP += r.hit_by_pitch ?? 0;
      teamIP3 += r.innings_pitched_thirds; teamER += r.earned_runs;
      teamPitchK += r.strikeouts_pitch; teamPitchBB += r.walks_pitch;
      teamHA += r.hits_allowed; teamRA += r.runs_allowed ?? 0;
      teamHRA += r.home_runs_allowed ?? 0;
      teamW += r.wins ?? 0; teamL += r.losses ?? 0; teamSV += r.saves ?? 0;
    }

    const teamAvg = teamAB > 0 ? Math.round((teamH / teamAB) * 1000) / 1000 : 0;
    const teamSF = playerRows.reduce((s, r) => s + (r.sacrifice_flies ?? 0), 0);
    const teamPA = teamAB + teamBB + teamHBP + teamSF;
    const teamOBP = teamPA > 0 ? Math.round(((teamH + teamBB + teamHBP) / teamPA) * 1000) / 1000 : 0;
    const teamSLG = teamAB > 0 ? Math.round((teamTB / teamAB) * 1000) / 1000 : 0;
    const teamIP = teamIP3 / 3;
    const teamERA = teamIP > 0 ? Math.round((teamER * 9 / teamIP) * 100) / 100 : 0;
    const teamWHIP = teamIP > 0 ? Math.round(((teamHA + teamPitchBB) / teamIP) * 100) / 100 : 0;

    payload.teamStats = {
      batting: {
        atBats: teamAB, hits: teamH, homeRuns: teamHR, rbi: teamRBI,
        runs: teamR, strikeouts: teamK, battingAverage: teamAvg,
        walks: teamBB, stolenBases: teamSB, doubles: team2B, triples: team3B,
        totalBases: teamTB, hitByPitch: teamHBP,
        obp: teamOBP, slg: teamSLG, ops: Math.round((teamOBP + teamSLG) * 1000) / 1000,
        players: playerRows.filter((r) => r.at_bats > 0).length,
      },
      pitching: {
        inningsPitched: Math.round(teamIP * 10) / 10, earnedRuns: teamER,
        strikeouts: teamPitchK, walks: teamPitchBB, hitsAllowed: teamHA,
        era: teamERA, whip: teamWHIP,
        wins: teamW, losses: teamL, saves: teamSV,
        runsAllowed: teamRA, homeRunsAllowed: teamHRA,
        pitchers: playerRows.filter((r) => r.innings_pitched_thirds > 0).length,
      },
    };
  } catch (err) {
    console.error('[d1] team stats enrichment failed:', err instanceof Error ? err.message : err);
  }
}

// ---------------------------------------------------------------------------
// Team Schedule Transform — ESPN events → clean schedule shape
// ---------------------------------------------------------------------------

export function transformTeamSchedule(events: Record<string, unknown>[], teamShortName: string) {
  return events.map((e) => {
    const competitions = (e.competitions as Record<string, unknown>[]) ?? [];
    const comp = competitions[0] ?? {};
    const competitors = (comp.competitors as Record<string, unknown>[]) ?? [];
    const date = (e.date as string) ?? '';
    const statusObj = (comp.status ?? e.status) as Record<string, unknown> | undefined;
    const statusType = (statusObj?.type as Record<string, unknown>) ?? {};
    const state = (statusType.state as string) ?? 'pre';

    const home = competitors.find((c) => c.homeAway === 'home') as Record<string, unknown> | undefined;
    const away = competitors.find((c) => c.homeAway === 'away') as Record<string, unknown> | undefined;
    const homeTeam = (home?.team as Record<string, unknown>) ?? {};
    const awayTeam = (away?.team as Record<string, unknown>) ?? {};
    const rawHomeScore = home?.score as Record<string, unknown> | number | string | undefined;
    const rawAwayScore = away?.score as Record<string, unknown> | number | string | undefined;
    const homeScore = typeof rawHomeScore === 'object' && rawHomeScore !== null
      ? Number((rawHomeScore as Record<string, unknown>).value ?? (rawHomeScore as Record<string, unknown>).displayValue ?? 0)
      : Number(rawHomeScore ?? 0);
    const awayScore = typeof rawAwayScore === 'object' && rawAwayScore !== null
      ? Number((rawAwayScore as Record<string, unknown>).value ?? (rawAwayScore as Record<string, unknown>).displayValue ?? 0)
      : Number(rawAwayScore ?? 0);
    const isFinal = state === 'post';
    const shortLower = teamShortName.toLowerCase();
    const isHome = (homeTeam.abbreviation as string)?.toLowerCase() === shortLower
      || (homeTeam.displayName as string)?.toLowerCase().includes(shortLower);

    const opponent = isHome ? awayTeam : homeTeam;
    const teamScore = isHome ? homeScore : awayScore;
    const oppScore = isHome ? awayScore : homeScore;

    return {
      id: String(e.id ?? ''),
      date,
      opponent: {
        name: ((opponent.displayName ?? opponent.name ?? '') as string),
        abbreviation: ((opponent.abbreviation ?? '') as string),
      },
      isHome,
      status: state,
      detail: ((statusType.shortDetail ?? statusType.detail ?? '') as string),
      score: isFinal || state === 'in' ? { team: teamScore, opponent: oppScore } : null,
      result: isFinal ? (teamScore > oppScore ? 'W' : teamScore < oppScore ? 'L' : 'T') : null,
    };
  });
}

/**
 * Query D1 accumulated stats for the players list endpoint.
 * Returns players in the frontend Player shape with inline stats.
 */
export async function queryPlayersFromD1(
  env: Env,
  opts: { search: string; team: string; position: string; sortBy: string; limit: number; offset: number },
): Promise<Record<string, unknown>[] | null> {
  const conditions = [`sport = 'college-baseball'`, `season = ?`];
  const binds: (string | number)[] = [SEASON];

  if (opts.search) {
    conditions.push(`(name LIKE ? OR team LIKE ?)`);
    const q = `%${opts.search}%`;
    binds.push(q, q);
  }

  if (opts.team) {
    conditions.push(`team LIKE ?`);
    binds.push(`%${opts.team}%`);
  }

  if (opts.position) {
    if (opts.position === 'IF') {
      conditions.push(`position IN ('1B','2B','3B','SS','IF')`);
    } else if (opts.position === 'OF') {
      conditions.push(`position IN ('LF','CF','RF','OF')`);
    } else if (opts.position === 'P') {
      conditions.push(`(position IN ('P','SP','RP','LHP','RHP') OR innings_pitched_thirds > 0)`);
    } else {
      conditions.push(`position = ?`);
      binds.push(opts.position.toUpperCase());
    }
  }

  // Order by descending impact — different for pitchers vs batters
  let orderClause: string;
  switch (opts.sortBy) {
    case 'avg':
      conditions.push(`at_bats >= 10`);
      orderClause = `CAST(hits AS REAL) / at_bats DESC`;
      break;
    case 'homeRuns':
      orderClause = `home_runs DESC`;
      break;
    case 'rbi':
      orderClause = `rbis DESC`;
      break;
    case 'era':
      conditions.push(`innings_pitched_thirds >= 9`);
      orderClause = `CAST(earned_runs AS REAL) * 27 / innings_pitched_thirds ASC`;
      break;
    case 'strikeouts':
      orderClause = `strikeouts_pitch DESC`;
      break;
    default:
      // Default sort: composite batting value
      orderClause = `(hits + home_runs * 3 + rbis) DESC`;
      break;
  }

  const where = conditions.join(' AND ');
  const sql = `SELECT espn_id, name, team, team_id, position, headshot,
    games_bat, at_bats, runs, hits, rbis, home_runs, walks_bat, strikeouts_bat, stolen_bases,
    doubles, triples, hit_by_pitch, sacrifice_flies, sacrifice_hits, caught_stealing,
    total_bases, on_base_pct, slugging_pct,
    games_pitch, innings_pitched_thirds, earned_runs, walks_pitch, strikeouts_pitch,
    hits_allowed, runs_allowed, home_runs_allowed, wins, losses, saves
    FROM player_season_stats
    WHERE ${where}
    ORDER BY ${orderClause}
    LIMIT ? OFFSET ?`;

  binds.push(opts.limit, opts.offset);

  const { results } = await env.DB.prepare(sql).bind(...binds).all<D1PlayerStats>();

  if (!results || results.length === 0) return null;

  return results.map((r) => {
    const avg = r.at_bats > 0 ? Math.round((r.hits / r.at_bats) * 1000) / 1000 : 0;
    const pa = r.at_bats + r.walks_bat + (r.hit_by_pitch ?? 0) + (r.sacrifice_flies ?? 0);
    const obp = (r.on_base_pct ?? 0) > 0 ? Math.round(r.on_base_pct * 1000) / 1000
      : pa > 0 ? Math.round(((r.hits + r.walks_bat + (r.hit_by_pitch ?? 0)) / pa) * 1000) / 1000 : 0;
    const slg = (r.slugging_pct ?? 0) > 0 ? Math.round(r.slugging_pct * 1000) / 1000
      : r.at_bats > 0 ? Math.round(((r.total_bases ?? 0) / r.at_bats) * 1000) / 1000 : 0;
    const ip = r.innings_pitched_thirds / 3;
    const era = ip > 0 ? Math.round((r.earned_runs * 9 / ip) * 100) / 100 : 0;
    const whip = ip > 0 ? Math.round(((r.hits_allowed + r.walks_pitch) / ip) * 100) / 100 : 0;

    const player: Record<string, unknown> = {
      id: r.espn_id,
      name: r.name,
      team: r.team,
      jersey: '',
      position: r.position,
      classYear: '',
      conference: '',
      headshot: r.headshot || '',
      bio: { height: '', weight: 0, bats: '', throws: '', hometown: '' },
    };

    if (r.at_bats > 0 || r.games_bat > 0) {
      player.battingStats = {
        avg, homeRuns: r.home_runs, rbi: r.rbis, ops: Math.round((obp + slg) * 1000) / 1000,
        games: r.games_bat, atBats: r.at_bats, runs: r.runs, hits: r.hits,
        doubles: r.doubles ?? 0, triples: r.triples ?? 0,
        walks: r.walks_bat, strikeouts: r.strikeouts_bat, stolenBases: r.stolen_bases,
        caughtStealing: r.caught_stealing ?? 0, hitByPitch: r.hit_by_pitch ?? 0,
        sacrificeFlies: r.sacrifice_flies ?? 0, sacrificeHits: r.sacrifice_hits ?? 0,
        totalBases: r.total_bases ?? 0, obp, slg,
      };
    }

    if (r.innings_pitched_thirds > 0 || r.games_pitch > 0) {
      player.pitchingStats = {
        era, wins: r.wins ?? 0, losses: r.losses ?? 0, strikeouts: r.strikeouts_pitch, whip,
        games: r.games_pitch, saves: r.saves ?? 0,
        inningsPitched: Math.round(ip * 10) / 10, hits: r.hits_allowed,
        runs: r.runs_allowed ?? 0, earnedRuns: r.earned_runs, walks: r.walks_pitch,
        homeRunsAllowed: r.home_runs_allowed ?? 0,
      };
    }

    return player;
  });
}

// --- College Baseball Enhanced News (ESPN + Highlightly) ---

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  scores: ['score', 'scored', 'final', 'walk-off', 'walkoff', 'shutout', 'no-hitter', 'run-rule', 'sweep', 'swept', 'wins', 'defeats', 'beats', 'rout', 'rally', 'comeback'],
  transfers: ['transfer', 'portal', 'commit', 'committed', 'decommit', 'enters portal', 'flip', 'destination', 'leaving'],
  recruiting: ['recruit', 'signee', 'prospect', 'class of', 'signing day', 'nli', 'verbal', 'commitment', 'five-star', 'four-star'],
  editorial: ['preview', 'column', 'opinion', 'take', 'breakdown', 'deep dive', 'outlook', 'hot take', 'editorial'],
  analysis: ['analytics', 'stat', 'metric', 'sabermetric', 'rpi', 'sos', 'projection', 'model', 'era', 'whip', 'slugging', 'war'],
  rankings: ['rank', 'poll', 'top 25', 'ranked', 'power rankings', 'coaches poll', 'usa today', 'preseason', 'postseason'],
};

export function categorizeArticle(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  let bestCategory = 'general';
  let bestCount = 0;
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const count = keywords.filter((kw) => text.includes(kw)).length;
    if (count > bestCount) {
      bestCount = count;
      bestCategory = category;
    }
  }
  return bestCategory;
}

export function titleSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let overlap = 0;
  for (const w of wordsA) { if (wordsB.has(w)) overlap++; }
  return overlap / Math.max(wordsA.size, wordsB.size);
}

export interface EnhancedArticle {
  id: string;
  title: string;
  description: string;
  source: 'espn' | 'highlightly' | 'bsi';
  url: string;
  imageUrl?: string;
  publishedAt: string;
  category: string;
  team?: string;
}

export function computeBattingDifferentials(p1: Record<string, number>, p2: Record<string, number>): Record<string, number> {
  const stats = ['avg', 'obp', 'slg', 'hr', 'rbi', 'sb', 'runs', 'hits', 'ab', 'bb', 'so'];
  const result: Record<string, number> = {};
  for (const s of stats) {
    if (p1[s] != null && p2[s] != null) {
      const diff = p1[s] - p2[s];
      result[`batting_${s}`] = ['avg', 'obp', 'slg'].includes(s) ? Math.round(diff * 1000) / 1000 : Math.round(diff);
    }
  }
  return result;
}

export function computePitchingDifferentials(p1: Record<string, number>, p2: Record<string, number>): Record<string, number> {
  const stats = ['era', 'whip', 'wins', 'losses', 'saves', 'strikeouts', 'ip', 'k9'];
  const result: Record<string, number> = {};
  for (const s of stats) {
    if (p1[s] != null && p2[s] != null) {
      const diff = p1[s] - p2[s];
      result[`pitching_${s}`] = ['era', 'whip', 'k9'].includes(s) ? Math.round(diff * 100) / 100 : Math.round(diff);
    }
  }
  return result;
}

// =============================================================================
// Historical Trends
// =============================================================================

export function computeTrendSummary(snapshots: Array<{ wins: number; losses: number; ranking: number | null }>) {
  if (snapshots.length === 0) return { currentStreak: 'N/A', last10: 'N/A', rankingChange: null };

  let streakType = '';
  let streakCount = 0;
  for (let i = snapshots.length - 1; i > 0; i--) {
    const winDiff = snapshots[i].wins - snapshots[i - 1].wins;
    const lossDiff = snapshots[i].losses - snapshots[i - 1].losses;
    const dayType = winDiff > 0 ? 'W' : lossDiff > 0 ? 'L' : '';
    if (i === snapshots.length - 1) { streakType = dayType; streakCount = dayType ? 1 : 0; }
    else if (dayType === streakType && dayType) streakCount++;
    else break;
  }

  const last = snapshots[snapshots.length - 1];
  const tenAgo = snapshots.length >= 11 ? snapshots[snapshots.length - 11] : snapshots[0];
  const last10W = last.wins - tenAgo.wins;
  const last10L = last.losses - tenAgo.losses;

  const firstRank = snapshots.find(s => s.ranking != null)?.ranking ?? null;
  const lastRank = [...snapshots].reverse().find(s => s.ranking != null)?.ranking ?? null;
  const rankingChange = firstRank != null && lastRank != null ? firstRank - lastRank : null;

  return {
    currentStreak: streakCount > 0 ? `${streakType}${streakCount}` : 'N/A',
    last10: `${last10W}-${last10L}`,
    rankingChange,
  };
}


/**
 * Parse ESPN's IP notation (e.g. "6.1" = 6 and 1/3 innings) into integer thirds.
 * 6.0 = 18, 6.1 = 19, 6.2 = 20, 7.0 = 21, etc.
 */
export function parseInningsToThirds(ip: string): number {
  const num = parseFloat(ip);
  if (isNaN(num)) return 0;
  const whole = Math.floor(num);
  const frac = Math.round((num - whole) * 10); // .1 = 1, .2 = 2
  return whole * 3 + frac;
}

export interface LeaderRow {
  espn_id: string;
  name: string;
  team: string;
  team_id: string;
  headshot: string;
  computed_value: number;
}

export async function buildLeaderCategories(env: Env) {
  const queries = [
    {
      name: 'Batting Average',
      abbreviation: 'battingAverage',
      sql: `SELECT espn_id, name, team, team_id, headshot,
              ROUND(CAST(hits AS REAL) / at_bats, 3) AS computed_value
            FROM player_season_stats
            WHERE sport = 'college-baseball' AND season = ?
              AND at_bats >= 15
            ORDER BY computed_value DESC
            LIMIT 10`,
      format: (v: number) => v.toFixed(3).replace(/^0/, ''),
    },
    {
      name: 'Home Runs',
      abbreviation: 'homeRuns',
      sql: `SELECT espn_id, name, team, team_id, headshot, home_runs AS computed_value
            FROM player_season_stats
            WHERE sport = 'college-baseball' AND season = ?
              AND at_bats > 0
            ORDER BY home_runs DESC
            LIMIT 10`,
      format: (v: number) => String(v),
    },
    {
      name: 'RBI',
      abbreviation: 'RBIs',
      sql: `SELECT espn_id, name, team, team_id, headshot, rbis AS computed_value
            FROM player_season_stats
            WHERE sport = 'college-baseball' AND season = ?
              AND at_bats > 0
            ORDER BY rbis DESC
            LIMIT 10`,
      format: (v: number) => String(v),
    },
    {
      name: 'Earned Run Average',
      abbreviation: 'earnedRunAverage',
      sql: `SELECT espn_id, name, team, team_id, headshot,
              ROUND(CAST(earned_runs AS REAL) * 27 / innings_pitched_thirds, 2) AS computed_value
            FROM player_season_stats
            WHERE sport = 'college-baseball' AND season = ?
              AND innings_pitched_thirds >= 15
            ORDER BY computed_value ASC
            LIMIT 10`,
      format: (v: number) => v.toFixed(2),
    },
    {
      name: 'Strikeouts',
      abbreviation: 'strikeouts',
      sql: `SELECT espn_id, name, team, team_id, headshot, strikeouts_pitch AS computed_value
            FROM player_season_stats
            WHERE sport = 'college-baseball' AND season = ?
              AND innings_pitched_thirds > 0
            ORDER BY strikeouts_pitch DESC
            LIMIT 10`,
      format: (v: number) => String(v),
    },
    {
      name: 'Hits',
      abbreviation: 'hits',
      sql: `SELECT espn_id, name, team, team_id, headshot, hits AS computed_value
            FROM player_season_stats
            WHERE sport = 'college-baseball' AND season = ?
              AND at_bats > 0
            ORDER BY hits DESC
            LIMIT 10`,
      format: (v: number) => String(v),
    },
  ];

  const categories = [];
  for (const q of queries) {
    const { results } = await env.DB.prepare(q.sql).bind(SEASON).all<LeaderRow>();

    if (results.length === 0) continue;

    categories.push({
      name: q.name,
      abbreviation: q.abbreviation,
      leaders: results.map((r) => ({
        name: r.name,
        id: r.espn_id,
        team: r.team,
        teamId: r.team_id,
        headshot: r.headshot || '',
        value: q.format(r.computed_value),
        stat: q.abbreviation,
      })),
    });
  }

  return categories;
}
