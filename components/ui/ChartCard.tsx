/**
 * ChartCard Component
 * Wrapper for charts with title and actions
 */

import React from 'react';
import { Card } from './Card';

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  fullWidth?: boolean;
}

export function ChartCard({ title, subtitle, children, actions, fullWidth = false }: ChartCardProps) {
  return (
    <Card variant="default" padding="lg" className={fullWidth ? 'w-full' : ''}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-display font-bold text-white">{title}</h3>
          {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>

      <div>{children}</div>
    </Card>
  );
}
