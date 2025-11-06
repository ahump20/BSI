import { cfpTop25Data } from '../../lib/cfp/data';
import { runScenarioSimulation } from '../../lib/cfp/simulator';
import type { CFPTop25Response, ScenarioSimulationRequest } from '../../lib/cfp/types';

const CACHE_KEY_TOP25 = 'cfp-top25-latest';
const CACHE_KEY_PREFIX_SCENARIO = 'cfp-scenario-';

export interface Env {
  CFP_CACHE?: KVNamespace;
  CFP_ARCHIVE?: R2Bucket;
  CFP_DB?: D1Database;
}

function jsonResponse(body: unknown, status = 200, corsOverride?: Record<string, string>) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'content-type,authorization,x-requested-with',
    ...corsOverride
  };

  return new Response(JSON.stringify(body), { status, headers });
}

async function handleTop25(env: Env): Promise<Response> {
  const hasCache = Boolean(env.CFP_CACHE);
  let cacheState: 'hit' | 'miss' | 'bypass' = hasCache ? 'miss' : 'bypass';
  let payload: CFPTop25Response;

  if (env.CFP_CACHE) {
    const cached = await env.CFP_CACHE.get(CACHE_KEY_TOP25, 'json');
    if (cached) {
      payload = cached as CFPTop25Response;
      cacheState = 'hit';
    } else {
      payload = JSON.parse(JSON.stringify(cfpTop25Data)) as CFPTop25Response;
      await env.CFP_CACHE.put(CACHE_KEY_TOP25, JSON.stringify(payload), { expirationTtl: 900 });
    }
  } else {
    payload = JSON.parse(JSON.stringify(cfpTop25Data)) as CFPTop25Response;
  }

  payload.meta = { fetchedFrom: 'worker', cache: cacheState };

  return jsonResponse(payload, 200, {
    'Cache-Control': 'public, max-age=120'
  });
}

async function handleScenarioSimulation(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  let body: ScenarioSimulationRequest = {};
  try {
    body = (await request.json()) as ScenarioSimulationRequest;
  } catch (error) {
    return jsonResponse({ error: 'Invalid JSON payload', details: (error as Error).message }, 400);
  }

  const normalizedIterations = Math.min(Math.max(body.iterations ?? 2500, 500), 20000);
  const normalizedPayload: ScenarioSimulationRequest = {
    ...body,
    iterations: normalizedIterations
  };

  const cacheKey = `${CACHE_KEY_PREFIX_SCENARIO}${normalizedIterations}-${JSON.stringify(
    (body.adjustments ?? []).map((adj) => ({
      team: adj.team,
      winProbabilityDelta: adj.winProbabilityDelta ?? 0,
      resumeBonus: adj.resumeBonus ?? 0,
      autoBid: adj.autoBid ?? false
    }))
  )}-${(body.protectSeeds ?? []).join('-')}-${body.chaosFactor ?? 1}`;

  if (env.CFP_CACHE) {
    const cached = await env.CFP_CACHE.get(cacheKey, 'json');
    if (cached) {
      return jsonResponse({ ...cached, meta: { cache: 'hit', fetchedFrom: 'worker' } }, 200, {
        'Cache-Control': 'public, max-age=60'
      });
    }
  }

  const result = runScenarioSimulation(normalizedPayload);
  const responseBody = { ...result, meta: { cache: env.CFP_CACHE ? 'miss' : 'bypass', fetchedFrom: 'worker' } };

  if (env.CFP_CACHE) {
    await env.CFP_CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 120 });
  }

  if (env.CFP_ARCHIVE) {
    const key = `scenarios/${result.scenarioHash}-${result.generatedAt}.json`;
    await env.CFP_ARCHIVE.put(key, JSON.stringify(responseBody), {
      httpMetadata: {
        contentType: 'application/json'
      }
    });
  }

  return jsonResponse(responseBody, 200, {
    'Cache-Control': 'no-store'
  });
}

async function handleSummary(): Promise<Response> {
  const payload = {
    season: cfpTop25Data.season,
    lastUpdated: cfpTop25Data.lastUpdated,
    projectedField: cfpTop25Data.modelBaseline.projectedField,
    bubbleTeams: cfpTop25Data.modelBaseline.bubbleTeams,
    headline: `${cfpTop25Data.modelBaseline.projectedField[0]?.team ?? 'Top contender'} still pacing the CFP composite.`,
    notes: cfpTop25Data.modelBaseline.notes
  };

  return jsonResponse(payload, 200, {
    'Cache-Control': 'public, max-age=300'
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return jsonResponse({}, 204);
    }

    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/+$/u, '');

    if (pathname === '/cfp/top25') {
      return handleTop25(env);
    }

    if (pathname === '/cfp/simulate') {
      return handleScenarioSimulation(request, env);
    }

    if (pathname === '/cfp/summary') {
      return handleSummary();
    }

    if (pathname === '/cfp' || pathname === '/cfp/health') {
      return jsonResponse({ status: 'ok', service: 'cfp-playoff', timestamp: new Date().toISOString() });
    }

    return jsonResponse({ error: 'Not found', path: pathname }, 404);
  }
};
