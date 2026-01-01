/**
 * WHOOP v2 API Adapter
 *
 * Integrates with WHOOP v2 API for athlete biometric data collection.
 * CRITICAL: v2 migration required by October 1, 2025 (v1 endpoints will be removed)
 *
 * Data Sources:
 * - Recovery data (HRV, resting HR, recovery score)
 * - Sleep data (duration, quality, stages)
 * - Workout/Strain data (intensity, duration)
 * - Cycle data (combines recovery + sleep + strain)
 *
 * @see https://developer.whoop.com/api
 */

import { z } from 'zod';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface WHOOPConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  baseUrl?: string;
}

export interface WHOOPTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'Bearer';
  scope: string;
}

// Zod schemas for runtime validation
export const WHOOPRecoverySchema = z.object({
  cycle_id: z.number(),
  sleep_id: z.number(),
  user_id: z.number(),
  created_at: z.string(), // ISO 8601
  updated_at: z.string(),
  score_state: z.enum(['SCORED', 'PENDING_SCORE', 'UNSCORABLE']),
  score: z.object({
    user_calibrating: z.boolean(),
    recovery_score: z.number().min(0).max(100),
    resting_heart_rate: z.number().min(0),
    hrv_rmssd_milli: z.number().min(0),
    spo2_percentage: z.number().min(0).max(100).optional(),
    skin_temp_celsius: z.number().optional(),
  }),
});

export const WHOOPSleepSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  start: z.string(), // ISO 8601
  end: z.string(),
  timezone_offset: z.string(), // "+00:00"
  nap: z.boolean(),
  score_state: z.enum(['SCORED', 'PENDING_SCORE', 'UNSCORABLE']),
  score: z.object({
    stage_summary: z.object({
      total_in_bed_time_milli: z.number(),
      total_awake_time_milli: z.number(),
      total_no_data_time_milli: z.number(),
      total_light_sleep_time_milli: z.number(),
      total_slow_wave_sleep_time_milli: z.number(),
      total_rem_sleep_time_milli: z.number(),
      sleep_cycle_count: z.number(),
      disturbance_count: z.number(),
    }),
    sleep_needed: z.object({
      baseline_milli: z.number(),
      need_from_sleep_debt_milli: z.number(),
      need_from_recent_strain_milli: z.number(),
      need_from_recent_nap_milli: z.number(),
    }),
    respiratory_rate: z.number().optional(),
    sleep_performance_percentage: z.number().min(0).max(100).optional(),
    sleep_consistency_percentage: z.number().min(0).max(100).optional(),
    sleep_efficiency_percentage: z.number().min(0).max(100).optional(),
  }),
});

export const WHOOPWorkoutSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  start: z.string(),
  end: z.string(),
  timezone_offset: z.string(),
  sport_id: z.number(),
  score_state: z.enum(['SCORED', 'PENDING_SCORE', 'UNSCORABLE']),
  score: z.object({
    strain: z.number().min(0).max(21),
    average_heart_rate: z.number(),
    max_heart_rate: z.number(),
    kilojoule: z.number(),
    percent_recorded: z.number().min(0).max(100),
    distance_meter: z.number().optional(),
    altitude_gain_meter: z.number().optional(),
    altitude_change_meter: z.number().optional(),
    zone_duration: z
      .object({
        zone_zero_milli: z.number(),
        zone_one_milli: z.number(),
        zone_two_milli: z.number(),
        zone_three_milli: z.number(),
        zone_four_milli: z.number(),
        zone_five_milli: z.number(),
      })
      .optional(),
  }),
});

export const WHOOPCycleSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  start: z.string(),
  end: z.string().optional(),
  timezone_offset: z.string(),
  score_state: z.enum(['SCORED', 'PENDING_SCORE', 'UNSCORABLE']),
  score: z.object({
    strain: z.number().min(0).max(21),
    kilojoule: z.number(),
    average_heart_rate: z.number(),
    max_heart_rate: z.number(),
  }),
});

// Normalized output types for BSI
export interface NormalizedWearablesReading {
  player_id: string;
  reading_timestamp: Date;
  timezone_offset: number; // minutes from UTC
  metric_type:
    | 'heart_rate'
    | 'hrv_rmssd'
    | 'recovery_score'
    | 'spo2'
    | 'skin_temp'
    | 'strain'
    | 'sleep_performance'
    | 'respiratory_rate';
  metric_value: number;
  metric_unit: 'bpm' | 'ms' | 'score' | '%' | 'celsius' | 'count';
  quality_score: number; // 0.0-1.0
  activity_state: 'resting' | 'sleeping' | 'active' | 'exercising';
  source_session_id: string;
  raw_payload: any;
  data_source: 'whoop_v2';
}

