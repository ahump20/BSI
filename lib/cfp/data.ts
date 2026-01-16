import top25 from '../../data/cfp/2024-top25.json';
import type { CFPTop25Response, ScenarioAdjustment } from './types';

export const cfpTop25Data = top25 as CFPTop25Response;

export function getTeamBaseline(teamName: string) {
  const ranking = cfpTop25Data.rankings.find((entry) => entry.team === teamName);
  if (!ranking) {
    return undefined;
  }

  const baselineProjection = cfpTop25Data.modelBaseline.teams.find(
    (team) => team.team === teamName
  );

  return {
    ranking,
    projection: baselineProjection,
  };
}

export function normalizeAdjustments(adjustments: ScenarioAdjustment[] = []): ScenarioAdjustment[] {
  const validTeams = new Set(cfpTop25Data.rankings.map((entry) => entry.team));

  return adjustments
    .filter((adjustment) => validTeams.has(adjustment.team))
    .map((adjustment) => ({
      team: adjustment.team,
      winProbabilityDelta: Math.max(Math.min(adjustment.winProbabilityDelta ?? 0, 0.4), -0.4),
      resumeBonus: Math.max(Math.min(adjustment.resumeBonus ?? 0, 8), -8),
      autoBid: adjustment.autoBid ?? false,
    }));
}
