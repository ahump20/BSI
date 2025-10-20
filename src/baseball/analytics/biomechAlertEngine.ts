import type {
  PitcherWorkloadRiskResponse,
  UmpireZoneProbabilityResponse,
} from '../api/types';

export interface BiomechPitcherMetric {
  pitcherId: string;
  name: string;
  team: string;
  handedness: 'L' | 'R';
  releaseEfficiency: number;
  hipShoulderSeparation: number;
  armStressIndex: number;
  armSlotStability: number;
  lowerHalfPower: number;
  efficiencyTrend: number;
  lastCapture: string;
}

export interface CombinedPitcherIntel {
  pitcherId: string;
  name: string;
  team: string;
  workloadIndex: number;
  biomechStressScore: number;
  combinedRiskScore: number;
  riskTier: 'green' | 'amber' | 'red';
  recommendedRestDays: number;
  alerts: string[];
  leverageZone?: {
    zone: string;
    message: string;
  };
  metadata: {
    lastBiomechCapture: string;
    efficiencyTrend: number;
  };
}

export function calculateBiomechStressScore(metric: BiomechPitcherMetric): number {
  const stressContributors = [
    metric.armStressIndex,
    1 - metric.armSlotStability,
    Math.max(0, -metric.efficiencyTrend),
  ];

  const weightedStress =
    stressContributors[0] * 0.5 +
    stressContributors[1] * 0.3 +
    stressContributors[2] * 0.2;

  return clamp(weightedStress, 0, 1);
}

export function normalizeWorkloadIndex(workloadIndex: number): number {
  if (!Number.isFinite(workloadIndex)) {
    return 0;
  }

  if (workloadIndex > 100) {
    return clamp(workloadIndex / 150, 0, 1);
  }

  if (workloadIndex > 1) {
    return clamp(workloadIndex / 100, 0, 1);
  }

  return clamp(workloadIndex, 0, 1);
}

export function deriveRiskTier(score: number): CombinedPitcherIntel['riskTier'] {
  if (score >= 0.75) {
    return 'red';
  }
  if (score >= 0.55) {
    return 'amber';
  }
  return 'green';
}

export function evaluateUmpireOpportunity(
  umpire: UmpireZoneProbabilityResponse | undefined,
): CombinedPitcherIntel['leverageZone'] {
  if (!umpire || !umpire.zones.length) {
    return undefined;
  }

  const zonesWithDelta = umpire.zones.map((zone) => ({
    ...zone,
    strikeDelta: zone.calledStrikeProbability - umpire.baselineStrikeProbability,
  }));

  const bestZone = zonesWithDelta.reduce((prev, current) => (
    current.strikeDelta > prev.strikeDelta ? current : prev
  ));

  if (bestZone.strikeDelta <= 0.03) {
    return undefined;
  }

  return {
    zone: bestZone.zone,
    message: `Attack the ${bestZone.zone} half — called strike rate is ${(bestZone.calledStrikeProbability * 100).toFixed(1)}% (+${(bestZone.strikeDelta * 100).toFixed(1)} vs. baseline).`,
  };
}

export function generateCombinedPitcherIntel(
  workload: PitcherWorkloadRiskResponse,
  biomech: BiomechPitcherMetric,
  umpire?: UmpireZoneProbabilityResponse,
): CombinedPitcherIntel {
  const biomechStressScore = calculateBiomechStressScore(biomech);
  const normalizedWorkload = normalizeWorkloadIndex(workload.workloadIndex);
  const combinedRiskScore = clamp(normalizedWorkload * 0.6 + biomechStressScore * 0.4, 0, 1);
  const riskTier = deriveRiskTier(combinedRiskScore);

  const alerts: string[] = [];
  if (combinedRiskScore >= 0.75) {
    alerts.push('Redline fatigue risk — reduce usage immediately.');
  } else if (combinedRiskScore >= 0.55) {
    alerts.push('Monitor closely — biomechanics trending toward stress.');
  }

  if (biomech.efficiencyTrend < -0.05) {
    alerts.push('Efficiency trending down over the last capture window.');
  }

  if (biomech.armStressIndex >= 0.7) {
    alerts.push('Arm stress index above safe threshold.');
  }

  if (workload.shortRestAppearances >= 2) {
    alerts.push('Multiple short-rest turns logged this week.');
  }

  const leverageZone = evaluateUmpireOpportunity(umpire);

  return {
    pitcherId: biomech.pitcherId,
    name: biomech.name,
    team: biomech.team,
    workloadIndex: Math.round(normalizedWorkload * 100),
    biomechStressScore: Math.round(biomechStressScore * 100) / 100,
    combinedRiskScore: Math.round(combinedRiskScore * 100) / 100,
    riskTier,
    recommendedRestDays: workload.recommendedRestDays,
    alerts,
    leverageZone,
    metadata: {
      lastBiomechCapture: biomech.lastCapture,
      efficiencyTrend: biomech.efficiencyTrend,
    },
  };
}

export function generateIntelReport(
  workloads: PitcherWorkloadRiskResponse[],
  biomechMetrics: BiomechPitcherMetric[],
  umpire?: UmpireZoneProbabilityResponse,
): CombinedPitcherIntel[] {
  const biomechByPitcher = new Map(biomechMetrics.map((metric) => [metric.pitcherId, metric]));

  return workloads
    .map((workload) => {
      const metric = biomechByPitcher.get(workload.pitcherId);
      if (!metric) {
        return null;
      }
      return generateCombinedPitcherIntel(workload, metric, umpire);
    })
    .filter((item): item is CombinedPitcherIntel => item !== null)
    .sort((a, b) => b.combinedRiskScore - a.combinedRiskScore);
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}
