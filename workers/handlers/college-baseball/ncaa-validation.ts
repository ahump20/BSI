/**
 * NCAA Baseball — Validation & Corrections Ledger
 *
 * Implements:
 *   - NCAA "proving box score" rule (team PA reconciliation invariant)
 *   - Host-official control: home-team report is authoritative
 *   - Away-team change workflow: requires home consent
 *   - Corrections ledger: append-only, never overwrite
 *   - Expected arrival windows and late-flag logic
 *
 * References:
 *   - NCAA Stats Manual: PA = R + LOB + Opponent Putouts (proving rule)
 *   - NCAA SID Policies: corrections within 1 week; home control
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TeamBoxLine {
  teamId: string;
  isHome: boolean;
  runs: number;
  lob: number;       // left on base
  ab: number;
  bb: number;
  hbp: number;
  sf: number;
  sh: number;
  hits: number;
  errors: number;
}

export interface BoxScoreProofResult {
  valid: boolean;
  homePA: number;
  awayPA: number;
  homePAExpected: number;
  awayPAExpected: number;
  homeValid: boolean;
  awayValid: boolean;
  errors: string[];
}

export interface CorrectionRequest {
  gameId: string;
  table: string;
  field: string;
  recordId: string;
  oldValue: string | null;
  newValue: string;
  requestedBy: string;  // 'home_sid' | 'away_sid' | 'official_feed'
}

export interface CorrectionResult {
  correctionId: string;
  status: 'pending' | 'approved' | 'rejected';
  requiresAwayConsent: boolean;
  message: string;
}

export interface SubmissionWindowInput {
  gameId: string;
  gameDateUtc: string;   // ISO timestamp of game start
  hasLiveStats: boolean; // true = LiveStats feed; false = manual XML only
}

// ---------------------------------------------------------------------------
// Proving box score rule
//
// NCAA rule: Team Plate Appearances = Runs Scored + LOB + Opponent Putouts
// Opponent putouts ≈ (innings played * 3) for the fielding team.
// PA = AB + BB + HBP + SF + SH
//
// Both conditions must hold for home AND away to declare the box valid.
// ---------------------------------------------------------------------------

/**
 * Compute plate appearances from components.
 * PA = AB + BB + HBP + SF + SH
 */
export function computePA(line: Pick<TeamBoxLine, 'ab' | 'bb' | 'hbp' | 'sf' | 'sh'>): number {
  return line.ab + line.bb + line.hbp + line.sf + line.sh;
}

/**
 * NCAA "Proving Box Score" validation.
 *
 * Expected PA for a team = their Runs + their LOB + Opponent Putouts.
 * Opponent putouts = 3 * full innings completed by that team's pitchers,
 * which equals (total outs recorded against that team's batters).
 *
 * For a completed 9-inning game:
 *   - Home team batters face 27 outs (away pitchers record 27 PO)
 *   - Away team batters face 27 outs (or fewer if home wins in walk-off)
 *
 * We accept the simpler form used in NCAA stats manuals:
 *   PA(team) = R(team) + LOB(team) + PO(opponent)
 * where PO(opponent) is passed in directly (sum of putouts from fielding box).
 *
 * When putout data is unavailable, we derive PO from away/home outs:
 *   - For a final-score game: PO_home = total outs against away batters
 *   - Typically 3 * innings, but walk-off final inning may be 1 or 2 outs.
 *
 * This function accepts the team box lines and opponent putout totals.
 */
export function proveBoxScore(
  home: TeamBoxLine,
  away: TeamBoxLine,
  homePO: number,  // putouts recorded by home fielders (against away batters)
  awayPO: number,  // putouts recorded by away fielders (against home batters)
): BoxScoreProofResult {
  const errors: string[] = [];

  const homePA = computePA(home);
  const awayPA = computePA(away);

  // Expected: PA = R + LOB + opponent_PO
  const homePAExpected = home.runs + home.lob + awayPO;
  const awayPAExpected = away.runs + away.lob + homePO;

  const homeValid = homePA === homePAExpected;
  const awayValid = awayPA === awayPAExpected;

  if (!homeValid) {
    errors.push(
      `Home PA mismatch: computed ${homePA} (AB+BB+HBP+SF+SH) ≠ expected ${homePAExpected} (R+LOB+AwayPO)`
    );
  }
  if (!awayValid) {
    errors.push(
      `Away PA mismatch: computed ${awayPA} (AB+BB+HBP+SF+SH) ≠ expected ${awayPAExpected} (R+LOB+HomePO)`
    );
  }

  return {
    valid: homeValid && awayValid,
    homePA,
    awayPA,
    homePAExpected,
    awayPAExpected,
    homeValid,
    awayValid,
    errors,
  };
}

/**
 * Cross-table conservation check:
 * Runs in line score = sum of run-scoring events in PBP = team runs in box.
 */
