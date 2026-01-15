/**
 * EPAChart Component
 * Visualize Expected Points Added by quarter
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ChartCard } from '../ui/ChartCard';
import type { EPAMetrics } from '@/lib/types/nfl-playbyplay';

export interface EPAChartProps {
  gameId: string;
}

export function EPAChart({ gameId }: EPAChartProps) {
  const [metrics, setMetrics] = useState<EPAMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch(`/api/nfl/playbyplay?gameId=${gameId}`);
        const json = await response.json();
        setMetrics(json.epaMetrics);
      } catch (error) {
        console.error('Failed to fetch EPA metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [gameId]);

  if (loading || !metrics) {
    return (
      <ChartCard title="EPA Analysis">
        <p className="text-text-secondary">Loading metrics...</p>
      </ChartCard>
    );
  }

  const maxEPA = Math.max(...Object.values(metrics.byQuarter));
  const minEPA = Math.min(...Object.values(metrics.byQuarter));
  const range = maxEPA - minEPA;

  return (
    <ChartCard title="EPA Analysis" subtitle="Expected Points Added by Quarter">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-charcoal rounded-lg p-4">
            <p className="text-text-tertiary text-xs uppercase tracking-wider mb-1">Overall</p>
            <p className="text-2xl font-bold text-burnt-orange">{metrics.overall.toFixed(2)}</p>
          </div>
          <div className="bg-charcoal rounded-lg p-4">
            <p className="text-text-tertiary text-xs uppercase tracking-wider mb-1">Passing</p>
            <p className="text-2xl font-bold text-white">{metrics.passing.toFixed(2)}</p>
          </div>
          <div className="bg-charcoal rounded-lg p-4">
            <p className="text-text-tertiary text-xs uppercase tracking-wider mb-1">Rushing</p>
            <p className="text-2xl font-bold text-white">{metrics.rushing.toFixed(2)}</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-text-secondary font-semibold">By Quarter</p>
          {Object.entries(metrics.byQuarter).map(([quarter, epa]) => {
            const percentage = range > 0 ? ((epa - minEPA) / range) * 100 : 50;
            const isPositive = epa > 0;

            return (
              <div key={quarter}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-text-tertiary">Q{quarter}</span>
                  <span className={`text-sm font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {isPositive ? '+' : ''}
                    {epa.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-charcoal rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ChartCard>
  );
}
