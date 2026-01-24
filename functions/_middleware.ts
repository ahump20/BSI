/**
 * BSI Request Middleware
 *
 * Readiness Gate: Checks D1 system_readiness before allowing data requests.
 * Prevents cold starts from poisoning cache or serving uncertain data.
 *
 * Flow:
 *   Request -> Skip check for health/admin/static
 *           -> Check system readiness in D1
 *           -> If initializing: try R2 snapshot recovery
 *           -> If not ready: 202/503 + no-store
 *           -> If ready: proceed to handler
 */

import {
  checkReadiness,
  validateFromSnapshot,
  markLiveIngestion,
  type ReadinessState,
} from '../lib/readiness';

interface Env {
  DB: D1Database;
  SPORTS_DATA?: R2Bucket;
}

/** Paths that skip readiness checks */
const SKIP_PATHS = ['/api/health', '/api/admin', '/_next', '/favicon', '/api/v1'] as const;

/** Response for not-ready state */
function createNotReadyResponse(
  state: ReadinessState,
  reason: string,
  httpStatus: 202 | 503
): Response {
  const status = state === 'initializing' ? 'pending' : 'unavailable';
  const retryAfter = state === 'initializing' ? '30' : '60';

  return new Response(
    JSON.stringify({
      status,
      message: reason,
      lifecycle: state,
    }),
    {
      status: httpStatus,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'X-BSI-Readiness': state,
        'Retry-After': retryAfter,
      },
    }
  );
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, next, env } = context;
  const url = new URL(request.url);

  // Skip readiness checks for health, admin, static assets
  if (SKIP_PATHS.some((path) => url.pathname.startsWith(path))) {
    return next();
  }

  // Skip for non-API routes (let Next.js handle pages)
  if (!url.pathname.startsWith('/api/')) {
    return next();
  }

  // Check system readiness
  let readiness = await checkReadiness(env.DB, 'system');

  // Try snapshot recovery if initializing and R2 is available
  if (readiness.state === 'initializing' && env.SPORTS_DATA) {
    // Try to recover from known dataset snapshots
    const snapshotsToTry = [
      { scope: 'cfb-rankings-ap', key: 'snapshots/cfb-rankings-ap/latest.json', minCount: 25 },
      {
        scope: 'cfb-rankings-coaches',
        key: 'snapshots/cfb-rankings-coaches/latest.json',
        minCount: 25,
      },
      { scope: 'cfb-games-live', key: 'snapshots/cfb-games-live/latest.json', minCount: 1 },
    ];

    let anyRecovered = false;
    for (const snapshot of snapshotsToTry) {
      const recovered = await validateFromSnapshot(
        env.DB,
        env.SPORTS_DATA,
        snapshot.scope,
        snapshot.key,
        snapshot.minCount
      );

      if (recovered) {
        anyRecovered = true;
      }
    }

    // Mark system as ready if any dataset recovered
    if (anyRecovered) {
      await markLiveIngestion(env.DB, 'system', 'Recovered from R2 snapshots during cold start');
    }

    // Re-check readiness after recovery attempts
    readiness = await checkReadiness(env.DB, 'system');
  }

  if (!readiness.isReady) {
    // When not ready, httpStatus is always 202 or 503
    const blockedStatus = readiness.httpStatus as 202 | 503;
    return createNotReadyResponse(readiness.state, readiness.reason, blockedStatus);
  }

  // System is ready - proceed to handler
  const response = await next();

  // Add readiness header to successful responses
  const headers = new Headers(response.headers);
  headers.set('X-BSI-Readiness', readiness.state);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
