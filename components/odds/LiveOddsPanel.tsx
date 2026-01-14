/**
 * LiveOddsPanel Component
 * Display real-time odds updates
 */

'use client';

import React from 'react';
import { Card } from '../ui/Card';
import { useOddsWebSocket } from '@/lib/hooks/useOddsWebSocket';
import { OddsMovementIndicator } from './OddsMovementIndicator';
import type { OddsSubscription } from '@/lib/types/websocket-odds';

export interface LiveOddsPanelProps {
  gameId: string;
  sport: string;
}

export function LiveOddsPanel({ gameId, sport }: LiveOddsPanelProps) {
  const subscription: OddsSubscription = {
    gameIds: [gameId],
    sports: [sport],
  };

  const { connected, latestUpdate, error } = useOddsWebSocket(subscription);

  if (error) {
    return (
      <Card variant="default" padding="lg">
        <p className="text-red-500">Error connecting to odds feed</p>
      </Card>
    );
  }

  if (!connected) {
    return (
      <Card variant="default" padding="lg">
        <p className="text-text-secondary">Connecting to live odds...</p>
      </Card>
    );
  }

  if (!latestUpdate) {
    return (
      <Card variant="default" padding="lg">
        <p className="text-text-secondary">Waiting for odds updates...</p>
      </Card>
    );
  }

  return (
    <Card variant="default" padding="lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-display font-bold text-white">Live Odds</h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-text-secondary">LIVE</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-charcoal rounded-lg p-3">
            <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">Moneyline</p>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">Home</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-burnt-orange">
                    {latestUpdate.odds.moneyline.home > 0 ? '+' : ''}
                    {latestUpdate.odds.moneyline.home}
                  </span>
                  <OddsMovementIndicator movement={latestUpdate.movement} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">Away</span>
                <span className="text-sm font-semibold text-white">
                  {latestUpdate.odds.moneyline.away > 0 ? '+' : ''}
                  {latestUpdate.odds.moneyline.away}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-charcoal rounded-lg p-3">
            <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">Spread</p>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">
                  {latestUpdate.odds.spread.line > 0 ? '+' : ''}
                  {latestUpdate.odds.spread.line}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-burnt-orange">
                    {latestUpdate.odds.spread.home}
                  </span>
                  <OddsMovementIndicator movement={latestUpdate.movement} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-charcoal rounded-lg p-3">
            <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">Total</p>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">O {latestUpdate.odds.total.line}</span>
                <span className="text-sm font-semibold text-white">
                  {latestUpdate.odds.total.over}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">U {latestUpdate.odds.total.line}</span>
                <span className="text-sm font-semibold text-white">
                  {latestUpdate.odds.total.under}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-text-tertiary">
          <span>{latestUpdate.sportsbook}</span>
          <span>{new Date(latestUpdate.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>
    </Card>
  );
}
