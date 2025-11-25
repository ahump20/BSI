/**
 * Sports Data Quality Control - Analysis Pipeline
 *
 * CLI wrapper and orchestration layer for running comprehensive QC
 * on scraped sports data. This module ties together all validation
 * functions and produces a complete QC report.
 *
 * Usage:
 *   import { runQCPipeline } from './qc_analysis';
 *   const report = await runQCPipeline(data);
 *
 * @module qc_analysis
 */

import {
  type GameData,
  type PlayerStats,
  type SimulationResults,
  type QCReport,
  type QCCheckResult,
  type OutlierResult,
  type QCMetrics,
  validatePlayerStats,
  validateGameData,
  validateSimulationResults,
  detectOutliersMAD,
  calculateQCMetrics,
  generateReportId,
  VALIDATION_THRESHOLDS,
} from './qc_core';

// ============================================================================
// PIPELINE INPUT TYPES
// ============================================================================

/**
 * Input data structure for QC pipeline
 */
export interface QCPipelineInput {
  games?: GameData[];
  player_stats?: PlayerStats[];
  simulations?: SimulationResults[];
  data_source: string;
}

/**
 * Configuration options for QC pipeline
 */
export interface QCPipelineConfig {
  // MAD outlier detection threshold
  mad_threshold?: number;

  // Whether to auto-reject records that fail validation
  auto_reject_failures?: boolean;

  // Whether to auto-reject extreme outliers (>7 MADs)
  auto_reject_outliers?: boolean;

  // Whether to include flagged records in output
  include_flagged?: boolean;

  // Minimum confidence score to accept (0-1)
  min_confidence_score?: number;
}

/**
 * Default pipeline configuration
 */
const DEFAULT_CONFIG: Required<QCPipelineConfig> = {
  mad_threshold: VALIDATION_THRESHOLDS.MAD_THRESHOLD_PERMISSIVE,
  auto_reject_failures: false,
  auto_reject_outliers: false,
  include_flagged: true,
  min_confidence_score: 0.0,
};

// ============================================================================
// MAIN PIPELINE
// ============================================================================

/**
 * Run the complete QC pipeline on input data
 *
 * This function:
 * 1. Validates all input records
 * 2. Detects statistical outliers using MAD
 * 3. Generates before/after metrics
 * 4. Produces actionable recommendations
 * 5. Filters data based on configuration
 *
 * @param input - Data to validate
 * @param config - Pipeline configuration
 * @returns Complete QC report and filtered data
 */
