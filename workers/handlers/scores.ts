import type { Env } from '../shared/types';
import { responseToJson } from '../shared/helpers';
import { handleCollegeBaseballSchedule } from './college-baseball';
import { handleMLBScores } from './mlb';
import { handleNFLScores } from './nfl';
import { handleNBAScores } from './nba';
import { handleCFBScores } from './cfb';

/**
 * Aggregate live scores across all sports into a single payload.
 *
 * Calls existing sport-specific handlers in parallel and merges results
 * into a stable envelope: { data, errors, meta }.
 *
 * College baseball uses the schedule-shaped handler (not the raw scores
 * payload) so the /scores page receives the shape it already expects.
 *
 * Optional `date` query param is forwarded to downstream handlers.
 */
export async function handleScoresOverview(
  url: URL,
  env: Env,
  ctx?: ExecutionContext,
): Promise<Response> {
  const date = url.searchParams.get('date') ?? undefined;
  const origin = url.origin;

  function buildUrl(path: string): URL {
    const u = new URL(path, origin);
    if (date) {
      u.searchParams.set('date', date);
    }
    return u;
  }

  const results: Record<string, unknown> = {};
  const errors: Record<string, string> = {};
  const sportSources: Record<string, string> = {};

  type Handler = (url: URL, env: Env, ctx?: ExecutionContext) => Promise<Response>;

  async function fetchSport(
    key: string,
    handler: Handler,
    path: string,
    source: string,
  ) {
    try {
      const res = await handler(buildUrl(path), env, ctx);
      const json = await responseToJson(res);
      results[key] = json;
      sportSources[key] = source;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      errors[key] = msg;
    }
  }

  await Promise.all([
    fetchSport(
      'college-baseball',
      handleCollegeBaseballSchedule,
      '/api/college-baseball/schedule',
      'Highlightly / ESPN',
    ),
    fetchSport('mlb', handleMLBScores, '/api/mlb/scores', 'MLB Stats API'),
    fetchSport('nfl', handleNFLScores, '/api/nfl/scores', 'ESPN'),
    fetchSport('nba', handleNBAScores, '/api/nba/scores', 'ESPN'),
    fetchSport('cfb', handleCFBScores, '/api/cfb/scores', 'ESPN'),
  ]);

  const now = new Date().toISOString();
  const body = {
    data: results,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
    meta: {
      source: 'BSI Aggregate',
      fetched_at: now,
      timezone: 'America/Chicago' as const,
      sports: sportSources,
    },
  };

  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=30, s-maxage=30',
      'X-BSI-Source': 'scores-overview',
      'X-BSI-Fetched-At': now,
    },
  });
}
