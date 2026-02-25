/**
 * BSI College Baseball Analytics — Cron Worker
 *
 * Computes advanced sabermetric metrics from cumulative player stats in D1.
 * Stores results in cbb_batting_advanced / cbb_pitching_advanced tables
 * and caches hot leaderboards in KV.
 *
 * Cron schedule:
 *   - Daily 6 AM CT (11 UTC):  Full recompute of per-player advanced metrics
 *   - Sundays: also recalculates park factors + conference strength (day check in code)
 *
 * Data flow:
 *   player_season_stats (D1, populated by bsi-cbb-ingest + sync endpoints)
 *     → savant-metrics.ts (pure math, no side effects)
 *     → cbb_batting_advanced / cbb_pitching_advanced / cbb_park_factors / cbb_conference_strength (D1)
 *     → KV hot leaderboard caches
 *
 * Deploy: wrangler deploy --config workers/bsi-cbb-analytics/wrangler.toml
 */

import {
  calculateWOBA,
  calculateWRCPlus,
  calculateOPSPlus,
  calculateISO,
  calculateBABIP,
  calculateKPct,
  calculateBBPct,
  calculateFIP,
  calculateERAMinus,
  calculateK9,
  calculateBB9,
  calculateHR9,
  calculateKBB,
  calculateLOBPct,
  calculateEBA,
  calculateESLG,
  calculateEWOBA,
  calculateParkFactor,
  calculateConferenceStrength,
  calculateFIPConstant,
  calculateWOBAScale,
  MLB_WOBA_WEIGHTS,
} from '../../lib/analytics/savant-metrics';
import type { BattingLine, LeagueContext } from '../../lib/analytics/savant-metrics';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Env {
  KV: KVNamespace;
  DB: D1Database;
}

interface PlayerBattingRow {
  espn_id: string;
  name: string;
  team: string;
  team_id: string;
  position: string;
  conference?: string;
  at_bats: number;
  hits: number;
  doubles: number;
  triples: number;
  home_runs: number;
  walks_bat: number;
  strikeouts_bat: number;
  hit_by_pitch: number;
  sacrifice_flies: number;
  runs: number;
  games_bat: number;
  on_base_pct: number;
  slugging_pct: number;
  stolen_bases?: number;
  caught_stealing?: number;
}

