/**
 * Player Evaluation API Handler — Cross-Sport Unified Evaluation
 *
 * Routes:
 *   GET /api/evaluate/player/:sport/:playerId — Unified evaluation profile
 *   GET /api/evaluate/search?q=name&sport=mlb  — Cross-sport player search
 *
 * This handler wraps existing sport-specific player endpoints,
 * normalizes responses into EvaluationProfile shape, and computes
 * percentile rankings per sport/position.
 *
 * For college baseball: Leverages Savant D1 data with pre-computed percentiles.
 * For MLB/NFL/NBA: Uses ESPN athlete data with league-average-based estimates.
 */

import type { Env } from '../shared/types';
import { json, cachedJson, kvGet, kvPut, apiError } from '../shared/helpers';
import { HTTP_CACHE, CACHE_TTL } from '../shared/constants';
import {
  getAthlete,
  transformAthlete,
} from '../../lib/api-clients/espn-api';
import type {
  EvaluationProfile,
  EvaluationMetric,
  EvaluationSport,
  EvaluationTier,
} from '../../lib/evaluate/metrics';
import {
  getMetricsForPlayer,
  classifyTier,
  SPORT_LABELS,
} from '../../lib/evaluate/metrics';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEASON = 2026;
const EVAL_CACHE_TTL = 900; // 15 min

function evalMeta(source: string) {
  return {
    source,
    fetched_at: new Date().toISOString(),
    timezone: 'America/Chicago' as const,
  };
}

// ---------------------------------------------------------------------------
// College Baseball Evaluation (D1 Savant data)
// ---------------------------------------------------------------------------

async function evaluateCollegeBaseball(
  playerId: string,
  env: Env
): Promise<EvaluationProfile | null> {
  // Fetch from D1 — same approach as handleSavantPlayer
  const batting = await env.DB.prepare(
    `SELECT * FROM cbb_batting_advanced WHERE player_id = ? AND season = ?`
  ).bind(playerId, SEASON).first() as Record<string, unknown> | null;

  const pitching = await env.DB.prepare(
    `SELECT * FROM cbb_pitching_advanced WHERE player_id = ? AND season = ?`
  ).bind(playerId, SEASON).first() as Record<string, unknown> | null;

  if (!batting && !pitching) return null;

  const isPitcher = !batting && !!pitching;
  const primary = isPitcher ? pitching! : batting!;
  const position = (primary.position as string) || (isPitcher ? 'P' : 'UT');

  const metricDefs = getMetricsForPlayer('college-baseball', position);
  const metrics: EvaluationMetric[] = [];

  // Compute percentiles against full population for each metric
  for (const def of metricDefs) {
    const value = primary[def.key];
    if (value == null || typeof value !== 'number' || !Number.isFinite(value)) continue;

    const table = isPitcher ? 'cbb_pitching_advanced' : 'cbb_batting_advanced';
    const minFilter = isPitcher ? 'ip >= 10' : 'pa >= 25';

    const { results: popResults } = await env.DB.prepare(
      `SELECT ${def.key} FROM ${table} WHERE season = ? AND ${minFilter} AND ${def.key} IS NOT NULL`
    ).bind(SEASON).all();

    const sorted = popResults
      .map((r) => r[def.key] as number)
      .filter((v) => Number.isFinite(v))
      .sort((a, b) => a - b);

    let percentile = 50;
    if (sorted.length > 1) {
      const below = sorted.filter((v) => v < value).length;
      percentile = Math.round((below / (sorted.length - 1)) * 100);
      // Invert for "lower is better" stats (ERA, FIP, etc.)
      if (!def.higherIsBetter) percentile = 100 - percentile;
    }

    metrics.push({
      key: def.key,
      label: def.label,
      value,
      percentile,
      higherIsBetter: def.higherIsBetter,
      category: def.category,
      displayValue: def.format(value),
    });
  }

  const avgPercentile =
    metrics.length > 0
      ? Math.round(metrics.reduce((s, m) => s + m.percentile, 0) / metrics.length)
      : 50;

  return {
    player: {
      id: playerId,
      name: (primary.player_name as string) || playerId,
      sport: 'college-baseball',
      team: (primary.team as string) || '',
      position,
      bio: {},
    },
    evaluation: {
      tier: classifyTier(avgPercentile),
      overallPercentile: avgPercentile,
      metrics,
    },
    meta: evalMeta('bsi-savant'),
  };
}

// ---------------------------------------------------------------------------
// ESPN-based Evaluation (MLB, NFL, NBA)
// ---------------------------------------------------------------------------

/**
 * League-average baselines for percentile estimation.
 * These are approximate season averages — enough for percentile ranking.
 * Updated each season by the cron or manually.
 */
