/**
 * Shared Adapter Utilities
 *
 * Common utilities used across all data adapters.
 * Provides:
 * - Response transformation helpers
 * - Date/time formatting
 * - Error handling utilities
 * - Rate limiting helpers
 * - Cache key generation
 */

import type {
  UnifiedGame,
  UnifiedTeam,
  UnifiedSportKey,
  UnifiedGameStatus,
  TeamRecord,
} from '../types/adapters';

// ============================================================================
// RESPONSE TRANSFORMATION
// ============================================================================

/**
 * Create a unified team from various provider formats
 */
export function createUnifiedTeam(input: {
  id: string | number;
  name?: string;
  displayName?: string;
  fullName?: string;
  abbreviation?: string;
  shortName?: string;
  location?: string;
  nickname?: string;
  conference?: string;
  division?: string;
  color?: string;
  alternateColor?: string;
  logo?: string;
  record?: string | TeamRecord;
  ranking?: number;
}): UnifiedTeam {
  const name = input.name || input.displayName || input.fullName || 'Unknown';

  return {
    id: String(input.id),
    name,
    displayName: input.displayName || input.fullName || name,
    abbreviation: input.abbreviation || name.substring(0, 3).toUpperCase(),
    shortName: input.shortName || input.abbreviation,
    nickname: input.nickname,
    location: input.location,
    conference: input.conference,
    division: input.division,
    color: input.color,
    alternateColor: input.alternateColor,
    logo: input.logo,
    record: typeof input.record === 'string' ? parseRecord(input.record) : input.record,
    ranking: input.ranking,
  };
}

/**
 * Create a unified game from various provider formats
 */
export function createUnifiedGame(input: {
  id: string | number;
  sport: UnifiedSportKey;
  scheduledAt: string | Date;
  status: string | UnifiedGameStatus;
  homeTeam: UnifiedTeam | Partial<UnifiedTeam>;
  awayTeam: UnifiedTeam | Partial<UnifiedTeam>;
  homeScore?: number | null;
  awayScore?: number | null;
  homeRanking?: number;
  awayRanking?: number;
  venue?: string;
  venueCity?: string;
  broadcast?: string;
  conference?: string;
  isConferenceGame?: boolean;
  week?: number;
  postseason?: boolean;
  provider: string;
  sportData?: any;
}): UnifiedGame {
  return {
    id: String(input.id),
    sport: input.sport,
    scheduledAt:
      input.scheduledAt instanceof Date
        ? input.scheduledAt.toISOString()
        : input.scheduledAt,
    status: normalizeStatus(input.status),
    homeTeam: ensureUnifiedTeam(input.homeTeam),
    awayTeam: ensureUnifiedTeam(input.awayTeam),
    homeScore: input.homeScore ?? null,
    awayScore: input.awayScore ?? null,
    homeRanking: input.homeRanking,
    awayRanking: input.awayRanking,
    venue: input.venue,
    venueCity: input.venueCity,
    broadcast: input.broadcast,
    conference: input.conference,
    isConferenceGame: input.isConferenceGame,
    week: input.week,
    postseason: input.postseason,
    provider: input.provider,
    fetchedAt: new Date().toISOString(),
    sportData: input.sportData,
  };
}

function ensureUnifiedTeam(team: UnifiedTeam | Partial<UnifiedTeam>): UnifiedTeam {
  if ('id' in team && 'name' in team && 'displayName' in team && 'abbreviation' in team) {
    return team as UnifiedTeam;
  }

  return createUnifiedTeam({
    id: team.id || 'unknown',
    name: team.name,
    displayName: team.displayName,
    abbreviation: team.abbreviation,
    shortName: team.shortName,
    location: team.location,
    conference: team.conference,
    color: team.color,
    logo: team.logo,
    ranking: team.ranking,
  });
}

// ============================================================================
// STATUS NORMALIZATION
// ============================================================================

/**
 * Normalize game status from various provider formats
 */
