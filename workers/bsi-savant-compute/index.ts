/**
 * BSI Savant Compute Worker — NIL Scoring & Weekly Snapshots
 *
 * Runs after bsi-cbb-analytics has populated the advanced metrics tables.
 * Two responsibilities:
 *   1. NIL valuation scoring (reads cbb_batting_advanced + cbb_pitching_advanced)
 *   2. Weekly metric snapshots for movement tracking
 *
 * Cron: offset 30 min from bsi-cbb-analytics (which runs on the hour every 6h)
 * Manual trigger: GET /run
 *
 * Bindings: DB (D1: bsi-prod-db), KV (BSI_PROD_CACHE)
 *
 * Deploy: wrangler deploy --config workers/bsi-savant-compute/wrangler.toml
 */

const SEASON = 2026;
const MIN_PA = 5;
const MIN_IP = 5.0;

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function clamp(n: number, min: number, max: number): number { return Math.max(min, Math.min(max, n)); }
function round(n: number, d = 3): number { const f = 10 ** d; return Math.round(n * f) / f; }

// ---------------------------------------------------------------------------
// NIL Scoring
// ---------------------------------------------------------------------------

const NIL_WEIGHTS = { performance: 0.40, exposure: 0.30, market: 0.30 };

const NIL_TIERS: { name: string; min: number; floor: number; ceiling: number }[] = [
  { name: 'elite',         min: 80, floor: 150000, ceiling: 500000 },
  { name: 'high',          min: 60, floor: 50000,  ceiling: 200000 },
  { name: 'mid',           min: 40, floor: 15000,  ceiling: 75000 },
  { name: 'emerging',      min: 20, floor: 3000,   ceiling: 25000 },
  { name: 'developmental', min: 0,  floor: 500,    ceiling: 5000 },
];

function nilTier(score: number): { name: string; low: number; mid: number; high: number } {
  for (const t of NIL_TIERS) {
    if (score >= t.min) {
      const pct = t.min < 100 ? (score - t.min) / (100 - t.min) : 1;
      const range = t.ceiling - t.floor;
      const low = Math.round(t.floor + range * Math.max(0, pct - 0.15));
      const mid = Math.round(t.floor + range * pct);
      const high = Math.round(t.floor + range * Math.min(1, pct + 0.15));
      return { name: t.name, low, mid, high };
    }
  }
  return { name: 'developmental', low: 500, mid: 1500, high: 5000 };
}

/** Score on-field performance [0-100] from savant advanced stats. */
function scorePerformance(row: Record<string, unknown>, type: 'batter' | 'pitcher'): number {
  if (type === 'batter') {
    const wrcPlus = (row.wrc_plus as number) ?? 100;
    const woba = (row.woba as number) ?? 0.320;
    const opsPlus = (row.ops_plus as number) ?? 100;
    const wrcScore = clamp((wrcPlus - 70) / 130 * 100, 0, 100);
    const wobaScore = clamp((woba - 0.250) / 0.250 * 100, 0, 100);
    const opsScore = clamp((opsPlus - 70) / 130 * 100, 0, 100);
    return round(wrcScore * 0.45 + wobaScore * 0.35 + opsScore * 0.20, 1);
  } else {
    const fip = (row.fip as number) ?? 4.50;
    const eraMinus = (row.era_minus as number) ?? 100;
    const k9 = (row.k_9 as number) ?? 6;
    const fipScore = clamp((6 - fip) / 4 * 100, 0, 100);
    const eraMinusScore = clamp((130 - eraMinus) / 80 * 100, 0, 100);
    const kScore = clamp((k9 - 3) / 10 * 100, 0, 100);
    return round(fipScore * 0.45 + eraMinusScore * 0.35 + kScore * 0.20, 1);
  }
}

/**
 * Score exposure [0-100].
 *
 * Real follower data: log scale (1K → ~25, 10K → ~50, 100K → ~75).
 * No followers: proxy from program tier, market size, and performance spillover.
 * Proxy range: ~12–58, intentionally below real-follower ceiling.
 */
function scoreExposure(
  followers: number,
  marketSize?: string | null,
  programTier?: string | null,
  perfScore?: number,
): number {
  if (followers > 0) {
    return clamp(round(Math.log10(Math.max(1, followers)) * 20 - 15, 1), 5, 98);
  }

  let base = 12;
  if (programTier === 'power') base = 32;
  else if (programTier === 'mid-major') base = 20;

  let marketBoost = 0;
  if (marketSize === 'large') marketBoost = 14;
  else if (marketSize === 'medium') marketBoost = 7;

  const spillover = perfScore != null ? round((perfScore / 100) * 12, 1) : 0;

  return clamp(round(base + marketBoost + spillover, 1), 5, 62);
}