export function validateRunConservation(
  boxRuns: number,
  pbpRunsTotal: number,
  lineScoreRuns: number,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (boxRuns !== pbpRunsTotal) {
    errors.push(`Box runs (${boxRuns}) ≠ PBP run-scoring events (${pbpRunsTotal})`);
  }
  if (boxRuns !== lineScoreRuns) {
    errors.push(`Box runs (${boxRuns}) ≠ line score runs (${lineScoreRuns})`);
  }
  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Corrections ledger helpers
// ---------------------------------------------------------------------------

/**
 * Determine if a correction requires away-team consent.
 * NCAA rule: away-team stat changes require home SID consent.
 * Home-team stat changes can be made by home SID directly.
 */
export function requiresAwayConsent(request: CorrectionRequest): boolean {
  return request.requestedBy === 'away_sid';
}

/**
 * Build a corrections ledger entry.
 * Corrections are append-only — never overwrite historical records.
 */
export function buildCorrectionEntry(
  request: CorrectionRequest,
): CorrectionResult & { entry: Record<string, unknown> } {
  const correctionId = `corr_${request.gameId}_${crypto.randomUUID()}`;
  const needsConsent = requiresAwayConsent(request);

  const entry = {
    correction_id: correctionId,
    game_id: request.gameId,
    tbl: request.table,
    field: request.field,
    record_id: request.recordId,
    old_value: request.oldValue ?? null,
    new_value: request.newValue,
    requested_by: request.requestedBy,
    approved_by: null,
    requires_away_consent: needsConsent ? 1 : 0,
    away_consent_at: null,
    status: 'pending' as const,
    submitted_at: new Date().toISOString(),
    resolved_at: null,
    notes: null,
  };

  return {
    correctionId,
    status: 'pending',
    requiresAwayConsent: needsConsent,
    message: needsConsent
      ? 'Correction submitted; awaiting home SID consent before applying.'
      : 'Correction submitted; pending review.',
    entry,
  };
}

// ---------------------------------------------------------------------------
// Submission window helpers
// ---------------------------------------------------------------------------

const POST_GAME_WINDOW_HOURS = 2;    // provisional stats expected within T+2h
const CORRECTION_WINDOW_DAYS = 7;    // NCAA allows corrections within 1 week

/**
 * Compute expected arrival timestamps for a game's stats submission.
 *
 * NCAA workflow:
 *   - Post-game (T+0 to T+2h): ingest final box
 *   - Correction window (T+1 day to T+7 days): accept official corrections
 *   - Manual XML uploads: only when "No" for NCAA LiveStats scoring
 */
export function computeSubmissionWindow(input: SubmissionWindowInput): {
  windowId: string;
  gameId: string;
  expectedBy: string;
  weeklyDeadline: string;
  hasLiveStats: boolean;
} {
  const gameDate = new Date(input.gameDateUtc);
  const expectedBy = new Date(gameDate.getTime() + POST_GAME_WINDOW_HOURS * 3_600_000);

  // Weekly deadline: next Monday at 11:59 PM CT
  const dayOfWeek = gameDate.getUTCDay(); // 0=Sun
  // dayOfWeek: 0=Sun,1=Mon,...6=Sat
  // If today is Monday (1), next Monday is 7 days away.
  // Otherwise: calculate forward days mod 7, treating 0 remainder as 7.
  const daysUntilMonday = dayOfWeek === 1 ? 7 : (8 - dayOfWeek) % 7 || 7;
  const weeklyDeadline = new Date(gameDate.getTime() + daysUntilMonday * 86_400_000);
  weeklyDeadline.setUTCHours(23, 59, 0, 0);

  return {
    windowId: `sw_${input.gameId}`,
    gameId: input.gameId,
    expectedBy: expectedBy.toISOString(),
    weeklyDeadline: weeklyDeadline.toISOString(),
    hasLiveStats: input.hasLiveStats,
  };
}

/**
 * Check whether a submission is late.
 * Late = box not received within CORRECTION_WINDOW_DAYS days.
 */
export function isSubmissionLate(
  weeklyDeadline: string,
  receivedAt: string | null,
): boolean {
  if (!receivedAt) return new Date() > new Date(weeklyDeadline);
  return new Date(receivedAt) > new Date(weeklyDeadline);
}

// ---------------------------------------------------------------------------
// Soft validation flags (flag, don't block)
// ---------------------------------------------------------------------------

export interface SoftValidationResult {
  flags: string[];
}

/**
 * Soft checks: flag anomalies without blocking ingestion.
 *   - Duplicate jersey in lineup
 *   - Implausible stat totals (e.g., > 30 AB in a single game)
 *   - Missing batter in lineup order
 */
export function runSoftValidations(
  homeLineup: Array<{ playerId: string; jersey: string; battingOrder: number }>,
  awayLineup: Array<{ playerId: string; jersey: string; battingOrder: number }>,
  home: TeamBoxLine,
  away: TeamBoxLine,
): SoftValidationResult {
  const flags: string[] = [];

  for (const [side, lineup] of [['home', homeLineup], ['away', awayLineup]] as const) {
    const jerseys = lineup.map((p) => p.jersey);
    const dupes = jerseys.filter((j, i) => jerseys.indexOf(j) !== i);
    if (dupes.length > 0) {
      flags.push(`${side}: duplicate jersey numbers detected: ${[...new Set(dupes)].join(', ')}`);
    }

    const orders = lineup.map((p) => p.battingOrder).filter((o) => o > 0);
    const missingOrders = [];
    for (let i = 1; i <= 9; i++) {
      if (!orders.includes(i)) missingOrders.push(i);
    }
    if (missingOrders.length > 0) {
      flags.push(`${side}: missing batting order positions: ${missingOrders.join(', ')}`);
    }
  }

  // Implausible totals
  if (home.ab > 60) flags.push(`Home AB (${home.ab}) seems implausibly high for a single game`);
  if (away.ab > 60) flags.push(`Away AB (${away.ab}) seems implausibly high for a single game`);
  if (home.runs > 30) flags.push(`Home runs (${home.runs}) exceeds typical game total`);
  if (away.runs > 30) flags.push(`Away runs (${away.runs}) exceeds typical game total`);

  return { flags };
}