export function normalizeStatus(status: string | UnifiedGameStatus): UnifiedGameStatus {
  if (typeof status !== 'string') return status;

  const normalized = status.toLowerCase().trim();

  // Final states
  if (
    normalized.includes('final') ||
    normalized === 'f' ||
    normalized === 'completed' ||
    normalized === 'post'
  ) {
    return 'FINAL';
  }

  // Live states
  if (
    normalized.includes('live') ||
    normalized.includes('in progress') ||
    normalized.includes('in_progress') ||
    normalized === 'in' ||
    /^\d+(st|nd|rd|th)/.test(normalized) ||  // "1st", "2nd", etc.
    /^(top|bot|bottom)\s*\d+/.test(normalized)  // "Top 5", "Bot 7"
  ) {
    return 'LIVE';
  }

  // Postponed
  if (normalized.includes('postponed') || normalized === 'ppd') {
    return 'POSTPONED';
  }

  // Cancelled
  if (normalized.includes('cancel') || normalized.includes('cancelled')) {
    return 'CANCELLED';
  }

  // Delayed
  if (normalized.includes('delay')) {
    return 'DELAYED';
  }

  // Default to scheduled
  return 'SCHEDULED';
}

// ============================================================================
// RECORD PARSING
// ============================================================================

/**
 * Parse a record string into structured format
 */
export function parseRecord(recordStr: string): TeamRecord | undefined {
  if (!recordStr) return undefined;

  // Handle formats like "45-12", "45-12-2", "45-12, 18-6"
  const overallMatch = recordStr.match(/(\d+)-(\d+)(?:-(\d+))?/);
  if (!overallMatch) return undefined;

  const wins = parseInt(overallMatch[1], 10);
  const losses = parseInt(overallMatch[2], 10);
  const ties = overallMatch[3] ? parseInt(overallMatch[3], 10) : undefined;

  // Try to find conference record
  const confMatch = recordStr.match(/,\s*(\d+)-(\d+)/);

  return {
    overall: `${wins}-${losses}${ties !== undefined ? `-${ties}` : ''}`,
    conference: confMatch ? `${confMatch[1]}-${confMatch[2]}` : undefined,
    wins,
    losses,
    ties,
    winPct: wins + losses > 0 ? wins / (wins + losses) : 0,
  };
}

// ============================================================================
// DATE/TIME UTILITIES
// ============================================================================

/**
 * Format date for API requests (YYYYMMDD)
 */
export function formatDateForApi(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Format date with slashes (YYYY/MM/DD)
 */
export function formatDateWithSlashes(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

/**
 * Parse YYYYMMDD to Date
 */
export function parseDateString(dateStr: string): Date {
  const year = parseInt(dateStr.substring(0, 4), 10);
  const month = parseInt(dateStr.substring(4, 6), 10) - 1;
  const day = parseInt(dateStr.substring(6, 8), 10);
  return new Date(year, month, day);
}

/**
 * Get current season year for a sport
 */
export function getCurrentSeasonYear(sport: UnifiedSportKey): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Football and basketball seasons span calendar years
  if (sport === 'ncaaf' || sport === 'nfl') {
    // Football: Aug-Feb
    return month < 3 ? year - 1 : year;
  }

  if (sport === 'ncaab' || sport === 'wcbb' || sport === 'nba' || sport === 'wnba') {
    // Basketball: Nov-Jun
    return month < 7 ? year - 1 : year;
  }

  if (sport === 'nhl') {
    // Hockey: Oct-Jun
    return month < 7 ? year - 1 : year;
  }

  // Baseball: Feb-Nov (same calendar year)
  return year;
}

/**
 * Get current week for football
 */
export function getCurrentFootballWeek(season: number = getCurrentSeasonYear('ncaaf')): number {
  const now = new Date();
  const seasonStart = new Date(season, 7, 25); // August 25

  if (now < seasonStart) return 0;

  const diffMs = now.getTime() - seasonStart.getTime();
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));

  return Math.min(Math.max(diffWeeks + 1, 1), 15);
}

// ============================================================================
// CACHE KEY UTILITIES
// ============================================================================

/**
 * Generate a cache key for adapter requests
 */
