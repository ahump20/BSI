export type ChampionDimensionId =
  | 'clutch_gene'
  | 'killer_instinct'
  | 'flow_state'
  | 'mental_fortress'
  | 'predator_mindset'
  | 'champion_aura'
  | 'winner_dna'
  | 'beast_mode';

export interface ChampionDimensionDefinition {
  id: ChampionDimensionId;
  name: string;
  description: string;
  primarySignals: string[];
  biometricCorrelates: string[];
  validationChecks: string[];
}

export interface DimensionScore {
  value: number;
  confidence: number;
  evidence: string[];
}

export type ChampionProfile = Record<ChampionDimensionId, DimensionScore>;

export interface ValidationResult<T> {
  valid: boolean;
  errors: string[];
  data?: T;
}

export const CHAMPION_DIMENSIONS: ChampionDimensionDefinition[] = [
  {
    id: 'clutch_gene',
    name: 'Clutch Gene',
    description:
      'Ability to elevate execution quality in high-leverage moments with scoreboard pressure.',
    primarySignals: [
      'Win probability added in final 3 outs/2 minutes',
      'Heart rate variability stability when leverage index > 2.0',
      'Decision latency compared to personal season baseline',
    ],
    biometricCorrelates: [
      'HRV drift < 5% during high leverage',
      'Pupil dilation variance < 3%',
      'Reduced blink rate per minute',
    ],
    validationChecks: [
      'Confirm leverage-tagged play-by-play feed ingestion',
      'Cross-check biometric stream timestamps with play events',
      'Require minimum 20 high leverage samples',
    ],
  },
  {
    id: 'killer_instinct',
    name: 'Killer Instinct',
    description: 'Tendency to convert advantage states into wins without regression.',
    primarySignals: [
      'Conversion rate when leading by ≤ 2',
      'Aggressive decision frequency (swing %, blitz rate, steal attempts)',
      'Post-error bounce-back sequence quality',
    ],
    biometricCorrelates: [
      'Galvanic skin response baseline return < 90 seconds',
      'Reduced variability in breath rate',
      'Consistent grip force within ±8%',
    ],
    validationChecks: [
      'Validate opponent strength adjusted metrics',
      'Ensure biometric sensor calibration < 24 hours old',
      'Minimum 5-game trailing sample window',
    ],
  },
  {
    id: 'flow_state',
    name: 'Flow State',
    description: 'Capacity to maintain automatic, high-efficiency execution without overthinking.',
    primarySignals: [
      'Reaction times within 1 standard deviation of best career mark',
      'Smooth pursuit eye tracking (saccade frequency < 20/min)',
      'Self-report RPE within target band',
    ],
    biometricCorrelates: [
      'Theta/beta EEG ratio in optimal zone',
      'Heart coherence score > 0.65',
      'Respiration cadence 4-6 breaths/minute',
    ],
    validationChecks: [
      'EEG data must pass artifact rejection',
      'Respiration strap dropout < 2%',
      'Survey completion within 15 minutes of session',
    ],
  },
  {
    id: 'mental_fortress',
    name: 'Mental Fortress',
    description: 'Resilience to adversity, recovery from mistakes, and error compartmentalisation.',
    primarySignals: [
      'Performance delta after negative events',
      'Self-talk sentiment analysis staying positive/neutral',
      'Sleep quality index within acceptable range',
    ],
    biometricCorrelates: [
      'Cortisol slope normalized to circadian baseline',
      'HRV recovery to baseline within 12 hours',
      'Slow-wave sleep ≥ 90 minutes per night',
    ],
    validationChecks: [
      'Validate sleep wearable sync within 6 hours of wake-up',
      'Require linguistic model traceability for sentiment',
      'Flag if less than 3 adversity events tracked',
    ],
  },
  {
    id: 'predator_mindset',
    name: 'Predator Mindset',
    description:
      'Strategic aggression: sensing vulnerability and attacking with timing discipline.',
    primarySignals: [
      'Anticipatory movement advantage (first step lead > 0.15s)',
      'Pre-pitch stance adjustments frequency',
      'Tactical decision success % when given go/no-go autonomy',
    ],
    biometricCorrelates: [
      'Micro-expression threat detection accuracy',
      'Peripheral vision breadth (degrees)',
      'Stable lactate levels during aggressive bursts',
    ],
    validationChecks: [
      'Confirm video tagging at 120fps minimum',
      'Peripheral sensors recalibrated weekly',
      'Link lactate sample IDs to session metadata',
    ],
  },
  {
    id: 'champion_aura',
    name: 'Champion Aura',
    description: 'Influence on teammates and opponents via posture, communication, and energy.',
    primarySignals: [
      'Teammate performance uplift when on field',
      'Vocal leadership sentiment score',
      'Body language dominance index (chin angle, shoulder set)',
    ],
    biometricCorrelates: [
      'EMG readings for posture stability',
      'Voice biometrics amplitude consistency',
      'Thermal imaging for composure markers',
    ],
    validationChecks: [
      'Ensure optical tracking for posture > 60 fps',
      'Voice capture must meet SNR thresholds',
      'Thermal camera calibration < 48 hours old',
    ],
  },
  {
    id: 'winner_dna',
    name: 'Winner DNA',
    description:
      'Consistency of elite habits, preparation, and adaptability under new scouting reports.',
    primarySignals: [
      'Pre-game routine adherence score',
      'Scouting report adjustment latency',
      'Nutritional compliance logs',
    ],
    biometricCorrelates: [
      'Glucose variability < target threshold',
      'Sleep regularity index > 80',
      'Training load monotony within safe range',
    ],
    validationChecks: [
      'Nutrition data verified via photo or coach sign-off',
      'Sync training load from wearables daily',
      'Cross-check scout adjustments with video annotations',
    ],
  },
  {
    id: 'beast_mode',
    name: 'Beast Mode',
    description: 'Peak intensity bursts where physical output spikes without mechanical breakdown.',
    primarySignals: [
      'Max-effort velocity / power output percentiles',
      'Contact quality during full-intent swings',
      'Defensive range bursts captured on tracking',
    ],
    biometricCorrelates: [
      'Blood lactate clearance rate',
      'Muscle oxygenation sustainment',
      'Force plate asymmetry < 5% at max load',
    ],
    validationChecks: [
      'Force plate calibration logs within 72 hours',
      'Validate wearable placement via session photos',
      'Ensure session flagged as max intent',
    ],
  },
];

