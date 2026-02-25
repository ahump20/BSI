/**
 * College Baseball — sabermetrics, SOS, and conference power index handlers.
 *
 * TODO: wOBA weights at line ~100 use MLB linear weights. College-specific
 * weights require a full season of D1 run-scoring data — too thin at 3 weeks in.
 * See docs/tech-debt/college-woba-weights.md for details.
 */

import type { Env } from './shared';
import { json, cachedJson, kvGet, kvPut, dataHeaders, HTTP_CACHE, CACHE_TTL, SEASON, teamMetadata, metaByEspnId, getLogoUrl } from './shared';

/**
 * League-wide sabermetric baselines for 2026 college baseball.
 * GET /api/college-baseball/sabermetrics
 * Computes league-average wOBA, BABIP, K%, BB% from all qualified hitters in D1.
 */
export async function handleCBBLeagueSabermetrics(env: Env): Promise<Response> {
  const cacheKey = 'cb:saber:league:2026';
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.standings, { 'X-Cache': 'HIT' });

  try {
    // Aggregate batting stats for all qualified hitters (20+ AB)
    // Include OBP/SLG for per-player derivation of 2B/3B/HBP
    const batting = await env.DB.prepare(`
      SELECT
        SUM(at_bats) as total_ab,
        SUM(hits) as total_h,
        SUM(doubles) as total_2b,
        SUM(triples) as total_3b,
        SUM(home_runs) as total_hr,
        SUM(walks_bat) as total_bb,
        SUM(strikeouts_bat) as total_k,
        SUM(hit_by_pitch) as total_hbp,
        SUM(sacrifice_flies) as total_sf,
        SUM(runs) as total_r,
        COUNT(*) as qualified_hitters
      FROM player_season_stats
      WHERE sport = 'college-baseball' AND season = ? AND at_bats >= 20
    `).bind(SEASON).first<Record<string, number>>();

    // When 2B/3B/HBP are mostly 0 (ESPN doesn't provide these in box scores),
    // compute league-wide approximations from stored OBP/SLG.
    // Per-player derivation would be more accurate but is done in the team handler;
    // the league handler uses aggregate approximation for baselines.
    if (batting && (batting.total_2b || 0) === 0 && (batting.total_hbp || 0) === 0) {
      // Fetch per-player data for derivation
      const players = await env.DB.prepare(`
        SELECT at_bats, hits, home_runs, walks_bat, on_base_pct, slugging_pct
        FROM player_season_stats
        WHERE sport = 'college-baseball' AND season = ? AND at_bats >= 20
          AND on_base_pct > 0 AND slugging_pct > 0
      `).bind(SEASON).all<{ at_bats: number; hits: number; home_runs: number; walks_bat: number; on_base_pct: number; slugging_pct: number }>();

      let derived2B = 0, derived3B = 0, derivedHBP = 0, derivedSF = 0;
      for (const p of players.results) {
        const ab = p.at_bats;
        const h = p.hits;
        const hr = p.home_runs;
        const bb = p.walks_bat;
        const slg = p.slugging_pct;
        const obp = p.on_base_pct;

        // Derive TB → 2B/3B
        if (slg > 0 && ab > 0 && h > hr) {
          const tb = Math.round(slg * ab);
          const xb = Math.max(0, tb - h - 3 * hr);
          const est3B = Math.max(0, Math.round(xb * 0.05));
          derived3B += est3B;
          derived2B += Math.max(0, xb - 2 * est3B);
        }

        // Derive HBP from OBP
        if (obp > 0 && obp < 1 && ab > 0) {
          const estHbp = Math.round((obp * (ab + bb) - h - bb) / (1 - obp));
          if (estHbp > 0) derivedHBP += estHbp;
          else if (estHbp < 0) {
            // Negative means SF likely exists
            for (let trySf = 1; trySf <= 3; trySf++) {
              const adj = Math.round((obp * (ab + bb + trySf) - h - bb) / (1 - obp));
              if (adj >= 0) { derivedHBP += adj; derivedSF += trySf; break; }
            }
          }
        }
      }

      batting.total_2b = derived2B;
      batting.total_3b = derived3B;
      batting.total_hbp = derivedHBP;
      batting.total_sf = derivedSF;
    }

    // Aggregate pitching stats for qualified pitchers (45+ thirds = 15 IP)
    const pitching = await env.DB.prepare(`
      SELECT
        SUM(innings_pitched_thirds) as total_ip_thirds,
        SUM(strikeouts_pitch) as total_k,
        SUM(walks_pitch) as total_bb,
        SUM(home_runs_allowed) as total_hr,
        SUM(earned_runs) as total_er,
        COUNT(*) as qualified_pitchers
      FROM player_season_stats
      WHERE sport = 'college-baseball' AND season = ? AND innings_pitched_thirds >= 45
    `).bind(SEASON).first<Record<string, number>>();

    if (!batting || !pitching) {
      return json({ error: 'No qualifying data', meta: { source: 'bsi-d1', fetched_at: new Date().toISOString(), timezone: 'America/Chicago' } }, 404);
    }

    const ab = batting.total_ab || 0;
    const h = batting.total_h || 0;
    const doubles = batting.total_2b || 0;
    const triples = batting.total_3b || 0;
    const hr = batting.total_hr || 0;
    const bb = batting.total_bb || 0;
    const k = batting.total_k || 0;
    const hbp = batting.total_hbp || 0;
    const sf = batting.total_sf || 0;
    const totalRuns = batting.total_r || 0;
    const singles = h - doubles - triples - hr;

    // Correct PA = AB + BB + HBP + SF (Bug 4 fix)
    const pa = ab + bb + hbp + sf;

    // wOBA with HBP in numerator (Bug 5 fix) — using MLB linear weights for now
    // TODO(Phase 3B): derive college-specific weights from D1 run environment
    const wBB = 0.69, wHBP = 0.72, w1B = 0.89, w2B = 1.24, w3B = 1.56, wHR = 2.01;
    const league_woba = pa > 0
      ? (wBB * bb + wHBP * hbp + w1B * singles + w2B * doubles + w3B * triples + wHR * hr) / pa
      : 0;

    const league_babip = (ab - k - hr) > 0 ? (h - hr) / (ab - k - hr) : 0;
    const league_kpct = pa > 0 ? k / pa : 0;
    const league_bbpct = pa > 0 ? bb / pa : 0;
    const league_iso = ab > 0 ? (doubles + 2 * triples + 3 * hr) / ab : 0;

    // League OBP and AVG for wOBA scale computation
    const league_avg = ab > 0 ? h / ab : 0;
    const league_obp = pa > 0 ? (h + bb + hbp) / pa : 0;
    const league_slg = ab > 0 ? (singles + 2 * doubles + 3 * triples + 4 * hr) / ab : 0;

    // Runs per PA — needed for wRC+ denominator
    const runs_per_pa = pa > 0 ? totalRuns / pa : 0;

    // Guard: with <100 qualified hitters, league baselines are unreliable.
    // Use reference D1 values (typical full-season college baseball) as floor.
    const thinSample = (batting.qualified_hitters || 0) < 100;

    // wOBA scale: (lgOBP - lgwOBA) / (lgOBP - lgAVG) — Tango framework
    // Must be positive (typically 1.0-1.3 for college). Clamp to [0.8, 1.4].
    let woba_scale = 1.15; // D1 reference default
    if (!thinSample && (league_obp - league_avg) > 0.01) {
      const raw = (league_obp - league_woba) / (league_obp - league_avg);
      woba_scale = Math.max(0.8, Math.min(1.4, raw));
    }

    // Pitching: compute FIP constant from D1 league data (Bug 6 fix)
    // cFIP = lgERA - (13*lgHR/9 + 3*lgBB/9 - 2*lgK/9)
    const ipThirds = pitching.total_ip_thirds || 0;
    const ip = ipThirds / 3;
    const lgERA = ip > 0 ? (pitching.total_er || 0) * 9 / ip : 0;
    const lgHR9 = ip > 0 ? (pitching.total_hr || 0) * 9 / ip : 0;
    const lgBB9 = ip > 0 ? (pitching.total_bb || 0) * 9 / ip : 0;
    const lgK9 = ip > 0 ? (pitching.total_k || 0) * 9 / ip : 0;

    // FIP constant: typically 3.7-4.0 for D1. Clamp to [3.0, 5.0] to guard against
    // extreme early-season samples. Use reference when <5 qualified pitchers.
    const qualifiedPitchers = pitching.qualified_pitchers || 0;
    let fip_constant = 3.80; // D1 reference default
    if (qualifiedPitchers >= 5 && ip > 0) {
      const raw = lgERA - (13 * lgHR9 + 3 * lgBB9 - 2 * lgK9) / 9;
      fip_constant = Math.max(3.0, Math.min(5.0, raw));
    }

    const league_fip = ip > 0
      ? (13 * (pitching.total_hr || 0) + 3 * (pitching.total_bb || 0) - 2 * (pitching.total_k || 0)) / ip + fip_constant
      : 0;

    const payload = {
      season: 2026,
      league_woba: Math.round(league_woba * 1000) / 1000,
      league_babip: Math.round(league_babip * 1000) / 1000,
      league_kpct: Math.round(league_kpct * 1000) / 1000,
      league_bbpct: Math.round(league_bbpct * 1000) / 1000,
      league_iso: Math.round(league_iso * 1000) / 1000,
      league_fip: Math.round(league_fip * 100) / 100,
      league_era: Math.round(lgERA * 100) / 100,
      league_obp: Math.round(league_obp * 1000) / 1000,
      league_avg: Math.round(league_avg * 1000) / 1000,
      league_slg: Math.round(league_slg * 1000) / 1000,
      fip_constant: Math.round(fip_constant * 100) / 100,
      woba_scale: Math.round(woba_scale * 100) / 100,
      runs_per_pa: Math.round(runs_per_pa * 1000) / 1000,
      weights_source: 'mlb-derived',
      thin_sample: thinSample,
      qualified_hitters: batting.qualified_hitters || 0,
      qualified_pitchers: qualifiedPitchers,
      meta: { source: 'bsi-d1', fetched_at: new Date().toISOString(), timezone: 'America/Chicago' },
    };

    await kvPut(env.KV, cacheKey, payload, 3600);
    return cachedJson(payload, 200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Sabermetrics computation failed' }, 500);
  }
}

