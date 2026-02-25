/**
 * BSI Savant Compute Worker
 *
 * Cron: every 6 hours — recomputes advanced metrics from player_season_stats.
 * Manual trigger: GET /compute — returns summary JSON.
 *
 * Bindings: DB (D1: bsi-prod-db), KV (BSI_PROD_CACHE)
 *
 * Deploy: wrangler deploy --config workers/bsi-savant-compute/wrangler.toml
 */

interface Env {
  DB: D1Database;
  KV: KVNamespace;
}

const SEASON = 2026;
const MIN_PA = 20;
const MIN_IP = 5.0;

// ---------------------------------------------------------------------------
// Inline math — minimal subset of savant-metrics.ts
// ---------------------------------------------------------------------------

const WEIGHTS = { wBB: 0.69, wHBP: 0.72, w1B: 0.89, w2B: 1.24, w3B: 1.56, wHR: 2.01 };

function safe(n: number): number { return Number.isFinite(n) ? n : 0; }
function clamp(n: number, min: number, max: number): number { return Math.max(min, Math.min(max, n)); }
function round(n: number, d = 3): number { const f = 10 ** d; return Math.round(n * f) / f; }
function thirdsToIP(thirds: number): number { return Math.floor(thirds / 3) + (thirds % 3) / 3; }

function calcWOBA(pa: number, bb: number, hbp: number, h: number, doubles: number, triples: number, hr: number) {
  if (pa <= 0) return 0;
  const singles = Math.max(0, h - doubles - triples - hr);
  return safe((WEIGHTS.wBB * bb + WEIGHTS.wHBP * hbp + WEIGHTS.w1B * singles + WEIGHTS.w2B * doubles + WEIGHTS.w3B * triples + WEIGHTS.wHR * hr) / pa);
}

function calcFIP(hr: number, bb: number, hbp: number, so: number, ip: number, c: number) {
  if (ip <= 0) return 0;
  return safe((13 * hr + 3 * (bb + hbp) - 2 * so) / ip + c);
}

function calcFIPConst(era: number, hr: number, bb: number, k: number, ip: number) {
  if (ip <= 0) return 3.80;
  return clamp(era - (13 * hr + 3 * bb - 2 * k) / ip, 3.0, 5.0);
}

