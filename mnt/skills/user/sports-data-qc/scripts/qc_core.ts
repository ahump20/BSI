import { z } from "zod";

export type Sport = "college_baseball" | "mlb" | "nfl";
export type DataSource =
  | "espn_box_score"
  | "ncaa_stats"
  | "pitch_tracking"
  | "game_simulator";

export interface CitationMetadata {
  sourceUrl: string;
  scrapedAt: string; // ISO string in America/Chicago
  timezone: "America/Chicago";
  confidence: number; // 0-1 confidence score based on QC outcome
}

export type CheckName =
  | "range"
  | "completeness"
  | "consistency"
  | "temporal"
  | "statistical_outliers";

export type CheckStatus = "pass" | "warn" | "fail";

export interface QcCheckOutcome {
  check: CheckName;
  status: CheckStatus;
  details: string;
  impactedRecords: string[];
  metrics?: Record<string, number>;
}

export interface OutlierFlag {
  id: string;
  metric: string;
  value: number;
  median: number;
  mad: number;
  modifiedZScore: number;
  severity: "moderate" | "high";
  context?: string;
}

export interface DistributionShift {
  metric: string;
  currentMean: number;
  previousMean?: number;
  delta?: number;
  percentageChange?: number;
  sampleSize: number;
  baselineSampleSize?: number;
}

export interface QcSummary {
  recordsEvaluated: number;
  recordsFlagged: number;
  recordsFiltered: number;
  filteredPercentage: number;
}

export interface QcReport {
  source: DataSource;
  sport: Sport;
  generatedAt: string;
  metadata: CitationMetadata;
  summary: QcSummary;
  checks: QcCheckOutcome[];
  outliers: OutlierFlag[];
  distribution: DistributionShift[];
  recommendations: string[];
  filteredRecords: string[];
  rawMetrics: Record<string, number>;
  baseline?: BaselineMetrics;
}

export interface BaselineMetrics {
  source: DataSource;
  sport: Sport;
  meanBattingAverage?: number;
  meanPitchVelocity?: number;
  meanExitVelocity?: number;
  meanWinProbabilityHome?: number;
  sampleSize: number;
  computedAt: string;
}

export interface QcRequestPayload {
  source: DataSource;
  sport: Sport;
  sourceUrl: string;
  scrapedAt: string;
  payload: unknown;
  baseline?: BaselineMetrics;
}

export interface EspnPlayerBattingLine {
  playerId: string;
  name: string;
  team: "home" | "away";
  atBats: number;
  hits: number;
  rbi: number;
  battingAverage: number;
}

export interface EspnPitchingLine {
  playerId: string;
  name: string;
  team: "home" | "away";
  inningsPitched: number;
  earnedRuns: number;
  era: number;
}

export interface EspnPitchVelocitySample {
  pitcherId: string;
  pitchType: string;
  velocity: number;
}

export interface EspnBoxScorePayload {
  metadata: {
    gameId: string;
    timestamp: string;
    venue?: string;
    season: number;
    homeTeam: string;
    awayTeam: string;
    finalScore: {
      home: number;
      away: number;
    };
  };
  batting: EspnPlayerBattingLine[];
  pitching: EspnPitchingLine[];
  pitchVelocities?: EspnPitchVelocitySample[];
  playByPlayTotals: {
    homeRuns: number;
    awayRuns: number;
    homeHits: number;
    awayHits: number;
    homeRbi: number;
    awayRbi: number;
  };
}

export interface NcaaStatsPayload {
  season: number;
  conference: string;
  teams: Array<{
    teamId: string;
    teamName: string;
    overallRecord: {
      wins: number;
      losses: number;
    };
    conferenceRecord: {
      wins: number;
      losses: number;
    };
    battingAverage: number;
    era: number;
  }>;
}

export interface PitchTrackingPayload {
  trackingProvider: string;
  season: number;
  gameId: string;
  pitches: Array<{
    pitchId: string;
    pitcherId: string;
    batterId: string;
    pitchType: string;
    velocity: number;
    spinRate: number;
    exitVelocity?: number;
    releasePoint: {
      x: number;
      y: number;
      z: number;
    };
    timestamp: string;
  }>;
}

export interface GameSimulatorPayload {
  simulationId: string;
  gameId: string;
  iterations: number;
  generatedAt: string;
  results: Array<{
    outcome: "home_win" | "away_win" | "draw";
    winProbability: number;
    averageScore: {
      home: number;
      away: number;
    };
  }>;
}