export function generateCacheKey(
  provider: string,
  sport: UnifiedSportKey,
  type: string,
  ...params: (string | number | undefined)[]
): string {
  const parts = [provider, sport, type, ...params.filter(Boolean)];
  return parts.join(':').toLowerCase();
}

/**
 * Cache TTL configurations (in seconds)
 */
export const CACHE_TTLS = {
  live: 30,           // Live scores
  scheduled: 300,     // Scheduled games (5 min)
  final: 3600,        // Final scores (1 hour)
  standings: 300,     // Standings (5 min)
  rankings: 1800,     // Rankings (30 min)
  team: 86400,        // Team info (24 hours)
  roster: 3600,       // Roster (1 hour)
  player: 3600,       // Player info (1 hour)
} as const;

/**
 * Get appropriate cache TTL for game status
 */
export function getCacheTTLForGame(status: UnifiedGameStatus): number {
  switch (status) {
    case 'LIVE':
      return CACHE_TTLS.live;
    case 'FINAL':
      return CACHE_TTLS.final;
    default:
      return CACHE_TTLS.scheduled;
  }
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Adapter-specific error class
 */
export class AdapterError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly statusCode?: number,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'AdapterError';
  }
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof AdapterError) {
    return error.retryable;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('econnreset') ||
      message.includes('network') ||
      message.includes('503') ||
      message.includes('429')
    );
  }

  return false;
}

/**
 * Wrap fetch with timeout and error handling
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number; provider?: string } = {}
): Promise<Response> {
  const { timeout = 10000, provider = 'unknown', ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new AdapterError(
        `HTTP ${response.status}: ${response.statusText}`,
        provider,
        response.status,
        response.status >= 500 || response.status === 429
      );
    }

    return response;
  } catch (error) {
    if (error instanceof AdapterError) throw error;

    const message = error instanceof Error ? error.message : 'Unknown error';
    const isTimeout = message.includes('abort');

    throw new AdapterError(
      isTimeout ? 'Request timeout' : message,
      provider,
      undefined,
      isTimeout
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================================================
// RATE LIMITING
// ============================================================================

export interface RateLimiter {
  canMakeRequest(): boolean;
  recordRequest(): void;
  getRemainingRequests(): number;
  getResetTime(): number;
}

/**
 * Create a simple rate limiter
 */
export function createRateLimiter(
  maxRequests: number,
  windowMs: number
): RateLimiter {
  let requestCount = 0;
  let windowStart = Date.now();

  return {
    canMakeRequest(): boolean {
      const now = Date.now();
      if (now - windowStart > windowMs) {
        // Reset window
        requestCount = 0;
        windowStart = now;
      }
      return requestCount < maxRequests;
    },

    recordRequest(): void {
      requestCount++;
    },

    getRemainingRequests(): number {
      const now = Date.now();
      if (now - windowStart > windowMs) {
        return maxRequests;
      }
      return Math.max(0, maxRequests - requestCount);
    },

    getResetTime(): number {
      return windowStart + windowMs;
    },
  };
}

// ============================================================================
// RETRY UTILITIES
// ============================================================================

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: unknown) => boolean;
}

/**
 * Execute a function with exponential backoff retry
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    shouldRetry = isRetryableError,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Exponential backoff with jitter
      const delay = Math.min(
        baseDelayMs * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelayMs
      );

      console.warn(
        `[Retry] Attempt ${attempt + 1}/${maxRetries} failed, retrying in ${Math.round(delay)}ms`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate sport key
 */
export function isValidSportKey(sport: unknown): sport is UnifiedSportKey {
  const validSports: UnifiedSportKey[] = [
    'ncaaf', 'ncaab', 'wcbb', 'nfl', 'nba', 'wnba', 'mlb', 'cbb', 'nhl',
  ];
  return typeof sport === 'string' && validSports.includes(sport as UnifiedSportKey);
}

/**
 * Sanitize team name for comparison
 */
export function sanitizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Compare team names for matching
 */
export function teamsMatch(name1: string, name2: string): boolean {
  return sanitizeTeamName(name1) === sanitizeTeamName(name2);
}