const LEAGUE_BASELINES: Record<string, { mean: number; stdDev: number }> = {
  // MLB Hitting
  'mlb:battingAverage': { mean: 0.248, stdDev: 0.028 },
  'mlb:onBasePercentage': { mean: 0.318, stdDev: 0.032 },
  'mlb:sluggingPercentage': { mean: 0.402, stdDev: 0.060 },
  'mlb:ops': { mean: 0.720, stdDev: 0.085 },
  'mlb:homeRuns': { mean: 15, stdDev: 10 },
  'mlb:rbi': { mean: 48, stdDev: 25 },
  'mlb:stolenBases': { mean: 10, stdDev: 10 },
  'mlb:runs': { mean: 52, stdDev: 20 },
  'mlb:hits': { mean: 100, stdDev: 35 },
  // MLB Pitching
  'mlb:era': { mean: 4.20, stdDev: 1.20 },
  'mlb:whip': { mean: 1.28, stdDev: 0.18 },
  'mlb:strikeouts': { mean: 120, stdDev: 55 },
  'mlb:wins': { mean: 8, stdDev: 4 },
  'mlb:saves': { mean: 5, stdDev: 10 },
  'mlb:inningsPitched': { mean: 130, stdDev: 50 },
  // NFL
  'nfl:passerRating': { mean: 88, stdDev: 14 },
  'nfl:completionPercentage': { mean: 64, stdDev: 5 },
  'nfl:yardsPerAttempt': { mean: 7.0, stdDev: 0.8 },
  'nfl:touchdowns': { mean: 22, stdDev: 8 },
  'nfl:interceptions': { mean: 10, stdDev: 5 },
  'nfl:passingYards': { mean: 3400, stdDev: 800 },
  'nfl:rushingYards': { mean: 600, stdDev: 350 },
  'nfl:yardsPerCarry': { mean: 4.2, stdDev: 0.7 },
  'nfl:rushingTouchdowns': { mean: 5, stdDev: 4 },
  'nfl:receptions': { mean: 55, stdDev: 25 },
  'nfl:receivingYards': { mean: 650, stdDev: 300 },
  'nfl:yardsPerReception': { mean: 11.5, stdDev: 3 },
  'nfl:receivingTouchdowns': { mean: 4, stdDev: 3 },
  'nfl:targets': { mean: 80, stdDev: 35 },
  'nfl:tackles': { mean: 60, stdDev: 25 },
  'nfl:sacks': { mean: 5, stdDev: 4 },
  'nfl:passDeflections': { mean: 6, stdDev: 4 },
  'nfl:forcedFumbles': { mean: 1, stdDev: 1 },
  // NBA
  'nba:points': { mean: 12, stdDev: 6 },
  'nba:fieldGoalPercentage': { mean: 0.455, stdDev: 0.045 },
  'nba:threePointPercentage': { mean: 0.355, stdDev: 0.05 },
  'nba:freeThrowPercentage': { mean: 0.775, stdDev: 0.07 },
  'nba:trueShootingPercentage': { mean: 0.570, stdDev: 0.04 },
  'nba:assists': { mean: 3.0, stdDev: 2.0 },
  'nba:turnovers': { mean: 1.5, stdDev: 0.8 },
  'nba:assistToTurnover': { mean: 2.0, stdDev: 0.8 },
  'nba:rebounds': { mean: 4.5, stdDev: 2.5 },
  'nba:offensiveRebounds': { mean: 0.8, stdDev: 0.6 },
  'nba:defensiveRebounds': { mean: 3.5, stdDev: 1.8 },
  'nba:steals': { mean: 0.8, stdDev: 0.4 },
  'nba:blocks': { mean: 0.5, stdDev: 0.4 },
};

/** Estimate percentile from a z-score against league baselines. */
function estimatePercentile(value: number, mean: number, stdDev: number, higherIsBetter: boolean): number {
  const z = (value - mean) / stdDev;
  const p = Math.min(Math.max((z + 2) / 4 * 100, 1), 99);
  return Math.round(higherIsBetter ? p : 100 - p);
}

/** Extract stat value from ESPN's nested statistics arrays. */
function extractStatValue(stats: unknown[], key: string): number | null {
  for (const group of stats) {
    const g = group as Record<string, unknown>;
    const splits = g.splits as Record<string, unknown>[] | undefined;
    const categories = g.categories as Record<string, unknown>[] | undefined;

    // Try splits format (common in ESPN athlete API)
    if (splits) {
      for (const split of splits) {
        const statObj = split.stats as Record<string, unknown>[] | undefined;
        if (statObj) {
          for (const stat of statObj) {
            if (stat.name === key || stat.abbreviation === key) {
              const v = parseFloat(String(stat.value ?? stat.displayValue ?? ''));
              if (Number.isFinite(v)) return v;
            }
          }
        }
      }
    }

    // Try categories format
    if (categories) {
      for (const cat of categories) {
        const catStats = cat.stats as Record<string, unknown>[] | undefined;
        if (catStats) {
          for (const stat of catStats) {
            if (stat.name === key || stat.abbreviation === key) {
              const v = parseFloat(String(stat.value ?? stat.displayValue ?? ''));
              if (Number.isFinite(v)) return v;
            }
          }
        }
      }
    }
  }
  return null;
}

