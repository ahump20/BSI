/**
 * StatsCard Component
 * TailAdmin-inspired stats card with trend indicators
 */

import React from 'react';
import { Card } from './Card';
import { clsx } from 'clsx';

export interface StatsCardProps {
  title: string;
  value: string | number;
  change?: { value: number; trend: 'up' | 'down' };
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

const colorClasses = {
  primary: 'text-burnt-orange',
  success: 'text-green-500',
  warning: 'text-yellow-500',
  danger: 'text-red-500',
};

const trendColorClasses = {
  up: 'text-green-500',
  down: 'text-red-500',
};

export function StatsCard({ title, value, change, icon, color = 'primary' }: StatsCardProps) {
  return (
    <Card variant="default" padding="lg">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-text-tertiary text-sm font-medium uppercase tracking-wider mb-2">
            {title}
          </p>
          <p className={clsx('text-3xl font-bold', colorClasses[color])}>{value}</p>

          {change && (
            <div className={clsx('flex items-center gap-1 mt-2', trendColorClasses[change.trend])}>
              <span className="text-sm font-medium">
                {change.trend === 'up' ? '↑' : '↓'} {Math.abs(change.value)}%
              </span>
              <span className="text-text-tertiary text-xs">vs last period</span>
            </div>
          )}
        </div>

        {icon && (
          <div className={clsx('flex-shrink-0 text-4xl', colorClasses[color])}>{icon}</div>
        )}
      </div>
    </Card>
  );
}
