/**
 * Diamond Certainty Engine™
 * Quantifies eight champion dimensions by fusing visual, physiological, and performance telemetry.
 * Mobile-first, data-driven, auditable scoring for college baseball decision makers.
 */

export type ChampionDimensionKey =
  | 'clutchGene'
  | 'killerInstinct'
  | 'flowState'
  | 'mentalFortress'
  | 'predatorMindset'
  | 'championAura'
  | 'winnerDNA'
  | 'beastMode'

export type ScoreSource =
  | 'micro_expression'
  | 'body_language'
  | 'physiological'
  | 'performance'
  | 'context'

export interface MicroExpressionSnapshot {
  timestamp: string
  expression:
    | 'focus'
    | 'determination'
    | 'confidence'
    | 'joy'
    | 'anger'
    | 'anxiety'
    | 'doubt'
    | 'neutral'
  intensity: number // 0-1
  durationMs: number
  confidence: number // 0-1 detection confidence
  valence: number // -1 (negative) to 1 (positive)
  arousal: number // 0-1
  situation: 'baseline' | 'pressure' | 'celebration' | 'adversity'
}

export interface BodyLanguageSnapshot {
  timestamp: string
  postureScore: number // 0-1 (upright to slouched)
  eyeContactScore: number // 0-1 (locked in vs avoiding)
  movementSharpness: number // 0-1 (decisive vs sluggish)
  composureScore: number // 0-1 (relaxed vs jittery)
  dominanceIndex: number // 0-1 (command presence)
  energyLevel: number // 0-1 (lethargic vs charged)
  sidelineInfluence?: number // 0-1 (leadership imprint)
}

export interface PhysiologicalSample {
  timestamp: string
  heartRate: number
  heartRateBaseline?: number
  heartRateVariability: number // ms
  respirationRate?: number // breaths/min
  stressIndex: number // 0-100 (Baevsky or similar)
  skinConductance?: number // microsiemens
  lactateLevel?: number // mmol/L
}

export interface PerformancePlay {
  timestamp: string
  leverage: number // 0-10 (6+ = high leverage)
  outcome: 'success' | 'failure'
  winProbabilityAdded: number // -100..100 basis points
  difficulty: number // 0-1
  phase: 'early' | 'middle' | 'late' | 'extra'
  aggressionFactor: number // 0-1 (swing rate, steal attempt, etc.)
  reactionTimeMs?: number
  impactScore?: number // 0-100 instantaneous impact
  recoveryTimeSec?: number // time to reset after failure
}

export interface ResumeSignals {
  clutchWinPct?: number
  seriesCloseRate?: number
  eliminationRecord?: { wins: number; losses: number }
  championshipAppearances?: number
  consecutiveWins?: number
  seasonWinPct?: number
  roadWinPct?: number
}

export interface DiamondCertaintyInput {
  athleteId: string
  sampleWindow: { start: string; end: string }
  microExpressions: MicroExpressionSnapshot[]
  bodyLanguage: BodyLanguageSnapshot[]
  physiological: PhysiologicalSample[]
  performance: PerformancePlay[]
  resume?: ResumeSignals
  context?: {
    opponentStrength?: number // 0-1 (1 = top-5 level)
    fatigueIndex?: number // 0-1 (1 = fresh, 0 = exhausted)
    venueType?: 'home' | 'road' | 'neutral'
  }
}

export interface ScoreContribution {
  source: ScoreSource
  metric: string
  rawScore: number
  weight: number
  weightedScore: number
  rationale: string
}

export interface DimensionScore {
  key: ChampionDimensionKey
  score: number
  tier: 'generational' | 'elite' | 'ascendant' | 'developing'
  contributions: ScoreContribution[]
}

export interface DiamondCertaintyReport {
  athleteId: string
  window: { start: string; end: string }
  dimensions: Record<ChampionDimensionKey, DimensionScore>
  overallScore: number
  confidence: number
  auditTrail: Array<{
    dimension: ChampionDimensionKey
    contributions: ScoreContribution[]
  }>
}

const clamp = (value: number, min = 0, max = 100) => Math.min(Math.max(value, min), max)

const round = (value: number, precision = 2) =>
  Math.round((value + Number.EPSILON) * Math.pow(10, precision)) / Math.pow(10, precision)

const safeAverage = (values: number[], fallback = 0) => {
  if (!values.length) return fallback
  const sum = values.reduce((acc, val) => acc + val, 0)
  return sum / values.length
}

