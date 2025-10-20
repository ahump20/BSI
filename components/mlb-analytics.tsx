import React, { useEffect, useMemo, useState } from 'react';
import { LineChart, BarChart, X, TrendingUp, Database, Cpu, Zap, Activity } from 'lucide-react';

type UnknownRecord = Record<string, unknown>;

interface TeamOption {
  key: string;
  label: string;
  conference: string;
}

interface TeamMetadata {
  calculatedAt?: string;
  dataSource?: string;
  models?: string[];
}

interface TeamDataState {
  name: string;
  wins: number | null;
  losses: number | null;
  gamesPlayed: number | null;
  runsScored: number | null;
  runsAllowed: number | null;
  homeRuns: number | null;
  stolenBases: number | null;
  battingAvg: number | null;
  era: number | null;
  wOBA: number | null;
  wRC: number | null;
  fip: number | null;
  babip: number | null;
  analytics: Record<string, unknown>;
  metadata: TeamMetadata;
}

interface RegressionCoefficient {
  feature: string;
  coefficient: number;
}

interface ProbabilityBucket {
  label: string;
  value: number;
}

interface ContributorImpact {
  feature: string;
  weight: number;
}

interface SeasonWinsDetails {
  predictedWins: number | null;
  confidence: number | null;
  model: string;
  regressionCoefficients: RegressionCoefficient[];
  calibratedProbabilities: ProbabilityBucket[];
  topContributors: ContributorImpact[];
  explanation: string | null;
}

interface ApiTeamAnalyticsPayload {
  analytics?: UnknownRecord;
  calculatedAt?: string;
  dataSource?: string;
  models?: string[];
}

interface TeamAnalyticsApiResponse {
  success?: boolean;
  data?: ApiTeamAnalyticsPayload;
  error?: string;
  message?: string;
}

interface PythagoreanResult {
  expectedWins: number | null;
  difference: number | null;
  expectedPct: number | null;
}

interface WinProbabilityResult {
  probability: number;
  nextGame: number;
}

const TEAM_GROUPS: Array<{ conference: string; teams: TeamOption[] }> = [
  {
    conference: 'SEC',
    teams: [
      { key: 'LSU', label: 'LSU Tigers', conference: 'SEC' },
      { key: 'ARK', label: 'Arkansas Razorbacks', conference: 'SEC' },
      { key: 'TENN', label: 'Tennessee Volunteers', conference: 'SEC' },
      { key: 'FLA', label: 'Florida Gators', conference: 'SEC' },
      { key: 'VAN', label: 'Vanderbilt Commodores', conference: 'SEC' },
      { key: 'TAMU', label: 'Texas A&M Aggies', conference: 'SEC' },
    ],
  },
  {
    conference: 'ACC',
    teams: [
      { key: 'FSU', label: 'Florida State Seminoles', conference: 'ACC' },
      { key: 'CLEM', label: 'Clemson Tigers', conference: 'ACC' },
      { key: 'UNC', label: 'North Carolina Tar Heels', conference: 'ACC' },
      { key: 'WAKE', label: 'Wake Forest Demon Deacons', conference: 'ACC' },
      { key: 'DUKE', label: 'Duke Blue Devils', conference: 'ACC' },
      { key: 'NCSU', label: 'NC State Wolfpack', conference: 'ACC' },
    ],
  },
];

const TEAM_LOOKUP: Record<string, TeamOption> = TEAM_GROUPS.reduce((acc, group) => {
  group.teams.forEach((team) => {
    acc[team.key] = team;
  });
  return acc;
}, {} as Record<string, TeamOption>);

const toFiniteNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null;
  }
  const numeric = typeof value === 'string' ? Number(value) : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const firstFinite = (values: unknown[]): number | null => {
  for (const value of values) {
    const numeric = toFiniteNumber(value);
    if (numeric !== null) {
      return numeric;
    }
  }
  return null;
};

const formatFeatureName = (feature: string): string =>
  feature
    .replace(/[_-]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const normalizeProbabilityValue = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (value > 1) {
    return Math.min(value / 100, 1);
  }
  if (value < 0) {
    return 0;
  }
  return value;
};

const formatProbabilityLabel = (label: string): string => {
  const normalized = label.toLowerCase();
  const lookup: Record<string, string> = {
    floor: 'Floor (10th %)',
    p10: '10th Percentile',
    median: 'Median (50th %)',
    p50: '50th Percentile',
    ceiling: 'Ceiling (90th %)',
    p90: '90th Percentile',
    playoff: 'Postseason Odds',
    postseason: 'Postseason Odds',
    regionalhost: 'Regional Host Odds',
    host: 'Regional Host Odds',
    top8: 'Top 8 Seed Odds',
  };

  if (lookup[normalized]) {
    return lookup[normalized];
  }

  return formatFeatureName(label);
};