/**
 * Team-level sabermetrics for a specific college baseball team.
 * GET /api/college-baseball/teams/:teamId/sabermetrics
 */
export async function handleCBBTeamSabermetrics(teamId: string, env: Env): Promise<Response> {
  const cacheKey = `cb:saber:team:${teamId}`;
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.team, { 'X-Cache': 'HIT' });

  try {
    // Resolve slug to ESPN numeric team_id if non-numeric
    let resolvedId = teamId;
    if (!/^\d+$/.test(teamId)) {
      // Convert slug to search term: "texas-am" → "%texas%a%m%"
      const searchTerm = `%${teamId.replace(/-/g, '%')}%`;
      const lookup = await env.DB.prepare(`
        SELECT team_id FROM player_season_stats
        WHERE sport = 'college-baseball' AND season = ? AND LOWER(team) LIKE LOWER(?)
        LIMIT 1
      `).bind(SEASON, searchTerm).first<{ team_id: string }>();
      if (lookup?.team_id) resolvedId = lookup.team_id;
    }

    // Get league baseline from KV (computed by league handler or ingest cron)
    const leagueRaw = await kvGet<Record<string, number>>(env.KV, 'cb:saber:league:2026');
    const lgWoba = leagueRaw?.league_woba ?? 0.340;
    const lgFip = leagueRaw?.league_fip ?? 4.50;
    const lgBabip = leagueRaw?.league_babip ?? 0.300;
    const lgKpct = leagueRaw?.league_kpct ?? 0.200;
    const lgBbpct = leagueRaw?.league_bbpct ?? 0.100;
    // College-calibrated constants from league handler (Bug 6 fix)
    const cFIP = leagueRaw?.fip_constant ?? 3.80;
    const wobaScale = leagueRaw?.woba_scale ?? 1.15;
    const lgRunsPerPA = leagueRaw?.runs_per_pa ?? 0.060;

    // wOBA linear weights (MLB-derived, flagged for future D1 calibration)
    const wBB = 0.69, wHBP = 0.72, w1B = 0.89, w2B = 1.24, w3B = 1.56, wHR = 2.01;

    // Qualified hitters — include OBP/SLG for derivation when 2B/3B/HBP unavailable
    const hitters = await env.DB.prepare(`
      SELECT espn_id, name, position, at_bats, hits, doubles, triples, home_runs,
             walks_bat, strikeouts_bat, hit_by_pitch, sacrifice_flies, games_bat,
             on_base_pct, slugging_pct
      FROM player_season_stats
      WHERE sport = 'college-baseball' AND season = ? AND team_id = ? AND at_bats >= 20
      ORDER BY at_bats DESC
    `).bind(SEASON, resolvedId).all<Record<string, unknown>>();

    // Qualified pitchers for this team
    const pitchers = await env.DB.prepare(`
      SELECT espn_id, name, position, innings_pitched_thirds, strikeouts_pitch,
             walks_pitch, home_runs_allowed, earned_runs, hits_allowed, games_pitch
      FROM player_season_stats
      WHERE sport = 'college-baseball' AND season = ? AND team_id = ? AND innings_pitched_thirds >= 45
      ORDER BY innings_pitched_thirds DESC
    `).bind(SEASON, resolvedId).all<Record<string, unknown>>();

    // Compute per-hitter sabermetrics.
    // ESPN college baseball box scores lack 2B/3B/HBP/SF labels.
    // When those columns are 0 but season OBP/SLG exist (university-reported),
    // derive the missing values:
    //   TB = round(SLG * AB)  →  2B + 2*3B = TB - H - 3*HR
    //   HBP ≈ round((OBP*(AB+BB) - H - BB) / (1 - OBP))  (assuming SF≈0)
    //   ISO = SLG - AVG  (exact from university stats, used as override)
    const hitterStats = hitters.results.map((h) => {
      const ab = Number(h.at_bats || 0);
      const hits = Number(h.hits || 0);
      let d = Number(h.doubles || 0);
      let t = Number(h.triples || 0);
      const hr = Number(h.home_runs || 0);
      const bb = Number(h.walks_bat || 0);
      const k = Number(h.strikeouts_bat || 0);
      let hbp = Number(h.hit_by_pitch || 0);
      let sf = Number(h.sacrifice_flies || 0);
      const obpStored = Number(h.on_base_pct || 0);
      const slgStored = Number(h.slugging_pct || 0);

      // Derive 2B/3B from SLG when direct data is missing
      if (d === 0 && t === 0 && slgStored > 0 && ab > 0 && hits > hr) {
        const tb = Math.round(slgStored * ab);
        // TB = H + 2B + 2*3B + 3*HR → 2B + 2*3B = TB - H - 3*HR
        const xb = Math.max(0, tb - hits - 3 * hr);
        // Triples are ~5% of extra-base hits in college — approximate
        t = Math.max(0, Math.round(xb * 0.05));
        d = Math.max(0, xb - 2 * t);
      }

      // Derive HBP from OBP when direct data is missing
      if (hbp === 0 && obpStored > 0 && obpStored < 1 && ab > 0) {
        // OBP = (H + BB + HBP) / (AB + BB + HBP + SF)
        // Assume SF ≈ 0: HBP = (OBP*(AB+BB) - H - BB) / (1 - OBP)
        const estHbp = Math.round((obpStored * (ab + bb) - hits - bb) / (1 - obpStored));
        hbp = Math.max(0, estHbp);
        // If HBP estimate is negative, OBP might account for SF too — try SF=1,2
        if (estHbp < 0) {
          for (let trySf = 1; trySf <= 3; trySf++) {
            const adjusted = Math.round((obpStored * (ab + bb + trySf) - hits - bb) / (1 - obpStored));
            if (adjusted >= 0) { hbp = adjusted; sf = trySf; break; }
          }
        }
      }

      const singles = Math.max(0, hits - d - t - hr);

      // PA = AB + BB + HBP + SF
      const pa = ab + bb + hbp + sf;

      const babip = (ab - k - hr) > 0 ? (hits - hr) / (ab - k - hr) : 0;
      // ISO: use SLG - AVG when university data available (exact), else compute from hit types
      const avg = ab > 0 ? hits / ab : 0;
      const iso = slgStored > 0 && ab > 0
        ? slgStored - avg
        : (ab > 0 ? (d + 2 * t + 3 * hr) / ab : 0);
      const kpct = pa > 0 ? k / pa : 0;
      const bbpct = pa > 0 ? bb / pa : 0;

      // wOBA with derived values
      const woba = pa > 0
        ? (wBB * bb + wHBP * hbp + w1B * singles + w2B * d + w3B * t + wHR * hr) / pa
        : 0;

      // wRC+ = ((wOBA - lgwOBA) / wOBA_scale + lgR/PA) / lgR/PA * 100
      const wrcPlus = lgRunsPerPA > 0
        ? ((woba - lgWoba) / wobaScale + lgRunsPerPA) / lgRunsPerPA * 100
        : 100;

      return {
        espn_id: h.espn_id,
        name: h.name,
        position: h.position,
        games: Number(h.games_bat || 0),
        ab,
        pa,
        babip: Math.round(babip * 1000) / 1000,
        iso: Math.round(iso * 1000) / 1000,
        kpct: Math.round(kpct * 1000) / 1000,
        bbpct: Math.round(bbpct * 1000) / 1000,
        woba: Math.round(woba * 1000) / 1000,
        wrc_plus: Math.round(wrcPlus),
      };
    });

    // Compute per-pitcher sabermetrics with college-calibrated FIP constant (Bug 6 fix)
    const pitcherStats = pitchers.results.map((p) => {
      const ipThirds = Number(p.innings_pitched_thirds || 0);
      const ip = ipThirds / 3;
      const k = Number(p.strikeouts_pitch || 0);
      const bb = Number(p.walks_pitch || 0);
      const hr = Number(p.home_runs_allowed || 0);

      // FIP with D1-computed constant instead of MLB's 3.2
      const fip = ip > 0 ? (13 * hr + 3 * bb - 2 * k) / ip + cFIP : 0;
      const k9 = ip > 0 ? (k * 9.0) / ip : 0;
      const bb9 = ip > 0 ? (bb * 9.0) / ip : 0;

      return {
        espn_id: p.espn_id,
        name: p.name,
        position: p.position,
        games: Number(p.games_pitch || 0),
        ip: Math.round(ip * 10) / 10,
        fip: Math.round(fip * 100) / 100,
        k9: Math.round(k9 * 10) / 10,
        bb9: Math.round(bb9 * 10) / 10,
      };
    });

    // Team aggregates (AB-weighted for rate stats)
    const teamAb = hitterStats.reduce((s, h) => s + h.ab, 0);
    const teamPa = hitterStats.reduce((s, h) => s + h.pa, 0);
    const teamWoba = teamPa > 0
      ? hitterStats.reduce((s, h) => s + h.woba * h.pa, 0) / teamPa
      : 0;
    const teamBabip = teamAb > 0
      ? hitterStats.reduce((s, h) => s + h.babip * h.ab, 0) / teamAb
      : 0;
    const teamIso = teamAb > 0
      ? hitterStats.reduce((s, h) => s + h.iso * h.ab, 0) / teamAb
      : 0;
    const teamKpct = teamPa > 0
      ? hitterStats.reduce((s, h) => s + h.kpct * h.pa, 0) / teamPa
      : 0;
    const teamBbpct = teamPa > 0
      ? hitterStats.reduce((s, h) => s + h.bbpct * h.pa, 0) / teamPa
      : 0;
    // Team wRC+ using corrected formula
    const teamWrcPlus = lgRunsPerPA > 0
      ? ((teamWoba - lgWoba) / wobaScale + lgRunsPerPA) / lgRunsPerPA * 100
      : 100;

    const totalIp = pitcherStats.reduce((s, p) => s + p.ip, 0);
    const teamFip = totalIp > 0
      ? pitcherStats.reduce((s, p) => s + p.fip * p.ip, 0) / totalIp
      : 0;
    const teamK9 = totalIp > 0
      ? pitcherStats.reduce((s, p) => s + p.k9 * p.ip, 0) / totalIp
      : 0;
    const teamBb9 = totalIp > 0
      ? pitcherStats.reduce((s, p) => s + p.bb9 * p.ip, 0) / totalIp
      : 0;

    // Shape top hitters/pitchers for the SabermetricsPanel component
    const topHitters = [...hitterStats]
      .sort((a, b) => b.wrc_plus - a.wrc_plus)
      .slice(0, 5)
      .map((h) => ({ name: h.name, wrc_plus: h.wrc_plus, woba: h.woba, babip: h.babip, iso: h.iso, pa: h.pa }));

    const topPitchers = [...pitcherStats]
      .sort((a, b) => a.fip - b.fip)
      .slice(0, 5)
      .map((p) => ({ name: p.name, fip: p.fip, k_per_9: p.k9, bb_per_9: p.bb9, ip: p.ip }));

    // Response shaped to match the TeamSabermetrics interface in SabermetricsPanel
    const payload = {
      teamId: resolvedId,
      season: 2026,
      batting: {
        woba: Math.round(teamWoba * 1000) / 1000,
        wrc_plus: Math.round(teamWrcPlus),
        babip: Math.round(teamBabip * 1000) / 1000,
        iso: Math.round(teamIso * 1000) / 1000,
        k_pct: Math.round(teamKpct * 1000) / 1000,
        bb_pct: Math.round(teamBbpct * 1000) / 1000,
        top_hitters: topHitters,
      },
      pitching: {
        fip: Math.round(teamFip * 100) / 100,
        k_per_9: Math.round(teamK9 * 10) / 10,
        bb_per_9: Math.round(teamBb9 * 10) / 10,
        top_pitchers: topPitchers,
      },
      league: {
        woba: lgWoba,
        fip: lgFip,
        babip: lgBabip,
        k_pct: lgKpct,
        bb_pct: lgBbpct,
      },
      all_hitters: hitterStats,
      all_pitchers: pitcherStats,
      meta: { source: 'bsi-d1', fetched_at: new Date().toISOString(), timezone: 'America/Chicago' },
    };

    await kvPut(env.KV, cacheKey, payload, 1800);
    return cachedJson(payload, 200, HTTP_CACHE.team, { 'X-Cache': 'MISS' });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Team sabermetrics failed' }, 500);
  }
}