const rateToScore = (rate: number, floor = 0.3, ceiling = 0.8) => {
  if (rate <= floor) return 20 * (rate / Math.max(floor, 1e-6))
  if (rate >= ceiling) return 90 + 10 * Math.min((rate - ceiling) / Math.max(1 - ceiling, 1e-6), 1)
  const scaled = (rate - floor) / (ceiling - floor)
  return clamp(30 + scaled * 60)
}

const normalizedDiff = (value: number, baseline: number, tolerance: number) => {
  if (baseline === 0 && value === 0) return 50
  const diff = value - baseline
  const normalized = 50 + (diff / Math.max(tolerance, 1e-6)) * 25
  return clamp(normalized)
}

const stressResilienceScore = (samples: PhysiologicalSample[]) => {
  if (!samples.length) return 50
  const avgStress = safeAverage(samples.map(sample => sample.stressIndex))
  const baseline = safeAverage(
    samples.map(sample => sample.heartRateBaseline ?? sample.stressIndex * 0.6)
  )
  const trendScore = normalizedDiff(baseline, avgStress, 25)
  const hrvScore = clamp((safeAverage(samples.map(sample => sample.heartRateVariability)) / 110) * 100)
  return clamp(trendScore * 0.55 + hrvScore * 0.45)
}

const expressionFocusScore = (snapshots: MicroExpressionSnapshot[], situation: MicroExpressionSnapshot['situation']) => {
  const filtered = snapshots.filter(snap => snap.situation === situation)
  if (!filtered.length) return 50
  const weightedIntensity = safeAverage(
    filtered.map(snap => snap.intensity * snap.confidence * (snap.expression === 'focus' ? 1.1 : 0.9))
  )
  return clamp(weightedIntensity * 100)
}

const expressionAggressionScore = (snapshots: MicroExpressionSnapshot[]) => {
  const aggressive = snapshots.filter(snap => ['determination', 'anger'].includes(snap.expression))
  if (!aggressive.length) return 45
  const weighted = safeAverage(
    aggressive.map(snap => snap.intensity * (snap.expression === 'anger' ? 0.9 : 1.05) * snap.arousal)
  )
  return clamp(35 + weighted * 65)
}

const bodyLanguageDominanceScore = (snapshots: BodyLanguageSnapshot[]) => {
  if (!snapshots.length) return 50
  const posture = safeAverage(snapshots.map(snap => snap.postureScore))
  const eyeContact = safeAverage(snapshots.map(snap => snap.eyeContactScore))
  const dominance = safeAverage(snapshots.map(snap => snap.dominanceIndex))
  return clamp((posture * 0.3 + eyeContact * 0.25 + dominance * 0.45) * 100)
}

const bodyLanguageComposureScore = (snapshots: BodyLanguageSnapshot[]) => {
  if (!snapshots.length) return 50
  const composure = safeAverage(snapshots.map(snap => snap.composureScore))
  const movement = safeAverage(snapshots.map(snap => snap.movementSharpness))
  return clamp((composure * 0.65 + movement * 0.35) * 100)
}

const aggressionConversionScore = (plays: PerformancePlay[]) => {
  const aggressivePlays = plays.filter(play => play.aggressionFactor >= 0.6)
  if (!aggressivePlays.length) return 50
  const successRate = safeAverage(aggressivePlays.map(play => (play.outcome === 'success' ? 1 : 0)))
  return rateToScore(successRate, 0.35, 0.7)
}

const clutchPerformanceScore = (plays: PerformancePlay[]) => {
  const highLeveragePlays = plays.filter(play => play.leverage >= 6)
  if (!highLeveragePlays.length) return 50
  const successRate = safeAverage(highLeveragePlays.map(play => (play.outcome === 'success' ? 1 : 0)))
  const wpaAverage = safeAverage(highLeveragePlays.map(play => play.winProbabilityAdded))
  const leverageScore = rateToScore(successRate, 0.3, 0.75)
  const wpaScore = clamp(50 + (wpaAverage / 45) * 45)
  return clamp(leverageScore * 0.6 + wpaScore * 0.4)
}

const flowCoherenceScore = (samples: PhysiologicalSample[]) => {
  if (!samples.length) return 50
  const hrv = clamp((safeAverage(samples.map(sample => sample.heartRateVariability)) / 120) * 100)
  const respiration = clamp(
    (1 - Math.abs(18 - safeAverage(samples.map(sample => sample.respirationRate ?? 18))) / 12) * 100
  )
  const stress = clamp(100 - safeAverage(samples.map(sample => sample.stressIndex)))
  return clamp(hrv * 0.45 + respiration * 0.25 + stress * 0.3)
}

