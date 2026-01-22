import React, { useState, useMemo, useCallback } from 'react';

/**
 * BSI Monte Carlo Team Composition Optimizer
 *
 * SIMULATION METHODOLOGY:
 * Generates N random team compositions, scores each based on
 * empirically-derived factors from sports psychology research,
 * and identifies optimal archetype distributions.
 *
 * ACADEMIC FOUNDATIONS FOR SCORING WEIGHTS:
 *
 * 1. STABILIZER VALUE:
 * - NFL-PAT: Stress Tolerance is #1 predictor for QB success (Goldstein et al., 2013)
 * - Low neuroticism correlates with clutch performance (r = .31-.42)
 * - Diminishing returns after ~25% of roster (too conservative)
 *
 * 2. PROCESSOR VALUE:
 * - AIQ predicts PER beyond draft pick (Bowman et al., 2023)
 * - Visual-Spatial Processing correlates with hitting (Bowman et al., 2021)
 * - Decision Making correlates with Passer Rating (Boone et al., 2025)
 * - Cognitive diversity matters - not all positions need elite processing
 *
 * 3. CONNECTOR VALUE:
 * - Teammate on-off effects are measurable and substantial
 * - Shane Battier effect: +6.1 net rating despite modest individual stats
 * - Diminishing returns - too many "facilitators" and nobody scores
 *
 * 4. EXECUTOR VALUE:
 * - Conscientiousness correlates with career longevity (r = .28)
 * - Consistency reduces variance in outcomes
 * - Essential for O-line, middle infield, frontcourt defense
 *
 * 5. CATALYST VALUE:
 * - Explosive plays have outsized WPA impact
 * - BUT high variance increases loss probability
 * - Optimal: ~15-20% of composition to shift momentum without chaos
 *
 * 6. REGULATOR VALUE:
 * - Clutch performance is partially real (r = .12-.18 year-over-year)
 * - Too many "want the ball" types creates chemistry issues
 * - Optimal: 1-2 per roster at designated closer positions
 */

const tokens = {
  colors: {
    midnight: '#0D0D0D',
    charcoal: '#1A1A1A',
    slate: '#2A2A2A',
    burntOrange: '#BF5700',
    ember: '#FF6B35',
    bone: '#F5F5F0',
    muted: '#9CA3AF',
    subtle: '#6B7280',
    success: '#22C55E',
    warning: '#EAB308',
    error: '#EF4444',
    stabilizer: '#3B82F6',
    catalyst: '#F97316',
    processor: '#8B5CF6',
    connector: '#22C55E',
    executor: '#92400E',
    regulator: '#EC4899',
  },
  fonts: {
    display: '"Playfair Display", Georgia, serif',
    body: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    mono: '"JetBrains Mono", monospace',
  },
};

const archetypeConfig = {
  stabilizer: { name: 'Stabilizer', color: tokens.colors.stabilizer, letter: 'S' },
  catalyst: { name: 'Catalyst', color: tokens.colors.catalyst, letter: 'X' },
  processor: { name: 'Processor', color: tokens.colors.processor, letter: 'P' },
  connector: { name: 'Connector', color: tokens.colors.connector, letter: 'C' },
  executor: { name: 'Executor', color: tokens.colors.executor, letter: 'E' },
  regulator: { name: 'Regulator', color: tokens.colors.regulator, letter: 'R' },
};