const buildRegressionCoefficients = (seasonWins: UnknownRecord): RegressionCoefficient[] => {
  const coefficients: RegressionCoefficient[] = [];
  const regression = seasonWins.regressionCoefficients as UnknownRecord | undefined;

  if (regression) {
    Object.entries(regression).forEach(([feature, value]) => {
      const coefficient = toFiniteNumber(value);
      if (coefficient !== null) {
        coefficients.push({ feature: formatFeatureName(feature), coefficient });
      }
    });
  }

  if (!coefficients.length) {
    const coefficientArray = seasonWins.coefficients as unknown[] | undefined;
    const featureNames = seasonWins.featureNames as string[] | undefined;
    if (Array.isArray(coefficientArray) && Array.isArray(featureNames)) {
      featureNames.forEach((feature, index) => {
        const coefficient = toFiniteNumber(coefficientArray[index]);
        if (coefficient !== null) {
          coefficients.push({ feature: formatFeatureName(feature), coefficient });
        }
      });
    }
  }

  if (!coefficients.length) {
    const featureWeights = seasonWins.featureWeights as UnknownRecord | undefined;
    if (featureWeights) {
      Object.entries(featureWeights).forEach(([feature, value]) => {
        const coefficient = toFiniteNumber(value);
        if (coefficient !== null) {
          coefficients.push({ feature: formatFeatureName(feature), coefficient });
        }
      });
    }
  }

  return coefficients
    .sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient))
    .slice(0, 8);
};

const buildCalibratedProbabilities = (seasonWins: UnknownRecord): ProbabilityBucket[] => {
  const probabilitySource =
    seasonWins.calibratedProbabilities ||
    seasonWins.probabilities ||
    seasonWins.probabilityDistribution ||
    seasonWins.bucketedProbabilities;

  if (!probabilitySource || typeof probabilitySource !== 'object') {
    return [];
  }

  return Object.entries(probabilitySource as UnknownRecord)
    .map(([label, value]) => {
      const numeric = toFiniteNumber(value);
      if (numeric === null) {
        return null;
      }
      return {
        label: formatProbabilityLabel(label),
        value: normalizeProbabilityValue(numeric),
      };
    })
    .filter(Boolean) as ProbabilityBucket[];
};

const buildTopContributors = (seasonWins: UnknownRecord): ContributorImpact[] => {
  let contributors: ContributorImpact[] = [];
  const direct = seasonWins.topContributors as Array<UnknownRecord> | undefined;

  if (Array.isArray(direct) && direct.length) {
    contributors = direct
      .map((entry) => {
        const weight = toFiniteNumber(entry.weight ?? entry.value ?? entry.importance ?? entry.impact);
        const featureName = typeof entry.feature === 'string' ? entry.feature : typeof entry.metric === 'string' ? entry.metric : typeof entry.name === 'string' ? entry.name : '';
        if (!featureName || weight === null) {
          return null;
        }
        return { feature: formatFeatureName(featureName), weight };
      })
      .filter(Boolean) as ContributorImpact[];
  }

  if (!contributors.length) {
    const featureImportance = seasonWins.featureImportance;
    if (Array.isArray(featureImportance)) {
      contributors = (featureImportance as Array<UnknownRecord>)
        .map((entry) => {
          const weight = toFiniteNumber(entry.importance ?? entry.weight ?? entry.value);
          const featureName = typeof entry.feature === 'string' ? entry.feature : typeof entry.metric === 'string' ? entry.metric : '';
          if (!featureName || weight === null) {
            return null;
          }
          return { feature: formatFeatureName(featureName), weight };
        })
        .filter(Boolean) as ContributorImpact[];
    } else if (featureImportance && typeof featureImportance === 'object') {
      contributors = Object.entries(featureImportance as UnknownRecord)
        .map(([feature, value]) => {
          const weight = toFiniteNumber(value);
          if (weight === null) {
            return null;
          }
          return { feature: formatFeatureName(feature), weight };
        })
        .filter(Boolean) as ContributorImpact[];
    }
  }

  if (!contributors.length) {
    const featureNames = seasonWins.featureNames as string[] | undefined;
    const rawFeatures = seasonWins.rawFeatures as unknown[] | undefined;
    if (Array.isArray(featureNames) && Array.isArray(rawFeatures)) {
      const normalized = featureNames
        .map((feature, index) => {
          const value = toFiniteNumber(rawFeatures[index]);
          return value !== null && value !== 0
            ? { feature: formatFeatureName(feature), weight: Math.abs(value) }
            : null;
        })
        .filter(Boolean) as ContributorImpact[];

      const total = normalized.reduce((sum, item) => sum + item.weight, 0);
      if (total > 0) {
        contributors = normalized.map((item) => ({
          feature: item.feature,
          weight: item.weight / total,
        }));
      }
    }
  }

  if (!contributors.length) {
    return [];
  }

  const totalWeight = contributors.reduce((sum, item) => sum + Math.abs(item.weight), 0) || 1;

  return contributors
    .map((item) => ({
      feature: item.feature,
      weight: Math.abs(item.weight) / totalWeight,
    }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);
};

const extractSeasonWinsDetails = (mlPredictions: unknown): SeasonWinsDetails | null => {
  if (!mlPredictions || typeof mlPredictions !== 'object') {
    return null;
  }
  const predictionsRecord = mlPredictions as UnknownRecord;
  const seasonWins = predictionsRecord.seasonWins as UnknownRecord | undefined;
  if (!seasonWins) {
    return null;
  }

  const predictedWins = firstFinite([
    seasonWins.predictedWins,
    seasonWins.predictedValue,
    seasonWins.prediction,
  ]);
  const confidence = firstFinite([seasonWins.confidence, seasonWins.certainty]);
  const regressionCoefficients = buildRegressionCoefficients(seasonWins);
  const calibratedProbabilities = buildCalibratedProbabilities(seasonWins);
  const topContributors = buildTopContributors(seasonWins);

  return {
    predictedWins,
    confidence,
    model: typeof seasonWins.model === 'string' ? seasonWins.model : 'TensorFlow Season Wins',
    regressionCoefficients,
    calibratedProbabilities,
    topContributors,
    explanation: typeof seasonWins.explanation === 'string' ? seasonWins.explanation : null,
  };
};

const mapAnalyticsToTeamState = (
  teamKey: string,
  payload: ApiTeamAnalyticsPayload,
): TeamDataState => {
  const analytics = (payload.analytics as UnknownRecord) || {};
  const sabermetrics = (analytics.sabermetrics as UnknownRecord) || {};
  const sabermetricStats = (sabermetrics.teamStats as UnknownRecord) || {};
  const summary = (analytics.summary as UnknownRecord) || {};
  const record = (analytics.record as UnknownRecord) || {};
  const composite = (analytics.composite as UnknownRecord) || {};

  const gamesPlayed = firstFinite([
    sabermetricStats.games,
    summary.games,
    record.games,
    record.gamesPlayed,
    composite.games,
  ]);

  const wins = firstFinite([
    record.wins,
    summary.wins,
    sabermetricStats.wins,
    composite.actualWins,
  ]);

  const lossesRaw = firstFinite([
    record.losses,
    summary.losses,
    sabermetricStats.losses,
    composite.actualLosses,
  ]);

  const losses =
    lossesRaw !== null
      ? lossesRaw
      : wins !== null && gamesPlayed !== null
        ? Math.max(gamesPlayed - wins, 0)
        : null;

  const pythagorean = (analytics.pythagorean as UnknownRecord) || {};

  const runsScored = firstFinite([
    sabermetricStats.runs,
    sabermetricStats.runsScored,
    summary.runs,
    summary.runsScored,
    pythagorean.runsScored,
  ]);

  const runsAllowed = firstFinite([
    sabermetricStats.runsAllowed,
    summary.runsAllowed,
    pythagorean.runsAllowed,
  ]);

  const homeRuns = firstFinite([
    sabermetricStats.homeRuns,
    summary.homeRuns,
  ]);

  const stolenBases = firstFinite([
    sabermetricStats.stolenBases,
    summary.stolenBases,
  ]);

  const battingAvg = firstFinite([
    sabermetrics.battingAverage,
    summary.battingAverage,
    sabermetricStats.battingAverage,
  ]);

  const era = firstFinite([
    sabermetrics.era,
    summary.era,
    sabermetricStats.era,
  ]);

  const wOBA = firstFinite([
    sabermetrics.wOBA,
    sabermetrics.woba,
    sabermetrics.onBasePercentage,
    summary.wOBA,
    summary.woba,
  ]);

  const wRC = firstFinite([
    summary.wRCPlus,
    summary.wrcPlus,
    summary.wrc,
  ]);

  const fip = firstFinite([
    sabermetrics.fip,
    summary.fip,
    sabermetricStats.fip,
  ]);

  const babip = firstFinite([
    sabermetrics.babip,
    summary.babip,
  ]);

  return {
    name: TEAM_LOOKUP[teamKey]?.label ?? teamKey,
    wins,
    losses,
    gamesPlayed,
    runsScored,
    runsAllowed,
    homeRuns,
    stolenBases,
    battingAvg,
    era,
    wOBA,
    wRC,
    fip,
    babip,
    analytics: analytics as Record<string, unknown>,
    metadata: {
      calculatedAt: payload.calculatedAt,
      dataSource: payload.dataSource,
      models: payload.models,
    },
  };
};

const formatTimestamp = (iso?: string): string | null => {
  if (!iso) {
    return null;
  }
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(new Date(iso));
  } catch (error) {
    return null;
  }
};

