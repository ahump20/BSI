/**
 * LineHistory Component
 * Shows historical odds movements
 */

'use client';

import React from 'react';
import { Card } from '../ui/Card';
import type { OddsHistory } from '@/lib/types/websocket-odds';

export interface LineHistoryProps {
  history: OddsHistory;
}

export function LineHistory({ history }: LineHistoryProps) {
  return (
    <Card variant="default" padding="lg">
      <h3 className="text-lg font-display font-bold text-white mb-4">
        Line Movement History
      </h3>

      <div className="space-y-3">
        {history.updates.slice(-10).reverse().map((update, index) => (
          <div
            key={index}
            className="flex items-center justify-between py-2 border-b border-text-tertiary/10 last:border-b-0"
          >
            <div className="flex items-center gap-4">
              <span className="text-xs text-text-tertiary">
                {new Date(update.timestamp).toLocaleTimeString()}
              </span>
              <span className="text-sm text-white">
                Spread: {update.odds.spread.line > 0 ? '+' : ''}
                {update.odds.spread.line}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary">{update.sportsbook}</span>
              {update.movement && (
                <span className={`text-sm ${
                  update.movement === 'up' ? 'text-green-500' : 
                  update.movement === 'down' ? 'text-red-500' : 
                  'text-text-tertiary'
                }`}>
                  {update.movement === 'up' ? '↑' : update.movement === 'down' ? '↓' : '→'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-text-tertiary/20">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Current Trend</span>
          <span className={`text-sm font-semibold ${
            history.trend === 'increasing' ? 'text-green-500' :
            history.trend === 'decreasing' ? 'text-red-500' :
            'text-text-tertiary'
          }`}>
            {history.trend === 'increasing' ? 'Moving Up ↑' :
             history.trend === 'decreasing' ? 'Moving Down ↓' :
             'Stable →'}
          </span>
        </div>
      </div>
    </Card>
  );
}