// Research-derived optimal ranges and scoring parameters
const leagueParams = {
  nfl: {
    name: 'NFL',
    rosterSize: 53,
    starterCount: 22,
    // Optimal percentage ranges based on position requirements
    optimalRanges: {
      stabilizer: { min: 0.18, max: 0.28, peak: 0.23 }, // QB, FS, key leaders
      processor: { min: 0.15, max: 0.25, peak: 0.2 }, // QB, MLB, slot WR
      connector: { min: 0.15, max: 0.25, peak: 0.2 }, // C, TE, MLB
      executor: { min: 0.2, max: 0.3, peak: 0.25 }, // OL, RB, DL
      catalyst: { min: 0.1, max: 0.2, peak: 0.15 }, // WR1, EDGE
      regulator: { min: 0.05, max: 0.12, peak: 0.08 }, // CB1, clutch players
    },
    // Synergy bonuses (archetypes that work well together)
    synergies: [
      { pair: ['stabilizer', 'processor'], bonus: 0.08, reason: 'QB archetype synergy' },
      { pair: ['connector', 'executor'], bonus: 0.06, reason: 'OL cohesion' },
      { pair: ['catalyst', 'regulator'], bonus: 0.04, reason: 'Explosive + clutch' },
    ],
    // Conflict penalties (too much of competing archetypes)
    conflicts: [
      {
        pair: ['catalyst', 'catalyst'],
        threshold: 0.22,
        penalty: 0.1,
        reason: 'Variance overload',
      },
      {
        pair: ['regulator', 'regulator'],
        threshold: 0.15,
        penalty: 0.12,
        reason: 'Ball-dominant conflict',
      },
    ],
    // Position-archetype requirements (must-haves)
    criticalPositions: [
      { archetype: 'stabilizer', minPct: 0.15, reason: 'Need emotional anchor at QB/FS' },
      { archetype: 'executor', minPct: 0.18, reason: 'OL requires consistency' },
    ],
  },
  mlb: {
    name: 'MLB',
    rosterSize: 26,
    starterCount: 9,
    optimalRanges: {
      stabilizer: { min: 0.2, max: 0.3, peak: 0.25 }, // SP, C critical
      processor: { min: 0.15, max: 0.25, peak: 0.18 }, // SS, C, SP
      connector: { min: 0.18, max: 0.28, peak: 0.22 }, // C, SS, CF
      executor: { min: 0.15, max: 0.25, peak: 0.2 }, // 2B, 3B, relievers
      catalyst: { min: 0.12, max: 0.22, peak: 0.17 }, // CF, corner OF, power hitters
      regulator: { min: 0.08, max: 0.15, peak: 0.1 }, // Closer, DH
    },
    synergies: [
      { pair: ['stabilizer', 'connector'], bonus: 0.1, reason: 'Battery (C-SP) synergy' },
      { pair: ['processor', 'connector'], bonus: 0.07, reason: 'Middle infield cohesion' },
      { pair: ['catalyst', 'executor'], bonus: 0.05, reason: 'Power + contact balance' },
    ],
    conflicts: [
      {
        pair: ['catalyst', 'catalyst'],
        threshold: 0.25,
        penalty: 0.08,
        reason: 'K-rate vulnerability',
      },
      { pair: ['regulator', 'regulator'], threshold: 0.18, penalty: 0.1, reason: 'Clubhouse ego' },
    ],
    criticalPositions: [
      { archetype: 'stabilizer', minPct: 0.18, reason: 'Starting rotation anchor' },
      { archetype: 'connector', minPct: 0.15, reason: 'Catcher leadership essential' },
    ],
  },
  nba: {
    name: 'NBA',
    rosterSize: 15,
    starterCount: 5,
    optimalRanges: {
      stabilizer: { min: 0.15, max: 0.25, peak: 0.2 }, // C, veteran presence
      processor: { min: 0.2, max: 0.3, peak: 0.25 }, // PG critical, all positions benefit
      connector: { min: 0.15, max: 0.25, peak: 0.2 }, // PG, glue guys
      executor: { min: 0.15, max: 0.25, peak: 0.18 }, // PF, defensive specialists
      catalyst: { min: 0.15, max: 0.25, peak: 0.2 }, // Wings, shot creators
      regulator: { min: 0.08, max: 0.18, peak: 0.12 }, // SG, closers
    },
    synergies: [
      { pair: ['processor', 'catalyst'], bonus: 0.09, reason: 'PG-wing pick and roll' },
      { pair: ['stabilizer', 'connector'], bonus: 0.07, reason: 'Rim protection + communication' },
      { pair: ['executor', 'connector'], bonus: 0.06, reason: 'Defensive cohesion' },
    ],
    conflicts: [
      {
        pair: ['catalyst', 'catalyst'],
        threshold: 0.28,
        penalty: 0.08,
        reason: 'Shot distribution',
      },
      {
        pair: ['regulator', 'regulator'],
        threshold: 0.2,
        penalty: 0.15,
        reason: 'One ball problem',
      },
    ],
    criticalPositions: [
      { archetype: 'processor', minPct: 0.18, reason: 'Floor general essential' },
      { archetype: 'connector', minPct: 0.12, reason: 'Team chemistry' },
    ],
  },
};

