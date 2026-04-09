/**
 * MLB Power Rankings
 *
 * Computes a composite power score for all 30 MLB teams from the live
 * standings payload. The algorithm blends three signals:
 *
 *   1. Actual win percentage (50%) — what has happened
 *   2. Pythagorean expected win percentage (30%) — what should have happened
 *   3. Run differential per game (20%) — margin of competence
 *
 * Pythagorean expectation normalizes for sequencing luck. A team with a
 * blowout-heavy loss profile and a close-game-heavy win profile will look
 * better in actual win% than in pythagorean. Small-sample MLB teams (10-20
 * games) are particularly noisy, so the blend gives some weight to both.
 *
 * GET /api/mlb/power-rankings
 */

import type { Env } from '../shared/types';
import {
  json,
  cachedJson,
  kvGet,
  kvPut,
  withMeta,
  cachedPayloadHeaders,
  freshDataHeaders,
  logError,
} from '../shared/helpers';
import { HTTP_CACHE, CACHE_TTL } from '../shared/constants';
import { handleMLBStandings } from './mlb';

const CACHE_KEY = 'mlb:power-rankings:v1';
const SEASON = 2026;

// Composite weights — sum to 1.0
const W_ACTUAL_WPCT = 0.5;
const W_PYTHAG = 0.3;
const W_RUN_DIFF = 0.2;

interface StandingsTeam {
  teamName: string;
  abbreviation: string;
  id: string;
  logo: string;
  wins: number;
  losses: number;
  winPercentage: number;
  gamesBack: number | string;
  league: string;
  division: string;
  runsScored: number;
  runsAllowed: number;
  streakCode: string;
  home: string;
  away: string;
  last10: string;
}

interface PowerRanking {
  rank: number;
  team: string;
  abbreviation: string;
  id: string;
  logo: string;
  league: string;
  division: string;
  wins: number;
  losses: number;
  winPct: number;
  runsScored: number;
  runsAllowed: number;
  runDiff: number;
  runDiffPerGame: number;
  pythagoreanWinPct: number;
  compositeScore: number;
  streak: string;
  last10: string;
}

/**
 * Pythagorean expected win percentage (Bill James, then refined by Davenport).
 * Using exponent 1.83 which is the standard for MLB.
 * Formula: RS^1.83 / (RS^1.83 + RA^1.83)
 */
function pythagoreanWinPct(rs: number, ra: number): number {
  if (rs <= 0 && ra <= 0) return 0.5;
  if (rs <= 0) return 0;
  if (ra <= 0) return 1;
  const exp = 1.83;
  const rsExp = Math.pow(rs, exp);
  const raExp = Math.pow(ra, exp);
  return rsExp / (rsExp + raExp);
}

/**
 * Normalize run differential per game to 0-100 scale.
 * MLB run-diff per game ranges roughly from -3 to +3 over a full season.
 * A run-diff of 0 = 50, +3 = 100, -3 = 0. Clamped.
 */
function normalizeRunDiffPerGame(rdpg: number): number {
  const clamped = Math.max(-3, Math.min(3, rdpg));
  return 50 + clamped * (50 / 3);
}

/**
 * Compute composite score (0-100) from the three inputs.
 * Each input is on a 0-100 scale before weighting.
 */
function computeComposite(winPct: number, pythag: number, rdpgNormalized: number): number {
  const wPct100 = winPct * 100;
  const pythag100 = pythag * 100;
  return wPct100 * W_ACTUAL_WPCT + pythag100 * W_PYTHAG + rdpgNormalized * W_RUN_DIFF;
}

export async function handleMLBPowerRankings(env: Env): Promise<Response> {
  const now = new Date().toISOString();

  try {
    // Check cache first (10-minute TTL — refreshes often but not every request)
    const cached = await kvGet<Record<string, unknown>>(env.KV, CACHE_KEY);
    if (cached) {
      return cachedJson(cached, 200, HTTP_CACHE.standings, cachedPayloadHeaders(cached));
    }

    // Fetch standings from the existing MLB handler (reuses its cache/fallback)
    const standingsResp = await handleMLBStandings(env);
    if (!standingsResp.ok) {
      return json({
        error: 'Upstream MLB standings unavailable',
        rankings: [],
        meta: { source: 'mlb-power', fetched_at: now, timezone: 'America/Chicago' },
      }, 503);
    }

    const standingsJson = await standingsResp.json() as {
      standings?: StandingsTeam[];
      data?: StandingsTeam[];
    };

    // MLB standings returns a flat `standings` array with all 30 teams
    const teams = standingsJson.standings ?? standingsJson.data ?? [];

    if (!Array.isArray(teams) || teams.length === 0) {
      return json({
        rankings: [],
        computedAt: now,
        season: SEASON,
        emptyReason: 'No MLB standings data available yet. Power rankings compute when teams have played games.',
        meta: { source: 'mlb-power', fetched_at: now, timezone: 'America/Chicago' },
      }, 200);
    }

    // Filter out teams with no games played (early-season spring rollover)
    const withGames = teams.filter((t) => (t.wins + t.losses) > 0);

    // Compute composite for each team
    const scored = withGames.map((t): Omit<PowerRanking, 'rank'> => {
      const gp = t.wins + t.losses;
      const winPct = gp > 0 ? t.wins / gp : 0;
      const rs = t.runsScored ?? 0;
      const ra = t.runsAllowed ?? 0;
      const runDiff = rs - ra;
      const rdpg = gp > 0 ? runDiff / gp : 0;
      const pythag = pythagoreanWinPct(rs, ra);
      const rdpgNormalized = normalizeRunDiffPerGame(rdpg);
      const composite = computeComposite(winPct, pythag, rdpgNormalized);

      return {
        team: t.teamName,
        abbreviation: t.abbreviation,
        id: t.id,
        logo: t.logo,
        league: t.league,
        division: t.division,
        wins: t.wins,
        losses: t.losses,
        winPct: Number(winPct.toFixed(4)),
        runsScored: rs,
        runsAllowed: ra,
        runDiff,
        runDiffPerGame: Number(rdpg.toFixed(3)),
        pythagoreanWinPct: Number(pythag.toFixed(4)),
        compositeScore: Number(composite.toFixed(2)),
        streak: t.streakCode ?? '',
        last10: t.last10 ?? '',
      };
    });

    // Sort descending by composite score
    scored.sort((a, b) => b.compositeScore - a.compositeScore);

    // Assign ranks
    const ranked: PowerRanking[] = scored.map((t, i) => ({ rank: i + 1, ...t }));

    const payload = withMeta(
      {
        rankings: ranked,
        computedAt: now,
        season: SEASON,
        methodology:
          '50% actual win percentage + 30% pythagorean expectation (exp 1.83) + 20% normalized run differential per game',
        totalTeams: ranked.length,
      },
      'mlb-power',
      { fetchedAt: now, sources: ['mlb-standings'] },
    );

    // 10-minute cache — standings refresh every few hours, but we want power
    // rankings to reflect the current API state without hammering compute.
    await kvPut(env.KV, CACHE_KEY, payload, 600);

    return cachedJson(payload, 200, HTTP_CACHE.standings, freshDataHeaders());
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[handleMLBPowerRankings]', msg);
    await logError(env, msg, 'handleMLBPowerRankings');
    return json(
      {
        error: 'Internal server error',
        rankings: [],
        meta: { source: 'mlb-power', fetched_at: now, timezone: 'America/Chicago' },
      },
      500,
    );
  }
}