const killerInstinctFromPerformance = (plays: PerformancePlay[]) => {
  const lateAggressive = plays.filter(play => play.phase === 'late' && play.aggressionFactor >= 0.5)
  if (!lateAggressive.length) return 50
  const successRate = safeAverage(lateAggressive.map(play => (play.outcome === 'success' ? 1 : 0)))
  const difficulty = safeAverage(lateAggressive.map(play => play.difficulty))
  const combined = successRate * 0.7 + difficulty * 0.3
  return clamp(30 + combined * 70)
}

const recoveryQuicknessScore = (plays: PerformancePlay[]) => {
  const failed = plays.filter(play => play.outcome === 'failure' && typeof play.recoveryTimeSec === 'number')
  if (!failed.length) return 55
  const avgRecovery = safeAverage(failed.map(play => play.recoveryTimeSec ?? 10))
  const normalized = clamp(100 - (avgRecovery / 15) * 55)
  return normalized
}

const winnerDNAScore = (plays: PerformancePlay[], resume?: ResumeSignals) => {
  const overallRate = rateToScore(
    safeAverage(plays.map(play => (play.outcome === 'success' ? 1 : 0))),
    0.45,
    0.7
  )
  const elimination = resume?.eliminationRecord
  const eliminationRate = elimination
    ? rateToScore(elimination.wins / Math.max(elimination.wins + elimination.losses, 1), 0.4, 0.72)
    : 55
  const seasonWinPct = resume?.seasonWinPct
    ? rateToScore(resume.seasonWinPct, 0.55, 0.75)
    : 60
  const streaks = resume?.consecutiveWins ? clamp(40 + Math.log10(Math.max(resume.consecutiveWins, 1)) * 20) : 55
  return clamp(overallRate * 0.35 + eliminationRate * 0.25 + seasonWinPct * 0.25 + streaks * 0.15)
}

const beastModeScore = (plays: PerformancePlay[], samples: PhysiologicalSample[]) => {
  if (!plays.length) return 50
  const peakImpact = clamp(Math.max(...plays.map(play => play.impactScore ?? 60)))
  const explosivePlays = plays.filter(play => (play.impactScore ?? 0) >= 80)
  const explosiveRate = explosivePlays.length / Math.max(plays.length, 1)
  const physiologicalFuel = clamp(
    (safeAverage(samples.map(sample => sample.lactateLevel ?? 6)) / 12) * 100
  )
  return clamp(peakImpact * 0.5 + explosiveRate * 100 * 0.3 + physiologicalFuel * 0.2)
}

const championAuraScore = (
  bodyLanguage: BodyLanguageSnapshot[],
  expressions: MicroExpressionSnapshot[],
  plays: PerformancePlay[],
  resume?: ResumeSignals
) => {
  const leadership = clamp(
    (safeAverage(bodyLanguage.map(snap => snap.sidelineInfluence ?? 0.5)) * 0.6 +
      safeAverage(bodyLanguage.map(snap => snap.eyeContactScore)) * 0.4) *
      100
  )
  const emotionalCommand = clamp(
    (safeAverage(expressions.map(snap => (snap.valence + 1) / 2)) * 0.4 +
      safeAverage(expressions.map(snap => snap.intensity)) * 0.6) *
      100
  )
  const gameSwing = clamp(
    (safeAverage(plays.map(play => play.winProbabilityAdded)) / 35) * 50 +
      rateToScore(safeAverage(plays.map(play => (play.outcome === 'success' ? 1 : 0))), 0.5, 0.75) * 0.5
  )
  const resumeBoost = resume?.championshipAppearances
    ? clamp(50 + Math.min(resume.championshipAppearances, 5) * 8)
    : 55
  return clamp(leadership * 0.35 + emotionalCommand * 0.25 + gameSwing * 0.2 + resumeBoost * 0.2)
}

const predatorMindsetScore = (
  bodyLanguage: BodyLanguageSnapshot[],
  expressions: MicroExpressionSnapshot[],
  plays: PerformancePlay[]
) => {
  const attackBody = clamp(
    (safeAverage(bodyLanguage.map(snap => snap.energyLevel)) * 0.5 +
      safeAverage(bodyLanguage.map(snap => snap.movementSharpness)) * 0.5) *
      100
  )
  const predExpressions = clamp(
    (expressionAggressionScore(expressions) * 0.7 + expressionFocusScore(expressions, 'pressure') * 0.3)
  )
  const strikeRate = clamp(
    (safeAverage(
      plays
        .filter(play => play.phase !== 'early')
        .map(play => (play.outcome === 'success' ? 1 : 0))
    ) || 0.55) * 100
  )
  return clamp(attackBody * 0.4 + predExpressions * 0.35 + strikeRate * 0.25)
}

