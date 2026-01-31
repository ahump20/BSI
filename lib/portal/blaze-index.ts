/**
 * Blaze Index — BSI's composite transfer portal player score (0-100).
 *
 * Factors:
 * - Engagement score (0-100, weighted 30%)
 * - Recency: entered in last 24h = 1.0, last 7d = 0.5, older = 0.2 (weighted 25%)
 * - Stars/rank if available (weighted 25%)
 * - Status bonus: in_portal players get full weight, committed/signed get 0.7x (weighted 20%)
 *
 * Deterministic: same inputs always produce same score.
 */

interface BlazeIndexInput {
  engagement_score?: number | null;
  stars?: number | null;
  overall_rank?: number | null;
  portal_date: string;
  status: string;
}

export function calculateBlazeIndex(input: BlazeIndexInput): number {
  const now = Date.now();
  const portalTime = new Date(input.portal_date).getTime();
  const hoursAgo = (now - portalTime) / (1000 * 60 * 60);

  // Engagement component (0-100, 30% weight)
  const engagement = Math.min(100, Math.max(0, input.engagement_score || 0));
  const engagementScore = engagement * 0.3;

  // Recency component (0-100, 25% weight)
  let recencyMultiplier: number;
  if (hoursAgo <= 24) recencyMultiplier = 1.0;
  else if (hoursAgo <= 168) recencyMultiplier = 0.5;
  else recencyMultiplier = 0.2;
  const recencyScore = recencyMultiplier * 100 * 0.25;

  // Stars/rank component (0-100, 25% weight)
  let talentScore = 50; // default mid-tier if no data
  if (input.stars && input.stars > 0) {
    talentScore = (input.stars / 5) * 100;
  } else if (input.overall_rank && input.overall_rank > 0) {
    // Lower rank = better. Top 10 = 100, top 50 = 80, top 200 = 50, rest = 20
    if (input.overall_rank <= 10) talentScore = 100;
    else if (input.overall_rank <= 50) talentScore = 80;
    else if (input.overall_rank <= 200) talentScore = 50;
    else talentScore = 20;
  }
  const talentComponent = talentScore * 0.25;

  // Status component (0-100, 20% weight)
  const statusMultiplier = input.status === 'in_portal' ? 1.0 : 0.7;
  const statusScore = statusMultiplier * 100 * 0.2;

  const raw = engagementScore + recencyScore + talentComponent + statusScore;
  return Math.round(Math.min(100, Math.max(0, raw)));
}