/** Score market [0-100] from school market data. */
function scoreMarket(marketSize: string | null, programTier: string | null): number {
  let base = 30;
  if (marketSize === 'large') base = 65;
  else if (marketSize === 'medium') base = 45;
  else if (marketSize === 'small') base = 25;

  if (programTier === 'power') base += 20;
  else if (programTier === 'mid-major') base += 8;

  return clamp(base, 0, 100);
}

async function computeNIL(db: D1Database, kv: KVNamespace): Promise<{ nilScored: number }> {
  const now = new Date().toISOString();

  // 1. Load school market data
  const { results: marketRows } = await db.prepare(
    'SELECT team, market_size, program_tier FROM nil_school_market'
  ).all() as { results: { team: string; market_size: string; program_tier: string }[] };

  const marketMap = new Map<string, { market_size: string; program_tier: string }>();
  for (const m of marketRows || []) {
    marketMap.set(m.team, { market_size: m.market_size, program_tier: m.program_tier });
  }

  // 2. Load social followers (aggregate per player across platforms)
  const { results: socialRows } = await db.prepare(
    'SELECT player_id, SUM(follower_count) as total_followers FROM nil_social_profiles GROUP BY player_id'
  ).all() as { results: { player_id: string; total_followers: number }[] };

  const socialMap = new Map<string, number>();
  for (const s of socialRows || []) {
    socialMap.set(s.player_id, s.total_followers || 0);
  }

  // 3. Read computed advanced stats (populated by bsi-cbb-analytics)
  const { results: batters } = await db.prepare(
    `SELECT b.player_id, b.player_name, b.team, b.conference,
            COALESCE(NULLIF(b.position, 'UN'), NULLIF(b.position, ''),
                     NULLIF(p.position, 'UN'), NULLIF(p.position, ''), 'UN') AS position,
            b.woba, b.wrc_plus, b.ops_plus, b.pa,
            COALESCE(p.stolen_bases, 0) AS sb,
            COALESCE(p.home_runs, 0) AS hr,
            COALESCE(p.at_bats, 0) AS ab,
            COALESCE(p.innings_pitched_thirds, 0) AS ip3
     FROM cbb_batting_advanced b
     LEFT JOIN player_season_stats p
       ON b.player_id = p.espn_id AND p.season = ?
     WHERE b.season = ? AND b.pa >= 20`
  ).bind(SEASON, SEASON).all();

  const { results: pitchers } = await db.prepare(
    `SELECT b.player_id, b.player_name, b.team, b.conference,
            COALESCE(NULLIF(b.position, 'UN'), NULLIF(b.position, ''),
                     NULLIF(p.position, 'UN'), NULLIF(p.position, ''), 'P') AS position,
            b.fip, b.era_minus, b.k_9, b.ip
     FROM cbb_pitching_advanced b
     LEFT JOIN player_season_stats p
       ON b.player_id = p.espn_id AND p.season = ?
     WHERE b.season = ? AND b.ip >= 10`
  ).bind(SEASON, SEASON).all();

  // 3b. Stat-based position inference for batters labeled 'UN'
  const pitcherIds = new Set((pitchers || []).map((r: Record<string, unknown>) => r.player_id as string));

  for (const row of (batters || []) as Record<string, unknown>[]) {
    if (row.position !== 'UN') continue;
    const pid = row.player_id as string;
    const ip3 = Number(row.ip3 || 0);
    const ab = Number(row.ab || 0);
    const sb = Number(row.sb || 0);
    const hr = Number(row.hr || 0);

    if (pitcherIds.has(pid) || (ip3 >= 30 && ab < 60)) {
      row.position = 'TWP';
      continue;
    }
    if (ab > 0 && sb >= 8) {
      row.position = 'OF';
      continue;
    }
    if (ab > 0 && hr >= 6 && sb <= 2) {
      row.position = 'IF/DH';
      continue;
    }
    row.position = 'UT';
  }

  // 4. Score every qualifying player
  const stmts: D1PreparedStatement[] = [];
  const histStmts: D1PreparedStatement[] = [];
  const scored = new Set<string>();

  const processRow = (row: Record<string, unknown>, type: 'batter' | 'pitcher') => {
    const pid = row.player_id as string;
    if (scored.has(pid)) return;
    scored.add(pid);

    const team = (row.team as string) || '';
    const mkt = marketMap.get(team);
    const followers = socialMap.get(pid) || 0;

    const perfScore = scorePerformance(row, type);
    const expScore = scoreExposure(followers, mkt?.market_size, mkt?.program_tier, perfScore);
    const mktScore = scoreMarket(mkt?.market_size || null, mkt?.program_tier || null);

    const indexScore = round(
      perfScore * NIL_WEIGHTS.performance +
      expScore * NIL_WEIGHTS.exposure +
      mktScore * NIL_WEIGHTS.market,
      1
    );

    const tier = nilTier(indexScore);

    stmts.push(db.prepare(
      `INSERT INTO nil_player_scores (player_id, season, index_score, performance_score, exposure_score, market_score, estimated_low, estimated_mid, estimated_high, tier, player_name, team, conference, position, social_followers, market_size, computed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(player_id, season) DO UPDATE SET
         index_score=excluded.index_score, performance_score=excluded.performance_score,
         exposure_score=excluded.exposure_score, market_score=excluded.market_score,
         estimated_low=excluded.estimated_low, estimated_mid=excluded.estimated_mid,
         estimated_high=excluded.estimated_high, tier=excluded.tier,
         player_name=excluded.player_name, team=excluded.team,
         conference=excluded.conference, position=excluded.position,
         social_followers=excluded.social_followers, market_size=excluded.market_size,
         computed_at=excluded.computed_at`
    ).bind(
      pid, SEASON, indexScore, perfScore, expScore, mktScore,
      tier.low, tier.mid, tier.high, tier.name,
      (row.player_name as string) || '', team,
      (row.conference as string) || null, (row.position as string) || null,
      followers, mkt?.market_size || null, now
    ));

    histStmts.push(db.prepare(
      `INSERT INTO nil_score_history (player_id, season, index_score, performance_score, estimated_mid, computed_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(pid, SEASON, indexScore, perfScore, tier.mid, now));
  };

  for (const row of (batters || []) as Record<string, unknown>[]) processRow(row, 'batter');
  for (const row of (pitchers || []) as Record<string, unknown>[]) processRow(row, 'pitcher');

  // 5. Execute in batches
  const BATCH_SIZE = 80;
  let batchErrors = 0;
  for (let i = 0; i < stmts.length; i += BATCH_SIZE) {
    try {
      await db.batch(stmts.slice(i, i + BATCH_SIZE));
    } catch (err) {
      batchErrors++;
      console.error(`[nil] Score batch ${Math.floor(i / BATCH_SIZE)} failed:`, err instanceof Error ? err.message : err);
    }
  }
  for (let i = 0; i < histStmts.length; i += BATCH_SIZE) {
    try {
      await db.batch(histStmts.slice(i, i + BATCH_SIZE));
    } catch (err) {
      console.error(`[nil] History batch ${Math.floor(i / BATCH_SIZE)} failed:`, err instanceof Error ? err.message : err);
    }
  }
  if (batchErrors > 0) {
    console.error(`[nil] ${batchErrors} score batch(es) failed — partial data written`);
  }

  await kv.put('nil:last-compute', now);
  return { nilScored: scored.size };
}

// ---------------------------------------------------------------------------
// Weekly Metric Snapshots — captures freeze-frame for movement tracking
// ---------------------------------------------------------------------------

function getISOWeek(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

async function captureWeeklySnapshot(db: D1Database, kv: KVNamespace): Promise<{ snapshotted: number } | null> {
  const week = getISOWeek();
  const now = new Date().toISOString();

  const lastSnap = await kv.get('savant:last-snapshot-week');
  if (lastSnap === week) return null;

  const { results: batters } = await db.prepare(`
    SELECT player_id, player_name, team, team_id, conference,
           woba, wrc_plus, ops, avg, iso, k_pct, bb_pct, pa
    FROM cbb_batting_advanced
    WHERE season = ? AND pa >= ?
    ORDER BY wrc_plus DESC
    LIMIT 200
  `).bind(SEASON, MIN_PA).all();

  const { results: pitchers } = await db.prepare(`
    SELECT player_id, player_name, team, team_id, conference,
           fip, era_minus, era, whip, k_9, bb_9, ip
    FROM cbb_pitching_advanced
    WHERE season = ? AND ip >= ?
    ORDER BY fip ASC
    LIMIT 200
  `).bind(SEASON, MIN_IP).all();

  const stmts: D1PreparedStatement[] = [];

  for (const b of (batters || []) as Record<string, unknown>[]) {
    stmts.push(db.prepare(
      `INSERT INTO cbb_metric_snapshots
        (snapshot_week, player_id, player_name, team, team_id, conference, season, player_type,
         woba, wrc_plus, ops, avg, iso, k_pct, bb_pct, pa_or_ip, captured_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'batter', ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(snapshot_week, player_id, player_type) DO UPDATE SET
         woba=excluded.woba, wrc_plus=excluded.wrc_plus, ops=excluded.ops,
         avg=excluded.avg, iso=excluded.iso, k_pct=excluded.k_pct,
         bb_pct=excluded.bb_pct, pa_or_ip=excluded.pa_or_ip, captured_at=excluded.captured_at`
    ).bind(
      week, b.player_id, b.player_name, b.team, b.team_id || null,
      b.conference || null, SEASON,
      b.woba || 0, b.wrc_plus || 0, b.ops || 0, b.avg || 0,
      b.iso || 0, b.k_pct || 0, b.bb_pct || 0, b.pa || 0, now
    ));
  }

  for (const p of (pitchers || []) as Record<string, unknown>[]) {
    stmts.push(db.prepare(
      `INSERT INTO cbb_metric_snapshots
        (snapshot_week, player_id, player_name, team, team_id, conference, season, player_type,
         fip, era_minus, era, whip, k_9, bb_9, pa_or_ip, captured_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pitcher', ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(snapshot_week, player_id, player_type) DO UPDATE SET
         fip=excluded.fip, era_minus=excluded.era_minus, era=excluded.era,
         whip=excluded.whip, k_9=excluded.k_9, bb_9=excluded.bb_9,
         pa_or_ip=excluded.pa_or_ip, captured_at=excluded.captured_at`
    ).bind(
      week, p.player_id, p.player_name, p.team, p.team_id || null,
      p.conference || null, SEASON,
      p.fip || 0, p.era_minus || 0, p.era || 0, p.whip || 0,
      p.k_9 || 0, p.bb_9 || 0, p.ip || 0, now
    ));
  }

  const BATCH_SIZE = 80;
  for (let i = 0; i < stmts.length; i += BATCH_SIZE) {
    try {
      await db.batch(stmts.slice(i, i + BATCH_SIZE));
    } catch (err) {
      console.error(`[snapshot] Batch ${Math.floor(i / BATCH_SIZE)} failed:`, err instanceof Error ? err.message : err);
    }
  }

  await kv.put('savant:last-snapshot-week', week);
  console.info(`[savant-compute] Weekly snapshot captured: week ${week}, ${stmts.length} players`);
  return { snapshotted: stmts.length };
}

// ---------------------------------------------------------------------------
// Worker entry
// ---------------------------------------------------------------------------

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/run' || url.pathname === '/compute') {
      try {
        const nilResult = await computeNIL(env.DB, env.KV);
        const snapResult = await captureWeeklySnapshot(env.DB, env.KV);
        return new Response(JSON.stringify({
          ok: true,
          message: 'NIL scoring + snapshot triggered',
          ...nilResult,
          snapshot: snapResult || 'already captured this week',
          computed_at: new Date().toISOString(),
        }, null, 2), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return new Response(JSON.stringify({ ok: false, error: msg }, null, 2), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    if (url.pathname === '/health') {
      const lastCompute = await env.KV.get('nil:last-compute');
      return new Response(JSON.stringify({
        status: 'ok',
        worker: 'bsi-savant-compute',
        purpose: 'NIL scoring + weekly snapshots',
        last_nil_compute: lastCompute || 'never',
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (url.pathname === '/') {
      return new Response('BSI Savant Compute — NIL scoring + weekly snapshots. Use /run to trigger.', { status: 200 });
    }

    return new Response('Not found', { status: 404 });
  },

  async scheduled(_event: ScheduledController, env: Env, _ctx: ExecutionContext): Promise<void> {
    try {
      const nilResult = await computeNIL(env.DB, env.KV);
      const snapResult = await captureWeeklySnapshot(env.DB, env.KV);
      const snapMsg = snapResult ? `, snapshot: ${snapResult.snapshotted} players` : '';
      console.info(`[savant-compute] Cron complete: ${nilResult.nilScored} NIL scored${snapMsg}`);
    } catch (err) {
      console.error(`[savant-compute] Cron failed:`, err);
    }
  },
} satisfies ExportedHandler<Env>;
