/**
 * BSI Power Rankings — College Baseball
 *
 * Computes composite power rankings from BSI's own Savant data:
 *   - Team-level wRC+ (offense)
 *   - Team-level FIP (pitching, inverted — lower is better)
 *   - Conference strength index (schedule difficulty)
 *
 * Rankings update automatically when Savant data recomputes (every 6h).
 * Week-over-week movement tracked via KV.
 *
 * GET /api/college-baseball/power-rankings
 */

import type { Env } from '../../shared/types';
import { json, kvGet, kvPut } from '../../shared/helpers';

const SEASON = 2026;
const CACHE_KEY = 'cb:power-rankings:latest';
const PREV_WEEK_KEY = 'cb:power-rankings:prev-week';
const CACHE_TTL = 21600; // 6 hours

// Composite weights — offense and pitching equally weighted, schedule adds a multiplier
const W_OFFENSE = 0.45;
const W_PITCHING = 0.45;
const W_SOS = 0.10;

interface TeamRanking {
  rank: number;
  team: string;
  teamId: string | null;
  conference: string;
  score: number;
  movement: number | null; // positive = moved up, negative = moved down, null = new
  metrics: {
    wrcPlus: number;
    teamFIP: number;
    teamWOBA: number;
    teamERA: number;
    sosIndex: number;
  };
  sampleSize: { batters: number; pitchers: number };
}

interface PowerRankingsResponse {
  rankings: TeamRanking[];
  computedAt: string;
  season: number;
  methodology: string;
  meta: { source: string; fetched_at: string; timezone: 'America/Chicago' };
}

/**
 * Aggregate team-level offensive metrics from individual player rows.
 * Uses PA-weighted averages for rate stats.
 */
async function getTeamOffense(db: D1Database): Promise<Map<string, { wrcPlus: number; woba: number; batters: number; teamId: string | null; conference: string }>> {
  const { results } = await db.prepare(`
    SELECT
      team,
      team_id,
      conference,
      COUNT(*) as batters,
      SUM(pa) as total_pa,
      SUM(pa * wrc_plus) / NULLIF(SUM(pa), 0) as team_wrc_plus,
      SUM(pa * woba) / NULLIF(SUM(pa), 0) as team_woba
    FROM cbb_batting_advanced
    WHERE season = ? AND pa >= 25
    GROUP BY team
    HAVING total_pa >= 100
    ORDER BY team_wrc_plus DESC
  `).bind(SEASON).all();

  const map = new Map<string, { wrcPlus: number; woba: number; batters: number; teamId: string | null; conference: string }>();
  for (const r of results) {
    map.set(r.team as string, {
      wrcPlus: (r.team_wrc_plus as number) || 100,
      woba: (r.team_woba as number) || 0.300,
      batters: (r.batters as number) || 0,
      teamId: (r.team_id as string) || null,
      conference: (r.conference as string) || 'Independent',
    });
  }
  return map;
}

/**
 * Aggregate team-level pitching metrics from individual player rows.
 * Uses IP-weighted averages for rate stats.
 */
async function getTeamPitching(db: D1Database): Promise<Map<string, { fip: number; era: number; pitchers: number }>> {
  const { results } = await db.prepare(`
    SELECT
      team,
      COUNT(*) as pitchers,
      SUM(ip) as total_ip,
      SUM(ip * fip) / NULLIF(SUM(ip), 0) as team_fip,
      SUM(ip * era) / NULLIF(SUM(ip), 0) as team_era
    FROM cbb_pitching_advanced
    WHERE season = ? AND ip >= 10
    GROUP BY team
    HAVING total_ip >= 50
    ORDER BY team_fip ASC
  `).bind(SEASON).all();

  const map = new Map<string, { fip: number; era: number; pitchers: number }>();
  for (const r of results) {
    map.set(r.team as string, {
      fip: (r.team_fip as number) || 4.50,
      era: (r.team_era as number) || 4.50,
      pitchers: (r.pitchers as number) || 0,
    });
  }
  return map;
}

/**
 * Get conference strength indices for schedule difficulty adjustment.
 */
async function getConferenceStrength(db: D1Database): Promise<Map<string, number>> {
  const { results } = await db.prepare(`
    SELECT conference, strength_index
    FROM cbb_conference_strength
    WHERE season = ?
  `).bind(SEASON).all();

  const map = new Map<string, number>();
  for (const r of results) {
    map.set(r.conference as string, (r.strength_index as number) || 0.5);
  }
  return map;
}

/**
 * Normalize a value within a population to [0, 1].
 * Higher normalized value = better.
 */
