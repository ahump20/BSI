/**
 * Leverage Equivalency Index Worker
 *
 * Normalizes championship leverage across sports on a 0-100 scale. Built for
 * late-game playoff moments so analysts can compare "clutch" across codes.
 */

import { LeverageEquivalencyIndex } from '../../lib/lei/leverage-equivalency-index';
import type { PlayContext } from '../../lib/lei/types';
import type { Env } from './types';

const calculator = new LeverageEquivalencyIndex();

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return jsonResponse(
        {
          status: 'ok',
          service: 'lei-worker',
          timestamp: new Date().toISOString(),
        },
        200
      );
    }

    if (request.method !== 'POST' || url.pathname !== '/api/lei') {
      return jsonResponse({ error: 'Not Found' }, 404);
    }

    if (env.LEI_API_TOKEN) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader !== `Bearer ${env.LEI_API_TOKEN}`) {
        return jsonResponse({ error: 'Unauthorized' }, 401);
      }
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch (error) {
      return jsonResponse({ error: 'Invalid JSON body.' }, 400);
    }

    const validation = calculator.validate(body);
    if (!validation.ok) {
      return jsonResponse({ error: 'Validation failed', issues: validation.issues }, 422);
    }

    let context: PlayContext;
    try {
      context = calculator.parseContext(body);
    } catch (error) {
      return jsonResponse({ error: error instanceof Error ? error.message : 'Invalid payload.' }, 422);
    }

    const result = calculator.computeWithComponents(context);

    if (env.LEI_LOGS) {
      ctx.waitUntil(persistAudit(env, context, result.lei));
    }

    return jsonResponse({
      lei: roundToTenths(result.lei),
      components: {
        championship_weight: result.components.championshipWeight,
        wpa: roundToThousandths(result.components.winProbabilityAdded),
        scarcity: roundToThousandths(result.components.scarcity),
      },
      context,
    });
  },
};

async function persistAudit(env: Env, context: PlayContext, lei: number): Promise<void> {
  const db = env.LEI_LOGS;
  if (!db) {
    return;
  }

  try {
    await db
      .prepare(
        `INSERT INTO lei_requests
          (timestamp, sport, playoff_round, pre_win_prob, post_win_prob, lei_score, payload)
        VALUES
          (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        new Date().toISOString(),
        context.sport,
        context.playoffRound,
        context.prePlayWinProb,
        context.postPlayWinProb,
        lei,
        JSON.stringify(context)
      )
      .run();
  } catch (error) {
    console.warn('[LEI Worker] Failed to persist audit log', error);
  }
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

function roundToTenths(value: number): number {
  return Math.round(value * 10) / 10;
}

function roundToThousandths(value: number): number {
  return Math.round(value * 1000) / 1000;
}