export interface NormalizedDailySummary {
  player_id: string;
  summary_date: Date;
  hrv_rmssd_avg: number | null;
  hrv_rmssd_min: number | null;
  hrv_rmssd_max: number | null;
  hrv_baseline_deviation: number | null;
  resting_hr_avg: number | null;
  resting_hr_min: number | null;
  hr_variability_index: number | null;
  day_strain: number | null;
  recovery_score: number | null;
  sleep_performance_score: number | null;
  total_sleep_minutes: number | null;
  rem_sleep_minutes: number | null;
  deep_sleep_minutes: number | null;
  sleep_efficiency: number | null;
  respiratory_rate_avg: number | null;
  data_completeness: number; // 0.0-1.0
  raw_payload: any;
  data_source: 'whoop_v2';
}

// ============================================================================
// WHOOP V2 API CLIENT
// ============================================================================

export class WHOOPv2Adapter {
  private config: WHOOPConfig;
  private baseUrl: string;
  private rateLimit = {
    requestsPerMinute: 100,
    currentRequests: 0,
    resetTime: Date.now() + 60000,
  };

  constructor(config: WHOOPConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.whoop.com';
  }

  // ==========================================================================
  // OAUTH 2.0 FLOW
  // ==========================================================================

  /**
   * Generate authorization URL for athlete consent flow
   */
  getAuthorizationUrl(state: string, scope?: string[]): string {
    const defaultScope = [
      'read:recovery',
      'read:sleep',
      'read:workout',
      'read:cycles',
      'read:profile',
    ];

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: (scope || defaultScope).join(' '),
      state,
    });

    return `${this.baseUrl}/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access tokens
   */
  async exchangeCodeForTokens(code: string): Promise<WHOOPTokens> {
    const response = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WHOOP OAuth token exchange failed: ${response.status} ${error}`);
    }

    return response.json();
  }

  /**
   * Refresh expired access token
   */
  async refreshAccessToken(refreshToken: string): Promise<WHOOPTokens> {
    const response = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WHOOP token refresh failed: ${response.status} ${error}`);
    }

    return response.json();
  }

  /**
   * Revoke access token (athlete consent revocation)
   */
  async revokeToken(token: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/oauth/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    });

    if (!response.ok) {
      throw new Error(`WHOOP token revocation failed: ${response.status}`);
    }
  }

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================

  /**
   * Get user profile (basic info)
   */
  async getUserProfile(accessToken: string): Promise<any> {
    return this.makeAuthenticatedRequest('/v2/user/profile/basic', accessToken);
  }

  /**
   * Get recovery data for date range
   */
  async getRecoveryData(accessToken: string, startDate: Date, endDate: Date): Promise<any[]> {
    const params = new URLSearchParams({
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    });

    const response = await this.makeAuthenticatedRequest(
      `/v2/recovery?${params.toString()}`,
      accessToken
    );

    return response.records || [];
  }

  /**
   * Get sleep data for date range
   */
  async getSleepData(accessToken: string, startDate: Date, endDate: Date): Promise<any[]> {
    const params = new URLSearchParams({
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    });

    const response = await this.makeAuthenticatedRequest(
      `/v2/sleep?${params.toString()}`,
      accessToken
    );

    return response.records || [];
  }

  /**
   * Get workout/strain data for date range
   */
  async getWorkoutData(accessToken: string, startDate: Date, endDate: Date): Promise<any[]> {
    const params = new URLSearchParams({
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    });

    const response = await this.makeAuthenticatedRequest(
      `/v2/workout?${params.toString()}`,
      accessToken
    );

    return response.records || [];
  }

  /**
   * Get cycle data (combines recovery, sleep, strain)
   * This is the most efficient endpoint for daily summaries
   */
  async getCycleData(accessToken: string, startDate: Date, endDate: Date): Promise<any[]> {
    const params = new URLSearchParams({
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    });

    const response = await this.makeAuthenticatedRequest(
      `/v2/cycle?${params.toString()}`,
      accessToken
    );

    return response.records || [];
  }

  // ==========================================================================
  // DATA NORMALIZATION (to BSI schema)
  // ==========================================================================

  /**
   * Normalize WHOOP recovery data to BSI wearables_readings format
   */
  normalizeRecoveryData(playerId: string, recoveryData: any): NormalizedWearablesReading[] {
    const validated = WHOOPRecoverySchema.parse(recoveryData);
    const readings: NormalizedWearablesReading[] = [];

    const timestamp = new Date(validated.updated_at);
    const qualityScore =
      validated.score_state === 'SCORED'
        ? 1.0
        : validated.score_state === 'PENDING_SCORE'
          ? 0.5
          : 0.0;

    // HRV reading
    readings.push({
      player_id: playerId,
      reading_timestamp: timestamp,
      timezone_offset: -360, // America/Chicago (CDT) offset in minutes; user profiles override
      metric_type: 'hrv_rmssd',
      metric_value: validated.score.hrv_rmssd_milli,
      metric_unit: 'ms',
      quality_score: qualityScore,
      activity_state: 'resting',
      source_session_id: `recovery_${validated.cycle_id}`,
      raw_payload: recoveryData,
      data_source: 'whoop_v2',
    });

    // Resting heart rate
    readings.push({
      player_id: playerId,
      reading_timestamp: timestamp,
      timezone_offset: 0,
      metric_type: 'heart_rate',
      metric_value: validated.score.resting_heart_rate,
      metric_unit: 'bpm',
      quality_score: qualityScore,
      activity_state: 'resting',
      source_session_id: `recovery_${validated.cycle_id}`,
      raw_payload: recoveryData,
      data_source: 'whoop_v2',
    });

    // Recovery score
    readings.push({
      player_id: playerId,
      reading_timestamp: timestamp,
      timezone_offset: 0,
      metric_type: 'recovery_score',
      metric_value: validated.score.recovery_score,
      metric_unit: 'score',
      quality_score: qualityScore,
      activity_state: 'resting',
      source_session_id: `recovery_${validated.cycle_id}`,
      raw_payload: recoveryData,
      data_source: 'whoop_v2',
    });

    // SpO2 (if available)
    if (validated.score.spo2_percentage) {
      readings.push({
        player_id: playerId,
        reading_timestamp: timestamp,
        timezone_offset: 0,
        metric_type: 'spo2',
        metric_value: validated.score.spo2_percentage,
        metric_unit: '%',
        quality_score: qualityScore,
        activity_state: 'resting',
        source_session_id: `recovery_${validated.cycle_id}`,
        raw_payload: recoveryData,
        data_source: 'whoop_v2',
      });
    }

    return readings;
  }

  /**
   * Normalize WHOOP sleep data to BSI format
   */
  normalizeSleepData(playerId: string, sleepData: any): NormalizedWearablesReading[] {
    const validated = WHOOPSleepSchema.parse(sleepData);
    const readings: NormalizedWearablesReading[] = [];

    const timestamp = new Date(validated.end);
    const qualityScore =
      validated.score_state === 'SCORED'
        ? 1.0
        : validated.score_state === 'PENDING_SCORE'
          ? 0.5
          : 0.0;

    // Sleep performance
    if (validated.score.sleep_performance_percentage) {
      readings.push({
        player_id: playerId,
        reading_timestamp: timestamp,
        timezone_offset: this.parseTimezoneOffset(validated.timezone_offset),
        metric_type: 'sleep_performance',
        metric_value: validated.score.sleep_performance_percentage,
        metric_unit: 'score',
        quality_score: qualityScore,
        activity_state: 'sleeping',
        source_session_id: `sleep_${validated.id}`,
        raw_payload: sleepData,
        data_source: 'whoop_v2',
      });
    }

    // Respiratory rate
    if (validated.score.respiratory_rate) {
      readings.push({
        player_id: playerId,
        reading_timestamp: timestamp,
        timezone_offset: this.parseTimezoneOffset(validated.timezone_offset),
        metric_type: 'respiratory_rate',
        metric_value: validated.score.respiratory_rate,
        metric_unit: 'count',
        quality_score: qualityScore,
        activity_state: 'sleeping',
        source_session_id: `sleep_${validated.id}`,
        raw_payload: sleepData,
        data_source: 'whoop_v2',
      });
    }

    return readings;
  }

  /**
   * Normalize WHOOP cycle data to BSI daily summary format
   */
  normalizeCycleDataToDailySummary(
    playerId: string,
    cycleData: any,
    recoveryData?: any,
    sleepData?: any
  ): NormalizedDailySummary {
    const cycleStart = new Date(cycleData.start);
    const summaryDate = new Date(cycleStart.toISOString().split('T')[0]); // Date only

    let dataCompleteness = 0.5; // Base: cycle data available
    if (recoveryData && recoveryData.score_state === 'SCORED') dataCompleteness += 0.25;
    if (sleepData && sleepData.score_state === 'SCORED') dataCompleteness += 0.25;

    return {
      player_id: playerId,
      summary_date: summaryDate,
      hrv_rmssd_avg: recoveryData?.score?.hrv_rmssd_milli || null,
      hrv_rmssd_min: null, // Not provided by WHOOP v2
      hrv_rmssd_max: null,
      hrv_baseline_deviation: null, // Calculated separately from historical baseline
      resting_hr_avg: recoveryData?.score?.resting_heart_rate || null,
      resting_hr_min: null,
      hr_variability_index: null, // Calculated separately
      day_strain: cycleData.score?.strain || null,
      recovery_score: recoveryData?.score?.recovery_score || null,
      sleep_performance_score: sleepData?.score?.sleep_performance_percentage || null,
      total_sleep_minutes: sleepData
        ? Math.round(sleepData.score.stage_summary.total_in_bed_time_milli / 60000)
        : null,
      rem_sleep_minutes: sleepData
        ? Math.round(sleepData.score.stage_summary.total_rem_sleep_time_milli / 60000)
        : null,
      deep_sleep_minutes: sleepData
        ? Math.round(sleepData.score.stage_summary.total_slow_wave_sleep_time_milli / 60000)
        : null,
      sleep_efficiency: sleepData?.score?.sleep_efficiency_percentage || null,
      respiratory_rate_avg: sleepData?.score?.respiratory_rate || null,
      data_completeness: dataCompleteness,
      raw_payload: { cycle: cycleData, recovery: recoveryData, sleep: sleepData },
      data_source: 'whoop_v2',
    };
  }

  // ==========================================================================
  // WEBHOOK MANAGEMENT
  // ==========================================================================

  /**
   * Create webhook subscription for real-time updates
   */
  async createWebhook(
    accessToken: string,
    webhookUrl: string,
    events: string[] = ['recovery.updated', 'sleep.updated', 'workout.updated', 'cycle.updated']
  ): Promise<any> {
    const response = await fetch(`${this.baseUrl}/v2/webhook`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        events,
      }),
    });

    if (!response.ok) {
      throw new Error(`WHOOP webhook creation failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Verify webhook signature (HMAC validation)
   */
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    // WHOOP uses HMAC-SHA256 for webhook verification
    const crypto = require('crypto');
    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Make authenticated request with rate limiting and retry logic
   */
  private async makeAuthenticatedRequest(
    endpoint: string,
    accessToken: string,
    retries = 3
  ): Promise<any> {
    await this.checkRateLimit();

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      this.rateLimit.currentRequests++;

      if (response.status === 429) {
        // Rate limit exceeded
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
        if (retries > 0) {
          await this.sleep(retryAfter * 1000);
          return this.makeAuthenticatedRequest(endpoint, accessToken, retries - 1);
        }
        throw new Error('WHOOP API rate limit exceeded');
      }

      if (response.status === 401) {
        throw new Error('WHOOP access token expired or invalid');
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`WHOOP API request failed: ${response.status} ${error}`);
      }

      return response.json();
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        await this.sleep(2000 * (4 - retries)); // Exponential backoff
        return this.makeAuthenticatedRequest(endpoint, accessToken, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Check and enforce rate limits (100 requests/minute)
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();

    if (now > this.rateLimit.resetTime) {
      // Reset window
      this.rateLimit.currentRequests = 0;
      this.rateLimit.resetTime = now + 60000;
    }

    if (this.rateLimit.currentRequests >= this.rateLimit.requestsPerMinute) {
      const waitTime = this.rateLimit.resetTime - now;
      await this.sleep(waitTime);
      this.rateLimit.currentRequests = 0;
      this.rateLimit.resetTime = Date.now() + 60000;
    }
  }

  /**
   * Parse timezone offset from "+00:00" to minutes
   */
  private parseTimezoneOffset(offset: string): number {
    const match = offset.match(/([+-])(\d{2}):(\d{2})/);
    if (!match) return 0;

    const sign = match[1] === '+' ? 1 : -1;
    const hours = parseInt(match[2], 10);
    const minutes = parseInt(match[3], 10);

    return sign * (hours * 60 + minutes);
  }

  /**
   * Check if error is retryable (network errors, 5xx)
   */
  private isRetryableError(error: any): boolean {
    if (error.message?.includes('fetch failed')) return true;
    if (error.message?.includes('ECONNRESET')) return true;
    if (error.message?.includes('500')) return true;
    if (error.message?.includes('502')) return true;
    if (error.message?.includes('503')) return true;
    return false;
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============================================================================
// FACTORY & EXPORTS
// ============================================================================

// Helper to safely access process.env in both Node.js and Workers
const getProcessEnv = (key: string): string | undefined =>
  typeof process !== 'undefined' ? process.env?.[key] : undefined;

/**
 * Create WHOOP v2 adapter instance from environment variables
 */
export function createWHOOPAdapter(config?: Partial<WHOOPConfig>): WHOOPv2Adapter {
  const defaultConfig: WHOOPConfig = {
    clientId: getProcessEnv('WHOOP_CLIENT_ID') || '',
    clientSecret: getProcessEnv('WHOOP_CLIENT_SECRET') || '',
    redirectUri:
      getProcessEnv('WHOOP_REDIRECT_URI') || 'http://localhost:3000/api/auth/whoop/callback',
  };

  return new WHOOPv2Adapter({ ...defaultConfig, ...config });
}

export default WHOOPv2Adapter;
