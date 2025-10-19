/**
 * Baseball-specific stat normalization helpers.
 *
 * Provides conversions between the common inning notation used by
 * scorekeepers (e.g. `6.1`, `6.2`) and the normalized representation we
 * persist in the database (total outs recorded).
 */

/**
 * Convert an inning value expressed in scorer notation (6.1, 6.2) into
 * total outs. Accepts strings, numbers, or nullish inputs. If the value
 * is already an integer number of outs it will be returned unchanged.
 */
export function inningsNotationToOuts(value: number | string | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }

  const numeric = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  const wholeInnings = Math.trunc(numeric);
  const fractional = numeric - wholeInnings;

  // Scorer notation only uses .0, .1 or .2 to represent 0, 1 or 2 outs.
  // Multiplying by 10 and rounding guards against floating point noise
  // (e.g. 0.1999999).
  const outsRemainder = Math.round(fractional * 10);

  return wholeInnings * 3 + outsRemainder;
}

/**
 * Convert total outs into the scorer notation (6.1 style). Useful for
 * presenting innings in UI components.
 */
export function outsToInningsNotation(outs: number): number {
  if (!Number.isFinite(outs) || outs <= 0) {
    return 0;
  }

  const wholeInnings = Math.floor(outs / 3);
  const remainder = outs % 3;
  return Number((wholeInnings + remainder / 10).toFixed(1));
}

/**
 * Convert total outs into the true fractional innings value (e.g. 6.333).
 * This should be used for calculations like ERA/WHIP instead of the
 * scorer notation.
 */
export function outsToInningsFloat(outs: number): number {
  if (!Number.isFinite(outs) || outs <= 0) {
    return 0;
  }

  return outs / 3;
}

/**
 * Calculate Earned Run Average from earned runs and total outs recorded.
 */
export function calculateEra(earnedRuns: number, outs: number): number {
  if (!Number.isFinite(earnedRuns) || !Number.isFinite(outs) || outs <= 0) {
    return 0;
  }

  return Number(((earnedRuns * 27) / outs).toFixed(2));
}

/**
 * Calculate WHIP (walks + hits per inning pitched) from totals expressed
 * using outs.
 */
export function calculateWhip(hitsAllowed: number, walksAllowed: number, outs: number): number {
  if (!Number.isFinite(hitsAllowed) || !Number.isFinite(walksAllowed) || !Number.isFinite(outs) || outs <= 0) {
    return 0;
  }

  return Number((((hitsAllowed + walksAllowed) * 3) / outs).toFixed(3));
}

export type PitchingOutsSource = Record<string, unknown> | null | undefined;

/**
 * Extract total outs from a data structure that may contain either the
 * normalized outs column or legacy inning notation.
 */
export function extractPitchingOuts(source: PitchingOutsSource): number {
  if (!source || typeof source !== 'object') {
    return 0;
  }

  const record = source as Record<string, unknown>;
  const outsCandidates = [
    record['inningsPitchedOuts'],
    record['outsPitched'],
    record['outsRecorded'],
    record['ipOuts'],
  ];

  for (const candidate of outsCandidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate) && candidate > 0) {
      return candidate;
    }
  }

  const notationCandidates = [record['inningsPitched'], record['ip']];
  for (const candidate of notationCandidates) {
    if (typeof candidate === 'number' || typeof candidate === 'string') {
      const outs = inningsNotationToOuts(candidate as number | string);
      if (outs > 0) {
        return outs;
      }
    }
  }

  return 0;
}