export interface DecisionVelocityPhase {
  id: 'perception' | 'processing' | 'decision' | 'execution';
  name: string;
  optimalRangeMs: [number, number];
  description: string;
  instrumentation: string[];
}

export const DECISION_VELOCITY_PHASES: DecisionVelocityPhase[] = [
  {
    id: 'perception',
    name: 'Perception',
    optimalRangeMs: [80, 160],
    description: 'Time to visually recognize the stimulus once presented.',
    instrumentation: [
      'Saccade tracking',
      'Retina-fovea alignment cameras',
      'Peripheral cue sensors',
    ],
  },
  {
    id: 'processing',
    name: 'Processing',
    optimalRangeMs: [120, 220],
    description: 'Cognitive synthesis of scouting data and game context.',
    instrumentation: ['EEG focus band', 'Cognitive workload estimator', 'Playbook query logs'],
  },
  {
    id: 'decision',
    name: 'Decision',
    optimalRangeMs: [90, 180],
    description: 'Selection of the executable option based on probability advantage.',
    instrumentation: [
      'Neural response mapper',
      'Option tree analytics',
      'Haptic confirmation device',
    ],
  },
  {
    id: 'execution',
    name: 'Execution',
    optimalRangeMs: [110, 210],
    description: 'Motor command release and first physical action.',
    instrumentation: ['EMG surface sensors', 'Force plates', 'Motion capture trigger'],
  },
];

export interface DecisionVelocitySnapshot {
  phases: Record<DecisionVelocityPhase['id'], number>;
  decisionLagMs: number;
  sampleCount: number;
  capturedAt: string;
}

export interface PatternRecognitionLevel {
  tier: 1 | 2 | 3 | 4 | 5;
  label: string;
  description: string;
  measurableIndicators: string[];
  requiredEvidence: string[];
}