async function evaluateESPNPlayer(
  sport: 'mlb' | 'nfl' | 'nba',
  playerId: string,
): Promise<EvaluationProfile | null> {
  const raw = await getAthlete(sport, playerId);
  const { player } = transformAthlete(raw as Record<string, unknown>);
  if (!player.name) return null;

  const position = player.position || '';
  const metricDefs = getMetricsForPlayer(sport, position);
  const stats = (player.stats || []) as unknown[];
  const metrics: EvaluationMetric[] = [];

  for (const def of metricDefs) {
    const value = extractStatValue(stats, def.key);
    if (value == null) continue;

    const baselineKey = `${sport}:${def.key}`;
    const baseline = LEAGUE_BASELINES[baselineKey];

    const percentile = baseline
      ? estimatePercentile(value, baseline.mean, baseline.stdDev, def.higherIsBetter)
      : 50; // No baseline → neutral

    metrics.push({
      key: def.key,
      label: def.label,
      value,
      percentile,
      higherIsBetter: def.higherIsBetter,
      category: def.category,
      displayValue: def.format(value),
    });
  }

  const avgPercentile =
    metrics.length > 0
      ? Math.round(metrics.reduce((s, m) => s + m.percentile, 0) / metrics.length)
      : 50;

  return {
    player: {
      id: playerId,
      name: player.name,
      sport,
      team: player.team?.name || '',
      position,
      headshot: player.headshot || undefined,
      bio: {
        height: player.height || undefined,
        weight: player.weight ? parseInt(player.weight, 10) : undefined,
        age: player.age || undefined,
      },
    },
    evaluation: {
      tier: classifyTier(avgPercentile),
      overallPercentile: avgPercentile,
      metrics,
    },
    meta: evalMeta(`espn-${sport}`),
  };
}

// ---------------------------------------------------------------------------
// Route Handlers
// ---------------------------------------------------------------------------

const VALID_SPORTS = new Set<EvaluationSport>(['college-baseball', 'mlb', 'nfl', 'nba']);

/**
 * GET /api/evaluate/player/:sport/:playerId
 */
export async function handleEvaluatePlayer(
  sport: string,
  playerId: string,
  env: Env
): Promise<Response> {
  if (!VALID_SPORTS.has(sport as EvaluationSport)) {
    return apiError(`Invalid sport: ${sport}. Valid: ${[...VALID_SPORTS].join(', ')}`, 'BAD_REQUEST', 400);
  }

  const cacheKey = `eval:${sport}:${playerId}`;
  const cached = await kvGet<EvaluationProfile>(env.KV, cacheKey);
  if (cached) {
    return cachedJson(cached, 200, HTTP_CACHE.player, { 'X-Cache': 'HIT' });
  }

  try {
    let profile: EvaluationProfile | null;

    if (sport === 'college-baseball') {
      profile = await evaluateCollegeBaseball(playerId, env);
    } else {
      profile = await evaluateESPNPlayer(sport as 'mlb' | 'nfl' | 'nba', playerId);
    }

    if (!profile) {
      return apiError('Player not found', 'NOT_FOUND', 404);
    }

    await kvPut(env.KV, cacheKey, profile, EVAL_CACHE_TTL);
    return cachedJson(profile, 200, HTTP_CACHE.player, { 'X-Cache': 'MISS' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[evaluate:${sport}:${playerId}]`, msg);
    return apiError('Failed to evaluate player', 'INTERNAL_ERROR', 500);
  }
}

/**
 * GET /api/evaluate/search?q=name&sport=mlb
 *
 * Thin wrapper around the search handler that filters to players only.
 * Constructs evaluation-tool-specific URLs.
 */
export async function handleEvaluateSearch(
  url: URL,
  env: Env
): Promise<Response> {
  const query = (url.searchParams.get('q') || '').trim();
  const sportFilter = url.searchParams.get('sport') || '';

  if (query.length < 2) {
    return json({ results: [], meta: evalMeta('evaluate-search') });
  }

  // Build internal search URL
  const searchUrl = new URL(`${url.origin}/api/search`);
  searchUrl.searchParams.set('q', query);
  searchUrl.searchParams.set('type', 'player');
  if (sportFilter) searchUrl.searchParams.set('sport', sportFilter);

  try {
    // Fetch from the internal search endpoint
    const searchRes = await fetch(searchUrl.toString());
    if (!searchRes.ok) {
      return json({ results: [], meta: evalMeta('evaluate-search') });
    }
    const searchData = (await searchRes.json()) as { results?: Array<Record<string, unknown>> };
    const rawResults = searchData.results || [];

    // Map results to evaluation-specific shape
    const results = rawResults
      .filter((r) => r.type === 'player')
      .slice(0, 10)
      .map((r) => ({
        id: r.id as string,
        name: r.name as string,
        sport: r.sport as string,
        team: (r.team as string) || '',
        position: (r.position as string) || '',
        url: `/evaluate/${r.sport}/${r.id}`,
        sportLabel: SPORT_LABELS[(r.sport as EvaluationSport)] || r.sport,
      }));

    return json({ results, meta: evalMeta('evaluate-search') });
  } catch (err) {
    console.error('[evaluate:search]', err instanceof Error ? err.message : err);
    return json({ results: [], meta: evalMeta('evaluate-search') });
  }
}
