/**
 * Weekly Pulse — automated "This Week in College Baseball" from D1 metric data.
 *
 * Returns the top performers, biggest movers (when snapshot history exists),
 * and conference-level trends. Frontend renders this as an auto-updating
 * content page at /college-baseball/weekly-pulse.
 *
 * GET /api/college-baseball/weekly-pulse
 */

import { cachedJson, json, kvGet, kvPut } from '../shared/helpers';
import { HTTP_CACHE } from '../shared/constants';

const SEASON = 2026;

interface PulsePlayer {
  player_id: string;
  player_name: string;
  team: string;
  conference: string | null;
  value: number;
  label: string;
}

interface PulseMovers {
  risers: Array<PulsePlayer & { delta: number }>;
  fallers: Array<PulsePlayer & { delta: number }>;
}

interface WeeklyPulseData {
  week: string;
  generated_at: string;
  top_hitters: PulsePlayer[];
  top_pitchers: PulsePlayer[];
  movers_woba: PulseMovers | null;
  movers_fip: PulseMovers | null;
  conference_snapshot: Array<{
    conference: string;
    strength_index: number;
    is_power: number;
    avg_woba: number;
    avg_era: number;
  }>;
}

function getISOWeek(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function prevWeek(week: string): string {
  const [year, wStr] = week.split('-W');
  const wNum = parseInt(wStr, 10);
  if (wNum <= 1) return `${parseInt(year, 10) - 1}-W52`;
  return `${year}-W${String(wNum - 1).padStart(2, '0')}`;
}

export async function handleWeeklyPulse(env: Env): Promise<Response> {
  const cacheKey = 'cb:weekly-pulse';
  const cached = await kvGet<WeeklyPulseData>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(
      { ...cached, meta: { source: 'bsi-savant', fetched_at: new Date().toISOString(), timezone: 'America/Chicago', cache_hit: true } },
      200,
      HTTP_CACHE.standings,
      { 'X-Cache': 'HIT' },
    );
  }

  try {
    const week = getISOWeek();
    const prev = prevWeek(week);
    const now = new Date().toISOString();

    // Top 10 hitters by wRC+
    const { results: topHitters } = await env.DB.prepare(`
      SELECT player_id, player_name, team, conference, wrc_plus
      FROM cbb_batting_advanced
      WHERE season = ? AND pa >= 30
      ORDER BY wrc_plus DESC
      LIMIT 10
    `).bind(SEASON).all();

    // Top 10 pitchers by FIP
    const { results: topPitchers } = await env.DB.prepare(`
      SELECT player_id, player_name, team, conference, fip
      FROM cbb_pitching_advanced
      WHERE season = ? AND ip >= 10
      ORDER BY fip ASC
      LIMIT 10
    `).bind(SEASON).all();

    // Try to compute movers from snapshots
    let moversWoba: PulseMovers | null = null;
    let moversFip: PulseMovers | null = null;

    const { results: currentSnap } = await env.DB.prepare(`
      SELECT player_id, player_name, team, conference, woba, player_type
      FROM cbb_metric_snapshots
      WHERE snapshot_week = ? AND player_type = 'batter' AND season = ?
    `).bind(week, SEASON).all();

    const { results: prevSnap } = await env.DB.prepare(`
      SELECT player_id, woba
      FROM cbb_metric_snapshots
      WHERE snapshot_week = ? AND player_type = 'batter' AND season = ?
    `).bind(prev, SEASON).all();

    if (currentSnap.length > 0 && prevSnap.length > 0) {
      const prevMap = new Map(
        (prevSnap as Array<{ player_id: string; woba: number }>).map(p => [p.player_id, p.woba])
      );

      const deltas: Array<PulsePlayer & { delta: number }> = [];
      for (const c of currentSnap as Array<Record<string, unknown>>) {
        const pid = c.player_id as string;
        const prevWoba = prevMap.get(pid);
        if (prevWoba !== undefined) {
          const delta = (c.woba as number) - prevWoba;
          if (Math.abs(delta) > 0.005) {
            deltas.push({
              player_id: pid,
              player_name: c.player_name as string,
              team: c.team as string,
              conference: (c.conference as string) || null,
              value: c.woba as number,
              label: 'wOBA',
              delta,
            });
          }
        }
      }

      deltas.sort((a, b) => b.delta - a.delta);
      moversWoba = {
        risers: deltas.filter(d => d.delta > 0).slice(0, 5),
        fallers: deltas.filter(d => d.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, 5),
      };
    }

    // FIP movers
    const { results: currentPitchSnap } = await env.DB.prepare(`
      SELECT player_id, player_name, team, conference, fip
      FROM cbb_metric_snapshots
      WHERE snapshot_week = ? AND player_type = 'pitcher' AND season = ?
    `).bind(week, SEASON).all();

    const { results: prevPitchSnap } = await env.DB.prepare(`
      SELECT player_id, fip
      FROM cbb_metric_snapshots
      WHERE snapshot_week = ? AND player_type = 'pitcher' AND season = ?
    `).bind(prev, SEASON).all();

    if (currentPitchSnap.length > 0 && prevPitchSnap.length > 0) {
      const prevFipMap = new Map(
        (prevPitchSnap as Array<{ player_id: string; fip: number }>).map(p => [p.player_id, p.fip])
      );

      const fipDeltas: Array<PulsePlayer & { delta: number }> = [];
      for (const c of currentPitchSnap as Array<Record<string, unknown>>) {
        const pid = c.player_id as string;
        const prevFip = prevFipMap.get(pid);
        if (prevFip !== undefined) {
          const delta = (c.fip as number) - prevFip;
          if (Math.abs(delta) > 0.1) {
            fipDeltas.push({
              player_id: pid,
              player_name: c.player_name as string,
              team: c.team as string,
              conference: (c.conference as string) || null,
              value: c.fip as number,
              label: 'FIP',
              delta,
            });
          }
        }
      }

      // For FIP, negative delta = improvement (lower is better)
      fipDeltas.sort((a, b) => a.delta - b.delta);
      moversFip = {
        risers: fipDeltas.filter(d => d.delta < 0).slice(0, 5), // improving
        fallers: fipDeltas.filter(d => d.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 5), // declining
      };
    }

    // Conference snapshot
    const { results: confData } = await env.DB.prepare(`
      SELECT conference, strength_index, is_power, avg_woba, avg_era
      FROM cbb_conference_strength
      WHERE season = ?
      ORDER BY strength_index DESC
    `).bind(SEASON).all();

    const pulse: WeeklyPulseData = {
      week,
      generated_at: now,
      top_hitters: (topHitters as Array<Record<string, unknown>>).map(h => ({
        player_id: h.player_id as string,
        player_name: h.player_name as string,
        team: h.team as string,
        conference: (h.conference as string) || null,
        value: h.wrc_plus as number,
        label: 'wRC+',
      })),
      top_pitchers: (topPitchers as Array<Record<string, unknown>>).map(p => ({
        player_id: p.player_id as string,
        player_name: p.player_name as string,
        team: p.team as string,
        conference: (p.conference as string) || null,
        value: p.fip as number,
        label: 'FIP',
      })),
      movers_woba: moversWoba,
      movers_fip: moversFip,
      conference_snapshot: (confData as Array<Record<string, unknown>>).map(c => ({
        conference: c.conference as string,
        strength_index: c.strength_index as number,
        is_power: c.is_power as number,
        avg_woba: c.avg_woba as number,
        avg_era: c.avg_era as number,
      })),
    };

    // Cache for 10 minutes
    await kvPut(env.KV, cacheKey, pulse, 600);

    return cachedJson(
      {
        ...pulse,
        meta: {
          source: 'bsi-savant',
          fetched_at: now,
          timezone: 'America/Chicago',
          cache_hit: false,
        },
      },
      200,
      HTTP_CACHE.standings,
      { 'X-Cache': 'MISS' },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: 'Failed to generate weekly pulse', detail: msg }, 500);
  }
}