// ESPN Data Diagnostics endpoint removed after verification (2026-02-25).
// ESPN college baseball does NOT offer /teams/{id}/statistics or /athletes endpoints.
// Box score labels: ['H-AB','AB','R','H','RBI','HR','BB','K','#P','AVG','OBP','SLG']
// — no 2B, 3B, HBP, SF. OBP/SLG at positions 9-11 are university-reported season averages.
// Coverage: ~30% of games (concentrated in SEC/Big Ten/ACC home games).

// ---------------------------------------------------------------------------
// SOS / RPI — Strength of Schedule and Ratings Percentage Index
// ---------------------------------------------------------------------------

/**
 * Strength of Schedule and RPI for a team.
 * GET /api/college-baseball/teams/:teamId/sos
 *
 * RPI = 0.25 * WP + 0.50 * OWP + 0.25 * OOWP
 * WP = win percentage
 * OWP = opponents' average winning percentage (excluding games vs this team)
 * OOWP = opponents' opponents' average winning percentage
 */
export async function handleCBBTeamSOS(teamId: string, env: Env): Promise<Response> {
  const cacheKey = `cb:sos:${teamId}`;
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.standings, { 'X-Cache': 'HIT' });

  try {
    // Resolve slug to ESPN numeric team_id if non-numeric
    let resolvedId = teamId;
    if (!/^\d+$/.test(teamId)) {
      const searchTerm = `%${teamId.replace(/-/g, '%')}%`;
      const lookup = await env.DB.prepare(`
        SELECT team_id FROM player_season_stats
        WHERE sport = 'college-baseball' AND season = ? AND LOWER(team) LIKE LOWER(?)
        LIMIT 1
      `).bind(SEASON, searchTerm).first<{ team_id: string }>();
      if (lookup?.team_id) resolvedId = lookup.team_id;
    }

    // Get all processed games for the season
    const allGames = await env.DB.prepare(`
      SELECT game_id, home_team_id, away_team_id, home_score, away_score
      FROM processed_games
      WHERE sport = 'college-baseball' AND game_date >= '2026-02-01'
        AND home_team_id IS NOT NULL AND away_team_id IS NOT NULL
    `).all<{ game_id: string; home_team_id: string; away_team_id: string; home_score: number; away_score: number }>();

    if (allGames.results.length === 0) {
      return json({ error: 'No game data available for RPI computation', meta: { source: 'bsi-d1', fetched_at: new Date().toISOString(), timezone: 'America/Chicago' } }, 404);
    }

    // Build win/loss record per team
    const records: Record<string, { wins: number; losses: number; opponents: string[] }> = {};

    const ensureRecord = (id: string) => {
      if (!records[id]) records[id] = { wins: 0, losses: 0, opponents: [] };
    };

    for (const g of allGames.results) {
      ensureRecord(g.home_team_id);
      ensureRecord(g.away_team_id);

      records[g.home_team_id].opponents.push(g.away_team_id);
      records[g.away_team_id].opponents.push(g.home_team_id);

      if (g.home_score > g.away_score) {
        records[g.home_team_id].wins++;
        records[g.away_team_id].losses++;
      } else if (g.away_score > g.home_score) {
        records[g.away_team_id].wins++;
        records[g.home_team_id].losses++;
      }
      // Ties don't count for RPI
    }

    const wp = (id: string): number => {
      const r = records[id];
      if (!r) return 0;
      const total = r.wins + r.losses;
      return total > 0 ? r.wins / total : 0;
    };

    // OWP: opponents' winning percentage, excluding games against this team
    const owpForTeam = (id: string): number => {
      const r = records[id];
      if (!r || r.opponents.length === 0) return 0;

      let totalWP = 0;
      let count = 0;

      for (const oppId of r.opponents) {
        const oppRecord = records[oppId];
        if (!oppRecord) continue;

        // Opponent's W-L excluding games vs teamId
        const gamesVsTeam = oppRecord.opponents.filter((o) => o === id).length;
        // Approximate: reduce wins/losses proportionally
        // In reality we'd need to check each game individually
        const oppTotal = oppRecord.wins + oppRecord.losses;
        if (oppTotal <= gamesVsTeam) continue;

        const oppWP = oppTotal > 0 ? oppRecord.wins / oppTotal : 0;
        totalWP += oppWP;
        count++;
      }

      return count > 0 ? totalWP / count : 0;
    };

    // OOWP: opponents' opponents' average winning percentage
    const oowpForTeam = (id: string): number => {
      const r = records[id];
      if (!r || r.opponents.length === 0) return 0;

      let totalOWP = 0;
      let count = 0;

      for (const oppId of r.opponents) {
        const owp = owpForTeam(oppId);
        totalOWP += owp;
        count++;
      }

      return count > 0 ? totalOWP / count : 0;
    };

    const teamWP = wp(resolvedId);
    const teamOWP = owpForTeam(resolvedId);
    const teamOOWP = oowpForTeam(resolvedId);
    const rpi = 0.25 * teamWP + 0.50 * teamOWP + 0.25 * teamOOWP;

    // Compute RPI for all teams and rank
    const allTeamIds = Object.keys(records);
    const rpiValues = allTeamIds.map((id) => ({
      id,
      rpi: 0.25 * wp(id) + 0.50 * owpForTeam(id) + 0.25 * oowpForTeam(id),
    })).sort((a, b) => b.rpi - a.rpi);

    const rpiRank = rpiValues.findIndex((v) => v.id === resolvedId) + 1;

    // SOS rank (by OWP)
    const sosValues = allTeamIds.map((id) => ({
      id,
      owp: owpForTeam(id),
    })).sort((a, b) => b.owp - a.owp);
    const sosRank = sosValues.findIndex((v) => v.id === resolvedId) + 1;

    // Opponents list with records
    const teamRecord = records[resolvedId];
    const uniqueOpponents = [...new Set(teamRecord?.opponents ?? [])];
    const opponents = uniqueOpponents.map((oppId) => ({
      id: oppId,
      wins: records[oppId]?.wins ?? 0,
      losses: records[oppId]?.losses ?? 0,
      wp: Math.round(wp(oppId) * 1000) / 1000,
    }));

    const payload = {
      team_id: teamId,
      wp: Math.round(teamWP * 1000) / 1000,
      owp: Math.round(teamOWP * 1000) / 1000,
      oowp: Math.round(teamOOWP * 1000) / 1000,
      rpi: Math.round(rpi * 1000) / 1000,
      rpi_rank: rpiRank,
      sos_rank: sosRank,
      total_teams: allTeamIds.length,
      record: { wins: teamRecord?.wins ?? 0, losses: teamRecord?.losses ?? 0 },
      opponents,
      meta: { source: 'bsi-d1', fetched_at: new Date().toISOString(), timezone: 'America/Chicago' },
    };

    await kvPut(env.KV, cacheKey, payload, 3600);
    return cachedJson(payload, 200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'RPI computation failed' }, 500);
  }
}

