'use client';

import { useState, useEffect, useCallback } from 'react';

export interface WatchlistEntry {
  playerId: string;
  playerName: string;
  team?: string;
  position?: string;
  addedAt: string;
  notes?: string;
}

const STORAGE_KEY = 'bsi-watchlist';

function readFromStorage(): WatchlistEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeToStorage(entries: WatchlistEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Storage full or blocked — fail silently
  }
}

export function useWatchlist() {
  const [entries, setEntries] = useState<WatchlistEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setEntries(readFromStorage());
    setLoaded(true);
  }, []);

  const addPlayer = useCallback((player: Omit<WatchlistEntry, 'addedAt'>) => {
    setEntries(prev => {
      if (prev.some(e => e.playerId === player.playerId)) return prev;
      const next = [{ ...player, addedAt: new Date().toISOString() }, ...prev];
      writeToStorage(next);
      return next;
    });
  }, []);

  const removePlayer = useCallback((playerId: string) => {
    setEntries(prev => {
      const next = prev.filter(e => e.playerId !== playerId);
      writeToStorage(next);
      return next;
    });
  }, []);

  const isWatched = useCallback((playerId: string) => {
    return entries.some(e => e.playerId === playerId);
  }, [entries]);

  const updateNotes = useCallback((playerId: string, notes: string) => {
    setEntries(prev => {
      const next = prev.map(e => e.playerId === playerId ? { ...e, notes } : e);
      writeToStorage(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setEntries([]);
    writeToStorage([]);
  }, []);

  return { entries, loaded, addPlayer, removePlayer, isWatched, updateNotes, clearAll };
}
