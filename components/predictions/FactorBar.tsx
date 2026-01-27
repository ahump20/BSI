'use client';

import type { JSX } from 'react';

interface FactorBarProps {
  label: string;
  impact: number;
  maxImpact?: number;
}

export function FactorBar({ label, impact, maxImpact = 20 }: FactorBarProps): JSX.Element {
  const absImpact = Math.abs(impact);
  const widthPercent = Math.min((absImpact / maxImpact) * 100, 100);
  const isPositive = impact >= 0;

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-text-secondary w-32 truncate" title={label}>
        {label}
      </span>
      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1 h-2 bg-bg-tertiary rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isPositive ? 'bg-burnt-orange' : 'bg-gold'
            }`}
            style={{ width: `${widthPercent}%` }}
          />
        </div>
        <span
          className={`text-sm font-mono w-16 text-right ${
            isPositive ? 'text-burnt-orange' : 'text-gold'
          }`}
        >
          {isPositive ? '+' : ''}
          {impact.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