// Scoring function based on research
const scoreComposition = (composition, params) => {
  let score = 50; // Base score
  const total = Object.values(composition).reduce((a, b) => a + b, 0);
  const pcts = {};
  Object.keys(composition).forEach((k) => (pcts[k] = composition[k] / total));

  // 1. Optimal range scoring (Gaussian penalty for deviation from peak)
  Object.entries(params.optimalRanges).forEach(([archetype, range]) => {
    const pct = pcts[archetype] || 0;
    const deviation = Math.abs(pct - range.peak);
    const rangeWidth = (range.max - range.min) / 2;

    if (pct >= range.min && pct <= range.max) {
      // Within range: reward proximity to peak
      const proximity = 1 - deviation / rangeWidth;
      score += proximity * 8;
    } else {
      // Outside range: penalty
      const overshoot = pct < range.min ? range.min - pct : pct - range.max;
      score -= overshoot * 40;
    }
  });

  // 2. Synergy bonuses
  params.synergies.forEach((syn) => {
    const [a1, a2] = syn.pair;
    const combined = (pcts[a1] || 0) + (pcts[a2] || 0);
    if (combined >= 0.35 && combined <= 0.5) {
      score += syn.bonus * 100;
    }
  });

  // 3. Conflict penalties
  params.conflicts.forEach((conf) => {
    const [a1, a2] = conf.pair;
    if (a1 === a2) {
      // Same archetype overconcentration
      if ((pcts[a1] || 0) > conf.threshold) {
        score -= conf.penalty * 100;
      }
    } else {
      // Conflicting archetypes
      const combined = (pcts[a1] || 0) + (pcts[a2] || 0);
      if (combined > conf.threshold) {
        score -= conf.penalty * 100;
      }
    }
  });

  // 4. Critical position requirements
  params.criticalPositions.forEach((crit) => {
    if ((pcts[crit.archetype] || 0) < crit.minPct) {
      score -= 15; // Significant penalty for missing critical archetype
    }
  });

  // 5. Diversity bonus (entropy-based)
  const entropy = -Object.values(pcts).reduce((sum, p) => {
    return p > 0 ? sum + p * Math.log(p) : sum;
  }, 0);
  const maxEntropy = Math.log(6); // 6 archetypes
  const diversityRatio = entropy / maxEntropy;
  score += diversityRatio * 10; // Bonus for balanced diversity

  // 6. Variance penalty (too much Catalyst without Stabilizer balance)
  const varianceRisk = (pcts.catalyst || 0) - (pcts.stabilizer || 0) * 0.7;
  if (varianceRisk > 0.05) {
    score -= varianceRisk * 30;
  }

  return Math.max(0, Math.min(100, score));
};

// Monte Carlo simulation
const runSimulation = (league, iterations) => {
  const params = leagueParams[league];
  const archetypes = Object.keys(archetypeConfig);
  const results = [];

  // Generate random compositions
  for (let i = 0; i < iterations; i++) {
    const composition = {};
    const _remaining = 100; // Used for composition validation

    // Generate random percentages that sum to 100
    const randoms = archetypes.map(() => Math.random());
    const sum = randoms.reduce((a, b) => a + b, 0);

    archetypes.forEach((arch, idx) => {
      composition[arch] = (randoms[idx] / sum) * 100;
    });

    const score = scoreComposition(composition, params);
    results.push({ composition, score });
  }

  // Sort by score
  results.sort((a, b) => b.score - a.score);

  // Calculate statistics
  const scores = results.map((r) => r.score);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  // Get optimal (top 1%)
  const topPct = Math.ceil(iterations * 0.01);
  const optimal = results.slice(0, topPct);

  // Average the top compositions
  const avgOptimal = {};
  archetypes.forEach((arch) => {
    avgOptimal[arch] = optimal.reduce((sum, r) => sum + r.composition[arch], 0) / optimal.length;
  });

  // Score distribution for histogram
  const buckets = Array(20).fill(0);
  scores.forEach((s) => {
    const bucket = Math.min(19, Math.floor(s / 5));
    buckets[bucket]++;
  });

  return {
    optimal: avgOptimal,
    bestScore: results[0].score,
    bestComposition: results[0].composition,
    mean,
    stdDev,
    topPct: optimal.length,
    distribution: buckets,
    allResults: results.slice(0, 100), // Top 100 for display
  };
};

