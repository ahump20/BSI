/**
 * useOddsWebSocket Hook
 * React hook for WebSocket odds connection
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import type { OddsUpdate, OddsSubscription } from '../types/websocket-odds';
import { WebSocketOddsService } from '../services/websocket-odds';

export function useOddsWebSocket(subscription: OddsSubscription) {
  const [connected, setConnected] = useState(false);
  const [latestUpdate, setLatestUpdate] = useState<OddsUpdate | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [service] = useState(() => new WebSocketOddsService());

  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        await service.connect();
        setConnected(true);
        service.subscribe(subscription);

        service.onOddsUpdate((update: OddsUpdate) => {
          setLatestUpdate(update);
        });
      } catch (err) {
        setError(err as Error);
        setConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      service.disconnect();
      setConnected(false);
    };
  }, [service, subscription]);

  const getHistory = useCallback(
    (gameId: string) => {
      return service.getOddsHistory(gameId);
    },
    [service]
  );

  return {
    connected,
    latestUpdate,
    error,
    getHistory,
  };
}