function calcWOBAScale(obp: number, woba: number, avg: number) {
  const d = obp - avg;
  if (d <= 0.01) return 1.15;
  return clamp((obp - woba) / d, 0.8, 1.4);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RawRow {
  espn_id: string; name: string; team: string; team_id: string | null; position: string | null;
  games_bat: number; at_bats: number; runs: number; hits: number; doubles: number; triples: number;
  home_runs: number; walks_bat: number; strikeouts_bat: number; stolen_bases: number;
  rbis: number; hit_by_pitch: number; sacrifice_flies: number; caught_stealing: number;
  on_base_pct: number; slugging_pct: number;
  games_pitch: number; innings_pitched_thirds: number; hits_allowed: number;
  earned_runs: number; walks_pitch: number; strikeouts_pitch: number;
  home_runs_allowed: number; wins: number; losses: number; saves: number;
}

// ---------------------------------------------------------------------------
// Main compute
// ---------------------------------------------------------------------------

async function compute(db: D1Database, kv: KVNamespace): Promise<{ batters: number; pitchers: number; conferences: number; venues: number }> {
  const now = new Date().toISOString();

  // 1. Query all raw data
  const { results: rawRows } = await db.prepare(
    `SELECT * FROM player_season_stats WHERE season = ? AND sport = 'college-baseball'`
  ).bind(SEASON).all() as { results: RawRow[] };

  if (!rawRows || rawRows.length === 0) {
    return { batters: 0, pitchers: 0, conferences: 0, venues: 0 };
  }

  // 2. Derive league context
  let lgPA = 0, lgAB = 0, lgH = 0, lgHR = 0, lgBB = 0, lgHBP = 0, lgSO = 0, lgSF = 0;
  let lg2B = 0, lg3B = 0, lgR = 0;
  let lgIP = 0, lgER = 0, lgPHR = 0, lgPBB = 0, lgPK = 0;

  for (const row of rawRows) {
    if (row.games_bat > 0) {
      const pa = row.at_bats + row.walks_bat + row.hit_by_pitch + row.sacrifice_flies;
      if (pa >= MIN_PA) {
        lgPA += pa; lgAB += row.at_bats; lgH += row.hits; lgHR += row.home_runs;
        lgBB += row.walks_bat; lgHBP += row.hit_by_pitch; lgSO += row.strikeouts_bat;
        lgSF += row.sacrifice_flies; lg2B += row.doubles; lg3B += row.triples;
        lgR += row.runs;
      }
    }
    if (row.games_pitch > 0) {
      const ip = thirdsToIP(row.innings_pitched_thirds);
      if (ip >= MIN_IP) {
        lgIP += ip; lgER += row.earned_runs; lgPHR += row.home_runs_allowed;
        lgPBB += row.walks_pitch; lgPK += row.strikeouts_pitch;
      }
    }
  }

  const lgAVG = lgAB > 0 ? lgH / lgAB : 0.260;
  const lgOBP = lgPA > 0 ? (lgH + lgBB + lgHBP) / lgPA : 0.340;
  const lgSingles = lgH - lg2B - lg3B - lgHR;
  const lgSLG = lgAB > 0 ? (lgSingles + 2 * lg2B + 3 * lg3B + 4 * lgHR) / lgAB : 0.400;
  const lgWOBA = calcWOBA(lgPA || 1, lgBB, lgHBP, lgH, lg2B, lg3B, lgHR);
  const lgERA = lgIP > 0 ? (lgER * 9) / lgIP : 4.50;
  const fipC = calcFIPConst(lgERA, lgPHR, lgPBB, lgPK, lgIP);
  const wScale = calcWOBAScale(lgOBP, lgWOBA, lgAVG);
  const rPA = lgPA > 0 ? lgR / lgPA : 0.11;

  // 3. Compute batting + pitching in batch SQL
  const batStmts: D1PreparedStatement[] = [];
  const pitchStmts: D1PreparedStatement[] = [];
  let batCount = 0, pitchCount = 0;

  for (const row of rawRows) {
    // Batting
    if (row.games_bat > 0) {
      const pa = row.at_bats + row.walks_bat + row.hit_by_pitch + row.sacrifice_flies;
      if (pa >= MIN_PA) {
        const ab = row.at_bats;
        const avg = ab > 0 ? row.hits / ab : 0;
        const singles = Math.max(0, row.hits - row.doubles - row.triples - row.home_runs);
        const slg = row.slugging_pct || (ab > 0 ? (singles + 2 * row.doubles + 3 * row.triples + 4 * row.home_runs) / ab : 0);
        const obp = row.on_base_pct || (pa > 0 ? (row.hits + row.walks_bat + row.hit_by_pitch) / pa : 0);
        const ops = obp + slg;
        const iso = safe(slg - avg);
        const babip = (() => { const d = ab - row.strikeouts_bat - row.home_runs + row.sacrifice_flies; return d > 0 ? safe((row.hits - row.home_runs) / d) : 0; })();
        const kPct = safe(row.strikeouts_bat / pa);
        const bbPct = safe(row.walks_bat / pa);
        const woba = calcWOBA(pa, row.walks_bat, row.hit_by_pitch, row.hits, row.doubles, row.triples, row.home_runs);
        const wrcPerPA = rPA > 0 && wScale > 0 ? ((woba - lgWOBA) / wScale + rPA) : rPA;
        const wrcPlus = rPA > 0 ? safe((wrcPerPA / rPA) * 100) : 100;
        const opsPlus = lgOBP > 0 && lgSLG > 0 ? safe(100 * (obp / lgOBP + slg / lgSLG - 1)) : 100;

        batStmts.push(db.prepare(
          `INSERT INTO cbb_batting_advanced (player_id, player_name, team, team_id, season, position, g, ab, pa, r, h, doubles, triples, hr, rbi, bb, so, sb, cs, avg, obp, slg, ops, k_pct, bb_pct, iso, babip, woba, wrc_plus, ops_plus, park_adjusted, data_source, computed_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'bsi-savant', ?)
           ON CONFLICT(player_id, season) DO UPDATE SET
             player_name=excluded.player_name, team=excluded.team, g=excluded.g, ab=excluded.ab, pa=excluded.pa,
             r=excluded.r, h=excluded.h, doubles=excluded.doubles, triples=excluded.triples, hr=excluded.hr,
             rbi=excluded.rbi, bb=excluded.bb, so=excluded.so, sb=excluded.sb, cs=excluded.cs,
             avg=excluded.avg, obp=excluded.obp, slg=excluded.slg, ops=excluded.ops,
             k_pct=excluded.k_pct, bb_pct=excluded.bb_pct, iso=excluded.iso, babip=excluded.babip,
             woba=excluded.woba, wrc_plus=excluded.wrc_plus, ops_plus=excluded.ops_plus, computed_at=excluded.computed_at`
        ).bind(
          row.espn_id, row.name, row.team, row.team_id, SEASON, row.position,
          row.games_bat, ab, pa, row.runs, row.hits, row.doubles, row.triples, row.home_runs,
          row.rbis, row.walks_bat, row.strikeouts_bat, row.stolen_bases, row.caught_stealing,
          round(avg), round(obp), round(slg), round(ops), round(kPct), round(bbPct),
          round(iso), round(babip), round(woba), round(wrcPlus, 1), round(opsPlus, 1), now
        ));
        batCount++;
      }
    }

    // Pitching
    if (row.games_pitch > 0) {
      const ip = thirdsToIP(row.innings_pitched_thirds);
      if (ip >= MIN_IP) {
        const era = safe((row.earned_runs * 9) / ip);
        const whip = safe((row.hits_allowed + row.walks_pitch) / ip);
        const k9 = safe((row.strikeouts_pitch * 9) / ip);
        const bb9 = safe((row.walks_pitch * 9) / ip);
        const hr9 = safe((row.home_runs_allowed * 9) / ip);
        const kbb = row.walks_pitch > 0 ? safe(row.strikeouts_pitch / row.walks_pitch) : 0;
        const fip = calcFIP(row.home_runs_allowed, row.walks_pitch, row.hit_by_pitch, row.strikeouts_pitch, ip, fipC);
        const eraMinus = lgERA > 0 ? safe(100 * era / lgERA) : 100;
        const runners = row.hits_allowed + row.walks_pitch + row.hit_by_pitch - row.home_runs_allowed;
        const lobPct = runners > 0 ? safe((runners - row.earned_runs) / runners) : 0;
        const bfEst = Math.round(ip * 3 + row.hits_allowed + row.walks_pitch);
        const babip = (() => { const d = bfEst - row.strikeouts_pitch - row.home_runs_allowed; return d > 0 ? safe((row.hits_allowed - row.home_runs_allowed) / d) : 0; })();

        pitchStmts.push(db.prepare(
          `INSERT INTO cbb_pitching_advanced (player_id, player_name, team, team_id, season, position, g, w, l, sv, ip, h, er, bb, hbp, so, era, whip, k_9, bb_9, hr_9, fip, era_minus, k_bb, lob_pct, babip, park_adjusted, data_source, computed_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'bsi-savant', ?)
           ON CONFLICT(player_id, season) DO UPDATE SET
             player_name=excluded.player_name, team=excluded.team, g=excluded.g, w=excluded.w, l=excluded.l,
             sv=excluded.sv, ip=excluded.ip, h=excluded.h, er=excluded.er, bb=excluded.bb, hbp=excluded.hbp,
             so=excluded.so, era=excluded.era, whip=excluded.whip, k_9=excluded.k_9, bb_9=excluded.bb_9,
             hr_9=excluded.hr_9, fip=excluded.fip, era_minus=excluded.era_minus, k_bb=excluded.k_bb,
             lob_pct=excluded.lob_pct, babip=excluded.babip, computed_at=excluded.computed_at`
        ).bind(
          row.espn_id, row.name, row.team, row.team_id, SEASON, row.position,
          row.games_pitch, row.wins, row.losses, row.saves,
          round(ip, 1), row.hits_allowed, row.earned_runs, row.walks_pitch,
          row.hit_by_pitch, row.strikeouts_pitch,
          round(era, 2), round(whip, 2), round(k9, 1), round(bb9, 1), round(hr9, 1),
          round(fip, 2), round(eraMinus, 1), round(kbb, 2), round(lobPct), round(babip), now
        ));
        pitchCount++;
      }
    }
  }

  // 4. Execute in batches (D1 batch limit ~100)
  const BATCH_SIZE = 80;
  for (let i = 0; i < batStmts.length; i += BATCH_SIZE) {
    await db.batch(batStmts.slice(i, i + BATCH_SIZE));
  }
  for (let i = 0; i < pitchStmts.length; i += BATCH_SIZE) {
    await db.batch(pitchStmts.slice(i, i + BATCH_SIZE));
  }

  // 5. Conference strength (aggregate from computed data)
  const confAgg = new Map<string, { totalERA: number; eraCount: number; totalOPS: number; opsCount: number; totalWOBA: number; wobaCount: number }>();

  const { results: batRows } = await db.prepare(
    'SELECT conference, era, ops, woba FROM cbb_batting_advanced WHERE season = ? AND conference IS NOT NULL'
  ).bind(SEASON).all() as { results: { conference: string; era: number; ops: number; woba: number }[] };

  for (const r of batRows || []) {
    let a = confAgg.get(r.conference);
    if (!a) { a = { totalERA: 0, eraCount: 0, totalOPS: 0, opsCount: 0, totalWOBA: 0, wobaCount: 0 }; confAgg.set(r.conference, a); }
    a.totalOPS += r.ops; a.opsCount++;
    a.totalWOBA += r.woba; a.wobaCount++;
  }

  const { results: pitRows } = await db.prepare(
    'SELECT conference, era FROM cbb_pitching_advanced WHERE season = ? AND conference IS NOT NULL'
  ).bind(SEASON).all() as { results: { conference: string; era: number }[] };

  for (const r of pitRows || []) {
    let a = confAgg.get(r.conference);
    if (!a) { a = { totalERA: 0, eraCount: 0, totalOPS: 0, opsCount: 0, totalWOBA: 0, wobaCount: 0 }; confAgg.set(r.conference, a); }
    a.totalERA += r.era; a.eraCount++;
  }

  const confStmts: D1PreparedStatement[] = [];
  const POWER = new Set(['SEC', 'ACC', 'Big 12', 'Big Ten', 'Pac-12']);
  for (const [conf, a] of confAgg) {
    const avgERA = a.eraCount > 0 ? a.totalERA / a.eraCount : 5.0;
    const avgOPS = a.opsCount > 0 ? a.totalOPS / a.opsCount : 0.700;
    const avgWOBA = a.wobaCount > 0 ? a.totalWOBA / a.wobaCount : 0.320;
    // Simplified strength: ERA weight 40%, wOBA 30%, OPS 30%
    const eraScore = clamp((1 - avgERA / 10) * 100, 0, 100);
    const wobaScore = clamp((avgWOBA / 0.400) * 50, 0, 100);
    const opsScore = clamp((avgOPS / 0.800) * 50, 0, 100);
    const strength = round(eraScore * 0.40 + wobaScore * 0.30 + opsScore * 0.30, 1);

    confStmts.push(db.prepare(
      `INSERT INTO cbb_conference_strength (conference, season, strength_index, avg_era, avg_ops, avg_woba, is_power, computed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(conference, season) DO UPDATE SET
         strength_index=excluded.strength_index, avg_era=excluded.avg_era, avg_ops=excluded.avg_ops,
         avg_woba=excluded.avg_woba, is_power=excluded.is_power, computed_at=excluded.computed_at`
    ).bind(conf, SEASON, strength, round(avgERA, 2), round(avgOPS, 3), round(avgWOBA, 3), POWER.has(conf) ? 1 : 0, now));
  }

  if (confStmts.length > 0) {
    await db.batch(confStmts);
  }

  // 6. Store last-compute timestamp
  await kv.put('savant:last-compute', now);

  return { batters: batCount, pitchers: pitchCount, conferences: confAgg.size, venues: 0 };
}

// ---------------------------------------------------------------------------
// Worker entry
// ---------------------------------------------------------------------------

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/compute' || url.pathname === '/') {
      try {
        const result = await compute(env.DB, env.KV);
        return new Response(JSON.stringify({
          ok: true,
          ...result,
          computed_at: new Date().toISOString(),
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return new Response(JSON.stringify({ ok: false, error: msg }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Health check
    if (url.pathname === '/health') {
      const lastCompute = await env.KV.get('savant:last-compute');
      return new Response(JSON.stringify({
        status: 'ok',
        worker: 'bsi-savant-compute',
        last_compute: lastCompute || 'never',
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response('Not found', { status: 404 });
  },

  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    try {
      const result = await compute(env.DB, env.KV);
      console.log(`[savant-compute] Cron complete: ${result.batters} batters, ${result.pitchers} pitchers, ${result.conferences} conferences`);
    } catch (err) {
      console.error(`[savant-compute] Cron failed:`, err);
    }
  },
};