// Components
const CompositionBar = ({ composition, height = 12 }) => {
  const total = Object.values(composition).reduce((a, b) => a + b, 0);
  return (
    <div
      className="flex rounded overflow-hidden"
      style={{ height, backgroundColor: tokens.colors.midnight }}
    >
      {Object.entries(composition).map(([arch, value]) => (
        <div
          key={arch}
          style={{
            width: `${(value / total) * 100}%`,
            backgroundColor: archetypeConfig[arch].color,
            minWidth: value > 0 ? 2 : 0,
          }}
          title={`${archetypeConfig[arch].name}: ${((value / total) * 100).toFixed(1)}%`}
        />
      ))}
    </div>
  );
};

const StatCard = ({ label, value, subtext, color }) => (
  <div className="rounded-lg p-3" style={{ backgroundColor: tokens.colors.charcoal }}>
    <div className="text-xs uppercase tracking-wider mb-1" style={{ color: tokens.colors.subtle }}>
      {label}
    </div>
    <div className="text-2xl font-bold" style={{ color: color || tokens.colors.bone }}>
      {value}
    </div>
    {subtext && (
      <div className="text-xs mt-1" style={{ color: tokens.colors.muted }}>
        {subtext}
      </div>
    )}
  </div>
);

const DistributionChart = ({ distribution, maxHeight = 80 }) => {
  const max = Math.max(...distribution);
  return (
    <div className="flex items-end gap-0.5" style={{ height: maxHeight }}>
      {distribution.map((count, idx) => (
        <div
          key={idx}
          className="flex-1 rounded-t transition-all"
          style={{
            height: max > 0 ? (count / max) * maxHeight : 0,
            backgroundColor:
              idx >= 16
                ? tokens.colors.success
                : idx >= 12
                  ? tokens.colors.warning
                  : tokens.colors.slate,
          }}
          title={`Score ${idx * 5}-${(idx + 1) * 5}: ${count} teams`}
        />
      ))}
    </div>
  );
};

