/**
 * ConfidenceMeter Component
 * Visual confidence indicator
 */

import React from 'react';
import { clsx } from 'clsx';

export interface ConfidenceMeterProps {
  confidence: 'high' | 'medium' | 'low';
  value: number;
}

export function ConfidenceMeter({ confidence, value }: ConfidenceMeterProps) {
  const percentage = Math.min(100, Math.max(0, value * 100));

  const getColor = () => {
    switch (confidence) {
      case 'high':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-red-500';
    }
  };

  const getText = () => {
    switch (confidence) {
      case 'high':
        return 'High Confidence';
      case 'medium':
        return 'Medium Confidence';
      case 'low':
        return 'Low Confidence';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-secondary">{getText()}</span>
        <span className="text-sm font-bold text-white">{percentage.toFixed(0)}%</span>
      </div>

      <div className="relative w-full h-3 bg-charcoal rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-500', getColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
