import { describe, expect, it } from 'vitest'
import {
  CHAMPION_DIMENSIONS,
  CULTURAL_ARCHETYPES,
  DECISION_VELOCITY_PHASES,
  UNIFIED_SPORTS_INTELLIGENCE_FEED,
  validateBlazeBackyardSession,
  validateChampionProfile,
  validateCognitiveLoadSnapshot,
  validateDecisionVelocitySnapshot,
  validateNilValuationSnapshot,
  validatePatternRecognitionSnapshot,
  validateQuantumPerformanceSnapshot
} from '../../lib/intelligence'

describe('intelligence frameworks definitions', () => {
  it('exposes all champion dimensions', () => {
    expect(CHAMPION_DIMENSIONS).toHaveLength(8)
    const ids = CHAMPION_DIMENSIONS.map((dim) => dim.id)
    expect(new Set(ids).size).toBe(8)
  })

  it('defines all decision velocity phases in order', () => {
    expect(DECISION_VELOCITY_PHASES.map((phase) => phase.id)).toEqual([
      'perception',
      'processing',
      'decision',
      'execution'
    ])
  })

  it('lists cultural archetypes for each flagship program', () => {
    const archetypeIds = CULTURAL_ARCHETYPES.map((arch) => arch.id)
    expect(archetypeIds).toEqual([
      'titans_defensive_resilience',
      'grizzlies_grit_grind',
      'longhorns_precision_execution',
      'cardinals_consistent_excellence'
    ])
  })

  it('registers unified feed sources', () => {
    expect(UNIFIED_SPORTS_INTELLIGENCE_FEED.length).toBeGreaterThanOrEqual(3)
  })
})