export const PATTERN_RECOGNITION_LEVELS: PatternRecognitionLevel[] = [
  {
    tier: 1,
    label: 'Basic Formation Recognition',
    description: 'Identifies static alignments and base coverages within 1.0s.',
    measurableIndicators: [
      'Formation identification accuracy ≥ 85%',
      'Pre-pitch callouts logged in communication system',
    ],
    requiredEvidence: ['Tagged video review', 'Coach validation checklist'],
  },
  {
    tier: 2,
    label: 'Tendency Identification',
    description: 'Understands historical tendencies tied to personnel or count.',
    measurableIndicators: ['Predictive tagging accuracy ≥ 70%', 'Adjustments applied pre-event'],
    requiredEvidence: ['Playbook note sync', 'Opponent database queries'],
  },
  {
    tier: 3,
    label: 'Predictive Analysis',
    description: 'Projects next action using contextual analytics and in-game signals.',
    measurableIndicators: [
      'Action probability model calibration error < 0.1',
      'Counter call success rate ≥ 65%',
    ],
    requiredEvidence: ['Real-time model output logs', 'Coach override approvals'],
  },
  {
    tier: 4,
    label: 'Elite Anticipation',
    description: 'Initiates counter before opponent commitment with minimal false starts.',
    measurableIndicators: ['False-positive rate < 8%', 'Advantage play success rate ≥ 75%'],
    requiredEvidence: ['Motion capture of early movement', 'Opponent communication sniffed'],
  },
  {
    tier: 5,
    label: 'Championship-Level Intuition',
    description: 'Combines film, lived reps, and micro-signals to dictate tempo.',
    measurableIndicators: [
      'Opposition EPA delta ≥ +4.0 when athlete on field',
      'Clutch conversion rate ≥ 80%',
    ],
    requiredEvidence: ['Post-game debrief transcripts', 'Verified biometric calm markers'],
  },
];

export interface PatternRecognitionSnapshot {
  tier: PatternRecognitionLevel['tier'];
  confidence: number;
  signalsTracked: number;
  evidenceIds: string[];
  updatedAt: string;
}

export interface CognitiveLoadChannel {
  id: string;
  description: string;
}

export const COGNITIVE_LOAD_CHANNELS: CognitiveLoadChannel[] = [
  {
    id: 'visual_processing',
    description: 'Tracking ball flight, pitch shape, and defensive alignments.',
  },
  { id: 'motor_planning', description: 'Preparing swing, throw, or footwork sequences.' },
  { id: 'communication', description: 'Coordinating signals, audibles, and cues.' },
  { id: 'tactical_reasoning', description: 'Updating strategy trees and probability states.' },
  { id: 'recovery', description: 'Breathing cadence, reset routines, and emotional regulation.' },
];

export interface CognitiveLoadSnapshot {
  distribution: Record<string, number>;
  sampleWindowSeconds: number;
  telemetryId: string;
  capturedAt: string;
}

export interface BlazeIntelligenceModule {
  id: string;
  name: string;
  description: string;
  inputs: string[];
  outputs: string[];
  validationHooks: string[];
}

export const BLAZE_INTELLIGENCE_OS_MODULES: BlazeIntelligenceModule[] = [
  {
    id: 'mcp_orchestration',
    name: 'Micro-service Control Platform',
    description:
      'Schedules and orchestrates workloads across cognitive, biomechanical, and scouting services.',
    inputs: ['Coach commands', 'Scheduling rules', 'System health signals'],
    outputs: ['Service runbooks', 'Telemetry heartbeats', 'Load balancing directives'],
    validationHooks: ['Heartbeat threshold monitors', 'Runbook checksum verification'],
  },
  {
    id: 'multi_sport_analytics',
    name: 'Multi-Sport Analytics Layer',
    description:
      'Shared analytics stack covering baseball, football, and basketball pattern engines.',
    inputs: ['Sport-specific data adapters', 'Shared feature store'],
    outputs: ['Normalized metrics', 'Cross-sport benchmarking dashboards'],
    validationHooks: ['Schema drift detection', 'Feature store freshness checks'],
  },
  {
    id: 'cultural_archetype_model',
    name: 'Cultural Archetype Modeling',
    description: 'Injects regional/team psychology into decision surfaces.',
    inputs: ['Qualitative scouting reports', 'Fanbase sentiment', 'Historical performance'],
    outputs: ['Archetype weights', 'Narrative-informed alerts'],
    validationHooks: ['Sentiment classifier calibration', 'Qual report provenance audit'],
  },
];