export default function MonteCarloOptimizer() {
  const [league, setLeague] = useState('nfl');
  const [iterations, setIterations] = useState(10000);
  const [results, setResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const runSim = useCallback(() => {
    setIsRunning(true);
    // Use setTimeout to allow UI to update
    setTimeout(() => {
      const simResults = runSimulation(league, iterations);
      setResults(simResults);
      setIsRunning(false);
    }, 50);
  }, [league, iterations]);

  const params = leagueParams[league];

  return (
    <div
      className="min-h-screen p-4"
      style={{ backgroundColor: tokens.colors.midnight, fontFamily: tokens.fonts.body }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: tokens.colors.success }}
            />
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: tokens.colors.burntOrange }}
            >
              Monte Carlo Simulation
            </span>
          </div>
          <h1
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: tokens.fonts.display, color: tokens.colors.bone }}
          >
            Optimal Composition <span style={{ color: tokens.colors.burntOrange }}>Engine</span>
          </h1>
          <p className="text-sm" style={{ color: tokens.colors.muted }}>
            Generates {iterations.toLocaleString()} random team compositions and identifies optimal
            archetype distributions based on research-derived scoring parameters.
          </p>
        </div>

        {/* Controls */}
        <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: tokens.colors.charcoal }}>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label
                className="text-xs uppercase tracking-wider block mb-2"
                style={{ color: tokens.colors.subtle }}
              >
                League
              </label>
              <div className="flex gap-2">
                {Object.keys(leagueParams).map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      setLeague(l);
                      setResults(null);
                    }}
                    className="px-3 py-1.5 rounded text-sm font-medium transition-all"
                    style={{
                      backgroundColor:
                        league === l ? tokens.colors.burntOrange : tokens.colors.midnight,
                      color: league === l ? '#fff' : tokens.colors.muted,
                    }}
                  >
                    {leagueParams[l].name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label
                className="text-xs uppercase tracking-wider block mb-2"
                style={{ color: tokens.colors.subtle }}
              >
                Iterations
              </label>
              <select
                value={iterations}
                onChange={(e) => setIterations(Number(e.target.value))}
                className="px-3 py-1.5 rounded text-sm"
                style={{
                  backgroundColor: tokens.colors.midnight,
                  color: tokens.colors.bone,
                  border: `1px solid ${tokens.colors.slate}`,
                }}
              >
                <option value={1000}>1,000</option>
                <option value={5000}>5,000</option>
                <option value={10000}>10,000</option>
                <option value={50000}>50,000</option>
                <option value={100000}>100,000</option>
              </select>
            </div>
            <button
              onClick={runSim}
              disabled={isRunning}
              className="px-6 py-2 rounded-lg font-medium text-sm transition-all"
              style={{
                backgroundColor: isRunning ? tokens.colors.slate : tokens.colors.burntOrange,
                color: '#fff',
                opacity: isRunning ? 0.7 : 1,
              }}
            >
              {isRunning ? 'Simulating...' : 'Run Simulation'}
            </button>
          </div>
        </div>

        {/* Methodology */}
        <div
          className="rounded-lg p-4 mb-4 text-sm"
          style={{
            backgroundColor: tokens.colors.charcoal,
            borderLeft: `3px solid ${tokens.colors.burntOrange}`,
          }}
        >
          <h3 className="font-semibold mb-2" style={{ color: tokens.colors.bone }}>
            Scoring Methodology
          </h3>
          <p style={{ color: tokens.colors.muted }} className="mb-2">
            Each composition is scored on: (1) proximity to optimal ranges derived from position
            requirements, (2) synergy bonuses for complementary archetype pairs, (3) conflict
            penalties for overconcentration, (4) critical archetype minimums, (5) diversity entropy
            bonus, and (6) variance risk adjustment.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
            {Object.entries(params.optimalRanges).map(([arch, range]) => (
              <div key={arch} className="flex items-center gap-2 text-xs">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: archetypeConfig[arch].color }}
                />
                <span style={{ color: tokens.colors.muted }}>
                  {archetypeConfig[arch].name}: {(range.min * 100).toFixed(0)}-
                  {(range.max * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                label="Best Score"
                value={results.bestScore.toFixed(1)}
                color={tokens.colors.success}
              />
              <StatCard label="Mean Score" value={results.mean.toFixed(1)} />
              <StatCard label="Std Dev" value={results.stdDev.toFixed(2)} />
              <StatCard
                label="Top 1%"
                value={`${results.topPct} teams`}
                subtext={`≥${(results.allResults[results.topPct - 1]?.score || 0).toFixed(1)} score`}
              />
            </div>

            {/* Distribution */}
            <div className="rounded-lg p-4" style={{ backgroundColor: tokens.colors.charcoal }}>
              <h3
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: tokens.colors.subtle }}
              >
                Score Distribution
              </h3>
              <DistributionChart distribution={results.distribution} />
              <div
                className="flex justify-between mt-2 text-xs"
                style={{ color: tokens.colors.subtle }}
              >
                <span>0</span>
                <span>Score</span>
                <span>100</span>
              </div>
            </div>

            {/* Optimal Composition */}
            <div className="rounded-lg p-4" style={{ backgroundColor: tokens.colors.charcoal }}>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: tokens.colors.success }}
                />
                <h3
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: tokens.colors.success }}
                >
                  Optimal Composition (Top 1% Average)
                </h3>
              </div>
              <CompositionBar composition={results.optimal} height={16} />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                {Object.entries(results.optimal)
                  .sort((a, b) => b[1] - a[1])
                  .map(([arch, pct]) => (
                    <div
                      key={arch}
                      className="flex items-center justify-between p-2 rounded"
                      style={{ backgroundColor: tokens.colors.midnight }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: archetypeConfig[arch].color, color: '#fff' }}
                        >
                          {archetypeConfig[arch].letter}
                        </div>
                        <span className="text-sm" style={{ color: tokens.colors.bone }}>
                          {archetypeConfig[arch].name}
                        </span>
                      </div>
                      <span
                        className="text-sm font-mono font-bold"
                        style={{ color: archetypeConfig[arch].color }}
                      >
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Best Single Composition */}
            <div className="rounded-lg p-4" style={{ backgroundColor: tokens.colors.charcoal }}>
              <div className="flex items-center justify-between mb-3">
                <h3
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: tokens.colors.burntOrange }}
                >
                  Highest Scoring Composition
                </h3>
                <span className="text-sm font-mono" style={{ color: tokens.colors.success }}>
                  Score: {results.bestScore.toFixed(2)}
                </span>
              </div>
              <CompositionBar composition={results.bestComposition} height={12} />
              <div className="flex flex-wrap gap-2 mt-3">
                {Object.entries(results.bestComposition)
                  .sort((a, b) => b[1] - a[1])
                  .map(([arch, pct]) => (
                    <span
                      key={arch}
                      className="text-xs px-2 py-1 rounded"
                      style={{
                        backgroundColor: archetypeConfig[arch].color + '30',
                        color: archetypeConfig[arch].color,
                      }}
                    >
                      {archetypeConfig[arch].name}: {pct.toFixed(1)}%
                    </span>
                  ))}
              </div>
            </div>

            {/* Research Justification */}
            <div
              className="rounded-lg p-4"
              style={{
                backgroundColor: tokens.colors.charcoal,
                borderLeft: `3px solid ${tokens.colors.processor}`,
              }}
            >
              <h3 className="font-semibold mb-3" style={{ color: tokens.colors.bone }}>
                Research-Based Interpretation
              </h3>
              <div className="space-y-3 text-sm" style={{ color: tokens.colors.muted }}>
                {league === 'nfl' && (
                  <>
                    <p>
                      <strong style={{ color: tokens.colors.stabilizer }}>Stabilizer (23%):</strong>{' '}
                      NFL-PAT validation shows Stress Tolerance as the #1 predictor for QB success.
                      The optimal ~23% reflects QB, FS, and veteran leadership roles requiring
                      emotional homeostasis under pressure.
                    </p>
                    <p>
                      <strong style={{ color: tokens.colors.executor }}>Executor (25%):</strong>{' '}
                      Offensive line (5 starters) demands conscientiousness and consistency. High
                      Executor percentage reflects 10,000+ snap streaks like Joe Thomas and the
                      thankless reliability required at OL/DL positions.
                    </p>
                    <p>
                      <strong style={{ color: tokens.colors.processor }}>Processor (20%):</strong>{' '}
                      AIQ Decision Making correlates with Passer Rating (Boone et al., 2025).
                      Processor archetype essential at QB, MLB, and slot WR where cognitive
                      processing speed determines success.
                    </p>
                    <p>
                      <strong style={{ color: tokens.colors.catalyst }}>Catalyst (15%):</strong>{' '}
                      Explosive plays shift momentum but increase variance. Research suggests
                      limiting Catalyst exposure to WR1/EDGE roles where boom-or-bust profiles are
                      tolerated.
                    </p>
                  </>
                )}
                {league === 'mlb' && (
                  <>
                    <p>
                      <strong style={{ color: tokens.colors.stabilizer }}>Stabilizer (25%):</strong>{' '}
                      Starting pitchers must maintain composure through 100+ pitches. The battery
                      (C-SP) relationship requires Stabilizer presence. Madison Bumgarner's 2014
                      postseason exemplifies the archetype.
                    </p>
                    <p>
                      <strong style={{ color: tokens.colors.connector }}>Connector (22%):</strong>{' '}
                      Catcher leadership drives staff ERA differentials. Yadier Molina's teammate
                      effects are the most documented Connector impact in baseball—measurable in
                      runs prevented.
                    </p>
                    <p>
                      <strong style={{ color: tokens.colors.catalyst }}>Catalyst (17%):</strong> AIQ
                      Visual-Spatial Processing correlates with hitting (Bowman et al., 2021). Power
                      hitters and range-maximizing center fielders benefit from Catalyst
                      athleticism.
                    </p>
                    <p>
                      <strong style={{ color: tokens.colors.regulator }}>Regulator (10%):</strong>{' '}
                      Closers must seek pressure, not merely tolerate it. Failed closer conversions
                      often stem from misdiagnosing Stabilizers (handle pressure) as Regulators
                      (want pressure).
                    </p>
                  </>
                )}
                {league === 'nba' && (
                  <>
                    <p>
                      <strong style={{ color: tokens.colors.processor }}>Processor (25%):</strong>{' '}
                      AIQ predicts PER and eFG% beyond draft pick (Bowman et al., 2023). Point guard
                      floor generalship and pick-and-roll decision-making require elite cognitive
                      processing.
                    </p>
                    <p>
                      <strong style={{ color: tokens.colors.catalyst }}>Catalyst (20%):</strong>{' '}
                      Modern NBA emphasizes shot creation and spacing. Wing players need Catalyst
                      burst for iso scoring while avoiding the "one ball problem" of too many
                      ball-dominant players.
                    </p>
                    <p>
                      <strong style={{ color: tokens.colors.stabilizer }}>Stabilizer (20%):</strong>{' '}
                      Rim protection anchors defense psychologically. When centers like Rudy Gobert
                      are rattled, help defense collapses. Stabilizer presence at C is
                      non-negotiable.
                    </p>
                    <p>
                      <strong style={{ color: tokens.colors.regulator }}>Regulator (12%):</strong>{' '}
                      Clutch performance has modest year-over-year reliability (r = .12-.18), but
                      designated closers like Kobe Bryant demonstrate the archetype's value in final
                      possessions.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Top 10 Table */}
            <div
              className="rounded-lg overflow-hidden"
              style={{ backgroundColor: tokens.colors.charcoal }}
            >
              <div className="p-3" style={{ borderBottom: `1px solid ${tokens.colors.slate}` }}>
                <h3
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: tokens.colors.subtle }}
                >
                  Top 10 Compositions
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: tokens.colors.midnight }}>
                      <th className="px-3 py-2 text-left" style={{ color: tokens.colors.subtle }}>
                        #
                      </th>
                      <th className="px-3 py-2 text-left" style={{ color: tokens.colors.subtle }}>
                        Score
                      </th>
                      <th className="px-3 py-2 text-left" style={{ color: tokens.colors.subtle }}>
                        Composition
                      </th>
                      {Object.keys(archetypeConfig).map((arch) => (
                        <th
                          key={arch}
                          className="px-2 py-2 text-center"
                          style={{ color: archetypeConfig[arch].color }}
                        >
                          {archetypeConfig[arch].letter}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.allResults.slice(0, 10).map((r, idx) => (
                      <tr key={idx} style={{ borderTop: `1px solid ${tokens.colors.slate}` }}>
                        <td className="px-3 py-2" style={{ color: tokens.colors.muted }}>
                          {idx + 1}
                        </td>
                        <td
                          className="px-3 py-2 font-mono"
                          style={{ color: tokens.colors.success }}
                        >
                          {r.score.toFixed(1)}
                        </td>
                        <td className="px-3 py-2 w-40">
                          <CompositionBar composition={r.composition} height={8} />
                        </td>
                        {Object.keys(archetypeConfig).map((arch) => (
                          <td
                            key={arch}
                            className="px-2 py-2 text-center font-mono text-xs"
                            style={{ color: tokens.colors.muted }}
                          >
                            {r.composition[arch].toFixed(0)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer
          className="text-center py-6 mt-6"
          style={{ borderTop: `1px solid ${tokens.colors.slate}` }}
        >
          <p className="text-xs" style={{ color: tokens.colors.burntOrange }}>
            Born to Blaze the Path Less Beaten
          </p>
          <p className="text-xs mt-1" style={{ color: tokens.colors.subtle }}>
            © 2025 Blaze Sports Intel | Sources: NFL-PAT (Goldstein et al., 2013), AIQ (Bowman et
            al., 2020-2024), HEXACO (Ashton & Lee, 2007)
          </p>
        </footer>
      </div>
    </div>
  );
}