describe('validation pipelines', () => {
  const baseChampionProfile = Object.fromEntries(
    CHAMPION_DIMENSIONS.map((dimension) => [
      dimension.id,
      { value: 85, confidence: 0.8, evidence: ['sample-evidence'] }
    ])
  )

  const baseDecisionVelocity = {
    phases: {
      perception: 120,
      processing: 180,
      decision: 150,
      execution: 160
    },
    decisionLagMs: 45,
    sampleCount: 32,
    capturedAt: '2025-10-16T12:00:00Z'
  }

  const basePatternRecognition = {
    tier: 4,
    confidence: 0.72,
    signalsTracked: 42,
    evidenceIds: ['vid-123', 'report-456'],
    updatedAt: '2025-10-16T12:00:00Z'
  }

  const baseCognitiveLoad = {
    distribution: {
      visual_processing: 35,
      motor_planning: 25,
      communication: 15,
      tactical_reasoning: 15,
      recovery: 10
    },
    sampleWindowSeconds: 120,
    telemetryId: 'cl-123',
    capturedAt: '2025-10-16T12:00:00Z'
  }

  const baseNilValuation = {
    athleteId: 'ath-123',
    brandScore: 82,
    performanceScore: 91,
    socialMomentumScore: 77,
    marketAdjustment: 1.12,
    projectedMonthlyValue: 18750,
    updatedAt: '2025-10-16T12:00:00Z',
    confidence: 0.94
  }

  const baseBackyardSession = {
    athleteId: 'ath-123',
    gameId: 'mlb-show-24',
    sessionId: 'session-42',
    telemetry: {
      reactionTimeMs: 275,
      patternAccuracy: 0.81,
      decisionVelocityMs: 510
    },
    swingPlaneCorrelation: 0.64,
    transferConfidence: 0.78,
    capturedAt: '2025-10-16T12:00:00Z'
  }

  it('validates a complete champion profile', () => {
    const { valid, errors } = validateChampionProfile(baseChampionProfile)
    expect(valid).toBe(true)
    expect(errors).toEqual([])
  })

  it('rejects champion profile missing evidence', () => {
    const brokenProfile = {
      ...baseChampionProfile,
      clutch_gene: { value: 80, confidence: 0.7, evidence: [] }
    }
    const { valid, errors } = validateChampionProfile(brokenProfile)
    expect(valid).toBe(false)
    expect(errors.some((error) => error.includes('clutch_gene'))).toBe(true)
  })

  it('validates decision velocity snapshot', () => {
    const { valid, errors } = validateDecisionVelocitySnapshot(baseDecisionVelocity)
    expect(valid).toBe(true)
    expect(errors).toEqual([])
  })

  it('rejects decision velocity with negative phase value', () => {
    const broken = {
      ...baseDecisionVelocity,
      phases: { ...baseDecisionVelocity.phases, decision: -10 }
    }
    const { valid, errors } = validateDecisionVelocitySnapshot(broken)
    expect(valid).toBe(false)
    expect(errors.some((error) => error.includes('decision'))).toBe(true)
  })

  it('validates pattern recognition snapshot', () => {
    const { valid, errors } = validatePatternRecognitionSnapshot(basePatternRecognition)
    expect(valid).toBe(true)
    expect(errors).toEqual([])
  })

  it('rejects pattern recognition snapshot with invalid tier', () => {
    const broken = { ...basePatternRecognition, tier: 7 }
    const { valid, errors } = validatePatternRecognitionSnapshot(broken)
    expect(valid).toBe(false)
    expect(errors.some((error) => error.includes('tier'))).toBe(true)
  })

  it('validates cognitive load snapshot', () => {
    const { valid, errors } = validateCognitiveLoadSnapshot(baseCognitiveLoad)
    expect(valid).toBe(true)
    expect(errors).toEqual([])
  })

  it('rejects cognitive load snapshot with incorrect distribution total', () => {
    const broken = {
      ...baseCognitiveLoad,
      distribution: { ...baseCognitiveLoad.distribution, recovery: 40 }
    }
    const { valid, errors } = validateCognitiveLoadSnapshot(broken)
    expect(valid).toBe(false)
    expect(errors.some((error) => error.includes('total 100'))).toBe(true)
  })

  it('validates nil valuation snapshot', () => {
    const { valid, errors } = validateNilValuationSnapshot(baseNilValuation)
    expect(valid).toBe(true)
    expect(errors).toEqual([])
  })

  it('rejects nil valuation snapshot outside range', () => {
    const broken = { ...baseNilValuation, performanceScore: 140 }
    const { valid, errors } = validateNilValuationSnapshot(broken)
    expect(valid).toBe(false)
    expect(errors.some((error) => error.includes('performanceScore'))).toBe(true)
  })

  it('validates blaze backyard session', () => {
    const { valid, errors } = validateBlazeBackyardSession(baseBackyardSession)
    expect(valid).toBe(true)
    expect(errors).toEqual([])
  })

  it('rejects blaze backyard session with invalid telemetry', () => {
    const broken = {
      ...baseBackyardSession,
      telemetry: { ...baseBackyardSession.telemetry, patternAccuracy: 2 }
    }
    const { valid, errors } = validateBlazeBackyardSession(broken)
    expect(valid).toBe(false)
    expect(errors.some((error) => error.includes('patternAccuracy'))).toBe(true)
  })

  it('validates quantum performance snapshot when all subsystems are valid', () => {
    const snapshot = {
      athleteId: 'ath-123',
      championProfile: baseChampionProfile,
      decisionVelocity: baseDecisionVelocity,
      patternRecognition: basePatternRecognition,
      cognitiveLoad: baseCognitiveLoad,
      nilValuation: baseNilValuation,
      culturalArchetype: CULTURAL_ARCHETYPES[0].id,
      timestamp: '2025-10-16T12:00:00Z'
    }

    const { valid, errors } = validateQuantumPerformanceSnapshot(snapshot)
    expect(valid).toBe(true)
    expect(errors).toEqual([])
  })

  it('rejects quantum performance snapshot cascading validation errors', () => {
    const snapshot = {
      athleteId: '',
      championProfile: { clutch_gene: { value: 102, confidence: 1.2, evidence: [''] } },
      decisionVelocity: {
        phases: { perception: -1 },
        decisionLagMs: -5,
        sampleCount: 0,
        capturedAt: 'invalid'
      },
      patternRecognition: {
        tier: 0,
        confidence: -0.1,
        signalsTracked: -2,
        evidenceIds: [''],
        updatedAt: 'bad'
      },
      cognitiveLoad: {
        distribution: { visual_processing: 120 },
        sampleWindowSeconds: -1,
        telemetryId: '',
        capturedAt: 'bad'
      },
      culturalArchetype: 'unknown',
      timestamp: 'not-time'
    }

    const { valid, errors } = validateQuantumPerformanceSnapshot(snapshot)
    expect(valid).toBe(false)
    expect(errors.length).toBeGreaterThan(5)
  })
})
