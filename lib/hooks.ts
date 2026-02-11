'use client';

import { useState, useEffect, useCallback } from 'react';

const TIMEZONE = 'America/Chicago';

interface SettingsObject {
  theme: 'dark' | 'light';
  timeFormat: '12h' | '24h';
  timezone: string;
}

interface UserSettingsReturn {
  settings: SettingsObject;
  resetSettings: () => void;
  formatDateTime: (date: Date) => string;
  formatDate: (date: Date) => string;
  formatTime: (date: Date) => string;
  isLoaded: boolean;
}

export function useUserSettings(): UserSettingsReturn {
  const [isLoaded, setIsLoaded] = useState(false);
  const [settings, setSettings] = useState<SettingsObject>({
    theme: 'dark',
    timeFormat: '12h',
    timezone: TIMEZONE,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('bsi_settings');
      if (stored) setSettings(prev => ({ ...prev, ...JSON.parse(stored) }));
    } catch {}
    setIsLoaded(true);
  }, []);

  const resetSettings = useCallback(() => {
    const defaults: SettingsObject = { theme: 'dark', timeFormat: '12h', timezone: TIMEZONE };
    setSettings(defaults);
    localStorage.removeItem('bsi_settings');
  }, []);

  const formatDateTime = useCallback((date: Date): string => {
    return (
      date.toLocaleString('en-US', {
        timeZone: TIMEZONE,
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }) + ' CT'
    );
  }, []);

  const formatDate = useCallback((date: Date): string => {
    return date.toLocaleDateString('en-US', {
      timeZone: TIMEZONE,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  const formatTime = useCallback((date: Date): string => {
    return (
      date.toLocaleTimeString('en-US', {
        timeZone: TIMEZONE,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }) + ' CT'
    );
  }, []);

  return { settings, resetSettings, formatDateTime, formatDate, formatTime, isLoaded };
}

export function useTeamPreferences() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('bsi_favorite_teams');
      if (stored) setFavorites(JSON.parse(stored));
    } catch {}
    setIsLoaded(true);
  }, []);

  const toggleFavorite = useCallback((teamId: string) => {
    setFavorites(prev => {
      const next = prev.includes(teamId) ? prev.filter(t => t !== teamId) : [...prev, teamId];
      localStorage.setItem('bsi_favorite_teams', JSON.stringify(next));
      return next;
    });
  }, []);

  const clearPreferences = useCallback(() => {
    setFavorites([]);
    localStorage.removeItem('bsi_favorite_teams');
  }, []);

  return { favorites, toggleFavorite, clearPreferences, isLoaded };
}
