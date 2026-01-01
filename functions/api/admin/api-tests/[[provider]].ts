/**
 * API Provider Test Endpoint
 * GET /api/admin/api-tests/:provider
 *
 * Test individual API providers to verify connectivity and configuration.
 *
 * Routes:
 *   GET /api/admin/api-tests/mlb         - Test MLB Stats API
 *   GET /api/admin/api-tests/espn        - Test ESPN APIs (NFL, NBA, NCAA)
 *   GET /api/admin/api-tests/sportsdataio - Test SportsDataIO
 *   GET /api/admin/api-tests/cfbd        - Test College Football Data
 *   GET /api/admin/api-tests/all         - Run all tests
 */

interface Env {
  SPORTSDATAIO_API_KEY?: string;
  SPORTSDATAIO_KEY?: string;
  CFBDATA_API_KEY?: string;
  COLLEGEFOOTBALLDATA_API_KEY?: string;
  KV?: KVNamespace;
}

interface TestResult {
  provider: string;
  status: 'pass' | 'fail' | 'skip';
  responseTime: number;
  statusCode?: number;
  error?: string;
  dataValidation?: boolean;
  details?: Record<string, unknown>;
}

const ESPN_HEADERS = {
  'User-Agent': 'BlazeSportsIntel/2.2.0 (https://blazesportsintel.com)',
  Accept: 'application/json',
};

