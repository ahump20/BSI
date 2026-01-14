/**
 * ProgressBar Component
 * Visual progress indicator
 */

import React from 'react';
import { clsx } from 'clsx';

export interface ProgressBarProps {
  value: number;
  max?: number;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const colorClasses = {
  primary: 'bg-burnt-orange',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
};

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-4',
};

export function ProgressBar({
  value,
  max = 100,
  color = 'primary',
  showLabel = false,
  size = 'md',
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between mb-2">
          <span className="text-sm text-text-secondary">Progress</span>
          <span className="text-sm font-semibold text-white">{percentage.toFixed(0)}%</span>
        </div>
      )}

      <div className="w-full bg-charcoal rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-300', sizeClasses[size], colorClasses[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
