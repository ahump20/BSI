/**
 * Sportradar MLB v8 API Client
 *
 * Typed client for the Sportradar MLB Trial/Production API.
 * Auth: x-api-key header (NOT query param).
 * Base: https://api.sportradar.com/mlb/{accessLevel}/v8/en
 *
 * Rate limiting: Built-in 1 QPS throttle for trial access.
 * Pattern follows SportsDataIOClient in sportsdataio-api.ts.
 */

import type {
  SportradarClientConfig,
  SportradarDailySchedule,
  SportradarPBPResponse,
  SportradarPitchMetrics,
  SportradarGameSummary,
  SportradarChangesResponse,
} from './sportradar-types';

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export class SportradarError extends Error {
  constructor(
    message: string,
    public status: number,
    public endpoint: string,
  ) {
    super(message);
    this.name = 'SportradarError';
  }
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

const TIMEOUT_MS = 12_000;

export class SportradarMLBClient {
  private apiKey: string;
  private accessLevel: 'trial' | 'production';
  private base: string;
  private lastRequestTime = 0;
  private minIntervalMs: number;

  constructor(config: SportradarClientConfig) {
    this.apiKey = config.apiKey;
    this.accessLevel = config.accessLevel;
    this.base = `https://api.sportradar.com/mlb/${config.accessLevel}/v8/en`;
    // Trial: hard 1 QPS limit. Production: 10 QPS.
    this.minIntervalMs = config.accessLevel === 'trial' ? 1100 : 100;
  }

  // -------------------------------------------------------------------------
  // Rate-limited fetch
  // -------------------------------------------------------------------------

  private async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minIntervalMs) {
      await new Promise((r) => setTimeout(r, this.minIntervalMs - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    await this.throttle();

    const url = `${this.base}/${endpoint}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        headers: {
          'x-api-key': this.apiKey,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new SportradarError(
          `Sportradar ${res.status}: ${res.statusText}`,
          res.status,
          endpoint,
        );
      }

      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  // -------------------------------------------------------------------------
  // Endpoints
  // -------------------------------------------------------------------------

  /**
   * Daily schedule — returns game IDs for a given date.
   * Endpoint: /games/{year}/{month}/{day}/schedule.json
   */
  async getDailySchedule(year: number, month: number, day: number): Promise<SportradarDailySchedule> {
    const m = String(month).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return this.fetch<SportradarDailySchedule>(`games/${year}/${m}/${d}/schedule.json`);
  }

  /**
   * Play-by-play — full PBP with pitch events for a game.
   * Endpoint: /games/{gameId}/pbp.json
   */
  async getPlayByPlay(gameId: string): Promise<SportradarPBPResponse> {
    return this.fetch<SportradarPBPResponse>(`games/${gameId}/pbp.json`);
  }

  /**
   * Pitch metrics — per-pitch velocity, type, outcome for a game.
   * Endpoint: /games/{gameId}/pitch_metrics.json
   */
  async getPitchMetrics(gameId: string): Promise<SportradarPitchMetrics> {
    return this.fetch<SportradarPitchMetrics>(`games/${gameId}/pitch_metrics.json`);
  }

  /**
   * Game summary — lineups + stats.
   * Endpoint: /games/{gameId}/summary.json
   */
  async getGameSummary(gameId: string): Promise<SportradarGameSummary> {
    return this.fetch<SportradarGameSummary>(`games/${gameId}/summary.json`);
  }

  /**
   * Changes — delta detection for corrections/updates.
   * Endpoint: /league/{year}/{month}/{day}/changes.json
   */
  async getChanges(year: number, month: number, day: number): Promise<SportradarChangesResponse> {
    const m = String(month).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return this.fetch<SportradarChangesResponse>(`league/${year}/${m}/${d}/changes.json`);
  }
}
