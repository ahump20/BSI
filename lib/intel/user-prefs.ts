import type { IntelMode, IntelSport } from './types';

const PREFS_KEY = 'bsi_intel_prefs';

export interface UserPrefs {
  sport: IntelSport;
  mode: IntelMode;
  teamLens: string | null;
}

const DEFAULT_PREFS: UserPrefs = {
  sport: 'all',
  mode: 'fan',
  teamLens: null,
};

export function loadPrefs(): UserPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
    return {
      sport: parsed.sport ?? DEFAULT_PREFS.sport,
      mode: parsed.mode ?? DEFAULT_PREFS.mode,
      teamLens: parsed.teamLens ?? DEFAULT_PREFS.teamLens,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(prefs: Partial<UserPrefs>): void {
  if (typeof window === 'undefined') return;
  try {
    const current = loadPrefs();
    const merged = { ...current, ...prefs };
    localStorage.setItem(PREFS_KEY, JSON.stringify(merged));
  } catch {
    // Silent fail — localStorage may be unavailable
  }
}

export function clearPrefs(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PREFS_KEY);
  } catch {
    // Silent fail
  }
}