const computeTier = (score: number): DimensionScore['tier'] => {
  if (score >= 92) return 'generational'
  if (score >= 80) return 'elite'
  if (score >= 68) return 'ascendant'
  return 'developing'
}

const buildContribution = (
  source: ScoreSource,
  metric: string,
  rawScore: number,
  weight: number,
  rationale: string
): ScoreContribution => ({
  source,
  metric,
  rawScore: round(rawScore, 2),
  weight: round(weight, 2),
  weightedScore: round(rawScore * weight, 2),
  rationale,
})

const aggregateDimension = (
  key: ChampionDimensionKey,
  contributions: ScoreContribution[]
): DimensionScore => {
  const totalWeight = contributions.reduce((acc, item) => acc + item.weight, 0)
  const normalizedContributions = contributions.map(item => {
    const normalizedWeight = item.weight / Math.max(totalWeight, 1e-6)
    return {
      ...item,
      weight: round(normalizedWeight, 2),
      weightedScore: round(item.rawScore * normalizedWeight, 2),
    }
  })
  const score = clamp(
    normalizedContributions.reduce((acc, item) => acc + item.weightedScore, 0)
  )
  return {
    key,
    score: round(score, 2),
    tier: computeTier(score),
    contributions: normalizedContributions,
  }
}

export class DiamondCertaintyEngine {
  static evaluate(input: DiamondCertaintyInput): DiamondCertaintyReport {
    const clutch = aggregateDimension('clutchGene', [
      buildContribution(
        'performance',
        'high_leverage_conversion',
        clutchPerformanceScore(input.performance),
        0.5,
        'Conversion rate and win probability swing in 6+ leverage snaps'
      ),
      buildContribution(
        'physiological',
        'stress_resilience',
        stressResilienceScore(input.physiological),
        0.25,
        'Heart rate variability and stress trend compared to baseline'
      ),
      buildContribution(
        'micro_expression',
        'pressure_focus',
        expressionFocusScore(input.microExpressions, 'pressure'),
        0.25,
        'Focus micro-expressions captured during late leverage possessions'
      ),
    ])

    const killer = aggregateDimension('killerInstinct', [
      buildContribution(
        'performance',
        'late_game_aggression',
        killerInstinctFromPerformance(input.performance),
        0.45,
        'Aggressive decisions and conversion rate when the game is late and tight'
      ),
      buildContribution(
        'body_language',
        'dominance',
        bodyLanguageDominanceScore(input.bodyLanguage),
        0.3,
        'Shoulder line, eye contact, and command presence readings'
      ),
      buildContribution(
        'micro_expression',
        'predatory_intensity',
        expressionAggressionScore(input.microExpressions),
        0.25,
        'Determination micro-signals detected pre-contact and pre-pitch'
      ),
    ])

    const flow = aggregateDimension('flowState', [
      buildContribution(
        'physiological',
        'coherence',
        flowCoherenceScore(input.physiological),
        0.55,
        'HRV stability, respiration rhythm, and stress suppression'
      ),
      buildContribution(
        'body_language',
        'composure',
        bodyLanguageComposureScore(input.bodyLanguage),
        0.3,
        'Smooth movement and minimal fidget signals across possessions'
      ),
      buildContribution(
        'micro_expression',
        'calm_focus',
        expressionFocusScore(input.microExpressions, 'baseline'),
        0.15,
        'Pre-play facial calm and re-centering cadence'
      ),
    ])

    const mental = aggregateDimension('mentalFortress', [
      buildContribution(
        'physiological',
        'stress_recovery',
        stressResilienceScore(input.physiological),
        0.4,
        'Stress index rebound speed after spikes'
      ),
      buildContribution(
        'performance',
        'bounce_back_speed',
        recoveryQuicknessScore(input.performance),
        0.3,
        'Time between negative event and next quality rep'
      ),
      buildContribution(
        'micro_expression',
        'adversity_composure',
        expressionFocusScore(input.microExpressions, 'adversity'),
        0.2,
        'Facial steadiness after failure moments'
      ),
      buildContribution(
        'context',
        'road_toughness',
        input.resume?.roadWinPct ? rateToScore(input.resume.roadWinPct, 0.45, 0.7) : 58,
        0.1,
        'Road environment win rate across last 40 starts'
      ),
    ])

    const predator = aggregateDimension('predatorMindset', [
      buildContribution(
        'body_language',
        'attack_posture',
        bodyLanguageDominanceScore(input.bodyLanguage),
        0.35,
        'Stride length, posture, and energy cues tracked in approach moments'
      ),
      buildContribution(
        'micro_expression',
        'predatory_cues',
        expressionAggressionScore(input.microExpressions),
        0.35,
        'Glare and narrowed-eye pulses prior to pitch release'
      ),
      buildContribution(
        'performance',
        'strike_conversion',
        aggressionConversionScore(input.performance),
        0.3,
        'Attack decisions that hunted advantage counts'
      ),
    ])

    const aura = aggregateDimension('championAura', [
      buildContribution(
        'body_language',
        'leadership_presence',
        championAuraScore(input.bodyLanguage, input.microExpressions, input.performance, input.resume),
        0.4,
        'Sideline influence, vocal command, and total-body gravitas'
      ),
      buildContribution(
        'performance',
        'win_probability_driver',
        clamp(
          safeAverage(input.performance.map(play => play.winProbabilityAdded)) * 1.5 +
            rateToScore(safeAverage(input.performance.map(play => (play.outcome === 'success' ? 1 : 0))), 0.5, 0.75) * 0.5
        ),
        0.35,
        'Aggregate win probability contributions across the window'
      ),
      buildContribution(
        'context',
        'stage_experience',
        input.resume?.championshipAppearances
          ? clamp(55 + Math.min(input.resume.championshipAppearances, 8) * 6)
          : 55,
        0.25,
        'High-stage reps: conference tourneys, Supers, Omaha'
      ),
    ])

    const winner = aggregateDimension('winnerDNA', [
      buildContribution(
        'performance',
        'conversion_consistency',
        winnerDNAScore(input.performance, input.resume),
        0.55,
        'Season-long win percentage, elimination record, sustained streaks'
      ),
      buildContribution(
        'context',
        'opponent_adjustment',
        input.context?.opponentStrength
          ? clamp(50 + input.context.opponentStrength * 40)
          : 55,
        0.15,
        'Strength-of-schedule uplift applied to resume'
      ),
      buildContribution(
        'performance',
        'series_close_rate',
        input.resume?.seriesCloseRate
          ? rateToScore(input.resume.seriesCloseRate, 0.5, 0.78)
          : 58,
        0.15,
        'Best-of series clinch conversion vs ranked opponents'
      ),
      buildContribution(
        'context',
        'fatigue_management',
        input.context?.fatigueIndex ? clamp(40 + input.context.fatigueIndex * 50) : 55,
        0.15,
        'Freshness or wear relative to travel and pitch counts'
      ),
    ])

    const beast = aggregateDimension('beastMode', [
      buildContribution(
        'performance',
        'peak_output',
        beastModeScore(input.performance, input.physiological),
        0.6,
        'Top-end play impact, explosive bursts, and play-to-play damage rate'
      ),
      buildContribution(
        'physiological',
        'power_reserve',
        clamp(
          (safeAverage(input.physiological.map(sample => sample.lactateLevel ?? 6)) / 14) * 100
        ),
        0.2,
        'Fuel markers pulled from lactate telemetry and neuromuscular load'
      ),
      buildContribution(
        'body_language',
        'energy_signature',
        clamp(safeAverage(input.bodyLanguage.map(sample => sample.energyLevel)) * 100),
        0.2,
        'Explosiveness and bounce in the body data feed'
      ),
    ])

    const dimensions: Record<ChampionDimensionKey, DimensionScore> = {
      clutchGene: clutch,
      killerInstinct: killer,
      flowState: flow,
      mentalFortress: mental,
      predatorMindset: predator,
      championAura: aura,
      winnerDNA: winner,
      beastMode: beast,
    }

    const overallScore = round(
      clamp(
        (clutch.score * 0.18 +
          killer.score * 0.14 +
          flow.score * 0.12 +
          mental.score * 0.14 +
          predator.score * 0.12 +
          aura.score * 0.1 +
          winner.score * 0.1 +
          beast.score * 0.1) /
          1
      ),
      2
    )

    const confidence = round(
      clamp(
        65 +
          Math.min(input.performance.length, 40) * 0.5 +
          Math.min(input.microExpressions.length, 120) * 0.1 +
          Math.min(input.physiological.length, 60) * 0.25,
        0,
        97
      ),
      2
    )

    return {
      athleteId: input.athleteId,
      window: input.sampleWindow,
      dimensions,
      overallScore,
      confidence,
      auditTrail: (Object.keys(dimensions) as ChampionDimensionKey[]).map(key => ({
        dimension: key,
        contributions: dimensions[key].contributions,
      })),
    }
  }
}
