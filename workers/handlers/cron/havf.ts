/**
 * HAV-F (Hit power, Approach, Volatility, Fielding) daily computation.
 *
 * Reads all qualifying batters from cbb_batting_advanced,
 * runs the HAV-F engine, and persists results to havf_scores.
 */

import type { Env } from '../../shared/types';
import { batchComputeHAVF, type HAVFInput } from '../../../lib/analytics/havf';

/**
 * Compute HAV-F scores from cbb_batting_advanced data.
 * Reads all qualifying batters (>=10 PA), runs the HAV-F engine,
 * and persists results to havf_scores. Runs once daily.
 */
export async function computeHAVFDaily(env: Env): Promise<void> {
  if (!env.DB) return;

  const season = new Date().getFullYear();
  const { results: batters } = await env.DB.prepare(
    `SELECT player_id, player_name, team, conference, position, season,
            avg, obp, slg, woba, iso, bb_pct, k_pct, babip, hr, pa
     FROM cbb_batting_advanced
     WHERE season = ? AND pa >= 10`
  ).bind(season).all<{
    player_id: string; player_name: string; team: string; conference: string;
    position: string; season: number; avg: number; obp: number; slg: number;
    woba: number; iso: number; bb_pct: number; k_pct: number; babip: number;
    hr: number; pa: number;
  }>();

  if (!batters || batters.length === 0) return;

  // Transform D1 rows to HAVFInput
  const inputs: HAVFInput[] = batters.map(b => ({
    playerID: b.player_id,
    name: b.player_name,
    team: b.team,
    league: 'college-baseball',
    season: b.season,
    avg: b.avg ?? 0,
    obp: b.obp ?? 0,
    slg: b.slg ?? 0,
    woba: b.woba ?? 0,
    iso: b.iso ?? 0,
    bbPct: b.bb_pct ?? 0,
    kPct: b.k_pct ?? 0,
    babip: b.babip ?? 0,
    hrPct: b.pa > 0 ? (b.hr ?? 0) / b.pa : 0,
    fieldingPct: null,
    rangeFactor: null,
    games: null,
  }));

  const results = batchComputeHAVF(inputs);

  // Batch upsert to havf_scores in chunks of 25
  const CHUNK = 25;
  for (let i = 0; i < results.length; i += CHUNK) {
    const chunk = results.slice(i, i + CHUNK);
    const stmts = chunk.map((r, idx) => {
      const batter = batters[i + idx];
      return env.DB.prepare(
        `INSERT OR REPLACE INTO havf_scores
         (player_id, player_name, team, league, season, position, conference,
          h_score, a_score, v_score, f_score, havf_composite,
          raw_avg, raw_obp, raw_slg, raw_woba, raw_iso, raw_bb_pct, raw_k_pct, raw_babip, raw_hr_rate,
          computed_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        r.playerID, r.name, r.team, r.league, r.season,
        batter?.position ?? null, batter?.conference ?? null,
        r.h_score, r.a_score, r.v_score, r.f_score,
        r.havf_composite,
        batter?.avg ?? null, batter?.obp ?? null, batter?.slg ?? null,
        batter?.woba ?? null, batter?.iso ?? null, batter?.bb_pct ?? null,
        batter?.k_pct ?? null, batter?.babip ?? null,
        batter?.pa > 0 ? (batter?.hr ?? 0) / batter.pa : null,
        r.meta.computed_at, r.meta.computed_at,
      );
    });
    await env.DB.batch(stmts);
  }
}
