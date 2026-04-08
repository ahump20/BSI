/** Format a rate stat as .XXX (strips leading zero, e.g. 0.321 → ".321") */
export const fmt3 = (v: number): string => v.toFixed(3).replace(/^0/, '');

/** Format a number to 1 decimal place; returns '—' for null/undefined */
export const fmt1 = (n: number | null | undefined, d = 1): string =>
  n == null ? '—' : n.toFixed(d);

/** Format a number to 2 decimal places; returns '—' for null/undefined */
export const fmt2 = (n: number | null | undefined): string =>
  n == null ? '—' : n.toFixed(2);

/** Format a 0–1 ratio as a percentage string, e.g. 0.312 → "31.2%"; returns '—' for null/undefined */
export const fmtPct = (n: number | null | undefined): string =>
  n == null ? '—' : `${(n * 100).toFixed(1)}%`;

/** Format a number as a rounded integer string; returns '—' for null/undefined */
export const fmtInt = (n: number | null | undefined): string =>
  n == null ? '—' : Math.round(n).toString();

/**
 * Strip trailing "lbs" from weight strings so callers can re-append consistently.
 * ESPN returns weight as "225 lbs" but some templates also append " lbs", causing "225 lbs lbs".
 * Handles: "225 lbs", "225lbs", "225", 225 (number), null/undefined.
 */
export const normalizeWeight = (w: string | number | null | undefined): string => {
  if (w == null) return '';
  return String(w).replace(/\s*lbs\.?\s*$/i, '').trim();
};

/**
 * Normalize height — handles both "6'2\"" format and raw inches (e.g. 74 → "6'2\"").
 * Returns the string as-is if already formatted, or converts integer inches to feet-inches.
 */
export const normalizeHeight = (h: string | number | null | undefined): string => {
  if (h == null || h === '') return '';
  const s = String(h).trim();
  if (s.includes("'") || s.includes('"') || s.includes('-')) return s;
  const inches = parseInt(s, 10);
  if (isNaN(inches) || inches < 48 || inches > 96) return s;
  const feet = Math.floor(inches / 12);
  const remainder = inches % 12;
  return `${feet}'${remainder}"`;
};

/** Normalize a team name for fuzzy matching — lowercase, alphanumeric only */
export const normalizeTeamName = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]/g, '');
