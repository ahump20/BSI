/**
 * Portal Fit Scoring
 *
 * Scores how well a transfer portal entrant fits a target team's needs
 * based on position need, performance metrics, and NIL efficiency.
 *
 * Score range: 0-100
 * - Position Need: 0-40 points (does the team need this position?)
 * - Performance: 0-35 points (how good is the player?)
 * - NIL Efficiency: 0-25 points (value relative to cost)
 */

export interface PortalFitInput {
  /** Player's primary position */
  position: string;
  /** Player's performance index score (0-100 from savant compute) */
  performanceScore?: number;
  /** Player's NIL estimated value */
  nilValue?: number;
  /** Target team's roster by position — count of current players */
  teamRoster?: { position: string; count: number }[];
  /** Team's average NIL value per player */
  teamAvgNIL?: number;
}

export interface PortalFitResult {
  /** Overall fit score 0-100 */
  score: number;
  /** Position need score 0-40 */
  positionNeed: number;
  /** Performance score 0-35 */
  performance: number;
  /** NIL efficiency score 0-25 */
  nilEfficiency: number;
  /** Human-readable fit label */
  label: 'Strong Fit' | 'Good Fit' | 'Moderate' | 'Low Fit';
}

const POSITION_GROUPS: Record<string, string> = {
  P: 'pitcher', SP: 'pitcher', RP: 'pitcher', LHP: 'pitcher', RHP: 'pitcher',
  LHSP: 'pitcher', RHSP: 'pitcher', LHRP: 'pitcher', RHRP: 'pitcher',
  C: 'catcher',
  '1B': 'infield', '2B': 'infield', '3B': 'infield', SS: 'infield', IF: 'infield',
  LF: 'outfield', CF: 'outfield', RF: 'outfield', OF: 'outfield',
  DH: 'utility', UT: 'utility',
};

const IDEAL_DEPTH: Record<string, number> = {
  pitcher: 14,
  catcher: 3,
  infield: 8,
  outfield: 6,
  utility: 4,
};

export function scorePortalFit(input: PortalFitInput): PortalFitResult {
  const pos = (input.position || '').toUpperCase();
  const group = POSITION_GROUPS[pos] || 'utility';

  // Position Need (0-40)
  let positionNeed = 20; // default: neutral
  if (input.teamRoster) {
    const groupCount = input.teamRoster
      .filter(r => {
        const rGroup = POSITION_GROUPS[(r.position || '').toUpperCase()] || 'utility';
        return rGroup === group;
      })
      .reduce((sum, r) => sum + r.count, 0);
    const ideal = IDEAL_DEPTH[group] || 4;
    const ratio = groupCount / ideal;
    if (ratio < 0.6) positionNeed = 40; // critical need
    else if (ratio < 0.8) positionNeed = 30; // moderate need
    else if (ratio > 1.2) positionNeed = 5; // oversaturated
    else positionNeed = 20; // adequate
  }

  // Performance (0-35)
  let performance = 15; // default: average
  if (input.performanceScore != null) {
    performance = Math.min(35, Math.round((input.performanceScore / 100) * 35));
  }

  // NIL Efficiency (0-25)
  let nilEfficiency = 15; // default: neutral
  if (input.nilValue != null && input.teamAvgNIL != null && input.teamAvgNIL > 0) {
    const ratio = input.nilValue / input.teamAvgNIL;
    if (ratio < 0.5) nilEfficiency = 25; // well below team average — great value
    else if (ratio < 1.0) nilEfficiency = 20;
    else if (ratio < 1.5) nilEfficiency = 15;
    else if (ratio < 2.5) nilEfficiency = 8;
    else nilEfficiency = 3; // way above average — expensive
  }

  const score = positionNeed + performance + nilEfficiency;

  let label: PortalFitResult['label'];
  if (score >= 75) label = 'Strong Fit';
  else if (score >= 55) label = 'Good Fit';
  else if (score >= 35) label = 'Moderate';
  else label = 'Low Fit';

  return { score, positionNeed, performance, nilEfficiency, label };
}
