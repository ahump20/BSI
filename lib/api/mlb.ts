import { apiCache, cacheMetrics } from '../utils/cache';
import { ApiError, ErrorCode, ErrorHandler, CircuitBreaker, DEFAULT_FALLBACKS } from '../utils/errors';

const DEFAULT_TEAM_ID = '138';
const CACHE_TTL = 30000; // 30 seconds for MLB data
const mlbCircuitBreaker = new CircuitBreaker();

export interface Fetcher {
  (input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

function resolveDefaultApiBase(): string {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.hostname === 'localhost'
      ? 'http://localhost:3000/api'
      : 'https://blazesportsintel.com/api';
  }

  return 'https://blazesportsintel.com/api';
}

function buildUrl(base: string, path: string, query: Record<string, string> = {}): string {
  const url = new URL(path, base.endsWith('/') ? base : `${base}/`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text();

    // Handle specific HTTP status codes
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new ApiError(
        ErrorCode.RATE_LIMITED,
        'Rate limit exceeded',
        response.status,
        retryAfter ? parseInt(retryAfter) * 1000 : undefined
      );
    } else if (response.status >= 500) {
      throw new ApiError(
        ErrorCode.API_UNAVAILABLE,
        `MLB API unavailable (${response.status})`,
        response.status
      );
    } else if (response.status === 404) {
      throw new ApiError(
        ErrorCode.INVALID_RESPONSE,
        'Requested data not found',
        response.status
      );
    } else {
      throw new ApiError(
        ErrorCode.INVALID_RESPONSE,
        `MLB API request failed with ${response.status}: ${body}`,
        response.status
      );
    }
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new ApiError(
      ErrorCode.INVALID_RESPONSE,
      'Failed to parse MLB API response',
      response.status
    );
  }
}

export async function getMlbTeam(
  teamId: string = DEFAULT_TEAM_ID,
  apiBase: string = resolveDefaultApiBase(),
  fetcher: Fetcher = fetch,
): Promise<unknown> {
  const url = buildUrl(apiBase, 'mlb', { teamId });
  const cacheKey = `mlb-team-${teamId}`;

  // Check cache first
  const cached = apiCache.get(cacheKey);
  if (cached !== null) {
    cacheMetrics.recordHit();
    console.log(`[Cache HIT] MLB team ${teamId}`);
    return cached;
  }

  cacheMetrics.recordMiss();
  console.log(`[Cache MISS] MLB team ${teamId}`);

  // Use circuit breaker and error handler
  return ErrorHandler.handleWithFallback(
    async () => {
      return mlbCircuitBreaker.execute(async () => {
        const response = await fetcher(url, { method: 'GET' });
        const data = await handleResponse(response);

        // Cache successful response
        apiCache.set(cacheKey, data, CACHE_TTL);

        return data;
      });
    },
    () => {
      // Try to get stale cached data as fallback
      const staleCached = apiCache.get(cacheKey);
      return staleCached || DEFAULT_FALLBACKS.MLB.team;
    },
    {
      retries: 3,
      retryDelay: 1000,
      onError: (error) => {
        ErrorHandler.logError(error, {
          operation: 'getMlbTeam',
          sport: 'MLB',
          teamId,
          url,
        });
      },
    }
  );
}

// Define the expected structure of the MLB standings API response
export interface MlbStandingsResponse {
  season: number;
  lastUpdated: string;
  standings: Array<{
    division: string;
    teams: Array<{
      teamId: string;
      name: string;
      wins: number;
      losses: number;
      pct: string;
      gb: string;
    }>;
  }>;
}

export async function getMlbStandings(
  apiBase: string = resolveDefaultApiBase(),
  fetcher: Fetcher = fetch,
): Promise<MlbStandingsResponse> {
  const url = buildUrl(apiBase, 'mlb-standings');
  const cacheKey = 'mlb-standings';

  // Check cache first
  const cached = apiCache.get<MlbStandingsResponse>(cacheKey);
  if (cached !== null) {
    cacheMetrics.recordHit();
    console.log('[Cache HIT] MLB standings');
    return cached;
  }

  cacheMetrics.recordMiss();
  console.log('[Cache MISS] MLB standings');

  // Use circuit breaker and error handler
  return ErrorHandler.handleWithFallback(
    async () => {
      return mlbCircuitBreaker.execute(async () => {
        const response = await fetcher(url, { method: 'GET' });
        const data = await handleResponse<MlbStandingsResponse>(response);

        // Cache successful response
        apiCache.set(cacheKey, data, CACHE_TTL);

        return data;
      });
    },
    () => {
      // Try to get stale cached data as fallback
      const staleCached = apiCache.get<MlbStandingsResponse>(cacheKey);
      return staleCached || (DEFAULT_FALLBACKS.MLB.standings as unknown as MlbStandingsResponse);
    },
    {
      retries: 3,
      retryDelay: 1000,
      onError: (error) => {
        ErrorHandler.logError(error, {
          operation: 'getMlbStandings',
          sport: 'MLB',
          url,
        });
      },
    }
  ) as Promise<MlbStandingsResponse>;
}