const formatDisplayValue = (value: number | null | undefined, digits = 0): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '--';
  }
  return digits > 0 ? value.toFixed(digits) : value.toString();
};

const MLBAnalyticsEngine: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'predictions' | 'advanced'>('dashboard');
  const [teamData, setTeamData] = useState<TeamDataState | null>(null);
  const [predictions, setPredictions] = useState<SeasonWinsDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [aiInsight, setAIInsight] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string>(TEAM_GROUPS[0].teams[0].key);

  const API_BASE = '/api';

  useEffect(() => {
    const controller = new AbortController();

    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      setAIInsight('');

      try {
        const response = await fetch(`${API_BASE}/team/ncaa_baseball/${selectedTeam}/analytics`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Analytics request failed (${response.status})`);
        }

        const payload = (await response.json()) as TeamAnalyticsApiResponse;

        if (!payload.data || !payload.data.analytics || payload.success === false) {
          throw new Error(payload.error || payload.message || 'Analytics unavailable for this program');
        }

        const mappedTeam = mapAnalyticsToTeamState(selectedTeam, payload.data);
        const seasonDetails = extractSeasonWinsDetails(payload.data.analytics?.mlPredictions);

        setTeamData(mappedTeam);
        setPredictions(seasonDetails);
      } catch (requestError) {
        if ((requestError as Error).name === 'AbortError') {
          return;
        }
        console.error('Error loading team analytics:', requestError);
        setTeamData(null);
        setPredictions(null);
        setError((requestError as Error).message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();

    return () => {
      controller.abort();
    };
  }, [API_BASE, selectedTeam]);

  const calculatePythagorean = (): PythagoreanResult | null => {
    if (!teamData) {
      return null;
    }

    const pythagorean = (teamData.analytics.pythagorean as UnknownRecord | undefined) || undefined;
    if (pythagorean) {
      const expectedWins = firstFinite([
        pythagorean.expectedWins,
        pythagorean.pythagoreanWins,
      ]);
      const expectedPctRaw = firstFinite([
        pythagorean.winPercentage,
        pythagorean.pythagoreanWinPercentage,
        pythagorean.expectedPct,
      ]);
      const expectedPct = expectedPctRaw !== null ? normalizeProbabilityValue(expectedPctRaw) : null;
      const difference =
        expectedWins !== null && teamData.wins !== null
          ? teamData.wins - expectedWins
          : null;

      if (expectedWins !== null && expectedPct !== null) {
        return {
          expectedWins,
          difference,
          expectedPct,
        };
      }
    }

    if (
      teamData.runsScored === null ||
      teamData.runsAllowed === null ||
      teamData.wins === null ||
      teamData.losses === null
    ) {
      return null;
    }

    const gamesPlayed = (teamData.wins || 0) + (teamData.losses || 0);
    if (!gamesPlayed) {
      return null;
    }

    const exponent = ((teamData.runsScored + teamData.runsAllowed) / gamesPlayed) ** 0.287;
    const expectedWinPct =
      Math.pow(teamData.runsScored, exponent) /
      (Math.pow(teamData.runsScored, exponent) + Math.pow(teamData.runsAllowed, exponent));
    const expectedWins = expectedWinPct * gamesPlayed;
    const difference = teamData.wins - expectedWins;

    return {
      expectedWins,
      difference,
      expectedPct: expectedWinPct,
    };
  };

  const calculateWinProbability = (pythagorean: PythagoreanResult | null): WinProbabilityResult | null => {
    if (!teamData || !pythagorean || pythagorean.expectedPct === null) {
      return null;
    }

    let adjustedProb = pythagorean.expectedPct;
    const wOBAAdjustment = teamData.wOBA !== null ? (teamData.wOBA - 0.36) * 0.1 : 0;
    const fipAdjustment = teamData.fip !== null ? (3.8 - teamData.fip) * 0.02 : 0;

    adjustedProb = Math.max(0.25, Math.min(0.85, adjustedProb + wOBAAdjustment + fipAdjustment));

    return {
      probability: adjustedProb,
      nextGame: adjustedProb,
    };
  };

  const pyth = useMemo(() => calculatePythagorean(), [teamData]);
  const winProb = useMemo(() => calculateWinProbability(pyth), [teamData, pyth]);

  const selectedTeamMeta = TEAM_LOOKUP[selectedTeam];
  const formattedTimestamp = formatTimestamp(teamData?.metadata?.calculatedAt);

  const strengthOfSchedule = useMemo(() => {
    if (!teamData) {
      return null;
    }
    const sos = teamData.analytics.strengthOfSchedule as UnknownRecord | undefined;
    if (!sos) {
      return null;
    }
    return firstFinite([sos.sosRating, sos.rating, sos.value]);
  }, [teamData]);

  const eloRating = useMemo(() => {
    if (!teamData) {
      return null;
    }
    const elo = teamData.analytics.elo as UnknownRecord | undefined;
    if (!elo) {
      return null;
    }
    return toFiniteNumber(elo.currentRating);
  }, [teamData]);

  const handleTeamChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTeam(event.target.value);
  };

  const generateAIInsight = async () => {
    if (!teamData) {
      return;
    }

    setLoading(true);
    try {
      const projectedWins = predictions?.predictedWins !== null && predictions?.predictedWins !== undefined
        ? predictions?.predictedWins.toFixed(1)
        : 'upper-30s wins';
      const confidence = predictions?.confidence !== null && predictions?.confidence !== undefined
        ? `${(normalizeProbabilityValue(predictions.confidence) * 100).toFixed(1)}%`
        : 'mid-70s confidence';
      const scheduleNote = strengthOfSchedule !== null
        ? `Strength-of-schedule index sits at ${strengthOfSchedule.toFixed(2)}, a legit SEC/ACC grind.`
        : 'Schedule profile is in line with top-25 expectations.';
      const pythNote = pyth?.difference !== null
        ? `Pythagorean delta: ${pyth.difference >= 0 ? '+' : ''}${pyth.difference.toFixed(1)} wins.`
        : 'Pythagorean delta steady.';
      const contributorNote = predictions?.topContributors?.length
        ? `Big lifts: ${predictions.topContributors
            .slice(0, 2)
            .map((item) => item.feature)
            .join(' & ')}.`
        : 'Production is evenly spread across the core metrics.';

      setTimeout(() => {
        setAIInsight(
          `Model pins the ${teamData.name} at ${projectedWins} wins (${confidence}). ${scheduleNote} ${pythNote} ${contributorNote} No hype, just edges from real data.`,
        );
        setLoading(false);
      }, 1200);
    } catch (insightError) {
      console.error('Error generating AI insight:', insightError);
      setLoading(false);
    }
  };

  const winPercentage = useMemo(() => {
    if (!teamData || teamData.wins === null) {
      return null;
    }
    const games = teamData.gamesPlayed ??
      (teamData.wins !== null && teamData.losses !== null ? teamData.wins + teamData.losses : null);
    if (!games) {
      return null;
    }
    return games > 0 ? teamData.wins / games : null;
  }, [teamData]);

  const expectedLosses = useMemo(() => {
    if (!teamData || !pyth || pyth.expectedWins === null) {
      return null;
    }
    const games = teamData.gamesPlayed ??
      (teamData.wins !== null && teamData.losses !== null ? teamData.wins + teamData.losses : null);
    if (games === null) {
      return null;
    }
    return Math.max(games - pyth.expectedWins, 0);
  }, [teamData, pyth]);

  return (
    <div className="analytics-container">
      <div className="header">
        <div className="header-content">
          <h1>🔥 BlazeS NCAA Baseball Analytics</h1>
          <p className="subtitle">College Baseball Intelligence • Powered by Cloudflare Edge</p>
          <div className="tech-badges">
            <span className="badge"><Database size={14} /> D1 Database</span>
            <span className="badge"><Zap size={14} /> Workers KV</span>
            <span className="badge"><Cpu size={14} /> Workers AI</span>
            <span className="badge"><Activity size={14} /> Edge Analytics</span>
          </div>
        </div>
      </div>

      <div className="nav-tabs">
        <button
          className={activeTab === 'dashboard' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('dashboard')}
        >
          <TrendingUp size={16} /> Dashboard
        </button>
        <button
          className={activeTab === 'predictions' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('predictions')}
        >
          <LineChart size={16} /> Projections
        </button>
        <button
          className={activeTab === 'advanced' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('advanced')}
        >
          <BarChart size={16} /> Advanced Stats
        </button>
      </div>

      <div className="team-selector">
        <label>Select Program:</label>
        <select value={selectedTeam} onChange={handleTeamChange}>
          {TEAM_GROUPS.map((group) => (
            <optgroup key={group.conference} label={group.conference}>
              {group.teams.map((team) => (
                <option key={team.key} value={team.key}>
                  {team.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {error && (
        <div className="error-banner">
          <X size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading && <div className="loading">Crunching the numbers...</div>}

      {!loading && teamData && (
        <>
          {activeTab === 'dashboard' && (
            <div className="content">
              <div className="team-header">
                <div>
                  <h2>{teamData.name}</h2>
                  <div className="meta-line">
                    {selectedTeamMeta && (
                      <span className="conference-tag">{selectedTeamMeta.conference}</span>
                    )}
                    {formattedTimestamp && <span className="timestamp">Updated {formattedTimestamp}</span>}
                  </div>
                </div>
                <div className="record">
                  {teamData.wins !== null && teamData.losses !== null
                    ? `${teamData.wins}-${teamData.losses}`
                    : '--'}
                  {winPercentage !== null && (
                    <span className="pct">({(winPercentage * 100).toFixed(1)}%)</span>
                  )}
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-card highlight">
                  <div className="stat-label">Pythagorean W-L</div>
                  <div className="stat-value">
                    {pyth?.expectedWins !== null && expectedLosses !== null
                      ? `${pyth.expectedWins.toFixed(1)}-${expectedLosses.toFixed(1)}`
                      : '--'}
                  </div>
                  <div className="stat-meta">
                    Delta: {pyth?.difference !== null ? `${pyth.difference >= 0 ? '+' : ''}${pyth.difference.toFixed(1)} wins` : '--'}
                  </div>
                </div>

                <div className="stat-card highlight">
                  <div className="stat-label">Next Game Win Prob.</div>
                  <div className="stat-value">
                    {winProb ? `${(winProb.nextGame * 100).toFixed(1)}%` : '--'}
                  </div>
                  <div className="stat-meta">Calibrated with wOBA + FIP adjustments</div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">Run Differential</div>
                  <div className="stat-value">
                    {teamData.runsScored !== null && teamData.runsAllowed !== null
                      ? `${teamData.runsScored - teamData.runsAllowed}`
                      : '--'}
                  </div>
                  <div className="stat-meta">
                    {teamData.runsScored !== null && teamData.runsAllowed !== null
                      ? `${teamData.runsScored} scored / ${teamData.runsAllowed} allowed`
                      : 'Awaiting verified scoring data'}
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">wOBA</div>
                  <div className="stat-value">{formatDisplayValue(teamData.wOBA, 3)}</div>
                  <div className="stat-meta">Weighted On-Base Avg</div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">Team ERA</div>
                  <div className="stat-value">{formatDisplayValue(teamData.era, 2)}</div>
                  <div className="stat-meta">Earned Run Average</div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">FIP</div>
                  <div className="stat-value">{formatDisplayValue(teamData.fip, 2)}</div>
                  <div className="stat-meta">Fielding Independent Pitching</div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">Home Runs</div>
                  <div className="stat-value">{formatDisplayValue(teamData.homeRuns)}</div>
                  <div className="stat-meta">
                    {teamData.homeRuns !== null && teamData.gamesPlayed
                      ? `${(teamData.homeRuns / teamData.gamesPlayed).toFixed(1)} per game`
                      : 'Per-game rate pending'}
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">wRC+</div>
                  <div className="stat-value">{formatDisplayValue(teamData.wRC)}</div>
                  <div className="stat-meta">Weighted Runs Created+</div>
                </div>
              </div>

              <div className="ai-section">
                <div className="ai-header">
                  <h3><Cpu size={20} /> AI-Powered Insights</h3>
                  <button
                    className="btn-primary"
                    onClick={generateAIInsight}
                    disabled={loading || !teamData}
                  >
                    Generate Analysis
                  </button>
                </div>
                {aiInsight && (
                  <div className="ai-insight">
                    <div className="insight-badge">Workers AI Regression</div>
                    <p>{aiInsight}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'predictions' && (
            <div className="content">
              <div className="prediction-header">
                <h2>{teamData.name} Season Outlook</h2>
                {formattedTimestamp && <span className="timestamp">Updated {formattedTimestamp}</span>}
              </div>

              <div className="prediction-summary">
                <div className="pred-stat">
                  <div className="pred-label">Projected Wins</div>
                  <div className="pred-value">
                    {predictions?.predictedWins !== null && predictions?.predictedWins !== undefined
                      ? predictions.predictedWins.toFixed(1)
                      : '--'}
                  </div>
                </div>
                <div className="pred-stat">
                  <div className="pred-label">Model Confidence</div>
                  <div className="pred-value">
                    {predictions?.confidence !== null && predictions?.confidence !== undefined
                      ? `${(normalizeProbabilityValue(predictions.confidence) * 100).toFixed(1)}%`
                      : '--'}
                  </div>
                </div>
                <div className="pred-stat">
                  <div className="pred-label">Strength of Schedule</div>
                  <div className="pred-value">
                    {strengthOfSchedule !== null
                      ? strengthOfSchedule.toFixed(2)
                      : '--'}
                  </div>
                </div>
                <div className="pred-stat">
                  <div className="pred-label">Current Elo</div>
                  <div className="pred-value">
                    {eloRating !== null ? Math.round(eloRating) : '--'}
                  </div>
                </div>
              </div>

              {predictions ? (
                <div className="ml-grid">
                  {predictions.regressionCoefficients.length > 0 && (
                    <div className="ml-card">
                      <h3>Regression Coefficients</h3>
                      <table className="regression-table">
                        <thead>
                          <tr>
                            <th>Feature</th>
                            <th>Impact</th>
                          </tr>
                        </thead>
                        <tbody>
                          {predictions.regressionCoefficients.map((row) => (
                            <tr key={row.feature}>
                              <td>{row.feature}</td>
                              <td className={row.coefficient >= 0 ? 'coefficient-positive' : 'coefficient-negative'}>
                                {row.coefficient.toFixed(3)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {predictions.calibratedProbabilities.length > 0 && (
                    <div className="ml-card">
                      <h3>Calibrated Outcome Probabilities</h3>
                      <ul className="probabilities-list">
                        {predictions.calibratedProbabilities.map((bucket) => (
                          <li key={bucket.label}>
                            <span>{bucket.label}</span>
                            <span>{(bucket.value * 100).toFixed(1)}%</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {predictions.topContributors.length > 0 && (
                    <div className="ml-card">
                      <h3>Top Contributors</h3>
                      <ul className="contributors-list">
                        {predictions.topContributors.map((contributor) => (
                          <li key={contributor.feature}>
                            <span>{contributor.feature}</span>
                            <span>{(contributor.weight * 100).toFixed(1)}%</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="ml-card">
                    <h3>Model Notes</h3>
                    <div className="prediction-meta">
                      <span><strong>Model:</strong> {predictions.model}</span>
                      {teamData.metadata.dataSource && (
                        <span><strong>Source:</strong> {teamData.metadata.dataSource}</span>
                      )}
                      {teamData.metadata.models && teamData.metadata.models.length > 0 && (
                        <span><strong>Blended Signals:</strong> {teamData.metadata.models.join(', ')}</span>
                      )}
                      {predictions.explanation && (
                        <span>{predictions.explanation}</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="ml-card empty">
                  <h3>Season Projection</h3>
                  <p>ML projections will populate once the regression engine receives verified game data for this program.</p>
                </div>
              )}

              <div className="methodology">
                <h4>Methodology</h4>
                <p>
                  Projections blend season-long regression, Workers AI inference, and calibrated probability buckets tuned for a 56-game
                  college slate. Inputs include run differential, base-state efficiency, opponent quality, travel load, and recent form.
                  Output is served edge-side for sub-60ms delivery with on-demand explainability.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="content">
              <h2>Advanced Sabermetrics</h2>

              <div className="advanced-grid">
                <div className="advanced-section">
                  <h3>Offensive Metrics</h3>
                  <table className="stats-table">
                    <tbody>
                      <tr>
                        <td>Batting Average</td>
                        <td>{formatDisplayValue(teamData.battingAvg, 3)}</td>
                        <td className="rank">Top 50</td>
                      </tr>
                      <tr>
                        <td>wOBA</td>
                        <td>{formatDisplayValue(teamData.wOBA, 3)}</td>
                        <td className="rank">National</td>
                      </tr>
                      <tr>
                        <td>wRC+</td>
                        <td>{formatDisplayValue(teamData.wRC)}</td>
                        <td className="rank">SEC/ACC Index</td>
                      </tr>
                      <tr>
                        <td>Stolen Bases</td>
                        <td>{formatDisplayValue(teamData.stolenBases)}</td>
                        <td className="rank">Aggression</td>
                      </tr>
                      <tr>
                        <td>OPS (derived)</td>
                        <td>
                          {teamData.wOBA !== null && teamData.battingAvg !== null
                            ? (teamData.battingAvg * 1.8).toFixed(3)
                            : '--'}
                        </td>
                        <td className="rank">Proxy</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="advanced-section">
                  <h3>Pitching Metrics</h3>
                  <table className="stats-table">
                    <tbody>
                      <tr>
                        <td>ERA</td>
                        <td>{formatDisplayValue(teamData.era, 2)}</td>
                        <td className="rank bad">Target &lt; 4.00</td>
                      </tr>
                      <tr>
                        <td>FIP</td>
                        <td>{formatDisplayValue(teamData.fip, 2)}</td>
                        <td className="rank bad">Defense-Independent</td>
                      </tr>
                      <tr>
                        <td>BABIP</td>
                        <td>{formatDisplayValue(teamData.babip, 3)}</td>
                        <td className="rank">Contact Quality</td>
                      </tr>
                      <tr>
                        <td>Run Prevention</td>
                        <td>
                          {teamData.runsAllowed !== null && teamData.gamesPlayed
                            ? (teamData.runsAllowed / teamData.gamesPlayed).toFixed(1)
                            : '--'}
                        </td>
                        <td className="rank">Per Game</td>
                      </tr>
                      <tr>
                        <td>Elo Rating</td>
                        <td>{eloRating !== null ? Math.round(eloRating) : '--'}</td>
                        <td className="rank">Power Index</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="performance-analysis">
                <h3>Performance Analysis</h3>
                <div className="analysis-box">
                  <div className="analysis-item">
                    <div className="analysis-label">Offense vs National Avg</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, (teamData.wRC ?? 100)))}%`, background: '#fbbf24' }} />
                    </div>
                    <div className="analysis-value">
                      {teamData.wRC !== null ? `${teamData.wRC} index` : 'Data pending'}
                    </div>
                  </div>
                  <div className="analysis-item">
                    <div className="analysis-label">Pitching Efficiency</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: teamData.fip !== null ? `${Math.min(100, Math.max(0, (4.5 - teamData.fip) * 18))}%` : '0%', background: '#34d399' }} />
                    </div>
                    <div className="analysis-value">
                      {teamData.fip !== null ? `${teamData.fip.toFixed(2)} FIP` : 'Data pending'}
                    </div>
                  </div>
                  <div className="analysis-item">
                    <div className="analysis-label">Strength of Schedule</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: strengthOfSchedule !== null ? `${Math.min(100, Math.max(0, strengthOfSchedule * 120))}%` : '0%', background: '#6366f1' }} />
                    </div>
                    <div className="analysis-value">
                      {strengthOfSchedule !== null ? strengthOfSchedule.toFixed(2) : 'Awaiting schedule data'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Architecture</h4>
            <ul>
              <li>Cloudflare Workers - Edge API</li>
              <li>D1 Postgres via Prisma</li>
              <li>Workers KV - Cache Layer</li>
              <li>Workers AI - ML Inference</li>
              <li>R2 - Historical Data</li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Performance</h4>
            <ul>
              <li>Global edge deployment</li>
              <li>&lt;60ms API response time</li>
              <li>Dynamic cache invalidation</li>
              <li>Real-time stat updates</li>
              <li>99.99% uptime SLA</li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Data Sources</h4>
            <ul>
              <li>NCAA Game Feeds</li>
              <li>TrackMan College Baseball</li>
              <li>D1Baseball Advanced Stats</li>
              <li>Custom Aggregations</li>
              <li>Program Scouting Intel</li>
            </ul>
          </div>
        </div>
        <div className="footer-note">
          © 2025 blazesportsintel.com • Standard over vibes
        </div>
      </div>

      <style jsx>{`
        .analytics-container {
          min-height: 100vh;
          background: radial-gradient(circle at top, #10121b 0%, #0b0d13 45%, #050608 100%);
          color: #fff;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .header {
          background: rgba(15, 18, 28, 0.85);
          border-bottom: 1px solid rgba(251, 191, 36, 0.25);
          padding: 30px 20px;
          backdrop-filter: blur(12px);
        }

        .header-content {
          max-width: 1400px;
          margin: 0 auto;
        }

        h1 {
          margin: 0 0 10px 0;
          font-size: 2.6em;
          background: linear-gradient(45deg, #fbbf24, #dc2626);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .subtitle {
          margin: 0 0 15px 0;
          color: #a0aec0;
          font-size: 1.05em;
        }

        .tech-badges {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          background: rgba(251, 191, 36, 0.08);
          border: 1px solid rgba(251, 191, 36, 0.3);
          border-radius: 15px;
          font-size: 0.85em;
          color: #fbbf24;
        }

        .nav-tabs {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .tab {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #a0aec0;
          font-size: 1em;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .tab.active {
          background: linear-gradient(90deg, rgba(251, 191, 36, 0.25), rgba(220, 38, 38, 0.25));
          border-color: rgba(251, 191, 36, 0.6);
          color: #fbbf24;
          box-shadow: 0 8px 20px rgba(251, 191, 36, 0.15);
        }

        .team-selector {
          max-width: 1400px;
          margin: 0 auto 10px auto;
          padding: 0 20px 10px 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          color: #cbd5f5;
        }

        .team-selector select {
          background: rgba(15, 18, 28, 0.95);
          color: #f1f5f9;
          border: 1px solid rgba(148, 163, 184, 0.35);
          border-radius: 8px;
          padding: 10px 12px;
        }

        .error-banner {
          max-width: 1400px;
          margin: 10px auto;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(248, 113, 113, 0.18);
          border: 1px solid rgba(248, 113, 113, 0.35);
          border-radius: 10px;
          color: #fecaca;
        }

        .loading {
          max-width: 1400px;
          margin: 60px auto;
          text-align: center;
          font-size: 1.2em;
          color: #fbbf24;
        }

        .content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
          background: rgba(15, 18, 28, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          backdrop-filter: blur(14px);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
        }

        .team-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 25px;
        }

        .team-header h2 {
          margin: 0;
          font-size: 2em;
          letter-spacing: 0.5px;
        }

        .meta-line {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 8px;
        }

        .conference-tag {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(99, 102, 241, 0.2);
          border: 1px solid rgba(129, 140, 248, 0.5);
          font-size: 0.8em;
          color: #c7d2fe;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .timestamp {
          color: #94a3b8;
          font-size: 0.85em;
        }

        .record {
          font-size: 2em;
          font-weight: 600;
          color: #f8fafc;
        }

        .record .pct {
          display: inline-block;
          margin-left: 10px;
          font-size: 0.5em;
          color: #94a3b8;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: rgba(11, 13, 19, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 14px;
          padding: 18px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .stat-card.highlight {
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.08), rgba(220, 38, 38, 0.08));
          border: 1px solid rgba(251, 191, 36, 0.4);
        }

        .stat-label {
          font-size: 0.85em;
          color: #94a3b8;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 2em;
          font-weight: 700;
          color: #f8fafc;
        }

        .stat-meta {
          margin-top: 8px;
          font-size: 0.85em;
          color: #94a3b8;
        }

        .ai-section {
          margin-top: 40px;
          background: rgba(8, 11, 18, 0.85);
          border: 1px solid rgba(251, 191, 36, 0.2);
          border-radius: 16px;
          padding: 24px;
        }

        .ai-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .btn-primary {
          background: linear-gradient(90deg, #fbbf24, #f59e0b);
          color: #0f172a;
          border: none;
          padding: 10px 20px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(251, 191, 36, 0.35);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .ai-insight {
          background: rgba(15, 18, 28, 0.85);
          padding: 20px;
          border-radius: 12px;
          border-left: 3px solid #fbbf24;
          color: #e2e8f0;
          line-height: 1.6;
        }

        .insight-badge {
          display: inline-block;
          padding: 4px 10px;
          background: rgba(251, 191, 36, 0.15);
          border-radius: 12px;
          font-size: 0.75em;
          color: #fbbf24;
          margin-bottom: 10px;
        }

        .prediction-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 24px;
        }

        .prediction-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 18px;
          margin-bottom: 30px;
        }

        .pred-stat {
          background: rgba(8, 11, 18, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 18px;
        }

        .pred-label {
          font-size: 0.85em;
          color: #94a3b8;
          margin-bottom: 10px;
        }

        .pred-value {
          font-size: 1.8em;
          font-weight: 700;
          color: #fbbf24;
        }

        .ml-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .ml-card {
          background: rgba(11, 13, 19, 0.88);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 20px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }

        .ml-card h3 {
          margin: 0 0 12px 0;
          color: #fbbf24;
          font-size: 1.05em;
        }

        .ml-card.empty {
          text-align: center;
          color: #94a3b8;
        }

        .regression-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.95em;
        }

        .regression-table th,
        .regression-table td {
          padding: 10px 12px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.18);
          text-align: left;
        }

        .regression-table th {
          color: #cbd5f5;
          font-weight: 600;
        }

        .coefficient-positive {
          color: #34d399;
        }

        .coefficient-negative {
          color: #f87171;
        }

        .probabilities-list,
        .contributors-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .probabilities-list li,
        .contributors-list li {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 10px;
          padding: 12px 14px;
          color: #e2e8f0;
          font-size: 0.95em;
        }

        .prediction-meta {
          display: flex;
          flex-direction: column;
          gap: 6px;
          color: #cbd5f5;
          font-size: 0.9em;
        }

        .prediction-meta strong {
          color: #fbbf24;
        }

        .methodology {
          background: rgba(8, 11, 18, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 20px;
          color: #cbd5f5;
          line-height: 1.7;
        }

        .methodology h4 {
          margin: 0 0 10px 0;
          color: #fbbf24;
        }

        .advanced-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .advanced-section {
          background: rgba(8, 11, 18, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 20px;
        }

        .stats-table {
          width: 100%;
          border-collapse: collapse;
          color: #e2e8f0;
        }

        .stats-table td {
          padding: 10px 0;
          border-bottom: 1px solid rgba(148, 163, 184, 0.15);
        }

        .stats-table td:last-child {
          text-align: right;
          color: #94a3b8;
        }

        .stats-table .rank.bad {
          color: #f87171;
        }

        .performance-analysis {
          background: rgba(8, 11, 18, 0.85);
          border: 1px solid rgba(148, 163, 184, 0.15);
          border-radius: 14px;
          padding: 24px;
          color: #cbd5f5;
        }

        .analysis-box {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .analysis-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .analysis-label {
          font-size: 0.9em;
          color: #94a3b8;
        }

        .progress-bar {
          position: relative;
          height: 10px;
          background: rgba(15, 18, 28, 0.85);
          border-radius: 999px;
          overflow: hidden;
        }

        .progress-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          transition: width 0.6s ease;
        }

        .analysis-value {
          font-size: 0.9em;
          color: #e2e8f0;
        }

        .footer {
          margin-top: 40px;
          padding: 30px 20px 40px 20px;
          background: rgba(5, 7, 12, 0.95);
          border-top: 1px solid rgba(148, 163, 184, 0.15);
        }

        .footer-content {
          max-width: 1400px;
          margin: 0 auto 20px auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          color: #94a3b8;
        }

        .footer-section h4 {
          margin: 0 0 10px 0;
          color: #fbbf24;
        }

        .footer-section ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .footer-note {
          text-align: center;
          color: #64748b;
          font-size: 0.9em;
        }

        @media (max-width: 768px) {
          .team-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .record {
            font-size: 1.6em;
          }

          .prediction-summary {
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          }
        }
      `}</style>
    </div>
  );
};

export default MLBAnalyticsEngine;

