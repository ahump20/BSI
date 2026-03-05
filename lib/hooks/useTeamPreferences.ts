'use client';

import { useState, useCallback } from 'react';

/** Stub for team preference persistence (localStorage-backed). */
interface TeamPreferences {
  favoriteTeams: string[];
}

const DEFAULT_PREFS: TeamPreferences = { favoriteTeams: [] };
const STORAGE_KEY = 'bsi:team-prefs';

function load(): TeamPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

function save(prefs: TeamPreferences) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch { /* noop */ }
}

export function useTeamPreferences() {
  const [prefs, setPrefs] = useState<TeamPreferences>(load);
  const [isLoaded] = useState(true);

  const addTeam = useCallback((team: string) => {
    setPrefs((prev) => {
      const next = { ...prev, favoriteTeams: [...new Set([...prev.favoriteTeams, team])] };
      save(next);
      return next;
    });
  }, []);

  const removeTeam = useCallback((team: string) => {
    setPrefs((prev) => {
      const next = { ...prev, favoriteTeams: prev.favoriteTeams.filter((t) => t !== team) };
      save(next);
      return next;
    });
  }, []);

  const clearPreferences = useCallback(() => {
    setPrefs(DEFAULT_PREFS);
    save(DEFAULT_PREFS);
  }, []);

  return { prefs, addTeam, removeTeam, clearPreferences, isLoaded };
}