const espnSchema = z.object({
  metadata: z.object({
    gameId: z.string().min(1),
    timestamp: z.string().datetime(),
    venue: z.string().optional(),
    season: z.number().int(),
    homeTeam: z.string().min(1),
    awayTeam: z.string().min(1),
    finalScore: z.object({
      home: z.number().int().nonnegative(),
      away: z.number().int().nonnegative(),
    }),
  }),
  batting: z
    .array(
      z.object({
        playerId: z.string(),
        name: z.string(),
        team: z.enum(["home", "away"]),
        atBats: z.number().int().nonnegative(),
        hits: z.number().int().nonnegative(),
        rbi: z.number().int().nonnegative(),
        battingAverage: z.number().nonnegative(),
      })
    )
    .min(1),
  pitching: z
    .array(
      z.object({
        playerId: z.string(),
        name: z.string(),
        team: z.enum(["home", "away"]),
        inningsPitched: z.number().nonnegative(),
        earnedRuns: z.number().nonnegative(),
        era: z.number().nonnegative(),
      })
    )
    .min(1),
  pitchVelocities: z
    .array(
      z.object({
        pitcherId: z.string(),
        pitchType: z.string(),
        velocity: z.number().positive(),
      })
    )
    .optional(),
  playByPlayTotals: z.object({
    homeRuns: z.number().int().nonnegative(),
    awayRuns: z.number().int().nonnegative(),
    homeHits: z.number().int().nonnegative(),
    awayHits: z.number().int().nonnegative(),
    homeRbi: z.number().int().nonnegative(),
    awayRbi: z.number().int().nonnegative(),
  }),
});

const ncaaSchema = z.object({
  season: z.number().int(),
  conference: z.string().min(1),
  teams: z
    .array(
      z.object({
        teamId: z.string(),
        teamName: z.string(),
        overallRecord: z.object({
          wins: z.number().int().nonnegative(),
          losses: z.number().int().nonnegative(),
        }),
        conferenceRecord: z.object({
          wins: z.number().int().nonnegative(),
          losses: z.number().int().nonnegative(),
        }),
        battingAverage: z.number().nonnegative(),
        era: z.number().nonnegative(),
      })
    )
    .min(1),
});

const pitchTrackingSchema = z.object({
  trackingProvider: z.string().min(1),
  season: z.number().int(),
  gameId: z.string().min(1),
  pitches: z
    .array(
      z.object({
        pitchId: z.string(),
        pitcherId: z.string(),
        batterId: z.string(),
        pitchType: z.string(),
        velocity: z.number().positive(),
        spinRate: z.number().positive(),
        exitVelocity: z.number().positive().optional(),
        releasePoint: z.object({
          x: z.number(),
          y: z.number(),
          z: z.number(),
        }),
        timestamp: z.string().datetime(),
      })
    )
    .min(1),
});

const simulatorSchema = z.object({
  simulationId: z.string(),
  gameId: z.string(),
  iterations: z.number().int().positive(),
  generatedAt: z.string().datetime(),
  results: z
    .array(
      z.object({
        outcome: z.enum(["home_win", "away_win", "draw"]),
        winProbability: z.number().nonnegative(),
        averageScore: z.object({
          home: z.number().nonnegative(),
          away: z.number().nonnegative(),
        }),
      })
    )
    .min(1),
});

interface MetricSample {
  id: string;
  metric: string;
  value: number;
  context?: string;
}

interface ValidationResult {
  checks: QcCheckOutcome[];
  outliers: OutlierFlag[];
  filteredRecords: string[];
  flaggedRecords: Set<string>;
  metrics: Record<string, number>;
  distribution: DistributionShift[];
  recommendations: string[];
}

const RANGE_LIMITS = {
  battingAverage: { min: 0, max: 1 },
  pitchVelocity: { min: 40, max: 110 },
  exitVelocity: { min: 0, max: 120 },
};

const MAD_THRESHOLD = 3.5;

