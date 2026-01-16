/**
 * Time Alignment Utilities
 *
 * Synchronizes wearables data (sampled every 1-60 minutes) with discrete
 * game events (sub-second resolution).
 *
 * Challenges:
 * - Wearables data is sparse and asynchronous
 * - Game events require precise timestamps (UTC)
 * - Different timezones between athlete location and game venue
 * - Data quality varies (missing readings, sync delays)
 *
 * Strategies:
 * 1. Pre-game baseline: Use morning data (6am-12pm local time)
 * 2. Window matching: Find closest reading within ±N hours
 * 3. Interpolation: Linear interpolation for missing data
 * 4. Quality scoring: Penalize large time deltas
 */

import { DateTime } from 'luxon'; // For robust timezone handling

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface WearablesReading {
  reading_id?: string;
  player_id: string;
  reading_timestamp: Date;
  timezone_offset: number; // minutes from UTC
  metric_type: string;
  metric_value: number;
  quality_score: number;
}

export interface GameEvent {
  event_id?: string;
  game_id: string;
  player_id: string;
  event_timestamp: Date; // UTC
  event_type: string;
}

export interface TimeAlignedData {
  game_event_id: string;
  game_event_timestamp: Date; // UTC
  wearable_reading_id: string | null;
  wearable_reading_timestamp: Date | null; // UTC
  time_delta_minutes: number; // Absolute difference
  interpolated: boolean;
  alignment_quality_score: number; // 0.0-1.0
  hrv_value: number | null;
  recovery_score: number | null;
  heart_rate: number | null;
  sleep_performance: number | null;
  strain: number | null;
}

export interface AlignmentConfig {
  lookbackHours: number; // How far back to search for readings (default: 24)
  maxTimeDeltaMinutes: number; // Maximum acceptable time difference (default: 120)
  enableInterpolation: boolean; // Allow linear interpolation (default: true)
  preferPregameData: boolean; // Prefer morning readings (default: true)
  qualityThreshold: number; // Minimum wearable quality score (default: 0.3)
}

export interface PregameBaseline {
  player_id: string;
  game_date: Date;
  hrv_avg: number | null;
  hrv_baseline_deviation: number | null; // % from 30-day baseline
  recovery_score: number | null;
  sleep_performance: number | null;
  resting_hr: number | null;
  strain: number | null;
  data_completeness: number; // 0.0-1.0
}

// ============================================================================
// TIME ALIGNMENT CLASS
// ============================================================================

export class TimeAlignmentService {
  private config: AlignmentConfig;

  constructor(config: Partial<AlignmentConfig> = {}) {
    this.config = {
      lookbackHours: config.lookbackHours || 24,
      maxTimeDeltaMinutes: config.maxTimeDeltaMinutes || 120,
      enableInterpolation: config.enableInterpolation !== false,
      preferPregameData: config.preferPregameData !== false,
      qualityThreshold: config.qualityThreshold || 0.3,
    };
  }

  // ==========================================================================
  // PRE-GAME BASELINE EXTRACTION
  // ==========================================================================

