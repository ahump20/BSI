export type FreshnessLevel = 'fresh' | 'degraded' | 'stale';

function resolveDate(input?: string | Date): Date | null {
  if (!input) return null;
  const date = input instanceof Date ? input : new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getAgeSeconds(input?: string | Date, nowMs: number = Date.now()): number {
  const date = resolveDate(input);
  if (!date) return 999 * 60;
  return Math.max(0, Math.floor((nowMs - date.getTime()) / 1000));
}

export function getAgeMinutes(input?: string | Date, nowMs: number = Date.now()): number {
  return Math.floor(getAgeSeconds(input, nowMs) / 60);
}

export function getFreshnessLevel(ageMinutes: number): FreshnessLevel {
  if (ageMinutes < 2) return 'fresh';
  if (ageMinutes < 5) return 'degraded';
  return 'stale';
}

export function getCompactAge(input?: string | Date, nowMs: number = Date.now()): string {
  const ageMinutes = getAgeMinutes(input, nowMs);
  if (ageMinutes < 1) return '';
  if (ageMinutes < 60) return `${ageMinutes}m ago`;
  const hours = Math.floor(ageMinutes / 60);
  return `${hours}h ago`;
}

export function getExactAge(input?: string | Date, nowMs: number = Date.now()): string {
  const ageSeconds = getAgeSeconds(input, nowMs);
  if (ageSeconds < 60) return `${ageSeconds}s ago`;
  const ageMinutes = Math.floor(ageSeconds / 60);
  if (ageMinutes < 60) return `${ageMinutes}m ago`;
  const hours = Math.floor(ageMinutes / 60);
  return `${hours}h ${ageMinutes % 60}m ago`;
}

export function getRelativeUpdateLabel(input?: string | Date, nowMs: number = Date.now()): string {
  const ageSeconds = getAgeSeconds(input, nowMs);
  if (ageSeconds < 60) return `Updated ${ageSeconds}s ago`;
  const ageMinutes = Math.floor(ageSeconds / 60);
  if (ageMinutes < 60) return `Updated ${ageMinutes}m ago`;
  if (ageMinutes < 1440) return `Updated ${Math.floor(ageMinutes / 60)}h ago`;
  return `Updated ${Math.floor(ageMinutes / 1440)}d ago`;
}