export interface NilValuationSnapshot {
  athleteId: string;
  brandScore: number;
  performanceScore: number;
  socialMomentumScore: number;
  marketAdjustment: number;
  projectedMonthlyValue: number;
  updatedAt: string;
  confidence: number;
}

export interface BlazeBackyardSession {
  athleteId: string;
  gameId: string;
  sessionId: string;
  telemetry: {
    reactionTimeMs: number;
    patternAccuracy: number;
    decisionVelocityMs: number;
  };
  swingPlaneCorrelation: number;
  transferConfidence: number;
  capturedAt: string;
}

export interface QuantumPerformanceSnapshot {
  athleteId: string;
  championProfile: ChampionProfile;
  decisionVelocity: DecisionVelocitySnapshot;
  patternRecognition: PatternRecognitionSnapshot;
  cognitiveLoad: CognitiveLoadSnapshot;
  nilValuation?: NilValuationSnapshot;
  culturalArchetype: string;
  timestamp: string;
}

export interface CulturalArchetypeDefinition {
  id: string;
  label: string;
  description: string;
  psychologicalEdges: string[];
  operationalGuardrails: string[];
}

export const CULTURAL_ARCHETYPES: CulturalArchetypeDefinition[] = [
  {
    id: 'titans_defensive_resilience',
    label: 'Titans — Defensive Resilience',
    description: 'Built on chaos resistance, thrives in low-scoring grinders.',
    psychologicalEdges: [
      'Confidence under duress',
      'Commitment to film study',
      'High trust in scheme',
    ],
    operationalGuardrails: [
      'Limit explosive risk-taking early',
      'Prioritize communication bandwidth',
    ],
  },
  {
    id: 'grizzlies_grit_grind',
    label: 'Grizzlies — Grit & Grind',
    description: 'Every rep is contact. Emphasizes blue-collar repetition and physical imposition.',
    psychologicalEdges: [
      'Relentless second efforts',
      'Team accountability loops',
      'High tolerance for pain',
    ],
    operationalGuardrails: ['Manage cumulative load', 'Balance aggression with control cues'],
  },
  {
    id: 'longhorns_precision_execution',
    label: 'Longhorns — Precision Execution',
    description: 'Obsessive about detail, script, and data-driven control.',
    psychologicalEdges: ['Scouting discipline', 'On-field adjustments', 'Process obsession'],
    operationalGuardrails: ['Beware overfitting to plan', 'Schedule decompression resets'],
  },
  {
    id: 'cardinals_consistent_excellence',
    label: 'Cardinals — Consistent Excellence',
    description: 'Steady climb built on fundamentals, depth, and cultural stability.',
    psychologicalEdges: [
      'Next-player-up mindset',
      'Smooth leadership transitions',
      'Habits > hype',
    ],
    operationalGuardrails: ['Continuously audit fundamentals', 'Guard against complacency'],
  },
];

export interface UnifiedFeedSource {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  refreshCadenceSeconds: number;
  schemaVersion: string;
}

export const UNIFIED_SPORTS_INTELLIGENCE_FEED: UnifiedFeedSource[] = [
  {
    id: 'mcp_servers',
    name: 'MCP Servers',
    description: 'Micro-service telemetry for scheduling, ingest, and task execution.',
    endpoint: 'wss://mcp.blaze.internal/telemetry',
    refreshCadenceSeconds: 15,
    schemaVersion: '2025.10.01',
  },
  {
    id: 'github_logs',
    name: 'GitHub Logs',
    description: 'Deployment events, CI runs, and issue state changes.',
    endpoint: 'https://api.github.com/orgs/blazesportsintel/events',
    refreshCadenceSeconds: 60,
    schemaVersion: '2025.09.12',
  },
  {
    id: 'realtime_api',
    name: 'Real-time API',
    description: 'Live stats, biometric streams, and ingest QA alerts.',
    endpoint: 'wss://realtime.blaze.sports/api/v1/feed',
    refreshCadenceSeconds: 10,
    schemaVersion: '2025.10.05',
  },
];

const ISO_8601_REGEX = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)$/;

function isIsoDate(value: string): boolean {
  return ISO_8601_REGEX.test(value);
}