interface PlayerPitchingRow {
  espn_id: string;
  name: string;
  team: string;
  team_id: string;
  position: string;
  conference?: string;
  innings_pitched_thirds: number;
  strikeouts_pitch: number;
  walks_pitch: number;
  home_runs_allowed: number;
  earned_runs: number;
  hits_allowed: number;
  hit_by_pitch_pitch?: number;
  games_pitch: number;
  wins?: number;
  losses?: number;
  saves?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEASON = 2026;
const MIN_AB_BATTING = 20;       // Minimum AB to qualify for batting
const MIN_IP_THIRDS_PITCHING = 45; // Minimum IP thirds (15 IP) for pitching
const WOBA_WEIGHTS = MLB_WOBA_WEIGHTS;

/**
 * ESPN team_id → conference mapping (244 D1 teams).
 * Generated from lib/data/team-metadata.ts — 2025-26 realignment.
 * Workers can't import from lib/, so this lives as a hardcoded const.
 */
const TEAM_CONFERENCE_MAP: Record<string, string> = {
  '126': 'SEC', '123': 'SEC', '75': 'SEC', '85': 'SEC', '58': 'SEC',
  '199': 'SEC', '120': 'SEC', '92': 'SEC', '78': 'SEC', '55': 'SEC',
  '148': 'SEC', '150': 'SEC', '193': 'SEC', '82': 'SEC', '91': 'SEC',
  '112': 'SEC',
  '97': 'ACC', '131': 'ACC', '95': 'ACC', '117': 'ACC', '72': 'ACC',
  '176': 'ACC', '83': 'ACC', '93': 'ACC', '96': 'ACC', '64': 'ACC',
  '65': 'ACC', '77': 'ACC', '86': 'ACC', '81': 'ACC', '115': 'ACC',
  '433': 'ACC', '439': 'ACC', '132': 'ACC',
  '198': 'Big 12', '201': 'Big 12', '110': 'Big 12', '121': 'Big 12',
  '136': 'Big 12', '264': 'Big 12', '60': 'Big 12', '59': 'Big 12',
  '127': 'Big 12', '161': 'Big 12', '334': 'Big 12', '124': 'Big 12',
  '373': 'Big 12', '168': 'Big 12', '160': 'Big 12', '128': 'Big 12',
  '66': 'Big Ten', '68': 'Big Ten', '153': 'Big Ten', '294': 'Big Ten',
  '167': 'Big Ten', '87': 'Big Ten', '89': 'Big Ten', '88': 'Big Ten',
  '90': 'Big Ten', '99': 'Big Ten', '411': 'Big Ten', '108': 'Big Ten',
  '273': 'Big Ten', '414': 'Big Ten', '189': 'Big Ten', '102': 'Big Ten',
  '133': 'Big Ten', '464': 'Big Ten',
  '113': 'Independent',
  '278': 'Mountain West', '21': 'Mountain West', '134': 'Mountain West',
  '155': 'Mountain West', '104': 'Mountain West', '360': 'Mountain West',
  '183': 'Mountain West', '63': 'Mountain West', '182': 'Mountain West',
  '94': 'AAC', '163': 'AAC', '122': 'AAC', '203': 'AAC', '206': 'AAC',
  '180': 'AAC', '119': 'AAC', '76': 'AAC', '447': 'AAC', '297': 'AAC',
  '139': 'ASUN', '73': 'ASUN', '307': 'ASUN', '74': 'ASUN', '156': 'ASUN',
  '1143': 'ASUN', '348': 'ASUN', '378': 'ASUN', '1103': 'ASUN',
  '296': 'ASUN', '1238': 'ASUN', '129699': 'ASUN',
  '259': 'America East', '154': 'America East', '292': 'America East',
  '299': 'America East', '395': 'America East', '450': 'America East',
  '449': 'America East',
  '98': 'Big East', '69': 'Big East', '312': 'Big East', '326': 'Big East',
  '357': 'Big East', '268': 'Big East', '195': 'Big East', '458': 'Big East',
  '207': 'Big South', '329': 'Big South', '356': 'Big South',
  '364': 'Big South', '380': 'Big South', '418': 'Big South',
  '421': 'Big South', '452': 'Big South', '453': 'Big South',
  '165': 'Big West', '141': 'Big West', '290': 'Big West', '61': 'Big West',
  '327': 'Big West', '185': 'Big West', '79': 'Big West', '448': 'Big West',
  '142': 'Big West', '67': 'Big West', '1147': 'Big West',
  '293': 'CAA', '405': 'CAA', '196': 'CAA', '118': 'CAA', '303': 'CAA',
  '365': 'CAA', '178': 'CAA', '401': 'CAA', '305': 'CAA', '152': 'CAA',
  '289': 'CAA',
  '172': 'CUSA', '173': 'CUSA', '190': 'CUSA', '263': 'CUSA',
  '339': 'CUSA', '164': 'CUSA', '177': 'CUSA', '197': 'CUSA',
  '103': 'CUSA', '84': 'CUSA',
  '270': 'Horizon', '135': 'Horizon', '410': 'Horizon', '412': 'Horizon',
  '209': 'Horizon',
  '149': 'Missouri Valley', '308': 'Missouri Valley', '262': 'Missouri Valley',
  '324': 'Missouri Valley', '288': 'Missouri Valley', '394': 'Missouri Valley',
  '432': 'Missouri Valley', '80': 'Missouri Valley', '302': 'Missouri Valley',
  '151': 'Patriot League', '179': 'Patriot League', '313': 'Patriot League',
  '366': 'Patriot League', '145': 'Patriot League', '377': 'Patriot League',
  '295': 'Southern', '304': 'Southern', '274': 'Southern', '202': 'Southern',
  '181': 'Southern', '459': 'Southern', '205': 'Southern', '208': 'Southern',
  '387': 'Southland', '309': 'Southland', '438': 'Southland',
  '367': 'Southland', '371': 'Southland', '170': 'Southland',
  '184': 'Southland', '399': 'Southland', '186': 'Southland',
  '443': 'Southland', '932': 'Southland',
  '111': 'Summit', '310': 'Summit', '407': 'Summit', '396': 'Summit',
  '301': 'Summit', '850': 'Summit',
  '146': 'Sun Belt', '144': 'Sun Belt', '140': 'Sun Belt', '57': 'Sun Belt',
  '192': 'Sun Belt', '269': 'Sun Belt', '271': 'Sun Belt', '320': 'Sun Belt',
  '138': 'Sun Belt', '358': 'Sun Belt', '129': 'Sun Belt', '384': 'Sun Belt',
  '147': 'Sun Belt', '272': 'Sun Belt',
  '204': 'A-10', '337': 'A-10', '338': 'A-10', '354': 'A-10',
  '166': 'A-10', '71': 'A-10', '376': 'A-10', '422': 'A-10',
  '130': 'A-10', '425': 'A-10', '300': 'A-10', '105': 'A-10',
  '315': 'WAC', '1105': 'WAC', '314': 'WAC', '1145': 'WAC',
  '125': 'WAC', '1146': 'WAC', '455': 'WAC',
  '287': 'WCC', '187': 'WCC', '143': 'WCC', '427': 'WCC',
  '174': 'WCC', '413': 'WCC', '416': 'WCC', '426': 'WCC',
  '267': 'WCC', '428': 'WCC',
};

const KV_TTL = {
  leaderboard: 3600,    // 1 hour
  leagueContext: 7200,  // 2 hours
};

// ---------------------------------------------------------------------------
// League context computation
// ---------------------------------------------------------------------------

interface LeagueContextResult {
  context: LeagueContext;
  sampleBatting: number;
  samplePitching: number;
}

async function computeLeagueContext(db: D1Database): Promise<LeagueContextResult> {
  // Batting aggregates
  const batting = await db.prepare(`
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
      COUNT(*) as n
    FROM player_season_stats
    WHERE sport = 'college-baseball' AND season = ? AND at_bats >= ?
  `).bind(SEASON, MIN_AB_BATTING).first<Record<string, number>>();

  // Pitching aggregates
  const pitching = await db.prepare(`
    SELECT
      SUM(innings_pitched_thirds) as total_ip_thirds,
      SUM(strikeouts_pitch) as total_k,
      SUM(walks_pitch) as total_bb,
      SUM(home_runs_allowed) as total_hr,
      SUM(earned_runs) as total_er,
      COUNT(*) as n
    FROM player_season_stats
    WHERE sport = 'college-baseball' AND season = ? AND innings_pitched_thirds >= ?
  `).bind(SEASON, MIN_IP_THIRDS_PITCHING).first<Record<string, number>>();

  if (!batting || !pitching) {
    return { context: defaultLeagueContext(), sampleBatting: 0, samplePitching: 0 };
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
  const pa = ab + bb + hbp + sf;

  if (pa <= 0) return { context: defaultLeagueContext(), sampleBatting: 0, samplePitching: 0 };

  const avg = h / ab;
  const obp = (h + bb + hbp) / pa;
  const slg = (singles + 2 * doubles + 3 * triples + 4 * hr) / ab;
  const runsPerPA = totalRuns / pa;

  const leagueWoba = (
    WOBA_WEIGHTS.wBB * bb +
    WOBA_WEIGHTS.wHBP * hbp +
    WOBA_WEIGHTS.w1B * singles +
    WOBA_WEIGHTS.w2B * doubles +
    WOBA_WEIGHTS.w3B * triples +
    WOBA_WEIGHTS.wHR * hr
  ) / pa;

  const wobaScale = calculateWOBAScale(obp, leagueWoba, avg);

  // Pitching
  const ipThirds = pitching.total_ip_thirds || 0;
  const ip = ipThirds / 3;
  const lgERA = ip > 0 ? (pitching.total_er || 0) * 9 / ip : 4.50;
  const fipConstant = calculateFIPConstant(
    lgERA,
    pitching.total_hr || 0,
    pitching.total_bb || 0,
    pitching.total_k || 0,
    ip,
  );

  return {
    context: {
      woba: leagueWoba,
      obp,
      avg,
      slg,
      era: lgERA,
      runsPerPA,
      wobaScale,
      fipConstant,
    },
    sampleBatting: batting.n || 0,
    samplePitching: pitching.n || 0,
  };
}

function defaultLeagueContext(): LeagueContext {
  return {
    woba: 0.340,
    obp: 0.350,
    avg: 0.270,
    slg: 0.420,
    era: 4.50,
    runsPerPA: 0.060,
    wobaScale: 1.15,
    fipConstant: 3.80,
  };
}

// ---------------------------------------------------------------------------
// Batting advanced computation + D1 write
// ---------------------------------------------------------------------------

async function computeBatting(db: D1Database, kv: KVNamespace, league: LeagueContext): Promise<number> {
  const { results: hitters } = await db.prepare(`
    SELECT espn_id, name, team, team_id, position, at_bats, hits, doubles, triples,
           home_runs, walks_bat, strikeouts_bat, hit_by_pitch, sacrifice_flies,
           runs, games_bat, on_base_pct, slugging_pct, stolen_bases, caught_stealing
    FROM player_season_stats
    WHERE sport = 'college-baseball' AND season = ? AND at_bats >= ?
    ORDER BY at_bats DESC
  `).bind(SEASON, MIN_AB_BATTING).all<PlayerBattingRow>();

  if (hitters.length === 0) return 0;

  const now = new Date().toISOString();
  const upsert = db.prepare(`
    INSERT OR REPLACE INTO cbb_batting_advanced
      (player_id, player_name, team, team_id, conference, season, position,
       g, ab, pa, r, h, doubles, triples, hr, bb, so, sb, cs,
       avg, obp, slg, ops, k_pct, bb_pct, iso, babip,
       woba, wrc_plus, ops_plus, e_ba, e_slg, e_woba,
       park_adjusted, data_source, computed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?)
  `);

  const batch: D1PreparedStatement[] = [];

  for (const p of hitters) {
    const ab = p.at_bats;
    const h = p.hits;
    const doubles = p.doubles || 0;
    const triples = p.triples || 0;
    const hr = p.home_runs || 0;
    const bb = p.walks_bat || 0;
    const so = p.strikeouts_bat || 0;
    const hbp = p.hit_by_pitch || 0;
    const sf = p.sacrifice_flies || 0;
    const pa = ab + bb + hbp + sf;

    const line: BattingLine = { pa, ab, h, doubles, triples, hr, bb, hbp, so, sf };

    const avg = p.on_base_pct > 0 ? (ab > 0 ? h / ab : 0) : (ab > 0 ? h / ab : 0);
    const obp = p.on_base_pct > 0 ? p.on_base_pct : (pa > 0 ? (h + bb + hbp) / pa : 0);
    const slg = p.slugging_pct > 0 ? p.slugging_pct : (ab > 0 ? (h - doubles - triples - hr + 2 * doubles + 3 * triples + 4 * hr) / ab : 0);
    const ops = obp + slg;

    const iso = calculateISO(slg, avg);
    const babip = calculateBABIP(h, hr, ab, so, sf);
    const kPct = calculateKPct(so, pa);
    const bbPct = calculateBBPct(bb, pa);
    const woba = calculateWOBA(line, WOBA_WEIGHTS);
    const wrcPlus = calculateWRCPlus(woba, league);
    const opsPlus = calculateOPSPlus(obp, slg, league.obp, league.slg);

    // Estimated stats
    const hrRate = pa > 0 ? hr / pa : 0;
    const eBA = calculateEBA(babip, hrRate, kPct);
    const eSLG = calculateESLG(iso, eBA);
    const eWOBA = calculateEWOBA(eBA, eSLG, bbPct);

    // Enrich conference from team_id lookup — player_season_stats has no conference column
    const conference = TEAM_CONFERENCE_MAP[p.team_id] ?? p.conference ?? null;

    batch.push(upsert.bind(
      p.espn_id, p.name, p.team, p.team_id, conference, SEASON, p.position,
      p.games_bat || 0, ab, pa, p.runs || 0, h, doubles, triples, hr, bb, so,
      p.stolen_bases ?? 0, p.caught_stealing ?? 0,
      r3(avg), r3(obp), r3(slg), r3(ops), r3(kPct), r3(bbPct), r3(iso), r3(babip),
      r3(woba), r1(wrcPlus), r1(opsPlus), r3(eBA), r3(eSLG), r3(eWOBA),
      0, 'bsi-savant', now,
    ));
  }

  // D1 batch limit is 100 statements per batch call
  for (let i = 0; i < batch.length; i += 100) {
    await db.batch(batch.slice(i, i + 100));
  }

  // Cache hot leaderboard in KV
  const top50 = await db.prepare(`
    SELECT player_id, player_name, team, conference, position,
           avg, obp, slg, ops, k_pct, bb_pct, iso, babip,
           woba, wrc_plus, ops_plus
    FROM cbb_batting_advanced
    WHERE season = ?
    ORDER BY woba DESC
    LIMIT 50
  `).bind(SEASON).all();

  await kv.put(
    `savant:batting:leaderboard:${SEASON}`,
    JSON.stringify(top50.results),
    { expirationTtl: KV_TTL.leaderboard },
  );

  return hitters.length;
}

// ---------------------------------------------------------------------------
// Pitching advanced computation + D1 write
// ---------------------------------------------------------------------------

async function computePitching(db: D1Database, kv: KVNamespace, league: LeagueContext): Promise<number> {
  const { results: pitchers } = await db.prepare(`
    SELECT espn_id, name, team, team_id, position, innings_pitched_thirds,
           strikeouts_pitch, walks_pitch, home_runs_allowed, earned_runs,
           hits_allowed, games_pitch, wins, losses, saves
    FROM player_season_stats
    WHERE sport = 'college-baseball' AND season = ? AND innings_pitched_thirds >= ?
    ORDER BY innings_pitched_thirds DESC
  `).bind(SEASON, MIN_IP_THIRDS_PITCHING).all<PlayerPitchingRow>();

  if (pitchers.length === 0) return 0;

  const now = new Date().toISOString();
  const upsert = db.prepare(`
    INSERT OR REPLACE INTO cbb_pitching_advanced
      (player_id, player_name, team, team_id, conference, season, position,
       g, gs, w, l, sv, ip, h, er, bb, hbp, so, era, whip,
       k_9, bb_9, hr_9, fip, x_fip, era_minus, k_bb, lob_pct, babip,
       park_adjusted, data_source, computed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?)
  `);

  const batch: D1PreparedStatement[] = [];

  for (const p of pitchers) {
    const ipThirds = p.innings_pitched_thirds;
    const ip = ipThirds / 3;
    const h = p.hits_allowed || 0;
    const er = p.earned_runs || 0;
    const hr = p.home_runs_allowed || 0;
    const bb = p.walks_pitch || 0;
    const hbp = p.hit_by_pitch_pitch ?? 0;
    const so = p.strikeouts_pitch || 0;

    const era = ip > 0 ? (er * 9) / ip : 0;
    const whip = ip > 0 ? (h + bb) / ip : 0;
    const k9 = calculateK9(so, ip);
    const bb9 = calculateBB9(bb, ip);
    const hr9 = calculateHR9(hr, ip);
    const fip = calculateFIP(hr, bb, hbp, so, ip, league.fipConstant);
    const eraMinus = calculateERAMinus(era, league.era);
    const kBB = calculateKBB(so, bb);
    const lobPct = calculateLOBPct(h, bb, hbp, er, hr);

    // BABIP against — estimate BF from IP + baserunners
    const bfEst = Math.round(ip * 3 + h + bb);
    const babip = calculateBABIP(h, hr, bfEst, so, 0);

    // Enrich conference from team_id lookup
    const conference = TEAM_CONFERENCE_MAP[p.team_id] ?? p.conference ?? null;

    batch.push(upsert.bind(
      p.espn_id, p.name, p.team, p.team_id, conference, SEASON, p.position,
      p.games_pitch || 0, 0,
      p.wins ?? 0, p.losses ?? 0, p.saves ?? 0,
      r2(ip), h, er, bb, hbp, so, r2(era), r3(whip),
      r1(k9), r1(bb9), r1(hr9), r2(fip), null, r1(eraMinus), r2(kBB), r3(lobPct), r3(babip),
      0, 'bsi-savant', now,
    ));
  }

  for (let i = 0; i < batch.length; i += 100) {
    await db.batch(batch.slice(i, i + 100));
  }

  // Cache hot leaderboard in KV
  const top50 = await db.prepare(`
    SELECT player_id, player_name, team, conference, position,
           era, whip, k_9, bb_9, hr_9, fip, era_minus, k_bb, lob_pct
    FROM cbb_pitching_advanced
    WHERE season = ?
    ORDER BY fip ASC
    LIMIT 50
  `).bind(SEASON).all();

  await kv.put(
    `savant:pitching:leaderboard:${SEASON}`,
    JSON.stringify(top50.results),
    { expirationTtl: KV_TTL.leaderboard },
  );

  return pitchers.length;
}

// ---------------------------------------------------------------------------
// Park factors (weekly)
// ---------------------------------------------------------------------------

async function computeParkFactors(db: D1Database): Promise<number> {
  const now = new Date().toISOString();
  const MIN_HOME_GAMES = 20;

  // Get all teams from player stats (for team name lookup)
  const { results: allTeams } = await db.prepare(`
    SELECT DISTINCT team, team_id FROM player_season_stats
    WHERE sport = 'college-baseball' AND season = ?
  `).bind(SEASON).all<{ team: string; team_id: string }>();

  if (allTeams.length === 0) return 0;

  const teamNameMap = new Map(allTeams.map(t => [t.team_id, t.team]));

  // Home stats: total runs scored at this team's home park
  const { results: homeStats } = await db.prepare(`
    SELECT home_team_id as team_id,
           COUNT(*) as games,
           SUM(home_score + away_score) as total_runs
    FROM processed_games
    WHERE home_team_id IS NOT NULL AND home_score IS NOT NULL
    GROUP BY home_team_id
  `).all<{ team_id: string; games: number; total_runs: number }>();

  // Away stats: total runs scored when this team plays away
  const { results: awayStats } = await db.prepare(`
    SELECT away_team_id as team_id,
           COUNT(*) as games,
           SUM(home_score + away_score) as total_runs
    FROM processed_games
    WHERE away_team_id IS NOT NULL AND away_score IS NOT NULL
    GROUP BY away_team_id
  `).all<{ team_id: string; games: number; total_runs: number }>();

  const homeMap = new Map(homeStats.map(h => [h.team_id, h]));
  const awayMap = new Map(awayStats.map(a => [a.team_id, a]));

  const upsert = db.prepare(`
    INSERT OR REPLACE INTO cbb_park_factors
      (team, team_id, venue_name, conference, season,
       runs_factor, sample_games, methodology_note, computed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const batch: D1PreparedStatement[] = [];

  for (const t of allTeams) {
    const home = homeMap.get(t.team_id);
    const away = awayMap.get(t.team_id);

    let factor = 1.0;
    let sampleGames = 0;
    let note = 'Neutral — insufficient home games';

    if (home && away && home.games >= MIN_HOME_GAMES && away.games > 0) {
      factor = calculateParkFactor(home.total_runs, away.total_runs, home.games, away.games);
      sampleGames = home.games;
      note = `Computed from ${home.games} home / ${away.games} away games`;
    } else if (home) {
      sampleGames = home.games;
      note = `Neutral — only ${home.games} home games (need ${MIN_HOME_GAMES})`;
    }

    batch.push(upsert.bind(
      t.team, t.team_id, null, TEAM_CONFERENCE_MAP[t.team_id] ?? null, SEASON,
      r3(factor), sampleGames, note, now,
    ));
  }

  for (let i = 0; i < batch.length; i += 100) {
    await db.batch(batch.slice(i, i + 100));
  }

  return allTeams.length;
}

// ---------------------------------------------------------------------------
// Conference strength (weekly)
// ---------------------------------------------------------------------------

async function computeConferenceStrength(db: D1Database): Promise<number> {
  const now = new Date().toISOString();

  // Aggregate per-conference batting and pitching stats
  const { results: conferences } = await db.prepare(`
    SELECT
      conference,
      AVG(woba) as avg_woba,
      AVG(ops) as avg_ops,
      COUNT(*) as n
    FROM cbb_batting_advanced
    WHERE season = ? AND conference IS NOT NULL
    GROUP BY conference
    HAVING COUNT(*) >= 5
  `).bind(SEASON).all<{ conference: string; avg_woba: number; avg_ops: number; n: number }>();

  if (conferences.length === 0) return 0;

  const pitching = await db.prepare(`
    SELECT
      conference,
      AVG(era) as avg_era
    FROM cbb_pitching_advanced
    WHERE season = ? AND conference IS NOT NULL
    GROUP BY conference
  `).bind(SEASON).all<{ conference: string; avg_era: number }>();

  const pitchingMap = new Map(pitching.results.map(p => [p.conference, p.avg_era]));

  // Compute real inter-conference win percentages from processed_games
  // A game is cross-conference when home and away team map to different conferences
  const { results: crossConfGames } = await db.prepare(`
    SELECT home_team_id, away_team_id, home_score, away_score
    FROM processed_games
    WHERE home_team_id IS NOT NULL AND away_team_id IS NOT NULL
      AND home_score IS NOT NULL AND away_score IS NOT NULL
  `).all<{ home_team_id: string; away_team_id: string; home_score: number; away_score: number }>();

  // Tally wins/losses per conference in cross-conference games
  const confWins: Record<string, number> = {};
  const confLosses: Record<string, number> = {};

  for (const g of crossConfGames) {
    const homeConf = TEAM_CONFERENCE_MAP[g.home_team_id];
    const awayConf = TEAM_CONFERENCE_MAP[g.away_team_id];
    if (!homeConf || !awayConf || homeConf === awayConf) continue;

    // Initialize counters
    confWins[homeConf] ??= 0;
    confLosses[homeConf] ??= 0;
    confWins[awayConf] ??= 0;
    confLosses[awayConf] ??= 0;

    if (g.home_score > g.away_score) {
      confWins[homeConf]++;
      confLosses[awayConf]++;
    } else if (g.away_score > g.home_score) {
      confWins[awayConf]++;
      confLosses[homeConf]++;
    }
    // Ties ignored (rare in baseball)
  }

  const upsert = db.prepare(`
    INSERT OR REPLACE INTO cbb_conference_strength
      (conference, season, strength_index, run_environment, avg_era, avg_ops, avg_woba,
       inter_conf_win_pct, rpi_avg, is_power, computed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const batch = conferences.map(c => {
    const avgERA = pitchingMap.get(c.conference) ?? 4.50;
    const wins = confWins[c.conference] ?? 0;
    const losses = confLosses[c.conference] ?? 0;
    const total = wins + losses;
    const interConfWinPct = total > 0 ? wins / total : 0.500;

    // RPI stays placeholder — real RPI needs 3-level opponent graph traversal
    const approxRPI = 0.500;
    const strength = calculateConferenceStrength(interConfWinPct, approxRPI, c.avg_woba, avgERA);
    const isPower = strength >= 65 ? 1 : 0;

    return upsert.bind(
      c.conference, SEASON, r1(strength), r2(c.avg_ops + avgERA),
      r2(avgERA), r3(c.avg_ops), r3(c.avg_woba),
      r3(interConfWinPct), approxRPI, isPower, now,
    );
  });

  for (let i = 0; i < batch.length; i += 100) {
    await db.batch(batch.slice(i, i + 100));
  }

  return conferences.length;
}

// ---------------------------------------------------------------------------
// Rounding helpers
// ---------------------------------------------------------------------------

function r1(n: number): number { return Math.round(n * 10) / 10; }
function r2(n: number): number { return Math.round(n * 100) / 100; }
function r3(n: number): number { return Math.round(n * 1000) / 1000; }

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Manual trigger endpoint for testing
    const url = new URL(request.url);
    if (url.pathname === '/run') {
      const result = await runAnalytics(env, true);
      return new Response(JSON.stringify(result, null, 2), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('BSI CBB Analytics Worker — use /run to trigger manually', { status: 200 });
  },

  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    const isSunday = new Date().getUTCDay() === 0;
    await runAnalytics(env, isSunday);
  },
};

async function runAnalytics(env: Env, includeWeekly: boolean) {
  const start = Date.now();
  const results: Record<string, unknown> = {};

  try {
    // 1. Compute league context
    const { context: league, sampleBatting, samplePitching } = await computeLeagueContext(env.DB);
    await env.KV.put(
      `savant:league:${SEASON}`,
      JSON.stringify(league),
      { expirationTtl: KV_TTL.leagueContext },
    );

    // Persist league context to D1 for downstream sync to cbb-api
    const now = new Date().toISOString();
    await env.DB.prepare(`
      INSERT OR REPLACE INTO cbb_league_context
        (season, computed_at, woba, obp, avg, slg, era, runs_per_pa,
         woba_scale, fip_constant, hr_fb_rate, sample_batting, sample_pitching)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      SEASON, now,
      league.woba, league.obp, league.avg, league.slg,
      league.era, league.runsPerPA, league.wobaScale, league.fipConstant,
      null, sampleBatting, samplePitching,
    ).run();

    results.league = league;
    results.leagueSamples = { batting: sampleBatting, pitching: samplePitching };

    // 2. Compute per-player batting advanced
    results.battingCount = await computeBatting(env.DB, env.KV, league);

    // 3. Compute per-player pitching advanced
    results.pitchingCount = await computePitching(env.DB, env.KV, league);

    // 4. Weekly: park factors + conference strength
    if (includeWeekly) {
      results.parkFactorsCount = await computeParkFactors(env.DB);
      results.conferenceCount = await computeConferenceStrength(env.DB);
    }

    results.durationMs = Date.now() - start;
    results.success = true;
    console.log('[bsi-cbb-analytics] Complete:', JSON.stringify(results));
  } catch (err) {
    results.error = err instanceof Error ? err.message : 'Unknown error';
    results.success = false;
    console.error('[bsi-cbb-analytics] Error:', results.error);
  }

  return results;
}