export async function runQCPipeline(
  input: QCPipelineInput,
  config: QCPipelineConfig = {}
): Promise<{
  report: QCReport;
  filtered_data: QCPipelineInput;
}> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const reportId = generateReportId();
  const timestamp = new Date().toISOString();

  // Initialize tracking
  const allChecks: QCCheckResult[] = [];
  const allOutliers: OutlierResult[] = [];
  const recommendations: string[] = [];

  const totalRecords =
    (input.games?.length || 0) +
    (input.player_stats?.length || 0) +
    (input.simulations?.length || 0);

  // -------------------------------------------------------------------------
  // STEP 1: Calculate before metrics
  // -------------------------------------------------------------------------

  const metricsBefore = calculateQCMetrics(input.games || [], input.player_stats || []);

  // -------------------------------------------------------------------------
  // STEP 2: Validate games
  // -------------------------------------------------------------------------

  const validatedGames: GameData[] = [];
  const rejectedGames: GameData[] = [];
  const flaggedGames: GameData[] = [];

  if (input.games) {
    for (const game of input.games) {
      const checks = validateGameData(game);
      allChecks.push(...checks);

      // Check confidence score
      if (
        game.metadata.confidence_score !== undefined &&
        game.metadata.confidence_score < cfg.min_confidence_score
      ) {
        checks.push({
          check_name: 'confidence_score',
          status: 'FAIL',
          message: `Confidence score ${game.metadata.confidence_score} below threshold ${cfg.min_confidence_score}`,
          affected_records: 1,
        });
      }

      const failedChecks = checks.filter((c) => c.status === 'FAIL');
      const warningChecks = checks.filter((c) => c.status === 'WARNING');

      if (failedChecks.length > 0) {
        if (cfg.auto_reject_failures) {
          rejectedGames.push(game);
        } else {
          flaggedGames.push(game);
        }
      } else if (warningChecks.length > 0) {
        flaggedGames.push(game);
      } else {
        validatedGames.push(game);
      }
    }
  }

  // -------------------------------------------------------------------------
  // STEP 3: Validate player stats + detect outliers
  // -------------------------------------------------------------------------

  const validatedPlayerStats: PlayerStats[] = [];
  const rejectedPlayerStats: PlayerStats[] = [];
  const flaggedPlayerStats: PlayerStats[] = [];

  if (input.player_stats) {
    // Run validation checks
    for (const stats of input.player_stats) {
      const checks = validatePlayerStats(stats);
      allChecks.push(...checks);

      // Check confidence score
      if (
        stats.metadata.confidence_score !== undefined &&
        stats.metadata.confidence_score < cfg.min_confidence_score
      ) {
        checks.push({
          check_name: 'confidence_score',
          status: 'FAIL',
          message: `Confidence score ${stats.metadata.confidence_score} below threshold ${cfg.min_confidence_score}`,
          affected_records: 1,
        });
      }

      const failedChecks = checks.filter((c) => c.status === 'FAIL');
      const warningChecks = checks.filter((c) => c.status === 'WARNING');

      if (failedChecks.length > 0) {
        if (cfg.auto_reject_failures) {
          rejectedPlayerStats.push(stats);
        } else {
          flaggedPlayerStats.push(stats);
        }
      } else if (warningChecks.length > 0) {
        flaggedPlayerStats.push(stats);
      } else {
        validatedPlayerStats.push(stats);
      }
    }

    // Run MAD outlier detection on continuous metrics
    const outlierAnalysis = runOutlierDetection(input.player_stats, cfg.mad_threshold);
    allOutliers.push(...outlierAnalysis.outliers);

    // Move outliers to appropriate buckets
    for (const player of outlierAnalysis.players_with_outliers) {
      const playerOutliers = allOutliers.filter((o) => input.player_stats!.indexOf(player) >= 0);

      const shouldReject = playerOutliers.some((o) => o.recommendation === 'REJECT');
      const shouldFlag = playerOutliers.some((o) => o.recommendation === 'FLAG');

      if (shouldReject && cfg.auto_reject_outliers) {
        // Remove from validated, add to rejected
        const idx = validatedPlayerStats.indexOf(player);
        if (idx >= 0) {
          validatedPlayerStats.splice(idx, 1);
          rejectedPlayerStats.push(player);
        }
      } else if (shouldFlag || shouldReject) {
        // Move to flagged
        const idx = validatedPlayerStats.indexOf(player);
        if (idx >= 0) {
          validatedPlayerStats.splice(idx, 1);
          flaggedPlayerStats.push(player);
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // STEP 4: Validate simulations
  // -------------------------------------------------------------------------

  const validatedSimulations: SimulationResults[] = [];
  const rejectedSimulations: SimulationResults[] = [];
  const flaggedSimulations: SimulationResults[] = [];

  if (input.simulations) {
    for (const sim of input.simulations) {
      const checks = validateSimulationResults(sim);
      allChecks.push(...checks);

      // Check confidence score
      if (
        sim.metadata.confidence_score !== undefined &&
        sim.metadata.confidence_score < cfg.min_confidence_score
      ) {
        checks.push({
          check_name: 'confidence_score',
          status: 'FAIL',
          message: `Confidence score ${sim.metadata.confidence_score} below threshold ${cfg.min_confidence_score}`,
          affected_records: 1,
        });
      }

      const failedChecks = checks.filter((c) => c.status === 'FAIL');
      const warningChecks = checks.filter((c) => c.status === 'WARNING');

      if (failedChecks.length > 0) {
        if (cfg.auto_reject_failures) {
          rejectedSimulations.push(sim);
        } else {
          flaggedSimulations.push(sim);
        }
      } else if (warningChecks.length > 0) {
        flaggedSimulations.push(sim);
      } else {
        validatedSimulations.push(sim);
      }
    }
  }

  // -------------------------------------------------------------------------
  // STEP 5: Calculate after metrics
  // -------------------------------------------------------------------------

  const metricsAfter = calculateQCMetrics(validatedGames, validatedPlayerStats);

  // -------------------------------------------------------------------------
  // STEP 6: Generate recommendations
  // -------------------------------------------------------------------------

  const totalRejected =
    rejectedGames.length + rejectedPlayerStats.length + rejectedSimulations.length;
  const totalFlagged = flaggedGames.length + flaggedPlayerStats.length + flaggedSimulations.length;
  const totalPassed =
    validatedGames.length + validatedPlayerStats.length + validatedSimulations.length;

  // Add recommendations based on results
  if (totalRejected > 0) {
    recommendations.push(
      `${totalRejected} records rejected due to validation failures. Review data source quality.`
    );
  }

  if (totalFlagged > 0) {
    recommendations.push(
      `${totalFlagged} records flagged for review. Consider manual inspection before ingestion.`
    );
  }

  const failedChecks = allChecks.filter((c) => c.status === 'FAIL');
  const failuresByType = groupChecksByName(failedChecks);

  for (const [checkName, count] of Object.entries(failuresByType)) {
    if (count > 5) {
      recommendations.push(
        `High failure rate for ${checkName} (${count} failures). Investigate scraper logic.`
      );
    }
  }

  const extremeOutliers = allOutliers.filter((o) => o.recommendation === 'REJECT');
  if (extremeOutliers.length > 0) {
    recommendations.push(
      `${extremeOutliers.length} extreme outliers detected (>7 MADs). Likely data quality issues.`
    );
  }

  const flaggedOutliers = allOutliers.filter((o) => o.recommendation === 'FLAG');
  if (flaggedOutliers.length > 0) {
    recommendations.push(
      `${flaggedOutliers.length} statistical outliers flagged. Could be legitimate exceptional performances - review manually.`
    );
  }

  // Check completeness degradation
  const completenessChange =
    metricsAfter.completeness_percentage - metricsBefore.completeness_percentage;
  if (completenessChange < -10) {
    recommendations.push(
      `Data completeness dropped by ${Math.abs(completenessChange).toFixed(1)}% after filtering. Review required field validation.`
    );
  }

  // Data source specific recommendations
  if (input.data_source.includes('ESPN')) {
    recommendations.push(
      'ESPN API has known reliability issues for college baseball. Consider using NCAA or SportsDataIO as primary source.'
    );
  }

  if (allOutliers.length === 0 && totalFlagged === 0 && totalRejected === 0) {
    recommendations.push('All data passed QC checks. Safe to proceed with ingestion into D1.');
  }

  // -------------------------------------------------------------------------
  // STEP 7: Build final report
  // -------------------------------------------------------------------------

  const report: QCReport = {
    report_id: reportId,
    timestamp,
    data_source: input.data_source,
    total_records: totalRecords,
    records_passed: totalPassed,
    records_flagged: totalFlagged,
    records_rejected: totalRejected,
    checks: allChecks,
    outliers: allOutliers,
    metrics_before: metricsBefore,
    metrics_after: metricsAfter,
    recommendations,
  };

  // -------------------------------------------------------------------------
  // STEP 8: Build filtered output
  // -------------------------------------------------------------------------

  const filtered_data: QCPipelineInput = {
    data_source: input.data_source,
    games: validatedGames,
    player_stats: validatedPlayerStats,
    simulations: validatedSimulations,
  };

  // Include flagged records if configured
  if (cfg.include_flagged) {
    filtered_data.games?.push(...flaggedGames);
    filtered_data.player_stats?.push(...flaggedPlayerStats);
    filtered_data.simulations?.push(...flaggedSimulations);
  }

  return { report, filtered_data };
}

// ============================================================================
// OUTLIER DETECTION HELPERS
// ============================================================================

/**
 * Run MAD-based outlier detection on player statistics
 */
function runOutlierDetection(
  playerStats: PlayerStats[],
  threshold: number
): {
  outliers: OutlierResult[];
  players_with_outliers: PlayerStats[];
} {
  const outliers: OutlierResult[] = [];
  const playersWithOutliers: PlayerStats[] = [];

  // Extract continuous metrics
  const battingAvgs = playerStats
    .map((p, i) => ({ value: p.batting_avg, index: i }))
    .filter((x): x is { value: number; index: number } => x.value !== undefined);

  const pitchVelocities = playerStats
    .map((p, i) => ({ value: p.pitch_velocity, index: i }))
    .filter((x): x is { value: number; index: number } => x.value !== undefined);

  const exitVelocities = playerStats
    .map((p, i) => ({ value: p.exit_velocity, index: i }))
    .filter((x): x is { value: number; index: number } => x.value !== undefined);

  const eras = playerStats
    .map((p, i) => ({ value: p.era, index: i }))
    .filter((x): x is { value: number; index: number } => x.value !== undefined);

  const spinRates = playerStats
    .map((p, i) => ({ value: p.spin_rate, index: i }))
    .filter((x): x is { value: number; index: number } => x.value !== undefined);

  // Run MAD detection for each metric
  if (battingAvgs.length > 0) {
    const results = detectOutliersMAD(
      battingAvgs.map((x) => x.value),
      'batting_avg',
      threshold
    );
    outliers.push(...results);

    // Track players with outliers
    results.forEach((result, i) => {
      if (result.is_outlier) {
        playersWithOutliers.push(playerStats[battingAvgs[i].index]);
      }
    });
  }

  if (pitchVelocities.length > 0) {
    const results = detectOutliersMAD(
      pitchVelocities.map((x) => x.value),
      'pitch_velocity',
      threshold
    );
    outliers.push(...results);

    results.forEach((result, i) => {
      if (result.is_outlier) {
        playersWithOutliers.push(playerStats[pitchVelocities[i].index]);
      }
    });
  }

  if (exitVelocities.length > 0) {
    const results = detectOutliersMAD(
      exitVelocities.map((x) => x.value),
      'exit_velocity',
      threshold
    );
    outliers.push(...results);

    results.forEach((result, i) => {
      if (result.is_outlier) {
        playersWithOutliers.push(playerStats[exitVelocities[i].index]);
      }
    });
  }

  if (eras.length > 0) {
    const results = detectOutliersMAD(
      eras.map((x) => x.value),
      'era',
      threshold
    );
    outliers.push(...results);

    results.forEach((result, i) => {
      if (result.is_outlier) {
        playersWithOutliers.push(playerStats[eras[i].index]);
      }
    });
  }

  if (spinRates.length > 0) {
    const results = detectOutliersMAD(
      spinRates.map((x) => x.value),
      'spin_rate',
      threshold
    );
    outliers.push(...results);

    results.forEach((result, i) => {
      if (result.is_outlier) {
        playersWithOutliers.push(playerStats[spinRates[i].index]);
      }
    });
  }

  // Deduplicate players
  const uniquePlayers = Array.from(new Set(playersWithOutliers));

  return {
    outliers,
    players_with_outliers: uniquePlayers,
  };
}

/**
 * Group check results by check name and count failures
 */
function groupChecksByName(checks: QCCheckResult[]): Record<string, number> {
  const groups: Record<string, number> = {};

  for (const check of checks) {
    groups[check.check_name] = (groups[check.check_name] || 0) + 1;
  }

  return groups;
}

// ============================================================================
// BATCH PROCESSING
// ============================================================================

/**
 * Process data in batches to handle large datasets
 * Useful for processing thousands of records without memory issues
 */
export async function runQCPipelineBatch(
  input: QCPipelineInput,
  config: QCPipelineConfig = {},
  batchSize: number = 1000
): Promise<{
  report: QCReport;
  filtered_data: QCPipelineInput;
}> {
  // For small datasets, use regular pipeline
  const totalRecords =
    (input.games?.length || 0) +
    (input.player_stats?.length || 0) +
    (input.simulations?.length || 0);

  if (totalRecords <= batchSize) {
    return runQCPipeline(input, config);
  }

  // Process in batches
  const allReports: QCReport[] = [];
  const allFilteredGames: GameData[] = [];
  const allFilteredPlayerStats: PlayerStats[] = [];
  const allFilteredSimulations: SimulationResults[] = [];

  // Batch games
  if (input.games) {
    for (let i = 0; i < input.games.length; i += batchSize) {
      const batch = input.games.slice(i, i + batchSize);
      const { report, filtered_data } = await runQCPipeline(
        { games: batch, data_source: input.data_source },
        config
      );
      allReports.push(report);
      allFilteredGames.push(...(filtered_data.games || []));
    }
  }

  // Batch player stats
  if (input.player_stats) {
    for (let i = 0; i < input.player_stats.length; i += batchSize) {
      const batch = input.player_stats.slice(i, i + batchSize);
      const { report, filtered_data } = await runQCPipeline(
        { player_stats: batch, data_source: input.data_source },
        config
      );
      allReports.push(report);
      allFilteredPlayerStats.push(...(filtered_data.player_stats || []));
    }
  }

  // Batch simulations
  if (input.simulations) {
    for (let i = 0; i < input.simulations.length; i += batchSize) {
      const batch = input.simulations.slice(i, i + batchSize);
      const { report, filtered_data } = await runQCPipeline(
        { simulations: batch, data_source: input.data_source },
        config
      );
      allReports.push(report);
      allFilteredSimulations.push(...(filtered_data.simulations || []));
    }
  }

  // Merge reports
  const mergedReport = mergeReports(allReports, input.data_source);

  return {
    report: mergedReport,
    filtered_data: {
      data_source: input.data_source,
      games: allFilteredGames,
      player_stats: allFilteredPlayerStats,
      simulations: allFilteredSimulations,
    },
  };
}

/**
 * Merge multiple QC reports into a single consolidated report
 */
function mergeReports(reports: QCReport[], dataSource: string): QCReport {
  const mergedChecks: QCCheckResult[] = [];
  const mergedOutliers: OutlierResult[] = [];
  const mergedRecommendations: string[] = [];

  let totalRecords = 0;
  let recordsPassed = 0;
  let recordsFlagged = 0;
  let recordsRejected = 0;

  for (const report of reports) {
    mergedChecks.push(...report.checks);
    mergedOutliers.push(...report.outliers);
    mergedRecommendations.push(...report.recommendations);

    totalRecords += report.total_records;
    recordsPassed += report.records_passed;
    recordsFlagged += report.records_flagged;
    recordsRejected += report.records_rejected;
  }

  // Use metrics from last report (most recent)
  const lastReport = reports[reports.length - 1];

  return {
    report_id: generateReportId(),
    timestamp: new Date().toISOString(),
    data_source: dataSource,
    total_records: totalRecords,
    records_passed: recordsPassed,
    records_flagged: recordsFlagged,
    records_rejected: recordsRejected,
    checks: mergedChecks,
    outliers: mergedOutliers,
    metrics_before: reports[0]?.metrics_before || lastReport.metrics_before,
    metrics_after: lastReport.metrics_after,
    recommendations: Array.from(new Set(mergedRecommendations)), // Deduplicate
  };
}
