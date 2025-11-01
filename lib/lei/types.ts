export type SportType = 'baseball' | 'football';

export type PlayoffRound = 'wildcard' | 'division' | 'conference' | 'championship';

export interface PlayContext {
  /**
   * Sport-specific context so we can normalize leverage across codes.
   */
  sport: SportType;
  playoffRound: PlayoffRound;
  prePlayWinProb: number; // 0 - 1 inclusive
  postPlayWinProb: number; // 0 - 1 inclusive
  outsRemaining?: number | null;
  strikesRemaining?: number | null;
  timeRemaining?: number | null;
  timeoutsRemaining?: number | null;
  scoreDifferential?: number;
}

export interface LeverageComponents {
  championshipWeight: number;
  winProbabilityAdded: number;
  scarcity: number;
}

export interface LeverageResponse {
  lei: number;
  components: LeverageComponents;
}

export interface ValidationIssue {
  field: keyof PlayContext | 'body';
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  issues?: ValidationIssue[];
}
