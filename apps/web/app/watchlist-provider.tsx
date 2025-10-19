'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '@clerk/nextjs';

export type WatchlistEntityType = 'TEAM' | 'GAME';

export interface WatchlistItem {
  id: string;
  entityType: WatchlistEntityType;
  entityId: string;
  displayName?: string | null;
  alertLeadChange: boolean;
  alertUpsetProbability: boolean;
  alertGameStart: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WatchlistCreateInput {
  entityType: WatchlistEntityType;
  entityId: string;
  displayName?: string;
  alertLeadChange?: boolean;
  alertUpsetProbability?: boolean;
  alertGameStart?: boolean;
}

interface WatchlistContextValue {
  items: WatchlistItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addItem: (payload: WatchlistCreateInput) => Promise<void>;
  updateItem: (payload: Partial<WatchlistItem> & { id: string }) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
}

const WatchlistContext = createContext<WatchlistContextValue | undefined>(undefined);

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    credentials: 'include'
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message = typeof data.error === 'string' ? data.error : response.statusText;
    throw new Error(message || 'Request failed');
  }

  return response.json() as Promise<T>;
}

interface WatchlistProviderProps {
  children: ReactNode;
  authDisabled?: boolean;
}

function useSafeAuth(authDisabled?: boolean) {
  if (authDisabled) {
    return { isSignedIn: false };
  }

  try {
    return useAuth();
  } catch {
    return { isSignedIn: false };
  }
}

export function WatchlistProvider({ children, authDisabled }: WatchlistProviderProps) {
  const { isSignedIn } = useSafeAuth(authDisabled);
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isSignedIn) {
      setItems([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await request<{ items: WatchlistItem[] }>('/api/v1/watchlist');
      setItems(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load watchlist');
    } finally {
      setLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addItem = useCallback<WatchlistContextValue['addItem']>(
    async ({ entityType, entityId, displayName, alertLeadChange, alertUpsetProbability, alertGameStart }) => {
      if (!isSignedIn) {
        throw new Error('Sign in required to use watchlist');
      }

      const payload = {
        entityType,
        entityId,
        displayName: displayName ?? undefined,
        alertLeadChange: alertLeadChange ?? false,
        alertUpsetProbability: alertUpsetProbability ?? false,
        alertGameStart: alertGameStart ?? false
      };

      const data = await request<{ item: WatchlistItem }>('/api/v1/watchlist', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setItems((current) => [...current, data.item]);
    },
    [isSignedIn]
  );

  const updateItem = useCallback<WatchlistContextValue['updateItem']>(
    async ({ id, ...changes }) => {
      if (!isSignedIn) {
        throw new Error('Sign in required to use watchlist');
      }

      const data = await request<{ item: WatchlistItem }>('/api/v1/watchlist', {
        method: 'PATCH',
        body: JSON.stringify({ id, ...changes })
      });

      setItems((current) => current.map((item) => (item.id === id ? data.item : item)));
    },
    [isSignedIn]
  );

  const removeItem = useCallback<WatchlistContextValue['removeItem']>(
    async (id) => {
      if (!isSignedIn) {
        throw new Error('Sign in required to use watchlist');
      }

      await request<{ success: boolean }>(`/api/v1/watchlist?id=${id}`, {
        method: 'DELETE'
      });

      setItems((current) => current.filter((item) => item.id !== id));
    },
    [isSignedIn]
  );

  const value = useMemo<WatchlistContextValue>(
    () => ({ items, loading, error, refresh, addItem, updateItem, removeItem }),
    [items, loading, error, refresh, addItem, updateItem, removeItem]
  );

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}

export function useWatchlist(): WatchlistContextValue {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
}
