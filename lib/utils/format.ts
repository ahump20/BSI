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

/** Normalize a team name for fuzzy matching — lowercase, alphanumeric only */
export const normalizeTeamName = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]/g, '');
