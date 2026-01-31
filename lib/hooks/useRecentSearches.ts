'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'bsi_recent_searches';
const MAX_SEARCHES = 10;

interface RecentSearch {
  query: string;
  timestamp: number;
  type?: 'team' | 'player' | 'game';
}

interface UseRecentSearchesReturn {
  recentSearches: RecentSearch[];
  addSearch: (query: string, type?: 'team' | 'player' | 'game') => void;
  removeSearch: (query: string) => void;
  clearSearches: () => void;
}

export function useRecentSearches(): UseRecentSearchesReturn {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentSearch[];
        setRecentSearches(parsed);
      }
    } catch {
      // Invalid data, ignore
    }
  }, []);

  // Save to localStorage whenever searches change
  const saveSearches = useCallback((searches: RecentSearch[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
    } catch {
      // Storage full or unavailable, ignore
    }
  }, []);

  const addSearch = useCallback(
    (query: string, type?: 'team' | 'player' | 'game') => {
      const trimmed = query.trim();
      if (!trimmed || trimmed.length < 2) return;

      setRecentSearches((prev) => {
        // Remove existing entry with same query (case-insensitive)
        const filtered = prev.filter((s) => s.query.toLowerCase() !== trimmed.toLowerCase());

        // Add new entry at the beginning
        const newSearch: RecentSearch = {
          query: trimmed,
          timestamp: Date.now(),
          type,
        };

        const updated = [newSearch, ...filtered].slice(0, MAX_SEARCHES);
        saveSearches(updated);
        return updated;
      });
    },
    [saveSearches]
  );

  const removeSearch = useCallback(
    (query: string) => {
      setRecentSearches((prev) => {
        const filtered = prev.filter((s) => s.query.toLowerCase() !== query.toLowerCase());
        saveSearches(filtered);
        return filtered;
      });
    },
    [saveSearches]
  );

  const clearSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage unavailable, ignore
    }
  }, []);

  return {
    recentSearches,
    addSearch,
    removeSearch,
    clearSearches,
  };
}
