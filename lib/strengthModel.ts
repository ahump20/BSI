import StrengthModelRuntime from './strengthModel.runtime.js';

export interface HistoricalGame {
  id?: string;
  date?: string;
  homeTeamId?: string;
  awayTeamId?: string;
  homeScore?: number;
  awayScore?: number;
  conferenceGame?: boolean;
}

export interface TeamProfile {
  id?: string;
  teamId?: string;
  slug?: string;
  name?: string;
  displayName?: string;
  school?: string;
  conference?: string;
  conferenceId?: string;
  league?: string;
  overallWins?: number;
  overallLosses?: number;
  wins?: number;
  losses?: number;
  record?: {
    wins?: number;
    losses?: number;
    overallWins?: number;
    overallLosses?: number;
  };
  quad1Wins?: number;
  quad2Wins?: number;
  quad3Losses?: number;
  quad4Losses?: number;
  rpi?: number;
  rpiValue?: number;
  strengthOfSchedule?: number;
  sos?: number;
  netRating?: number;
  rating?: number;
  runDifferential?: number;
  runDifferentialPerGame?: number;
}

export interface ProspectiveMatchup {
  opponentId?: string;
  opponent?: string;
  opponentName?: string;
  opponentSnapshot?: TeamProfile;
  location?: 'home' | 'away' | 'neutral' | string;
  venue?: string;
  winProbability?: number;
  probability?: number;
  opponentOppWinPct?: number;
  simulations?: number;
}

export interface ConferenceStrengthResult {
  conferenceId: string;
  season: number;
  teamCount: number;
  rating: number;
  confidence: number;
  metrics: {
    crossConferenceRecord: { wins: number; losses: number; winPct: number };
    intraConferenceRecord: { wins: number; losses: number; winPct: number };
    averageRpi: number | null;
    normalizedRpi: number;
    runDifferentialPerGame: number;
    qualityWinScore: number;
    top50Wins: number;
  };
  notes: string;
}

export interface RpiProjectionResult {
  teamId: string;
  season: number;
  baselineRpi: number | null;
  projectedRpi: number | null;
  rpiDelta: number;
  baselineRank: number | null;
  projectedRank: number | null;
  confidence: number;
  expectedRecord: {
    baselineWins: number;
    baselineLosses: number;
    projectedWins: number;
    projectedLosses: number;
  } | null;
  scenarioBreakdown: Array<{
    opponentId: string;
    opponentName: string;
    location: string;
    winProbability: number;
    projectedNet: number;
    rpiContribution: number;
    opponentRpi: number;
  }>;
  strengthOfScheduleIndex: number;
  notes: string;
}

export interface ScheduleSimulationOptions {
  simulations?: number;
  restrictAdvanced?: boolean;
}

export interface ScheduleSimulationResult {
  teamId: string;
  season: number;
  simulations: number;
  expectedWinsAdded: number;
  expectedLossesAdded: number;
  postseasonOdds: {
    baseline: number;
    projected: number;
    delta: number;
  };
  distribution: Array<{ wins: number; probability: number }>;
  gated: boolean;
  confidence: number;
  notes: string;
}

export interface ProjectedRankingRow {
  teamId: string | null;
  teamName: string;
  baselineRank: number | null;
  projectedRank: number | null;
  rpiBaseline: number;
  rpiProjected: number;
}

export interface StrengthModelInit {
  games?: HistoricalGame[];
  teams?: TeamProfile[];
  season?: number;
}

export interface StrengthModelInstance {
  calculateConferenceStrength(conferenceId: string): ConferenceStrengthResult;
  projectRpiShift(teamId: string, prospectiveMatchups?: ProspectiveMatchup[]): RpiProjectionResult;
  simulateSchedulingImpact(
    teamId: string,
    prospectiveMatchups?: ProspectiveMatchup[],
    options?: ScheduleSimulationOptions
  ): ScheduleSimulationResult;
  buildConferenceRanking(conferenceId: string, teamId: string, projectedRpi: number): ProjectedRankingRow[];
}

export type StrengthModelConstructor = new (params?: StrengthModelInit) => StrengthModelInstance;

export const StrengthModel = StrengthModelRuntime as unknown as StrengthModelConstructor;

export default StrengthModel;