function ensureInRange(value: number, min: number, max: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max;
}

export function validateChampionProfile(input: unknown): ValidationResult<ChampionProfile> {
  const errors: string[] = [];
  if (typeof input !== 'object' || input === null) {
    return { valid: false, errors: ['Champion profile must be an object.'] };
  }

  const profile = input as Record<string, unknown>;
  const expectedKeys = new Set(CHAMPION_DIMENSIONS.map((d) => d.id));

  for (const dimension of expectedKeys) {
    if (!(dimension in profile)) {
      errors.push(`Missing dimension: ${dimension}`);
      continue;
    }

    const value = profile[dimension];
    if (typeof value !== 'object' || value === null) {
      errors.push(`Dimension ${dimension} must be an object with value/confidence/evidence.`);
      continue;
    }

    const { value: score, confidence, evidence } = value as Record<string, unknown>;

    if (!ensureInRange(Number(score), 0, 100)) {
      errors.push(`Dimension ${dimension} value must be between 0 and 100.`);
    }

    if (!ensureInRange(Number(confidence), 0, 1)) {
      errors.push(`Dimension ${dimension} confidence must be between 0 and 1.`);
    }

    if (
      !Array.isArray(evidence) ||
      evidence.length === 0 ||
      evidence.some((item) => typeof item !== 'string' || item.trim() === '')
    ) {
      errors.push(`Dimension ${dimension} evidence must be an array of non-empty strings.`);
    }
  }

  for (const key of Object.keys(profile)) {
    if (!expectedKeys.has(key as ChampionDimensionId)) {
      errors.push(`Unexpected dimension key: ${key}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? (profile as ChampionProfile) : undefined,
  };
}

export function validateDecisionVelocitySnapshot(
  input: unknown
): ValidationResult<DecisionVelocitySnapshot> {
  const errors: string[] = [];
  if (typeof input !== 'object' || input === null) {
    return { valid: false, errors: ['Decision velocity snapshot must be an object.'] };
  }

  const snapshot = input as Record<string, unknown>;
  const { phases, decisionLagMs, sampleCount, capturedAt } = snapshot;

  if (typeof phases !== 'object' || phases === null) {
    errors.push('phases must be an object keyed by phase id.');
  } else {
    for (const phase of DECISION_VELOCITY_PHASES) {
      const value = (phases as Record<string, unknown>)[phase.id];
      if (!Number.isFinite(value)) {
        errors.push(`Phase ${phase.id} must be a finite number.`);
        continue;
      }
      if (Number(value) < 0) {
        errors.push(`Phase ${phase.id} cannot be negative.`);
      }
    }
  }

  if (!Number.isFinite(decisionLagMs) || (decisionLagMs as number) < 0) {
    errors.push('decisionLagMs must be a non-negative number.');
  }

  if (!Number.isInteger(sampleCount) || (sampleCount as number) <= 0) {
    errors.push('sampleCount must be a positive integer.');
  }

  if (typeof capturedAt !== 'string' || !isIsoDate(capturedAt)) {
    errors.push('capturedAt must be an ISO-8601 timestamp in UTC.');
  }

  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? (snapshot as unknown as DecisionVelocitySnapshot) : undefined,
  };
}

export function validatePatternRecognitionSnapshot(
  input: unknown
): ValidationResult<PatternRecognitionSnapshot> {
  const errors: string[] = [];
  if (typeof input !== 'object' || input === null) {
    return { valid: false, errors: ['Pattern recognition snapshot must be an object.'] };
  }

  const snapshot = input as Record<string, unknown>;
  const { tier, confidence, signalsTracked, evidenceIds, updatedAt } = snapshot;

  const tiers = PATTERN_RECOGNITION_LEVELS.map((level) => level.tier);
  if (!tiers.includes(tier as PatternRecognitionSnapshot['tier'])) {
    errors.push('tier must be one of the defined pattern recognition tiers.');
  }

  if (!ensureInRange(Number(confidence), 0, 1)) {
    errors.push('confidence must be between 0 and 1.');
  }

  if (!Number.isInteger(signalsTracked) || (signalsTracked as number) < 0) {
    errors.push('signalsTracked must be a non-negative integer.');
  }

  if (
    !Array.isArray(evidenceIds) ||
    evidenceIds.some((id) => typeof id !== 'string' || id.trim() === '')
  ) {
    errors.push('evidenceIds must be an array of non-empty strings.');
  }

  if (typeof updatedAt !== 'string' || !isIsoDate(updatedAt)) {
    errors.push('updatedAt must be an ISO-8601 timestamp in UTC.');
  }

  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? (snapshot as unknown as PatternRecognitionSnapshot) : undefined,
  };
}

export function validateCognitiveLoadSnapshot(
  input: unknown
): ValidationResult<CognitiveLoadSnapshot> {
  const errors: string[] = [];
  if (typeof input !== 'object' || input === null) {
    return { valid: false, errors: ['Cognitive load snapshot must be an object.'] };
  }

  const snapshot = input as Record<string, unknown>;
  const { distribution, sampleWindowSeconds, telemetryId, capturedAt } = snapshot;

  if (typeof distribution !== 'object' || distribution === null) {
    errors.push('distribution must be an object.');
  } else {
    const total = Object.values(distribution as Record<string, unknown>).reduce(
      (sum: number, value) => {
        if (!Number.isFinite(value)) {
          errors.push('All distribution values must be numbers.');
          return sum;
        }
        if (Number(value) < 0) {
          errors.push('Distribution values cannot be negative.');
        }
        return sum + (value as number);
      },
      0
    );

    if (errors.length === 0 && Math.abs((total as number) - 100) > 0.5) {
      errors.push('Distribution percentages must total 100 ±0.5.');
    }
  }

  if (!Number.isFinite(sampleWindowSeconds) || (sampleWindowSeconds as number) <= 0) {
    errors.push('sampleWindowSeconds must be a positive number.');
  }

  if (typeof telemetryId !== 'string' || telemetryId.trim() === '') {
    errors.push('telemetryId must be a non-empty string.');
  }

  if (typeof capturedAt !== 'string' || !isIsoDate(capturedAt)) {
    errors.push('capturedAt must be an ISO-8601 timestamp in UTC.');
  }

  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? (snapshot as unknown as CognitiveLoadSnapshot) : undefined,
  };
}

export function validateNilValuationSnapshot(
  input: unknown
): ValidationResult<NilValuationSnapshot> {
  const errors: string[] = [];
  if (typeof input !== 'object' || input === null) {
    return { valid: false, errors: ['NIL valuation snapshot must be an object.'] };
  }

  const snapshot = input as Record<string, unknown>;
  const {
    athleteId,
    brandScore,
    performanceScore,
    socialMomentumScore,
    marketAdjustment,
    projectedMonthlyValue,
    updatedAt,
    confidence,
  } = snapshot;

  if (typeof athleteId !== 'string' || athleteId.trim() === '') {
    errors.push('athleteId must be a non-empty string.');
  }

  if (!ensureInRange(Number(brandScore), 0, 100)) {
    errors.push('brandScore must be between 0 and 100.');
  }

  if (!ensureInRange(Number(performanceScore), 0, 100)) {
    errors.push('performanceScore must be between 0 and 100.');
  }

  if (!ensureInRange(Number(socialMomentumScore), 0, 100)) {
    errors.push('socialMomentumScore must be between 0 and 100.');
  }

  if (!Number.isFinite(marketAdjustment)) {
    errors.push('marketAdjustment must be a finite number.');
  }

  if (!Number.isFinite(projectedMonthlyValue) || (projectedMonthlyValue as number) < 0) {
    errors.push('projectedMonthlyValue must be a non-negative number.');
  }

  if (typeof updatedAt !== 'string' || !isIsoDate(updatedAt)) {
    errors.push('updatedAt must be an ISO-8601 timestamp in UTC.');
  }

  if (!ensureInRange(Number(confidence), 0, 1)) {
    errors.push('confidence must be between 0 and 1.');
  }

  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? (snapshot as unknown as NilValuationSnapshot) : undefined,
  };
}

export function validateBlazeBackyardSession(
  input: unknown
): ValidationResult<BlazeBackyardSession> {
  const errors: string[] = [];
  if (typeof input !== 'object' || input === null) {
    return { valid: false, errors: ['Blaze Backyard session must be an object.'] };
  }

  const session = input as Record<string, unknown>;
  const {
    athleteId,
    gameId,
    sessionId,
    telemetry,
    swingPlaneCorrelation,
    transferConfidence,
    capturedAt,
  } = session;

  if (typeof athleteId !== 'string' || athleteId.trim() === '') {
    errors.push('athleteId must be a non-empty string.');
  }

  if (typeof gameId !== 'string' || gameId.trim() === '') {
    errors.push('gameId must be a non-empty string.');
  }

  if (typeof sessionId !== 'string' || sessionId.trim() === '') {
    errors.push('sessionId must be a non-empty string.');
  }

  if (typeof telemetry !== 'object' || telemetry === null) {
    errors.push('telemetry must be an object.');
  } else {
    const { reactionTimeMs, patternAccuracy, decisionVelocityMs } = telemetry as Record<
      string,
      unknown
    >;
    if (!Number.isFinite(reactionTimeMs) || (reactionTimeMs as number) < 0) {
      errors.push('telemetry.reactionTimeMs must be a non-negative number.');
    }
    if (!ensureInRange(Number(patternAccuracy), 0, 1)) {
      errors.push('telemetry.patternAccuracy must be between 0 and 1.');
    }
    if (!Number.isFinite(decisionVelocityMs) || (decisionVelocityMs as number) <= 0) {
      errors.push('telemetry.decisionVelocityMs must be a positive number.');
    }
  }

  if (!ensureInRange(Number(swingPlaneCorrelation), -1, 1)) {
    errors.push('swingPlaneCorrelation must be between -1 and 1.');
  }

  if (!ensureInRange(Number(transferConfidence), 0, 1)) {
    errors.push('transferConfidence must be between 0 and 1.');
  }

  if (typeof capturedAt !== 'string' || !isIsoDate(capturedAt)) {
    errors.push('capturedAt must be an ISO-8601 timestamp in UTC.');
  }

  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? (session as unknown as BlazeBackyardSession) : undefined,
  };
}

export function validateQuantumPerformanceSnapshot(
  input: unknown
): ValidationResult<QuantumPerformanceSnapshot> {
  const errors: string[] = [];
  if (typeof input !== 'object' || input === null) {
    return { valid: false, errors: ['Quantum performance snapshot must be an object.'] };
  }

  const snapshot = input as Record<string, unknown>;
  const {
    athleteId,
    championProfile,
    decisionVelocity,
    patternRecognition,
    cognitiveLoad,
    nilValuation,
    culturalArchetype,
    timestamp,
  } = snapshot;

  if (typeof athleteId !== 'string' || athleteId.trim() === '') {
    errors.push('athleteId must be a non-empty string.');
  }

  if (
    typeof culturalArchetype !== 'string' ||
    !CULTURAL_ARCHETYPES.some((arch) => arch.id === culturalArchetype)
  ) {
    errors.push('culturalArchetype must match a defined archetype id.');
  }

  if (typeof timestamp !== 'string' || !isIsoDate(timestamp)) {
    errors.push('timestamp must be an ISO-8601 timestamp in UTC.');
  }

  const championResult = validateChampionProfile(championProfile);
  if (!championResult.valid) {
    errors.push(...championResult.errors.map((err) => `championProfile: ${err}`));
  }

  const decisionResult = validateDecisionVelocitySnapshot(decisionVelocity);
  if (!decisionResult.valid) {
    errors.push(...decisionResult.errors.map((err) => `decisionVelocity: ${err}`));
  }

  const patternResult = validatePatternRecognitionSnapshot(patternRecognition);
  if (!patternResult.valid) {
    errors.push(...patternResult.errors.map((err) => `patternRecognition: ${err}`));
  }

  const cognitiveResult = validateCognitiveLoadSnapshot(cognitiveLoad);
  if (!cognitiveResult.valid) {
    errors.push(...cognitiveResult.errors.map((err) => `cognitiveLoad: ${err}`));
  }

  if (nilValuation !== undefined) {
    const nilResult = validateNilValuationSnapshot(nilValuation);
    if (!nilResult.valid) {
      errors.push(...nilResult.errors.map((err) => `nilValuation: ${err}`));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? (snapshot as unknown as QuantumPerformanceSnapshot) : undefined,
  };
}