const toChicagoIso = (input: string): string => {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid timestamp provided: ${input}`);
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  const offsetFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    timeZoneName: "shortOffset",
  });
  const offsetValue = offsetFormatter
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;

  let offset = "-06:00";
  if (offsetValue) {
    // offsetValue examples: "GMT-5"
    const match = offsetValue.match(/GMT([+-])(\d{1,2})/);
    if (match) {
      const [, sign, hours] = match;
      offset = `${sign}${hours.padStart(2, "0")}:00`;
    }
  }

  const iso = `${lookup.year ?? "0000"}-${lookup.month ?? "01"}-${lookup.day ?? "01"}T${lookup.hour ?? "00"}:${lookup.minute ?? "00"}:${lookup.second ?? "00"}${offset}`;
  return iso;
};

const median = (values: number[]): number => {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
};

const computeMad = (values: number[], med: number): number => {
  if (values.length === 0) {
    return 0;
  }
  const deviations = values.map((value) => Math.abs(value - med));
  return median(deviations) || 0;
};

export const detectMadOutliers = (samples: MetricSample[]): OutlierFlag[] => {
  if (samples.length < 5) {
    return [];
  }
  const grouped = new Map<string, MetricSample[]>();
  for (const sample of samples) {
    const key = sample.metric;
    const bucket = grouped.get(key) ?? [];
    bucket.push(sample);
    grouped.set(key, bucket);
  }

  const outliers: OutlierFlag[] = [];
  for (const [metric, metricSamples] of grouped) {
    const values = metricSamples.map((sample) => sample.value);
    const med = median(values);
    const mad = computeMad(values, med);
    const denom = mad === 0 ? 1 : mad;
    for (const sample of metricSamples) {
      const modifiedZScore = 0.6745 * (sample.value - med) / denom;
      if (Math.abs(modifiedZScore) >= MAD_THRESHOLD) {
        outliers.push({
          id: sample.id,
          metric,
          value: sample.value,
          median: med,
          mad,
          modifiedZScore,
          severity: Math.abs(modifiedZScore) > MAD_THRESHOLD * 1.5 ? "high" : "moderate",
          context: sample.context,
        });
      }
    }
  }
  return outliers;
};

const evaluateRange = (
  id: string,
  value: number,
  metric: keyof typeof RANGE_LIMITS,
  impacted: Set<string>,
): boolean => {
  const { min, max } = RANGE_LIMITS[metric];
  if (value < min || value > max) {
    impacted.add(id);
    return false;
  }
  return true;
};

const validateEspnBoxScore = (
  payload: EspnBoxScorePayload,
  baseline?: BaselineMetrics,
): ValidationResult => {
  const checks: QcCheckOutcome[] = [];
  const flaggedRecords = new Set<string>();
  const filteredRecords: string[] = [];
  const metricSamples: MetricSample[] = [];
  const recommendations: string[] = [];

  // Range validation for batting averages
  for (const player of payload.batting) {
    if (!evaluateRange(player.playerId, player.battingAverage, "battingAverage", flaggedRecords)) {
      filteredRecords.push(player.playerId);
    }
    metricSamples.push({
      id: player.playerId,
      metric: "battingAverage",
      value: player.battingAverage,
      context: `${player.name} BA`,
    });
  }

  // Range validation for pitch velocities
  if (payload.pitchVelocities) {
    for (const velo of payload.pitchVelocities) {
      if (!evaluateRange(velo.pitcherId, velo.velocity, "pitchVelocity", flaggedRecords)) {
        filteredRecords.push(velo.pitcherId);
      }
      metricSamples.push({
        id: `${velo.pitcherId}-${velo.pitchType}`,
        metric: "pitchVelocity",
        value: velo.velocity,
        context: `${velo.pitchType} velocity`,
      });
    }
  }

  // Completeness check
  const requiredMetadataFields = [
    "gameId",
    "timestamp",
    "homeTeam",
    "awayTeam",
  ] as const;
  const missingFields = requiredMetadataFields.filter((field) => !payload.metadata[field]);
  if (missingFields.length > 0) {
    checks.push({
      check: "completeness",
      status: "fail",
      details: `Missing required metadata fields: ${missingFields.join(", ")}`,
      impactedRecords: [payload.metadata.gameId],
    });
    recommendations.push(
      `Update ESPN metadata scraper to capture: ${missingFields.join(", ")}.`,
    );
  } else {
    checks.push({
      check: "completeness",
      status: "pass",
      details: "All required metadata fields present.",
      impactedRecords: [],
    });
  }

  // Range check status summarization
  const rangeStatus = flaggedRecords.size === 0 ? "pass" : "fail";
  if (rangeStatus === "fail") {
    recommendations.push("Review stat parser for batting or velocity bounds exceeding league norms.");
  }
  checks.push({
    check: "range",
    status: rangeStatus,
    details:
      rangeStatus === "pass"
        ? "All batting averages and pitch velocities within expected ranges."
        : "Detected batting averages or pitch velocities outside accepted bounds.",
    impactedRecords: Array.from(flaggedRecords),
  });

  // Consistency check between box score totals and play-by-play totals
  const expectedHomeRuns = payload.metadata.finalScore.home;
  const expectedAwayRuns = payload.metadata.finalScore.away;
  const runMismatch =
    expectedHomeRuns !== payload.playByPlayTotals.homeRuns ||
    expectedAwayRuns !== payload.playByPlayTotals.awayRuns;
  const hitMismatch =
    payload.playByPlayTotals.homeHits !==
      payload.batting
        .filter((player) => player.team === "home")
        .reduce((acc, player) => acc + player.hits, 0) ||
    payload.playByPlayTotals.awayHits !==
      payload.batting
        .filter((player) => player.team === "away")
        .reduce((acc, player) => acc + player.hits, 0);

  if (runMismatch || hitMismatch) {
    const impacted = [payload.metadata.gameId];
    checks.push({
      check: "consistency",
      status: "warn",
      details: "Box score totals do not match play-by-play aggregates.",
      impactedRecords: impacted,
      metrics: {
        finalHomeRuns: expectedHomeRuns,
        finalAwayRuns: expectedAwayRuns,
        pbbHomeRuns: payload.playByPlayTotals.homeRuns,
        pbbAwayRuns: payload.playByPlayTotals.awayRuns,
      },
    });
    recommendations.push(
      "Reconcile ESPN box score totals with play-by-play parser; confirm inning-by-inning aggregation logic.",
    );
  } else {
    checks.push({
      check: "consistency",
      status: "pass",
      details: "Box score totals align with play-by-play aggregates.",
      impactedRecords: [],
    });
  }

  // Temporal validation
  const gameTimestamp = new Date(payload.metadata.timestamp);
  const now = new Date();
  const seasonYear = payload.metadata.season;
  let temporalStatus: CheckStatus = "pass";
  const temporalImpacted: string[] = [];
  const temporalDetails: string[] = [];
  if (Number.isNaN(gameTimestamp.getTime())) {
    temporalStatus = "fail";
    temporalImpacted.push(payload.metadata.gameId);
    temporalDetails.push("Invalid game timestamp format.");
  } else {
    if (gameTimestamp.getTime() > now.getTime()) {
      temporalStatus = "warn";
      temporalImpacted.push(payload.metadata.gameId);
      temporalDetails.push("Game timestamp is in the future.");
    }
    if (gameTimestamp.getUTCFullYear() !== seasonYear) {
      temporalStatus = temporalStatus === "pass" ? "warn" : temporalStatus;
      temporalImpacted.push(payload.metadata.gameId);
      temporalDetails.push("Season year does not match timestamp year.");
    }
  }
  checks.push({
    check: "temporal",
    status: temporalStatus,
    details: temporalDetails.length > 0 ? temporalDetails.join(" ") : "Timestamps valid.",
    impactedRecords: temporalImpacted,
  });
  if (temporalStatus !== "pass") {
    recommendations.push(
      "Verify schedule scraper timezone conversion for ESPN feeds (expect America/Chicago).",
    );
  }

  const outliers = detectMadOutliers(metricSamples);
  if (outliers.length > 0) {
    checks.push({
      check: "statistical_outliers",
      status: "warn",
      details: `${outliers.length} statistical outliers flagged via MAD (manual review recommended).`,
      impactedRecords: Array.from(new Set(outliers.map((outlier) => outlier.id))),
    });
  } else {
    checks.push({
      check: "statistical_outliers",
      status: "pass",
      details: "No statistical outliers detected via MAD threshold.",
      impactedRecords: [],
    });
  }

  const battingAverageMean =
    payload.batting.reduce((acc, player) => acc + player.battingAverage, 0) /
    payload.batting.length;
  const pitchVelocityMean = payload.pitchVelocities && payload.pitchVelocities.length > 0
    ? payload.pitchVelocities.reduce((acc, velo) => acc + velo.velocity, 0) /
      payload.pitchVelocities.length
    : undefined;

  const distribution: DistributionShift[] = [];
  if (baseline?.meanBattingAverage !== undefined) {
    const delta = battingAverageMean - baseline.meanBattingAverage;
    distribution.push({
      metric: "battingAverage",
      currentMean: battingAverageMean,
      previousMean: baseline.meanBattingAverage,
      delta,
      percentageChange:
        baseline.meanBattingAverage === 0
          ? undefined
          : (delta / baseline.meanBattingAverage) * 100,
      sampleSize: payload.batting.length,
      baselineSampleSize: baseline.sampleSize,
    });
  } else {
    distribution.push({
      metric: "battingAverage",
      currentMean: battingAverageMean,
      sampleSize: payload.batting.length,
    });
  }

  if (pitchVelocityMean !== undefined) {
    if (baseline?.meanPitchVelocity !== undefined) {
      const delta = pitchVelocityMean - baseline.meanPitchVelocity;
      distribution.push({
        metric: "pitchVelocity",
        currentMean: pitchVelocityMean,
        previousMean: baseline.meanPitchVelocity,
        delta,
        percentageChange:
          baseline.meanPitchVelocity === 0
            ? undefined
            : (delta / baseline.meanPitchVelocity) * 100,
        sampleSize: payload.pitchVelocities?.length ?? 0,
        baselineSampleSize: baseline.sampleSize,
      });
    } else {
      distribution.push({
        metric: "pitchVelocity",
        currentMean: pitchVelocityMean,
        sampleSize: payload.pitchVelocities?.length ?? 0,
      });
    }
  }

  const metrics: Record<string, number> = {
    battingAverageMean,
    sampleSize: payload.batting.length,
  };
  if (pitchVelocityMean !== undefined) {
    metrics.pitchVelocityMean = pitchVelocityMean;
  }

  if (checks.every((check) => check.status === "pass")) {
    recommendations.push("Publish ingestion to D1 — data is within acceptable tolerances.");
  }

  return {
    checks,
    outliers,
    filteredRecords,
    flaggedRecords,
    metrics,
    distribution,
    recommendations,
  };
};

const validateNcaaStats = (
  payload: NcaaStatsPayload,
  baseline?: BaselineMetrics,
): ValidationResult => {
  const checks: QcCheckOutcome[] = [];
  const flaggedRecords = new Set<string>();
  const filteredRecords: string[] = [];
  const recommendations: string[] = [];
  const metricSamples: MetricSample[] = [];

  for (const team of payload.teams) {
    if (team.battingAverage > RANGE_LIMITS.battingAverage.max) {
      flaggedRecords.add(team.teamId);
    }
    if (team.battingAverage < RANGE_LIMITS.battingAverage.min) {
      flaggedRecords.add(team.teamId);
    }
    metricSamples.push({
      id: team.teamId,
      metric: "battingAverage",
      value: team.battingAverage,
      context: `${team.teamName} BA`,
    });
    metricSamples.push({
      id: `${team.teamId}-era`,
      metric: "era",
      value: team.era,
      context: `${team.teamName} ERA`,
    });
    if (team.overallRecord.wins < 0 || team.overallRecord.losses < 0) {
      flaggedRecords.add(team.teamId);
      filteredRecords.push(team.teamId);
    }
  }

  checks.push({
    check: "range",
    status: flaggedRecords.size === 0 ? "pass" : "warn",
    details:
      flaggedRecords.size === 0
        ? "All team batting averages within NCAA expected range."
        : "Detected batting averages outside 0-1 bounds.",
    impactedRecords: Array.from(flaggedRecords),
  });

  checks.push({
    check: "completeness",
    status: "pass",
    details: "NCAA team payload includes required fields.",
    impactedRecords: [],
  });

  // Consistency: ensure overall wins/losses >= conference wins/losses
  const inconsistentTeams: string[] = [];
  for (const team of payload.teams) {
    if (
      team.overallRecord.wins < team.conferenceRecord.wins ||
      team.overallRecord.losses < team.conferenceRecord.losses
    ) {
      inconsistentTeams.push(team.teamId);
    }
  }
  if (inconsistentTeams.length > 0) {
    checks.push({
      check: "consistency",
      status: "warn",
      details: "Overall record cannot be less than conference record.",
      impactedRecords: inconsistentTeams,
    });
    recommendations.push(
      "Re-run NCAA standings scrape for impacted teams; conference totals likely double-counted.",
    );
  } else {
    checks.push({
      check: "consistency",
      status: "pass",
      details: "Overall vs conference records align.",
      impactedRecords: [],
    });
  }

  const now = new Date();
  const temporalWarnings: string[] = [];
  if (payload.season !== now.getUTCFullYear()) {
    temporalWarnings.push("Season year is not current calendar year (verify archival ingest).");
  }
  checks.push({
    check: "temporal",
    status: temporalWarnings.length > 0 ? "warn" : "pass",
    details:
      temporalWarnings.length > 0
        ? temporalWarnings.join(" ")
        : "Season metadata aligns with current calendar year.",
    impactedRecords: temporalWarnings.length > 0 ? [String(payload.season)] : [],
  });
  if (temporalWarnings.length > 0) {
    recommendations.push("Confirm NCAA season rollover logic after July 1st.");
  }

  const outliers = detectMadOutliers(metricSamples);
  checks.push({
    check: "statistical_outliers",
    status: outliers.length > 0 ? "warn" : "pass",
    details:
      outliers.length > 0
        ? `${outliers.length} NCAA team metrics flagged for manual review.`
        : "No statistical outliers detected for NCAA payload.",
    impactedRecords: Array.from(new Set(outliers.map((outlier) => outlier.id))),
  });

  const avgBattingAverage =
    payload.teams.reduce((acc, team) => acc + team.battingAverage, 0) / payload.teams.length;
  const distribution: DistributionShift[] = [];
  if (baseline?.meanBattingAverage !== undefined) {
    const delta = avgBattingAverage - baseline.meanBattingAverage;
    distribution.push({
      metric: "battingAverage",
      currentMean: avgBattingAverage,
      previousMean: baseline.meanBattingAverage,
      delta,
      percentageChange:
        baseline.meanBattingAverage === 0 ? undefined : (delta / baseline.meanBattingAverage) * 100,
      sampleSize: payload.teams.length,
      baselineSampleSize: baseline.sampleSize,
    });
  } else {
    distribution.push({
      metric: "battingAverage",
      currentMean: avgBattingAverage,
      sampleSize: payload.teams.length,
    });
  }

  const metrics: Record<string, number> = {
    avgBattingAverage,
    sampleSize: payload.teams.length,
  };

  if (checks.every((check) => check.status === "pass")) {
    recommendations.push("Safe to ingest NCAA standings into D1 baseline tables.");
  }

  return {
    checks,
    outliers,
    filteredRecords,
    flaggedRecords,
    metrics,
    distribution,
    recommendations,
  };
};

const validatePitchTracking = (
  payload: PitchTrackingPayload,
  baseline?: BaselineMetrics,
): ValidationResult => {
  const checks: QcCheckOutcome[] = [];
  const flaggedRecords = new Set<string>();
  const filteredRecords: string[] = [];
  const recommendations: string[] = [];
  const metricSamples: MetricSample[] = [];

  const now = new Date();
  const futurePitches: string[] = [];
  for (const pitch of payload.pitches) {
    if (!evaluateRange(pitch.pitchId, pitch.velocity, "pitchVelocity", flaggedRecords)) {
      filteredRecords.push(pitch.pitchId);
    }
    if (pitch.exitVelocity !== undefined) {
      if (!evaluateRange(pitch.pitchId, pitch.exitVelocity, "exitVelocity", flaggedRecords)) {
        filteredRecords.push(pitch.pitchId);
      }
      metricSamples.push({
        id: pitch.pitchId,
        metric: "exitVelocity",
        value: pitch.exitVelocity,
        context: `${pitch.pitchType} exit velo`,
      });
    }
    metricSamples.push({
      id: pitch.pitchId,
      metric: "pitchVelocity",
      value: pitch.velocity,
      context: `${pitch.pitchType} velo`,
    });
    const pitchTimestamp = new Date(pitch.timestamp);
    if (Number.isNaN(pitchTimestamp.getTime()) || pitchTimestamp > now) {
      futurePitches.push(pitch.pitchId);
    }
  }

  checks.push({
    check: "range",
    status: flaggedRecords.size > 0 ? "fail" : "pass",
    details:
      flaggedRecords.size > 0
        ? "Pitch tracking contains velocities outside 40-110 mph or exit velocity beyond 0-120 mph."
        : "Pitch velocities and exit velocities within bounds.",
    impactedRecords: Array.from(flaggedRecords),
  });
  if (flaggedRecords.size > 0) {
    recommendations.push("Re-run TrackMan/Statcast normalization on flagged pitch IDs.");
  }

  checks.push({
    check: "completeness",
    status: "pass",
    details: "Pitch tracking payload includes required fields.",
    impactedRecords: [],
  });

  checks.push({
    check: "consistency",
    status: "pass",
    details: "Pitch tracking release points and IDs validated structurally.",
    impactedRecords: [],
  });

  if (futurePitches.length > 0) {
    checks.push({
      check: "temporal",
      status: "warn",
      details: "Pitch timestamps are in the future or invalid.",
      impactedRecords: futurePitches,
    });
    recommendations.push("Verify pitch timestamp timezone conversion against America/Chicago baseline.");
  } else {
    checks.push({
      check: "temporal",
      status: "pass",
      details: "Pitch timestamps valid.",
      impactedRecords: [],
    });
  }

  const outliers = detectMadOutliers(metricSamples);
  checks.push({
    check: "statistical_outliers",
    status: outliers.length > 0 ? "warn" : "pass",
    details:
      outliers.length > 0
        ? `${outliers.length} pitch metrics flagged for manual review (possible career-high velocities).`
        : "No statistical outliers detected in pitch payload.",
    impactedRecords: Array.from(new Set(outliers.map((outlier) => outlier.id))),
  });

  const avgVelocity =
    payload.pitches.reduce((acc, pitch) => acc + pitch.velocity, 0) / payload.pitches.length;
  const exitVelocitySamples = payload.pitches.filter((pitch) => typeof pitch.exitVelocity === "number");
  const exitVelocityMean =
    exitVelocitySamples.length > 0
      ? exitVelocitySamples.reduce((acc, pitch) => acc + (pitch.exitVelocity ?? 0), 0) /
        exitVelocitySamples.length
      : undefined;
  const distribution: DistributionShift[] = [];
  if (baseline?.meanPitchVelocity !== undefined) {
    const delta = avgVelocity - baseline.meanPitchVelocity;
    distribution.push({
      metric: "pitchVelocity",
      currentMean: avgVelocity,
      previousMean: baseline.meanPitchVelocity,
      delta,
      percentageChange:
        baseline.meanPitchVelocity === 0 ? undefined : (delta / baseline.meanPitchVelocity) * 100,
      sampleSize: payload.pitches.length,
      baselineSampleSize: baseline.sampleSize,
    });
  } else {
    distribution.push({
      metric: "pitchVelocity",
      currentMean: avgVelocity,
      sampleSize: payload.pitches.length,
    });
  }

  const metrics: Record<string, number> = {
    avgVelocity,
    sampleSize: payload.pitches.length,
  };
  if (exitVelocityMean !== undefined) {
    metrics.exitVelocityMean = exitVelocityMean;
  }

  if (checks.filter((check) => check.status === "fail").length === 0) {
    recommendations.push("Ingest pitch tracking session into D1 pitch_events table.");
  }

  return {
    checks,
    outliers,
    filteredRecords,
    flaggedRecords,
    metrics,
    distribution,
    recommendations,
  };
};

const validateSimulator = (
  payload: GameSimulatorPayload,
  baseline?: BaselineMetrics,
): ValidationResult => {
  const checks: QcCheckOutcome[] = [];
  const flaggedRecords = new Set<string>();
  const filteredRecords: string[] = [];
  const recommendations: string[] = [];

  const probabilitySum = payload.results.reduce((acc, result) => acc + result.winProbability, 0);
  const probabilityCheck = Math.abs(probabilitySum - 1) <= 0.02; // allow small rounding error

  if (!probabilityCheck) {
    flaggedRecords.add(payload.simulationId);
    recommendations.push("Adjust Monte Carlo normalization — outcome probabilities must sum to 1.");
  }

  checks.push({
    check: "consistency",
    status: probabilityCheck ? "pass" : "fail",
    details: probabilityCheck
      ? "Win probabilities sum to ~1.0."
      : `Win probabilities sum to ${probabilitySum.toFixed(4)}, expected 1.0.`,
    impactedRecords: probabilityCheck ? [] : [payload.simulationId],
    metrics: { probabilitySum },
  });

  checks.push({
    check: "completeness",
    status: "pass",
    details: "Game simulator payload contains required fields.",
    impactedRecords: [],
  });

  const now = new Date();
  const generatedAt = new Date(payload.generatedAt);
  if (Number.isNaN(generatedAt.getTime()) || generatedAt > now) {
    checks.push({
      check: "temporal",
      status: "warn",
      details: "Simulator timestamp invalid or in the future.",
      impactedRecords: [payload.simulationId],
    });
    recommendations.push("Ensure simulator timestamps use America/Chicago before persistence.");
  } else {
    checks.push({
      check: "temporal",
      status: "pass",
      details: "Simulator timestamps valid.",
      impactedRecords: [],
    });
  }

  checks.push({
    check: "range",
    status: "pass",
    details: "Simulator scores and probabilities within logical bounds.",
    impactedRecords: [],
  });

  const outliers = payload.results
    .filter((result) => result.averageScore.home > 30 || result.averageScore.away > 30)
    .map<OutlierFlag>((result) => ({
      id: `${payload.simulationId}-${result.outcome}`,
      metric: "averageScore",
      value: Math.max(result.averageScore.home, result.averageScore.away),
      median: 0,
      mad: 0,
      modifiedZScore: 0,
      severity: "moderate",
      context: "Average score exceeded typical baseball range (30 runs).",
    }));
  checks.push({
    check: "statistical_outliers",
    status: outliers.length > 0 ? "warn" : "pass",
    details:
      outliers.length > 0
        ? `${outliers.length} simulation outcomes flagged for extreme scoring projections.`
        : "Simulator score distributions within expectations.",
    impactedRecords: outliers.map((flag) => flag.id),
  });

  const homeWin = payload.results.find((result) => result.outcome === "home_win");
  const distribution: DistributionShift[] = [];
  if (homeWin?.winProbability !== undefined) {
    if (baseline?.meanWinProbabilityHome !== undefined) {
      const delta = homeWin.winProbability - baseline.meanWinProbabilityHome;
      distribution.push({
        metric: "homeWinProbability",
        currentMean: homeWin.winProbability,
        previousMean: baseline.meanWinProbabilityHome,
        delta,
        percentageChange:
          baseline.meanWinProbabilityHome === 0
            ? undefined
            : (delta / baseline.meanWinProbabilityHome) * 100,
        sampleSize: payload.iterations,
        baselineSampleSize: baseline.sampleSize,
      });
    } else {
      distribution.push({
        metric: "homeWinProbability",
        currentMean: homeWin.winProbability,
        sampleSize: payload.iterations,
      });
    }
  }

  const metrics: Record<string, number> = {
    probabilitySum,
    sampleSize: payload.results.length,
  };
  if (homeWin?.winProbability !== undefined) {
    metrics.homeWinProbability = homeWin.winProbability;
  }

  if (checks.filter((check) => check.status === "fail").length === 0) {
    recommendations.push("Allow simulator output into projections API for Diamond Pro tier.");
  }

  return {
    checks,
    outliers,
    filteredRecords,
    flaggedRecords,
    metrics,
    distribution,
    recommendations,
  };
};

const inferConfidence = (checks: QcCheckOutcome[], outliers: OutlierFlag[], total: number): number => {
  const failures = checks.filter((check) => check.status === "fail").length;
  const warnings = checks.filter((check) => check.status === "warn").length;
  const penalty = failures * 0.25 + warnings * 0.1 + (outliers.length / Math.max(total, 1)) * 0.1;
  return Math.max(0, Number((1 - penalty).toFixed(3)));
};

export const runQualityChecks = (request: QcRequestPayload): QcReport => {
  const chicagoIso = toChicagoIso(request.scrapedAt);
  let validation: ValidationResult;

  switch (request.source) {
    case "espn_box_score": {
      const parsed = espnSchema.parse(request.payload);
      validation = validateEspnBoxScore(parsed, request.baseline);
      break;
    }
    case "ncaa_stats": {
      const parsed = ncaaSchema.parse(request.payload);
      validation = validateNcaaStats(parsed, request.baseline);
      break;
    }
    case "pitch_tracking": {
      const parsed = pitchTrackingSchema.parse(request.payload);
      validation = validatePitchTracking(parsed, request.baseline);
      break;
    }
    case "game_simulator": {
      const parsed = simulatorSchema.parse(request.payload);
      validation = validateSimulator(parsed, request.baseline);
      break;
    }
    default: {
      throw new Error(`Unsupported data source: ${request.source}`);
    }
  }

  const totalRecords = Math.max(
    validation.metrics.sampleSize ?? 0,
    request.source === "espn_box_score"
      ? (request.payload as EspnBoxScorePayload).batting.length
      : request.source === "ncaa_stats"
      ? (request.payload as NcaaStatsPayload).teams.length
      : request.source === "pitch_tracking"
      ? (request.payload as PitchTrackingPayload).pitches.length
      : request.source === "game_simulator"
      ? (request.payload as GameSimulatorPayload).results.length
      : 0,
  );

  const confidence = inferConfidence(validation.checks, validation.outliers, totalRecords);
  const filteredCount = validation.filteredRecords.length;
  const summary: QcSummary = {
    recordsEvaluated: totalRecords,
    recordsFlagged: validation.flaggedRecords.size,
    recordsFiltered: filteredCount,
    filteredPercentage: totalRecords === 0 ? 0 : Number(((filteredCount / totalRecords) * 100).toFixed(2)),
  };

  return {
    source: request.source,
    sport: request.sport,
    generatedAt: new Date().toISOString(),
    metadata: {
      sourceUrl: request.sourceUrl,
      scrapedAt: chicagoIso,
      timezone: "America/Chicago",
      confidence,
    },
    summary,
    checks: validation.checks,
    outliers: validation.outliers,
    distribution: validation.distribution,
    recommendations: validation.recommendations,
    filteredRecords: validation.filteredRecords,
    rawMetrics: validation.metrics,
    baseline: request.baseline,
  };
};

export type { ValidationResult };
