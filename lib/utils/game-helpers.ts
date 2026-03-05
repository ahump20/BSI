/**
 * Shared game display utilities used across NBA, NFL, and CFB game pages.
 */

interface TeamLike {
  team?: {
    logos?: Array<{ href?: string }>;
    logo?: string;
  };
}

/** Extract the best available team logo URL from an ESPN-shaped competitor object. */
export function getTeamLogo(competitor: TeamLike | undefined): string | null {
  return competitor?.team?.logos?.[0]?.href || competitor?.team?.logo || null;
}

/**
 * Label a game period by its zero-based index.
 * Returns "Q1"–"Q4" for regulation, "OT1"+ for overtime.
 */
export function getPeriodLabel(index: number): string {
  if (index < 4) return `Q${index + 1}`;
  return `OT${index - 3}`;
}

/**
 * Label a game quarter/period by its 1-based number.
 * Returns "Quarter 1"–"Quarter 4" for regulation, "OT1"+ for overtime.
 */
export function getQuarterLabel(num: number): string {
  if (num <= 4) return `Quarter ${num}`;
  return `OT${num - 4}`;
}