// Test functions for each provider
const PROVIDERS: Record<string, (env: Env) => Promise<TestResult>> = {
  mlb: async () => {
    const start = Date.now();
    try {
      const response = await fetch('https://statsapi.mlb.com/api/v1/teams/138', {
        signal: AbortSignal.timeout(5000),
      });
      const data = await response.json();

      // Validate response structure
      const isValid = data?.teams?.[0]?.name === 'St. Louis Cardinals';

      return {
        provider: 'MLB Stats API',
        status: response.ok && isValid ? 'pass' : 'fail',
        responseTime: Date.now() - start,
        statusCode: response.status,
        dataValidation: isValid,
        details: {
          teamFound: data?.teams?.[0]?.name || null,
          endpoint: 'https://statsapi.mlb.com/api/v1/teams/138',
        },
      };
    } catch (error) {
      return {
        provider: 'MLB Stats API',
        status: 'fail',
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  espn: async () => {
    const results: TestResult[] = [];
    const endpoints = [
      {
        name: 'ESPN NFL',
        url: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/10',
        validate: 'Tennessee Titans',
      },
      {
        name: 'ESPN NBA',
        url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/29',
        validate: 'Memphis Grizzlies',
      },
      {
        name: 'ESPN NCAA Football',
        url: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/251',
        validate: 'Texas Longhorns',
      },
      {
        name: 'ESPN College Baseball',
        url: 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams',
        validate: 'teams',
      },
    ];

    for (const ep of endpoints) {
      const start = Date.now();
      try {
        const response = await fetch(ep.url, {
          headers: ESPN_HEADERS,
          signal: AbortSignal.timeout(5000),
        });
        const data = await response.json();

        let isValid = false;
        if (ep.validate === 'teams') {
          isValid = Array.isArray(data?.sports?.[0]?.leagues?.[0]?.teams);
        } else {
          isValid = data?.team?.displayName === ep.validate;
        }

        results.push({
          provider: ep.name,
          status: response.ok && isValid ? 'pass' : 'fail',
          responseTime: Date.now() - start,
          statusCode: response.status,
          dataValidation: isValid,
        });
      } catch (error) {
        results.push({
          provider: ep.name,
          status: 'fail',
          responseTime: Date.now() - start,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Rate limit protection
      await new Promise((r) => setTimeout(r, 200));
    }

    // Return combined result
    const allPass = results.every((r) => r.status === 'pass');
    const totalTime = results.reduce((sum, r) => sum + r.responseTime, 0);

    return {
      provider: 'ESPN APIs',
      status: allPass ? 'pass' : 'fail',
      responseTime: totalTime,
      dataValidation: allPass,
      details: {
        endpoints: results,
        passed: results.filter((r) => r.status === 'pass').length,
        total: results.length,
      },
    };
  },

  sportsdataio: async (env: Env) => {
    const key = env.SPORTSDATAIO_API_KEY || env.SPORTSDATAIO_KEY;

    if (!key) {
      return {
        provider: 'SportsDataIO',
        status: 'skip',
        responseTime: 0,
        error: 'SPORTSDATAIO_API_KEY not configured',
      };
    }

    const start = Date.now();
    try {
      const response = await fetch(
        `https://api.sportsdata.io/v3/nfl/scores/json/Teams?key=${key}`,
        { signal: AbortSignal.timeout(5000) }
      );
      const data = await response.json();

      // Validate response structure
      const isValid = Array.isArray(data) && data.length > 0 && data[0]?.Key;

      return {
        provider: 'SportsDataIO',
        status: response.ok && isValid ? 'pass' : 'fail',
        responseTime: Date.now() - start,
        statusCode: response.status,
        dataValidation: isValid,
        details: {
          teamsReturned: Array.isArray(data) ? data.length : 0,
        },
      };
    } catch (error) {
      return {
        provider: 'SportsDataIO',
        status: 'fail',
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  cfbd: async (env: Env) => {
    const key = env.CFBDATA_API_KEY || env.COLLEGEFOOTBALLDATA_API_KEY;

    if (!key) {
      return {
        provider: 'College Football Data',
        status: 'skip',
        responseTime: 0,
        error: 'CFBDATA_API_KEY not configured',
      };
    }

    const start = Date.now();
    try {
      const response = await fetch('https://api.collegefootballdata.com/teams?conference=SEC', {
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(5000),
      });
      const data = await response.json();

      // Validate response structure
      const isValid =
        Array.isArray(data) &&
        data.length > 0 &&
        data.some((t: { school?: string }) => t?.school === 'Texas');

      return {
        provider: 'College Football Data',
        status: response.ok && isValid ? 'pass' : 'fail',
        responseTime: Date.now() - start,
        statusCode: response.status,
        dataValidation: isValid,
        details: {
          teamsReturned: Array.isArray(data) ? data.length : 0,
          texasFound: isValid,
        },
      };
    } catch (error) {
      return {
        provider: 'College Football Data',
        status: 'fail',
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

export const onRequest: PagesFunction<Env> = async ({ params, env, request }) => {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const provider = (params.provider as string[] | undefined)?.[0]?.toLowerCase() || 'all';
  const startTime = Date.now();

  const results: TestResult[] = [];

  if (provider === 'all') {
    // Run all tests with rate limiting
    for (const [_name, testFn] of Object.entries(PROVIDERS)) {
      const result = await testFn(env);
      results.push(result);
      // Rate limit between providers
      await new Promise((r) => setTimeout(r, 300));
    }
  } else if (PROVIDERS[provider]) {
    const result = await PROVIDERS[provider](env);
    results.push(result);
  } else {
    return new Response(
      JSON.stringify({
        error: `Unknown provider: ${provider}`,
        availableProviders: Object.keys(PROVIDERS),
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const summary = {
    totalTests: results.length,
    passed: results.filter((r) => r.status === 'pass').length,
    failed: results.filter((r) => r.status === 'fail').length,
    skipped: results.filter((r) => r.status === 'skip').length,
    totalTime: Date.now() - startTime,
    overallStatus: results.every((r) => r.status === 'pass' || r.status === 'skip')
      ? 'healthy'
      : 'degraded',
  };

  const response = {
    timestamp: new Date().toISOString(),
    provider: provider === 'all' ? 'all' : provider,
    summary,
    results,
  };

  return new Response(JSON.stringify(response, null, 2), {
    status: summary.overallStatus === 'healthy' ? 200 : 503,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
};
