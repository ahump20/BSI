/**
 * FactorBreakdown Component
 * Detailed breakdown of prediction factors
 */

import React from 'react';
import { Card } from '../ui/Card';
import type { PredictionFactor } from '@/lib/types/predictions';

export interface FactorBreakdownProps {
  factors: PredictionFactor[];
}

export function FactorBreakdown({ factors }: FactorBreakdownProps) {
  const sortedFactors = [...factors].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  return (
    <Card variant="default" padding="lg">
      <h3 className="text-lg font-display font-bold text-white mb-4">
        Prediction Factors
      </h3>

      <div className="space-y-4">
        {sortedFactors.map((factor, index) => {
          const impactPercent = Math.abs(factor.impact) * 100;
          const isPositive = factor.impact > 0;

          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isPositive ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm font-medium text-white">{factor.name}</span>
                </div>
                <span className={`text-sm font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositive ? '+' : ''}{(factor.impact * 100).toFixed(0)}%
                </span>
              </div>

              <p className="text-xs text-text-secondary pl-4">{factor.description}</p>

              <div className="w-full bg-charcoal rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${impactPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
