/**
 * Schedule Optimizer Component
 *
 * Features:
 * - Monte Carlo simulation results with confidence intervals
 * - Remaining game win probabilities visualization
 * - What-if scenario analysis
 * - Key games identification
 * - Optimization recommendations
 * - NCAA tournament probability tracking
 * - Conference strength rankings
 *
 * Uses Recharts for data visualization
 * Glassmorphism design with interactive elements
 *
 * Integration:
 * - /api/scheduling/optimize endpoint
 * - ConferenceStrengthModel analytics
 * - ScheduleOptimizer analytics
 *
 * Last Updated: October 19, 2025
 * Timezone: America/Chicago
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';

// ============================================================================
// Type Definitions
// ============================================================================

interface ScheduleOptimizerProps {
  teamId: string;
  teamName: string;
  onError?: (error: Error) => void;
}

interface SimulationData {
  simulation: {
    teamId: string;
    teamName: string;
    iterations: number;
    projectedRecord: {
      wins: number;
      losses: number;
      winningPct: number;
    };
    confidenceInterval: {
      level: number;
      winsLower: number;
      winsUpper: number;
      lossesLower: number;
      lossesUpper: number;
    };
    remainingGameProbabilities: Array<{
      gameId: string;
      opponent: string;
      winProbability: number;
      expectedMargin: number;
    }>;
    ncaaTournamentProbability: number;
    ncaaSeedProbability: number;
    conferenceChampionshipProbability: number;
  };
  whatIfScenarios?: Array<{
    scenarioName: string;
    description: string;
    projectedRecord: {
      wins: number;
      losses: number;
      winningPct: number;
    };
    rpiChange: number;
    ncaaTournamentProbabilityChange: number;
  }>;
  optimization?: {
    recommendations: Array<{
      priority: number;
      recommendation: string;
      reasoning: string;
      impactScore: number;
    }>;
    keyGames: Array<{
      gameId: string;
      opponent: string;
      importance: number;
      reasoning: string;
    }>;
    optimalOutcomes: Array<{
      scenario: string;
      probability: number;
      finalRecord: string;
      ncaaTournamentSeed?: number;
    }>;
  };
  conferenceStrength?: {
    conference: string;
    rpi: number;
    sos: number;
    isr: number;
    overallStrength: number;
    rank: number;
  };
}

// ============================================================================
// Main Component
// ============================================================================

export const ScheduleOptimizer: React.FC<ScheduleOptimizerProps> = ({
  teamId,
  teamName,
  onError,
}) => {
  const [data, setData] = useState<SimulationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [iterations, setIterations] = useState(10000);
  const [_selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'scenarios' | 'recommendations'>(
    'overview'
  );

  // Fetch optimization data
  useEffect(() => {
    fetchOptimizationData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchOptimizationData is stable, runs on teamId/iterations change
  }, [teamId, iterations]);

  const fetchOptimizationData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/scheduling/optimize?teamId=${teamId}&iterations=${iterations}&scenarios=true&optimize=true`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = (await response.json()) as SimulationData;
      setData(result);
    } catch (error) {
      console.error('Failed to fetch optimization data:', error);
      if (onError) {
        onError(error as Error);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatRecord = (wins: number, losses: number): string => {
    return `${wins}-${losses}`;
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingSpinner}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Running Monte Carlo simulations...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.simulation) {
    return (
      <div style={styles.container}>
        <div style={styles.errorMessage}>
          <p>❌ Failed to load schedule optimization data</p>
          <button onClick={fetchOptimizationData} style={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { simulation, whatIfScenarios, optimization, conferenceStrength } = data;

  // Prepare chart data for win probability distribution
  const distributionData = [];
  for (
    let wins = simulation.confidenceInterval.winsLower;
    wins <= simulation.confidenceInterval.winsUpper;
    wins++
  ) {
    // Approximate normal distribution
    const mean = simulation.projectedRecord.wins;
    const stdDev =
      (simulation.confidenceInterval.winsUpper - simulation.confidenceInterval.winsLower) / 4;
    const probability =
      Math.exp(-Math.pow(wins - mean, 2) / (2 * stdDev * stdDev)) /
      (stdDev * Math.sqrt(2 * Math.PI));

    distributionData.push({
      wins,
      probability: probability * 100,
      isProjected: wins === simulation.projectedRecord.wins,
    });
  }

  // Prepare chart data for remaining games
  const gamesData = simulation.remainingGameProbabilities.map((game, _index) => ({
    name: game.opponent.length > 15 ? game.opponent.substring(0, 12) + '...' : game.opponent,
    winProb: game.winProbability * 100,
    lossProb: (1 - game.winProbability) * 100,
    expectedMargin: game.expectedMargin,
  }));

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{teamName} Schedule Optimizer</h1>
          <p style={styles.subtitle}>
            {simulation.iterations.toLocaleString()} Monte Carlo simulations
          </p>
        </div>
        <div style={styles.iterationsSelector}>
          <label style={styles.label}>Simulations:</label>
          <select
            value={iterations}
            onChange={(e) => setIterations(parseInt(e.target.value))}
            style={styles.select}
          >
            <option value="1000">1,000</option>
            <option value="10000">10,000</option>
            <option value="50000">50,000</option>
            <option value="100000">100,000</option>
          </select>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={styles.tabNav}>
        <button
          onClick={() => setSelectedTab('overview')}
          style={{
            ...styles.tabButton,
            ...(selectedTab === 'overview' ? styles.tabButtonActive : {}),
          }}
        >
          Overview
        </button>
        <button
          onClick={() => setSelectedTab('scenarios')}
          style={{
            ...styles.tabButton,
            ...(selectedTab === 'scenarios' ? styles.tabButtonActive : {}),
          }}
        >
          What-If Scenarios
        </button>
        <button
          onClick={() => setSelectedTab('recommendations')}
          style={{
            ...styles.tabButton,
            ...(selectedTab === 'recommendations' ? styles.tabButtonActive : {}),
          }}
        >
          Recommendations
        </button>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div style={styles.content}>
          {/* Projected Record Card */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Projected Final Record</h2>
            <div style={styles.recordDisplay}>
              <div style={styles.recordMain}>
                {formatRecord(simulation.projectedRecord.wins, simulation.projectedRecord.losses)}
              </div>
              <div style={styles.recordWinPct}>
                {formatPercentage(simulation.projectedRecord.winningPct)}
              </div>
            </div>
            <div style={styles.confidenceInterval}>
              <p style={styles.confidenceLabel}>95% Confidence Interval:</p>
              <p style={styles.confidenceRange}>
                {simulation.confidenceInterval.winsLower}-{simulation.confidenceInterval.winsUpper}{' '}
                wins
              </p>
            </div>
          </div>

          {/* Probability Cards */}
          <div style={styles.probCards}>
            <div style={styles.probCard}>
              <div style={styles.probLabel}>NCAA Tournament</div>
              <div style={styles.probValue}>
                {formatPercentage(simulation.ncaaTournamentProbability)}
              </div>
              <div style={styles.probBar}>
                <div
                  style={{
                    ...styles.probBarFill,
                    width: `${simulation.ncaaTournamentProbability * 100}%`,
                    backgroundColor:
                      simulation.ncaaTournamentProbability > 0.7 ? '#10b981' : '#f59e0b',
                  }}
                />
              </div>
            </div>

            <div style={styles.probCard}>
              <div style={styles.probLabel}>National Seed</div>
              <div style={styles.probValue}>{formatPercentage(simulation.ncaaSeedProbability)}</div>
              <div style={styles.probBar}>
                <div
                  style={{
                    ...styles.probBarFill,
                    width: `${simulation.ncaaSeedProbability * 100}%`,
                    backgroundColor: simulation.ncaaSeedProbability > 0.5 ? '#10b981' : '#6b7280',
                  }}
                />
              </div>
            </div>

            <div style={styles.probCard}>
              <div style={styles.probLabel}>Conference Championship</div>
              <div style={styles.probValue}>
                {formatPercentage(simulation.conferenceChampionshipProbability)}
              </div>
              <div style={styles.probBar}>
                <div
                  style={{
                    ...styles.probBarFill,
                    width: `${simulation.conferenceChampionshipProbability * 100}%`,
                    backgroundColor:
                      simulation.conferenceChampionshipProbability > 0.3 ? '#10b981' : '#6b7280',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Win Distribution Chart */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Win Probability Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={distributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="wins"
                  stroke="#9ca3af"
                  label={{
                    value: 'Final Wins',
                    position: 'insideBottom',
                    offset: -5,
                    fill: '#9ca3af',
                  }}
                />
                <YAxis
                  stroke="#9ca3af"
                  label={{
                    value: 'Probability',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#9ca3af',
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#ffffff' }}
                />
                <Area
                  type="monotone"
                  dataKey="probability"
                  stroke="#ff6b00"
                  fill="#ff6b00"
                  fillOpacity={0.6}
                />
                <ReferenceLine
                  x={simulation.projectedRecord.wins}
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  label={{ value: 'Expected', position: 'top', fill: '#10b981' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Remaining Games */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Remaining Games Win Probability</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={gamesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" domain={[0, 100]} />
                <YAxis type="category" dataKey="name" stroke="#9ca3af" width={120} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Legend />
                <Bar dataKey="winProb" fill="#10b981" name="Win Probability" />
                <Bar dataKey="lossProb" fill="#ef4444" name="Loss Probability" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Conference Strength */}
          {conferenceStrength && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Conference Strength</h2>
              <div style={styles.confStrength}>
                <div style={styles.confMetric}>
                  <span style={styles.confLabel}>RPI:</span>
                  <span style={styles.confValue}>{conferenceStrength.rpi.toFixed(3)}</span>
                </div>
                <div style={styles.confMetric}>
                  <span style={styles.confLabel}>SOS:</span>
                  <span style={styles.confValue}>{conferenceStrength.sos.toFixed(3)}</span>
                </div>
                <div style={styles.confMetric}>
                  <span style={styles.confLabel}>ISR:</span>
                  <span style={styles.confValue}>{conferenceStrength.isr.toFixed(3)}</span>
                </div>
                <div style={styles.confMetric}>
                  <span style={styles.confLabel}>National Rank:</span>
                  <span style={styles.confValue}>#{conferenceStrength.rank}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* What-If Scenarios Tab */}
      {selectedTab === 'scenarios' && whatIfScenarios && (
        <div style={styles.content}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>What-If Scenarios</h2>
            <p style={styles.cardSubtitle}>
              Explore different outcomes and their impact on NCAA tournament chances
            </p>
            <div style={styles.scenarioGrid}>
              {whatIfScenarios.map((scenario, index) => (
                <div
                  key={index}
                  style={styles.scenarioCard}
                  onClick={() => setSelectedScenario(scenario.scenarioName)}
                >
                  <h3 style={styles.scenarioName}>{scenario.scenarioName}</h3>
                  <p style={styles.scenarioDesc}>{scenario.description}</p>
                  <div style={styles.scenarioRecord}>
                    {formatRecord(scenario.projectedRecord.wins, scenario.projectedRecord.losses)}
                  </div>
                  <div style={styles.scenarioMetrics}>
                    <div style={styles.scenarioMetric}>
                      <span style={styles.metricLabel}>RPI Change:</span>
                      <span
                        style={{
                          ...styles.metricValue,
                          color: scenario.rpiChange > 0 ? '#10b981' : '#ef4444',
                        }}
                      >
                        {scenario.rpiChange > 0 ? '+' : ''}
                        {scenario.rpiChange.toFixed(3)}
                      </span>
                    </div>
                    <div style={styles.scenarioMetric}>
                      <span style={styles.metricLabel}>NCAA Prob Change:</span>
                      <span
                        style={{
                          ...styles.metricValue,
                          color:
                            scenario.ncaaTournamentProbabilityChange > 0 ? '#10b981' : '#ef4444',
                        }}
                      >
                        {scenario.ncaaTournamentProbabilityChange > 0 ? '+' : ''}
                        {formatPercentage(scenario.ncaaTournamentProbabilityChange)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Tab */}
      {selectedTab === 'recommendations' && optimization && (
        <div style={styles.content}>
          {/* Key Recommendations */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Schedule Optimization Recommendations</h2>
            <div style={styles.recommendationsList}>
              {optimization.recommendations.map((rec, index) => (
                <div key={index} style={styles.recommendationCard}>
                  <div style={styles.recHeader}>
                    <span style={styles.recPriority}>Priority #{rec.priority}</span>
                    <span style={styles.recImpact}>Impact: {rec.impactScore.toFixed(1)}</span>
                  </div>
                  <h3 style={styles.recTitle}>{rec.recommendation}</h3>
                  <p style={styles.recReasoning}>{rec.reasoning}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Key Games */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Key Games</h2>
            <p style={styles.cardSubtitle}>Must-win games and high-impact matchups</p>
            <div style={styles.keyGamesList}>
              {optimization.keyGames.map((game, index) => (
                <div key={index} style={styles.keyGameCard}>
                  <div style={styles.keyGameHeader}>
                    <span style={styles.keyGameOpponent}>{game.opponent}</span>
                    <span style={styles.keyGameImportance}>
                      Importance: {game.importance.toFixed(1)}
                    </span>
                  </div>
                  <p style={styles.keyGameReasoning}>{game.reasoning}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Optimal Outcomes */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Optimal Outcomes</h2>
            <div style={styles.outcomesGrid}>
              {optimization.optimalOutcomes.map((outcome, index) => (
                <div key={index} style={styles.outcomeCard}>
                  <h3 style={styles.outcomeScenario}>{outcome.scenario}</h3>
                  <div style={styles.outcomeProb}>
                    {formatPercentage(outcome.probability)} probability
                  </div>
                  <div style={styles.outcomeRecord}>{outcome.finalRecord}</div>
                  {outcome.ncaaTournamentSeed && (
                    <div style={styles.outcomeSeed}>
                      🏆 National Seed #{outcome.ncaaTournamentSeed}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  loadingSpinner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid rgba(255, 107, 0, 0.3)',
    borderTop: '4px solid #ff6b00',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '20px',
    fontSize: '16px',
    color: '#9ca3af',
  },
  errorMessage: {
    textAlign: 'center',
    padding: '40px',
    color: '#ef4444',
  },
  retryButton: {
    marginTop: '20px',
    padding: '10px 20px',
    backgroundColor: '#ff6b00',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    padding: '20px',
    background: 'rgba(31, 41, 55, 0.8)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 107, 0, 0.2)',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#9ca3af',
    margin: 0,
  },
  iterationsSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  label: {
    fontSize: '14px',
    color: '#9ca3af',
  },
  select: {
    padding: '8px 12px',
    backgroundColor: 'rgba(55, 65, 81, 0.8)',
    color: '#ffffff',
    border: '1px solid rgba(255, 107, 0, 0.3)',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  tabNav: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    padding: '0 20px',
  },
  tabButton: {
    padding: '12px 24px',
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    color: '#9ca3af',
    border: '1px solid rgba(255, 107, 0, 0.2)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255, 107, 0, 0.2)',
    color: '#ff6b00',
    borderColor: '#ff6b00',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  card: {
    padding: '24px',
    background: 'rgba(31, 41, 55, 0.8)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 107, 0, 0.2)',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 4px 0',
  },
  cardSubtitle: {
    fontSize: '14px',
    color: '#9ca3af',
    margin: '0 0 20px 0',
  },
  recordDisplay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    padding: '30px 0',
  },
  recordMain: {
    fontSize: '48px',
    fontWeight: '800',
    color: '#ff6b00',
    textShadow: '0 0 20px rgba(255, 107, 0, 0.5)',
  },
  recordWinPct: {
    fontSize: '24px',
    color: '#9ca3af',
  },
  confidenceInterval: {
    textAlign: 'center',
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid rgba(255, 107, 0, 0.2)',
  },
  confidenceLabel: {
    fontSize: '14px',
    color: '#9ca3af',
    margin: '0 0 8px 0',
  },
  confidenceRange: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#ffffff',
    margin: 0,
  },
  probCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
  },
  probCard: {
    padding: '20px',
    background: 'rgba(31, 41, 55, 0.8)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 107, 0, 0.2)',
  },
  probLabel: {
    fontSize: '14px',
    color: '#9ca3af',
    marginBottom: '10px',
  },
  probValue: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '15px',
  },
  probBar: {
    width: '100%',
    height: '8px',
    backgroundColor: 'rgba(55, 65, 81, 0.8)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  probBarFill: {
    height: '100%',
    transition: 'width 0.3s ease',
    borderRadius: '4px',
  },
  confStrength: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  confMetric: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: 'rgba(55, 65, 81, 0.6)',
    borderRadius: '8px',
  },
  confLabel: {
    fontSize: '14px',
    color: '#9ca3af',
  },
  confValue: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#ff6b00',
  },
  scenarioGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  scenarioCard: {
    padding: '20px',
    backgroundColor: 'rgba(55, 65, 81, 0.6)',
    borderRadius: '8px',
    border: '1px solid rgba(255, 107, 0, 0.2)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  scenarioName: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 8px 0',
  },
  scenarioDesc: {
    fontSize: '14px',
    color: '#9ca3af',
    margin: '0 0 15px 0',
  },
  scenarioRecord: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#ff6b00',
    textAlign: 'center',
    margin: '15px 0',
  },
  scenarioMetrics: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '1px solid rgba(255, 107, 0, 0.2)',
  },
  scenarioMetric: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  metricValue: {
    fontSize: '14px',
    fontWeight: '600',
  },
  recommendationsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginTop: '20px',
  },
  recommendationCard: {
    padding: '20px',
    backgroundColor: 'rgba(55, 65, 81, 0.6)',
    borderRadius: '8px',
    borderLeft: '4px solid #ff6b00',
  },
  recHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  recPriority: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#ff6b00',
    textTransform: 'uppercase',
  },
  recImpact: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  recTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    margin: '0 0 8px 0',
  },
  recReasoning: {
    fontSize: '14px',
    color: '#9ca3af',
    margin: 0,
    lineHeight: '1.6',
  },
  keyGamesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginTop: '20px',
  },
  keyGameCard: {
    padding: '20px',
    backgroundColor: 'rgba(55, 65, 81, 0.6)',
    borderRadius: '8px',
    border: '1px solid rgba(255, 107, 0, 0.2)',
  },
  keyGameHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  keyGameOpponent: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
  },
  keyGameImportance: {
    fontSize: '14px',
    color: '#ff6b00',
    fontWeight: '600',
  },
  keyGameReasoning: {
    fontSize: '14px',
    color: '#9ca3af',
    margin: 0,
    lineHeight: '1.6',
  },
  outcomesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  outcomeCard: {
    padding: '20px',
    backgroundColor: 'rgba(55, 65, 81, 0.6)',
    borderRadius: '8px',
    border: '1px solid rgba(255, 107, 0, 0.2)',
    textAlign: 'center',
  },
  outcomeScenario: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 10px 0',
  },
  outcomeProb: {
    fontSize: '14px',
    color: '#9ca3af',
    marginBottom: '15px',
  },
  outcomeRecord: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#ff6b00',
    marginBottom: '15px',
  },
  outcomeSeed: {
    fontSize: '14px',
    color: '#10b981',
    fontWeight: '600',
    marginTop: '10px',
    paddingTop: '10px',
    borderTop: '1px solid rgba(255, 107, 0, 0.2)',
  },
};

export default ScheduleOptimizer;