  /**
   * Extract pre-game baseline wearables data (morning of game, 6am-12pm local time)
   * This provides the most reliable biometric snapshot before game stress
   */
  async extractPregameBaseline(
    playerId: string,
    gameDate: Date,
    playerTimezone: string, // IANA timezone (e.g., "America/New_York")
    wearablesReadings: WearablesReading[]
  ): Promise<PregameBaseline> {
    // Convert game date to player's local timezone
    const gameDateLocal = DateTime.fromJSDate(gameDate).setZone(playerTimezone);

    // Define pre-game window: 6am-12pm on game day
    const windowStart = gameDateLocal.set({ hour: 6, minute: 0, second: 0 }).toJSDate();
    const windowEnd = gameDateLocal.set({ hour: 12, minute: 0, second: 0 }).toJSDate();

    // Filter readings within window
    const pregameReadings = wearablesReadings.filter((r) => {
      const readingTime = r.reading_timestamp;
      return (
        readingTime >= windowStart &&
        readingTime <= windowEnd &&
        r.quality_score >= this.config.qualityThreshold
      );
    });

    // Calculate baseline metrics
    const hrvReadings = pregameReadings.filter((r) => r.metric_type === 'hrv_rmssd');
    const recoveryReadings = pregameReadings.filter((r) => r.metric_type === 'recovery_score');
    const sleepReadings = pregameReadings.filter((r) => r.metric_type === 'sleep_performance');
    const hrReadings = pregameReadings.filter((r) => r.metric_type === 'heart_rate');
    const strainReadings = pregameReadings.filter((r) => r.metric_type === 'strain');

    // Calculate 30-day HRV baseline (for deviation)
    const thirtyDaysAgo = new Date(gameDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    const historicalHrv = wearablesReadings.filter(
      (r) =>
        r.metric_type === 'hrv_rmssd' &&
        r.reading_timestamp >= thirtyDaysAgo &&
        r.reading_timestamp < gameDate &&
        r.quality_score >= this.config.qualityThreshold
    );
    const historicalHrvAvg = this.average(historicalHrv.map((r) => r.metric_value));

    const pregameHrvAvg = this.average(hrvReadings.map((r) => r.metric_value));
    const hrvDeviation =
      historicalHrvAvg && pregameHrvAvg
        ? ((pregameHrvAvg - historicalHrvAvg) / historicalHrvAvg) * 100
        : null;

    const dataCompleteness = this.calculateDataCompleteness([
      hrvReadings,
      recoveryReadings,
      sleepReadings,
      hrReadings,
      strainReadings,
    ]);

    return {
      player_id: playerId,
      game_date: gameDate,
      hrv_avg: pregameHrvAvg,
      hrv_baseline_deviation: hrvDeviation,
      recovery_score: this.average(recoveryReadings.map((r) => r.metric_value)),
      sleep_performance: this.average(sleepReadings.map((r) => r.metric_value)),
      resting_hr: this.average(hrReadings.map((r) => r.metric_value)),
      strain: this.average(strainReadings.map((r) => r.metric_value)),
      data_completeness: dataCompleteness,
    };
  }

  // ==========================================================================
  // EVENT-LEVEL TIME ALIGNMENT
  // ==========================================================================

  /**
   * Align wearables data to a specific game event
   * Finds closest reading within time window, with optional interpolation
   */
  async alignWearablesToEvent(
    gameEvent: GameEvent,
    wearablesReadings: WearablesReading[]
  ): Promise<TimeAlignedData> {
    const eventTime = gameEvent.event_timestamp;
    const windowStart = new Date(eventTime.getTime() - this.config.lookbackHours * 3600000);
    const windowEnd = eventTime;

    // Filter readings within window for this player
    const relevantReadings = wearablesReadings.filter(
      (r) =>
        r.player_id === gameEvent.player_id &&
        r.reading_timestamp >= windowStart &&
        r.reading_timestamp <= windowEnd &&
        r.quality_score >= this.config.qualityThreshold
    );

    if (relevantReadings.length === 0) {
      // No data available
      return this.createEmptyAlignment(gameEvent);
    }

    // Find closest reading
    const closestReading = this.findClosestReading(eventTime, relevantReadings);
    const timeDeltaMinutes = Math.abs(
      (eventTime.getTime() - closestReading.reading_timestamp.getTime()) / 60000
    );

    // Check if time delta is acceptable
    if (timeDeltaMinutes > this.config.maxTimeDeltaMinutes) {
      // Too far apart, return empty
      return this.createEmptyAlignment(gameEvent);
    }

    // Extract metric values
    const metricsByType = this.groupReadingsByMetric(relevantReadings, eventTime);

    // Calculate alignment quality score
    const qualityScore = this.calculateAlignmentQuality(
      timeDeltaMinutes,
      closestReading.quality_score,
      metricsByType.hrv !== null
    );

    return {
      game_event_id: gameEvent.event_id || '',
      game_event_timestamp: eventTime,
      wearable_reading_id: closestReading.reading_id || null,
      wearable_reading_timestamp: closestReading.reading_timestamp,
      time_delta_minutes: timeDeltaMinutes,
      interpolated: false,
      alignment_quality_score: qualityScore,
      hrv_value: metricsByType.hrv,
      recovery_score: metricsByType.recovery,
      heart_rate: metricsByType.heart_rate,
      sleep_performance: metricsByType.sleep,
      strain: metricsByType.strain,
    };
  }

  /**
   * Align wearables data to multiple events (batch processing)
   */
  async alignWearablesToEvents(
    gameEvents: GameEvent[],
    wearablesReadings: WearablesReading[]
  ): Promise<TimeAlignedData[]> {
    const alignments: TimeAlignedData[] = [];

    for (const event of gameEvents) {
      const alignment = await this.alignWearablesToEvent(event, wearablesReadings);
      alignments.push(alignment);
    }

    return alignments;
  }

  // ==========================================================================
  // INTERPOLATION
  // ==========================================================================

  /**
   * Linearly interpolate wearable value between two readings
   */
  interpolateReading(
    beforeReading: WearablesReading,
    afterReading: WearablesReading,
    targetTimestamp: Date
  ): number {
    const timeBefore = beforeReading.reading_timestamp.getTime();
    const timeAfter = afterReading.reading_timestamp.getTime();
    const timeTarget = targetTimestamp.getTime();

    const valueBefore = beforeReading.metric_value;
    const valueAfter = afterReading.metric_value;

    // Linear interpolation formula
    const weight = (timeTarget - timeBefore) / (timeAfter - timeBefore);
    return valueBefore + weight * (valueAfter - valueBefore);
  }

  // ==========================================================================
  // TIMEZONE UTILITIES
  // ==========================================================================

  /**
   * Convert UTC timestamp to player's local timezone
   */
  convertToPlayerTimezone(utcTimestamp: Date, playerTimezone: string): DateTime {
    return DateTime.fromJSDate(utcTimestamp).setZone(playerTimezone);
  }

  /**
   * Convert player local time to UTC
   */
  convertToUTC(localTimestamp: Date, playerTimezone: string): DateTime {
    return DateTime.fromJSDate(localTimestamp, { zone: playerTimezone }).toUTC();
  }

  /**
   * Normalize wearable reading timezone offset to UTC
   */
  normalizeReadingToUTC(reading: WearablesReading): Date {
    // If reading has timezone offset, adjust to UTC
    if (reading.timezone_offset !== 0) {
      const offsetMs = reading.timezone_offset * 60000;
      return new Date(reading.reading_timestamp.getTime() - offsetMs);
    }
    return reading.reading_timestamp;
  }

  // ==========================================================================
  // PRIVATE HELPER METHODS
  // ==========================================================================

  /**
   * Find closest reading to target timestamp
   */
  private findClosestReading(
    targetTimestamp: Date,
    readings: WearablesReading[]
  ): WearablesReading {
    return readings.reduce((closest, current) => {
      const currentDelta = Math.abs(
        current.reading_timestamp.getTime() - targetTimestamp.getTime()
      );
      const closestDelta = Math.abs(
        closest.reading_timestamp.getTime() - targetTimestamp.getTime()
      );
      return currentDelta < closestDelta ? current : closest;
    });
  }

  /**
   * Group readings by metric type and find closest to target time
   */
  private groupReadingsByMetric(
    readings: WearablesReading[],
    targetTime: Date
  ): {
    hrv: number | null;
    recovery: number | null;
    heart_rate: number | null;
    sleep: number | null;
    strain: number | null;
  } {
    const getClosestValue = (metricType: string): number | null => {
      const filtered = readings.filter((r) => r.metric_type === metricType);
      if (filtered.length === 0) return null;
      const closest = this.findClosestReading(targetTime, filtered);
      return closest.metric_value;
    };

    return {
      hrv: getClosestValue('hrv_rmssd'),
      recovery: getClosestValue('recovery_score'),
      heart_rate: getClosestValue('heart_rate'),
      sleep: getClosestValue('sleep_performance'),
      strain: getClosestValue('strain'),
    };
  }

  /**
   * Calculate alignment quality score (0.0-1.0)
   * Factors: time delta, wearable quality, data completeness
   */
  private calculateAlignmentQuality(
    timeDeltaMinutes: number,
    wearableQuality: number,
    hasHRV: boolean
  ): number {
    // Time quality: 1.0 if <30 min, 0.7 if <60 min, 0.4 if <120 min
    let timeQuality = 1.0;
    if (timeDeltaMinutes > 30) timeQuality = 0.7;
    if (timeDeltaMinutes > 60) timeQuality = 0.4;
    if (timeDeltaMinutes > 120) timeQuality = 0.2;

    // HRV availability bonus (HRV is most important metric)
    const hrvBonus = hasHRV ? 0.1 : 0.0;

    // Weighted average
    const quality = 0.6 * timeQuality + 0.4 * wearableQuality + hrvBonus;
    return Math.min(parseFloat(quality.toFixed(2)), 1.0);
  }

  /**
   * Calculate data completeness (0.0-1.0)
   * Based on how many expected metrics are present
   */
  private calculateDataCompleteness(readingGroups: WearablesReading[][]): number {
    const expectedMetrics = 5; // hrv, recovery, sleep, hr, strain
    const presentMetrics = readingGroups.filter((group) => group.length > 0).length;
    return parseFloat((presentMetrics / expectedMetrics).toFixed(2));
  }

  /**
   * Calculate average of array (null-safe)
   */
  private average(values: number[]): number | null {
    if (values.length === 0) return null;
    const sum = values.reduce((a, b) => a + b, 0);
    return parseFloat((sum / values.length).toFixed(2));
  }

  /**
   * Create empty alignment when no data available
   */
  private createEmptyAlignment(gameEvent: GameEvent): TimeAlignedData {
    return {
      game_event_id: gameEvent.event_id || '',
      game_event_timestamp: gameEvent.event_timestamp,
      wearable_reading_id: null,
      wearable_reading_timestamp: null,
      time_delta_minutes: Infinity,
      interpolated: false,
      alignment_quality_score: 0.0,
      hrv_value: null,
      recovery_score: null,
      heart_rate: null,
      sleep_performance: null,
      strain: null,
    };
  }
}

// ============================================================================
// FACTORY & EXPORTS
// ============================================================================

/**
 * Create time alignment service instance
 */
export function createTimeAlignmentService(
  config?: Partial<AlignmentConfig>
): TimeAlignmentService {
  return new TimeAlignmentService(config);
}

export default TimeAlignmentService;
