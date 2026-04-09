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
import { MLB_TEAMS } from '../../lib/utils/mlb-teams';

const CACHE_KEY = 'mlb:power-rankings:v1';
// Snapshot key for week-over-week delta tracking. Power rankings handler
// reads this, computes delta against current ranking, then rotates it.
const SNAPSHOT_KEY = 'mlb:power-rankings:snapshot:prev';
const SNAPSHOT_MIN_AGE_MS = 24 * 60 * 60 * 1000; // 1 day minimum between snapshots
const SEASON = 2026;

// Composite weights — sum to 1.0
const W_ACTUAL_WPCT = 0.5;
const W_PYTHAG = 0.3;
const W_RUN_DIFF = 0.2;

// Partial run-data guard — warn when a team with meaningful games played has
// zero runs on one side of the ledger, which indicates upstream data gaps
// rather than genuine shutout streaks.
const PYTHAG_WARN_MIN_GAMES = 5;

// Map from abbreviation → canonical slug used for team detail URLs.
// Built once at module load from the local MLB_TEAMS table, then extended
// with aliases for ESPN-specific abbreviation drift (e.g. ESPN uses CHW for
// White Sox while the local table uses CWS; ESPN uses ATH for Athletics
// while local uses OAK).
const ESPN_ABBR_ALIASES: Record<string, string> = {
  CHW: 'white-sox', // ESPN → White Sox
  CWS: 'white-sox', // Local
  ATH: 'athletics', // ESPN → Oakland Athletics
  OAK: 'athletics', // Local
};
const ABBR_TO_SLUG: Record<string, string> = {
  ...Object.fromEntries(MLB_TEAMS.map((t) => [t.abbreviation, t.slug])),
  ...ESPN_ABBR_ALIASES,
};

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
  slug: string | null;
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
  // Week-over-week movement. Positive = moved up, negative = moved down,
  // null = new to the rankings (or first snapshot).
  delta: number | null;
  prevRank: number | null;
}

interface RankSnapshot {
  capturedAt: string;
  ranks: Record<string, number>; // abbreviation → rank at capture time
}

/**
 * Pythagorean expected win percentage (Bill James, then refined by Davenport).
 * Using exponent 1.83 which is the standard for MLB.
 * Formula: RS^1.83 / (RS^1.83 + RA^1.83)
 *
 * @param gp Games played — used for partial-data guard. Zero rs or ra after
 *           multiple games played likely indicates upstream data gaps, not
 *           a genuine shutout streak, so we emit a warn for operators.
 */
function pythagoreanWinPct(rs: number, ra: number, gp: number = 0, teamName: string = ''): number {
  if (rs <= 0 && ra <= 0) {
    if (gp >= PYTHAG_WARN_MIN_GAMES) {
      console.warn(
        `[mlb-power] ${teamName || 'team'}: rs=0 and ra=0 after ${gp} games — likely missing run data. Defaulting pythag=0.5.`,
      );
    }
    return 0.5;
  }
  if (rs <= 0) {
    if (gp >= PYTHAG_WARN_MIN_GAMES) {
      console.warn(
        `[mlb-power] ${teamName || 'team'}: rs=0 after ${gp} games — likely missing runsScored data. Returning pythag=0.`,
      );
    }
    return 0;
  }
  if (ra <= 0) {
    if (gp >= PYTHAG_WARN_MIN_GAMES) {
      console.warn(
        `[mlb-power] ${teamName || 'team'}: ra=0 after ${gp} games — likely missing runsAllowed data. Returning pythag=1.`,
      );
    }
    return 1;
  }
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

    // Load the previous rank snapshot for week-over-week delta computation.
    // Null on first run or if the previous snapshot is missing.
    const prevSnapshot = await kvGet<RankSnapshot>(env.KV, SNAPSHOT_KEY);
    const prevRanks = prevSnapshot?.ranks ?? {};

    // Compute composite for each team
    const scored = withGames.map((t): Omit<PowerRanking, 'rank' | 'delta' | 'prevRank'> => {
      const gp = t.wins + t.losses;
      const winPct = gp > 0 ? t.wins / gp : 0;
      const rs = t.runsScored ?? 0;
      const ra = t.runsAllowed ?? 0;
      const runDiff = rs - ra;
      const rdpg = gp > 0 ? runDiff / gp : 0;
      const pythag = pythagoreanWinPct(rs, ra, gp, t.teamName);
      const rdpgNormalized = normalizeRunDiffPerGame(rdpg);
      const composite = computeComposite(winPct, pythag, rdpgNormalized);

      return {
        team: t.teamName,
        abbreviation: t.abbreviation,
        id: t.id,
        slug: ABBR_TO_SLUG[t.abbreviation] ?? null,
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

    // Assign ranks + compute delta against previous snapshot.
    // delta = prevRank - currentRank (positive means climbed, negative means dropped).
    const ranked: PowerRanking[] = scored.map((t, i) => {
      const rank = i + 1;
      const prevRank = prevRanks[t.abbreviation] ?? null;
      const delta = prevRank != null ? prevRank - rank : null;
      return { rank, delta, prevRank, ...t };
    });

    // Rotate the snapshot if the previous one is old enough (>= 1 day).
    // This gives delta a meaningful "week-over-week" cadence without requiring
    // a separate cron — the handler self-rotates on its own read cycle.
    const shouldRotate =
      !prevSnapshot ||
      Date.now() - new Date(prevSnapshot.capturedAt).getTime() >= SNAPSHOT_MIN_AGE_MS;
    if (shouldRotate && ranked.length > 0) {
      const nextSnapshot: RankSnapshot = {
        capturedAt: now,
        ranks: Object.fromEntries(ranked.map((r) => [r.abbreviation, r.rank])),
      };
      // Snapshot TTL = 14 days (ample for weekly delta tracking)
      await kvPut(env.KV, SNAPSHOT_KEY, nextSnapshot, 14 * 24 * 60 * 60);
    }

    const payload = withMeta(
      {
        rankings: ranked,
        computedAt: now,
        season: SEASON,
        methodology:
          '50% actual win percentage + 30% pythagorean expectation (exp 1.83) + 20% normalized run differential per game',
        totalTeams: ranked.length,
        snapshotCapturedAt: prevSnapshot?.capturedAt ?? null,
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