function normalize(values: number[], value: number, invert = false): number {
  if (values.length < 2) return 0.5;
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return 0.5;
  const n = (value - min) / (max - min);
  return invert ? 1 - n : n;
}

export async function handlePowerRankings(url: URL, env: Env): Promise<Response> {
  // Check KV cache first
  const cached = await kvGet<PowerRankingsResponse>(env.KV, CACHE_KEY);
  if (cached) {
    return json(cached);
  }

  // Query D1 for team-level aggregated metrics
  const [offense, pitching, sos] = await Promise.all([
    getTeamOffense(env.DB),
    getTeamPitching(env.DB),
    getConferenceStrength(env.DB),
  ]);

  // Build team set — only teams with both offense and pitching data
  const teams = [...offense.keys()].filter((t) => pitching.has(t));
  if (teams.length === 0) {
    return json({
      rankings: [],
      computedAt: new Date().toISOString(),
      season: SEASON,
      methodology: 'No qualifying teams found — Savant data may not have computed yet.',
      meta: { source: 'bsi-power-rankings', fetched_at: new Date().toISOString(), timezone: 'America/Chicago' as const },
    });
  }

  // Collect raw values for normalization
  const wrcValues = teams.map((t) => offense.get(t)!.wrcPlus);
  const fipValues = teams.map((t) => pitching.get(t)!.fip);
  const sosValues = [...sos.values()];

  // Compute composite scores
  const scored = teams.map((team) => {
    const off = offense.get(team)!;
    const pit = pitching.get(team)!;
    const sosIdx = sos.get(off.conference) ?? 0.5;

    const offScore = normalize(wrcValues, off.wrcPlus);
    const pitScore = normalize(fipValues, pit.fip, true); // lower FIP = better
    const sosScore = sosValues.length > 1 ? normalize(sosValues, sosIdx) : 0.5;

    const composite = offScore * W_OFFENSE + pitScore * W_PITCHING + sosScore * W_SOS;

    return {
      team,
      teamId: off.teamId,
      conference: off.conference,
      score: Math.round(composite * 1000) / 10, // 0-100 scale
      metrics: {
        wrcPlus: Math.round(off.wrcPlus * 10) / 10,
        teamFIP: Math.round(pit.fip * 100) / 100,
        teamWOBA: Math.round(off.woba * 1000) / 1000,
        teamERA: Math.round(pit.era * 100) / 100,
        sosIndex: Math.round(sosIdx * 100) / 100,
      },
      sampleSize: { batters: off.batters, pitchers: pit.pitchers },
    };
  });

  // Sort by composite score descending
  scored.sort((a, b) => b.score - a.score);

  // Load previous week's rankings for movement calculation
  const prevRankings = await kvGet<Record<string, number>>(env.KV, PREV_WEEK_KEY) ?? {};

  const rankings: TeamRanking[] = scored.map((t, i) => ({
    rank: i + 1,
    team: t.team,
    teamId: t.teamId,
    conference: t.conference,
    score: t.score,
    movement: prevRankings[t.team] != null ? prevRankings[t.team] - (i + 1) : null,
    metrics: t.metrics,
    sampleSize: t.sampleSize,
  }));

  // Store current rankings as "previous" for next week's movement
  // Only update weekly (check if last stored is >6 days old)
  const lastStoredKey = 'cb:power-rankings:prev-stored-at';
  const lastStored = await kvGet<string>(env.KV, lastStoredKey);
  const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();
  if (!lastStored || lastStored < sixDaysAgo) {
    const currentRankMap: Record<string, number> = {};
    for (const r of rankings) {
      currentRankMap[r.team] = r.rank;
    }
    await kvPut(env.KV, PREV_WEEK_KEY, currentRankMap, 604800); // 7 days
    await kvPut(env.KV, lastStoredKey, new Date().toISOString(), 604800);
  }

  const response: PowerRankingsResponse = {
    rankings,
    computedAt: new Date().toISOString(),
    season: SEASON,
    methodology: `BSI Composite: ${W_OFFENSE * 100}% offense (wRC+), ${W_PITCHING * 100}% pitching (FIP), ${W_SOS * 100}% strength of schedule. Min 25 PA (batters), 10 IP (pitchers).`,
    meta: {
      source: 'bsi-power-rankings',
      fetched_at: new Date().toISOString(),
      timezone: 'America/Chicago',
    },
  };

  // Cache for 6 hours
  await kvPut(env.KV, CACHE_KEY, response, CACHE_TTL);

  return json(response);
}
