/**
 * Shared season detection utilities for all sports APIs
 * Returns appropriate season year based on current date and sport
 *
 * @module _season-utils
 */

/**
 * Get the current season year for a given sport
 * @param {string} sport - The sport (mlb, nfl, nba)
 * @param {Date} [date=new Date()] - The date to check (defaults to now)
 * @returns {number} The season year
 */
export function getCurrentSeason(sport, date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-based (0 = January)

  switch (sport.toLowerCase()) {
    case 'mlb':
      // MLB season: April-October
      // In January-March (0-2), use previous year
      return month >= 3 && month <= 9 ? year : year - 1;

    case 'nfl':
      // NFL season: September-February (spans years)
      // In March-August (2-7), use previous year
      return month >= 8 || month <= 1 ? year : year - 1;

    case 'nba':
      // NBA season: October-June (spans years)
      // In July-September (6-8), use previous year
      return month >= 9 || month <= 5 ? year : year - 1;

    default:
      return year;
  }
}

/**
 * Check if the current date is within the regular season
 * @param {string} sport - The sport (mlb, nfl, nba)
 * @param {Date} [date=new Date()] - The date to check (defaults to now)
 * @returns {boolean} True if in-season
 */
export function isInSeason(sport, date = new Date()) {
  const month = date.getMonth(); // 0-based

  switch (sport.toLowerCase()) {
    case 'mlb':
      // March-October (2-9)
      return month >= 2 && month <= 9;
    case 'nfl':
      // September-February (8-11, 0-1)
      return month >= 8 || month <= 1;
    case 'nba':
      // October-June (9-11, 0-5)
      return month >= 9 || month <= 5;
    default:
      return true;
  }
}

/**
 * Format season label for display
 * NFL/NBA span two calendar years (e.g., "2024-25")
 * @param {string} sport - The sport (mlb, nfl, nba)
 * @param {number} season - The season year
 * @returns {string} Formatted season label
 */
export function getSeasonLabel(sport, season) {
  const sportLower = sport.toLowerCase();
  if (sportLower === 'nfl' || sportLower === 'nba') {
    const nextYear = (season + 1) % 100;
    return `${season}-${nextYear.toString().padStart(2, '0')}`;
  }
  return season.toString();
}
