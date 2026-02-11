'use client';

import { useCallback, useEffect, useState } from 'react';
import type { IntelMode, IntelSport } from './types';

const PREFS_KEY = 'bsi-intel-prefs';

export interface IntelPreferences {
    sport: IntelSport;
    mode: IntelMode;
    teamLens: string | null;
}

const DEFAULTS: IntelPreferences = {
    sport: 'all',
    mode: 'fan',
    teamLens: null,
};

function loadPrefs(): IntelPreferences {
    if (typeof window === 'undefined') return DEFAULTS;
    try {
          const raw = localStorage.getItem(PREFS_KEY);
          if (!raw) return DEFAULTS;
          const parsed = JSON.parse(raw) as Partial<IntelPreferences>;
          return {
                  sport: parsed.sport ?? DEFAULTS.sport,
                  mode: parsed.mode ?? DEFAULTS.mode,
                  teamLens: parsed.teamLens ?? DEFAULTS.teamLens,
          };
    } catch {
          return DEFAULTS;
    }
}

function savePrefs(prefs: IntelPreferences): void {
    try {
          localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
          // Storage full or unavailable — fail silently
    }
}

/**
 * Persists user intel preferences (sport, mode, teamLens) to localStorage.
 * Initializes from saved state on mount, writes on every change.
 */
export function useIntelPreferences() {
    const [prefs, setPrefs] = useState<IntelPreferences>(DEFAULTS);
    const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
        setPrefs(loadPrefs());
        setHydrated(true);
  }, []);

  // Save on change (skip initial mount)
  useEffect(() => {
        if (hydrated) {
                savePrefs(prefs);
        }
  }, [prefs, hydrated]);

  const setSport = useCallback((sport: IntelSport) => {
        setPrefs((prev) => ({ ...prev, sport }));
  }, []);

  const setMode = useCallback((mode: IntelMode) => {
        setPrefs((prev) => ({ ...prev, mode }));
  }, []);

  const setTeamLens = useCallback((teamLens: string | null) => {
        setPrefs((prev) => ({ ...prev, teamLens }));
  }, []);

  return {
        sport: prefs.sport,
        mode: prefs.mode,
        teamLens: prefs.teamLens,
        setSport,
        setMode,
        setTeamLens,
        hydrated,
  };
}