// ---------------------------------------------------------------------------
// Conference Power Index — BSI-computed ranking
// ---------------------------------------------------------------------------

/**
 * Conference Power Index — BSI-computed ranking.
 * CPI = 0.30*winPct + 0.30*confWinPct + 0.20*norm_wRC+ + 0.20*norm_FIP_inverse
 * GET /api/college-baseball/conferences/:conf/power-index
 */
export async function handleCBBConferencePowerIndex(conf: string, env: Env): Promise<Response> {
  const cacheKey = `cb:cpi:${conf}`;
  const cached = await kvGet<unknown>(env.KV, cacheKey);
  if (cached) return cachedJson(cached, 200, HTTP_CACHE.standings, { 'X-Cache': 'HIT' });

  try {
    // Get league baseline
    const leagueRaw = await kvGet<Record<string, number>>(env.KV, 'cb:saber:league:2026');
    const lgWoba = leagueRaw?.league_woba ?? 0.340;

    // Get teams in conference with aggregate stats
    const teams = await env.DB.prepare(`
      SELECT team_id, team,
        SUM(at_bats) as total_ab, SUM(hits) as total_h,
        SUM(doubles) as total_2b, SUM(triples) as total_3b,
        SUM(home_runs) as total_hr, SUM(walks_bat) as total_bb,
        SUM(strikeouts_bat) as total_k
      FROM player_season_stats
      WHERE sport = 'college-baseball' AND season = ? AND at_bats > 0
      GROUP BY team_id, team
    `).bind(SEASON).all<Record<string, unknown>>();

    // Get pitching stats
    const pitching = await env.DB.prepare(`
      SELECT team_id,
        SUM(innings_pitched_thirds) as total_ip_thirds,
        SUM(strikeouts_pitch) as total_k,
        SUM(walks_pitch) as total_bb,
        SUM(home_runs_allowed) as total_hr,
        SUM(earned_runs) as total_er
      FROM player_season_stats
      WHERE sport = 'college-baseball' AND season = ? AND innings_pitched_thirds > 0
      GROUP BY team_id
    `).bind(SEASON).all<Record<string, unknown>>();

    const pitchingMap = new Map(pitching.results.map((p) => [p.team_id as string, p]));

    // Get team → conference mapping from analytics-enriched table
    const confRows = await env.DB.prepare(`
      SELECT DISTINCT team_id, conference FROM cbb_batting_advanced
      WHERE season = ? AND conference IS NOT NULL
    `).bind(SEASON).all<{ team_id: string; conference: string }>();
    const teamConf = new Map(confRows.results.map((r) => [r.team_id, r.conference]));

    // Get team W-L records from processed_games
    const games = await env.DB.prepare(`
      SELECT home_team_id, away_team_id, home_score, away_score
      FROM processed_games
      WHERE sport = 'college-baseball' AND game_date >= '2026-02-01'
        AND home_team_id IS NOT NULL AND away_team_id IS NOT NULL
    `).all<{ home_team_id: string; away_team_id: string; home_score: number; away_score: number }>();

    const winLoss: Record<string, { w: number; l: number }> = {};
    const confWinLoss: Record<string, { w: number; l: number }> = {};
    for (const g of games.results) {
      if (!winLoss[g.home_team_id]) winLoss[g.home_team_id] = { w: 0, l: 0 };
      if (!winLoss[g.away_team_id]) winLoss[g.away_team_id] = { w: 0, l: 0 };

      const homeConf = teamConf.get(g.home_team_id);
      const awayConf = teamConf.get(g.away_team_id);
      const isConfGame = homeConf && awayConf && homeConf === awayConf;

      if (g.home_score > g.away_score) {
        winLoss[g.home_team_id].w++;
        winLoss[g.away_team_id].l++;
        if (isConfGame) {
          if (!confWinLoss[g.home_team_id]) confWinLoss[g.home_team_id] = { w: 0, l: 0 };
          if (!confWinLoss[g.away_team_id]) confWinLoss[g.away_team_id] = { w: 0, l: 0 };
          confWinLoss[g.home_team_id].w++;
          confWinLoss[g.away_team_id].l++;
        }
      } else if (g.away_score > g.home_score) {
        winLoss[g.away_team_id].w++;
        winLoss[g.home_team_id].l++;
        if (isConfGame) {
          if (!confWinLoss[g.home_team_id]) confWinLoss[g.home_team_id] = { w: 0, l: 0 };
          if (!confWinLoss[g.away_team_id]) confWinLoss[g.away_team_id] = { w: 0, l: 0 };
          confWinLoss[g.home_team_id].l++;
          confWinLoss[g.away_team_id].w++;
        }
      }
    }

    // Compute CPI per team
    const teamCPI = teams.results.map((t) => {
      const teamId = t.team_id as string;
      const ab = Number(t.total_ab || 0);
      const h = Number(t.total_h || 0);
      const d = Number(t.total_2b || 0);
      const tr = Number(t.total_3b || 0);
      const hr = Number(t.total_hr || 0);
      const bb = Number(t.total_bb || 0);
      const singles = h - d - tr - hr;
      const pa = ab + bb;

      const woba = pa > 0
        ? (0.69 * bb + 0.89 * singles + 1.24 * d + 1.56 * tr + 2.01 * hr) / pa
        : 0;
      const wrcPlus = lgWoba > 0
        ? ((woba - lgWoba) / 1.15 + 1.0) * 100
        : 100;

      const pitch = pitchingMap.get(teamId);
      const ipThirds = Number(pitch?.total_ip_thirds || 0);
      const ip = ipThirds / 3;
      const fip = ip > 0
        ? (13 * Number(pitch?.total_hr || 0) + 3 * Number(pitch?.total_bb || 0) - 2 * Number(pitch?.total_k || 0)) / ip + 3.2
        : 5.0;

      const record = winLoss[teamId] ?? { w: 0, l: 0 };
      const total = record.w + record.l;
      const winPct = total > 0 ? record.w / total : 0;

      const confRecord = confWinLoss[teamId] ?? { w: 0, l: 0 };
      const confTotal = confRecord.w + confRecord.l;
      // Before conference play starts, fall back to overall win%
      const confWinPct = confTotal > 0 ? confRecord.w / confTotal : winPct;

      return {
        team_id: teamId,
        team: t.team as string,
        wins: record.w,
        losses: record.l,
        conf_wins: confRecord.w,
        conf_losses: confRecord.l,
        win_pct: Math.round(winPct * 1000) / 1000,
        conf_win_pct: Math.round(confWinPct * 1000) / 1000,
        wrc_plus: Math.round(wrcPlus),
        fip: Math.round(fip * 100) / 100,
        woba: Math.round(woba * 1000) / 1000,
        // CPI components (will normalize after)
        _winPct: winPct,
        _confWinPct: confWinPct,
        _wrcPlus: wrcPlus,
        _fipInv: fip > 0 ? 1 / fip : 0,
      };
    });

    // Filter to requested conference before normalization so CPI is conference-relative.
    // URL slug may differ from DB name: "big-12" vs "Big 12", "sec" vs "SEC".
    const confSlugNorm = conf.toLowerCase().replace(/-/g, ' ');
    const filteredCPI = teamCPI.filter((t) => {
      const tc = teamConf.get(t.team_id);
      return tc && tc.toLowerCase() === confSlugNorm;
    });

    if (filteredCPI.length === 0) {
      return json({
        conference: conf,
        season: 2026,
        teams: [],
        meta: { source: 'bsi-d1', fetched_at: new Date().toISOString(), timezone: 'America/Chicago' },
      });
    }

    // Normalize and compute CPI (conference-relative)
    if (filteredCPI.length > 0) {
      const maxWP = Math.max(...filteredCPI.map((t) => t._winPct));
      const maxCWP = Math.max(...filteredCPI.map((t) => t._confWinPct));
      const maxWRC = Math.max(...filteredCPI.map((t) => t._wrcPlus));
      const maxFipInv = Math.max(...filteredCPI.map((t) => t._fipInv));

      for (const t of filteredCPI) {
        const normWP = maxWP > 0 ? t._winPct / maxWP : 0;
        const normCWP = maxCWP > 0 ? t._confWinPct / maxCWP : 0;
        const normWRC = maxWRC > 0 ? t._wrcPlus / maxWRC : 0;
        const normFipInv = maxFipInv > 0 ? t._fipInv / maxFipInv : 0;

        (t as Record<string, unknown>).cpi = Math.round(
          (0.30 * normWP + 0.30 * normCWP + 0.20 * normWRC + 0.20 * normFipInv) * 1000
        ) / 1000;
      }
    }

    // Sort by CPI descending
    filteredCPI.sort((a, b) => ((b as Record<string, unknown>).cpi as number) - ((a as Record<string, unknown>).cpi as number));

    // Clean up internal fields
    const ranked = filteredCPI.map((t, i) => {
      const { _winPct, _confWinPct, _wrcPlus, _fipInv, ...rest } = t;
      return { rank: i + 1, ...rest, cpi: (t as Record<string, unknown>).cpi };
    });

    const payload = {
      conference: conf,
      season: 2026,
      teams: ranked,
      meta: { source: 'bsi-d1', fetched_at: new Date().toISOString(), timezone: 'America/Chicago' },
    };

    await kvPut(env.KV, cacheKey, payload, 3600);
    return cachedJson(payload, 200, HTTP_CACHE.standings, { 'X-Cache': 'MISS' });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'CPI computation failed' }, 500);
  }
}
