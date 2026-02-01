'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';

const STORAGE_KEY = 'bsi-team-preferences';

interface TeamPrefs {
  teams: string[];
}

export function useTeamPreferences() {
  const [prefs, setPrefs] = useState<TeamPrefs>({ teams: [] });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setPrefs(JSON.parse(stored));
    } catch {}
    setIsLoaded(true);
  }, []);

  const addTeam = (team: string) => {
    const next = { teams: [...prefs.teams, team] };
    setPrefs(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const removeTeam = (team: string) => {
    const next = { teams: prefs.teams.filter((t) => t !== team) };
    setPrefs(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const clearPreferences = () => {
    setPrefs({ teams: [] });
    localStorage.removeItem(STORAGE_KEY);
  };

  return { prefs, addTeam, removeTeam, clearPreferences, isLoaded };
}

interface TeamPreferenceSelectorProps {
  selected?: string[];
  onChange?: (teams: string[]) => void;
}

export function TeamPreferenceSelector({ selected = [], onChange }: TeamPreferenceSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-2">Favorite Teams</label>
      <div className="flex flex-wrap gap-2">
        {selected.map((team) => (
          <Badge key={team} variant="primary">{team}</Badge>
        ))}
        {selected.length === 0 && <p className="text-text-tertiary text-sm">No favorite teams selected yet.</p>}
      </div>
    </div>
  );
}

export function FavoriteTeamsBadge({ teams }: { teams: string[] }) {
  if (teams.length === 0) return null;
  return (
    <div className="flex gap-1">
      {teams.slice(0, 3).map((t) => (
        <Badge key={t} variant="secondary" size="sm">{t}</Badge>
      ))}
      {teams.length > 3 && <span className="text-text-tertiary text-xs">+{teams.length - 3}</span>}
    </div>
  );
}
