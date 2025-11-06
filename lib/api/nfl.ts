import { apiCache, cacheMetrics } from '../utils/cache';
import { ApiError, ErrorCode, ErrorHandler, CircuitBreaker, DEFAULT_FALLBACKS } from '../utils/errors';

const DEFAULT_TEAM_ID = '10'; // Tennessee Titans
const CACHE_TTL = 30000; // 30 seconds for NFL data
const nflCircuitBreaker = new CircuitBreaker();

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
        `NFL API unavailable (${response.status})`,
        response.status
      );
    } else if (response.status === 404) {
      throw new ApiError(
        ErrorCode.INVALID_RESPONSE,
        'Requested NFL data not found',
        response.status
      );
    } else {
      throw new ApiError(
        ErrorCode.INVALID_RESPONSE,
        `NFL API request failed with ${response.status}: ${body}`,
        response.status
      );
    }
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new ApiError(
      ErrorCode.INVALID_RESPONSE,
      'Failed to parse NFL API response',
      response.status
    );
  }
}

// NFL Team Response Type based on ESPN API structure
export interface NflTeamResponse {
  team: {
    id: string;
    name: string;
    abbreviation: string;
    displayName: string;
    location: string;
    color: string;
    alternateColor: string;
    logo: string;
    record?: {
      items: Array<{
        description: string;
        type: string;
        summary: string;
        stats: Array<{
          name: string;
          value: number;
        }>;
      }>;
    };
    venue?: {
      id: string;
      fullName: string;
      address: {
        city: string;
        state: string;
      };
    };
    groups?: {
      parent?: {
        name: string;
      };
    };
  };
  analytics: {
    dataSource: string;
    lastUpdated: string;
    truthLabel: string;
  };
}

export async function getNflTeam(
  teamId: string = DEFAULT_TEAM_ID,
  apiBase: string = resolveDefaultApiBase(),
  fetcher: Fetcher = fetch,
): Promise<NflTeamResponse> {
  const url = buildUrl(apiBase, 'nfl', { teamId });
  const cacheKey = `nfl-team-${teamId}`;

  // Check cache first
  const cached = apiCache.get<NflTeamResponse>(cacheKey);
  if (cached !== null) {
    cacheMetrics.recordHit();
    return cached;
  }

  cacheMetrics.recordMiss();

  // Use circuit breaker and error handler
  return ErrorHandler.handleWithFallback(
    async () => {
      return nflCircuitBreaker.execute(async () => {
        const response = await fetcher(url, { method: 'GET' });
        const data = await handleResponse<NflTeamResponse>(response);

        // Cache successful response
        apiCache.set(cacheKey, data, CACHE_TTL);

        return data;
      });
    },
    () => {
      // Try to get stale cached data as fallback
      const staleCached = apiCache.get<NflTeamResponse>(cacheKey);
      return staleCached || (DEFAULT_FALLBACKS.NFL.team as unknown as NflTeamResponse);
    },
    {
      retries: 3,
      retryDelay: 1000,
      onError: (error) => {
        ErrorHandler.logError(error, {
          operation: 'getNflTeam',
          sport: 'NFL',
          teamId,
          url,
        });
      },
    }
  ) as Promise<NflTeamResponse>;
}

// NFL Standings Response Type based on ESPN API structure
export interface NflStandingsResponse {
  season: number;
  lastUpdated: string;
  standings: Array<{
    conference: string;
    division: string;
    teams: Array<{
      teamId: string;
      name: string;
      abbreviation: string;
      wins: number;
      losses: number;
      ties: number;
      winPercentage: number;
      divisionRank: number;
      conferenceRank: number;
      playoffSeed?: number;
    }>;
  }>;
  dataSource: string;
  truthLabel: string;
}

export async function getNflStandings(
  apiBase: string = resolveDefaultApiBase(),
  fetcher: Fetcher = fetch,
): Promise<NflStandingsResponse> {
  const url = buildUrl(apiBase, 'nfl-standings');
  const cacheKey = 'nfl-standings';

  // Check cache first
  const cached = apiCache.get<NflStandingsResponse>(cacheKey);
  if (cached !== null) {
    cacheMetrics.recordHit();
    return cached;
  }

  cacheMetrics.recordMiss();

  // Use circuit breaker and error handler
  return ErrorHandler.handleWithFallback(
    async () => {
      return nflCircuitBreaker.execute(async () => {
        const response = await fetcher(url, { method: 'GET' });
        const data = await handleResponse<NflStandingsResponse>(response);

        // Cache successful response
        apiCache.set(cacheKey, data, CACHE_TTL);

        return data;
      });
    },
    () => {
      // Try to get stale cached data as fallback
      const staleCached = apiCache.get<NflStandingsResponse>(cacheKey);
      return staleCached || (DEFAULT_FALLBACKS.NFL.standings as unknown as NflStandingsResponse);
    },
    {
      retries: 3,
      retryDelay: 1000,
      onError: (error) => {
        ErrorHandler.logError(error, {
          operation: 'getNflStandings',
          sport: 'NFL',
          url,
        });
      },
    }
  ) as Promise<NflStandingsResponse>;
}