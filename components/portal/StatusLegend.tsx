'use client';

import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

export interface StatusLegendProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'compact' | 'full';
}

interface StatusInfo {
  key: string;
  label: string;
  description: string;
  color: string;
  bgColor: string;
}

const statuses: StatusInfo[] = [
  {
    key: 'in_portal',
    label: 'In Portal',
    description: 'Player is actively seeking a new school',
    color: 'text-warning',
    bgColor: 'bg-warning/20',
  },
  {
    key: 'committed',
    label: 'Committed',
    description: 'Player has committed to a new program',
    color: 'text-success',
    bgColor: 'bg-success/20',
  },
  {
    key: 'withdrawn',
    label: 'Withdrawn',
    description: 'Player withdrew and stays at current school',
    color: 'text-text-muted',
    bgColor: 'bg-charcoal-700/50',
  },
];

export function StatusLegend({ variant = 'full', className, ...props }: StatusLegendProps) {
  if (variant === 'compact') {
    return (
      <div className={cn('flex flex-wrap items-center gap-4 text-sm', className)} {...props}>
        <span className="text-text-tertiary">Status:</span>
        {statuses.map((status) => (
          <span key={status.key} className="inline-flex items-center gap-1.5">
            <span
              className={cn(
                'px-2 py-0.5 rounded text-xs font-medium',
                status.bgColor,
                status.color
              )}
            >
              {status.label}
            </span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn('p-4 rounded-xl bg-charcoal-800/30 border border-border-subtle', className)}
      {...props}
    >
      <h4 className="text-sm font-medium text-text-secondary mb-3">Portal Status Guide</h4>
      <div className="space-y-3">
        {statuses.map((status) => (
          <div key={status.key} className="flex items-start gap-3">
            <span
              className={cn(
                'px-2.5 py-1 rounded text-xs font-medium flex-shrink-0',
                status.bgColor,
                status.color
              )}
            >
              {status.label}
            </span>
            <span className="text-sm text-text-tertiary">{status.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
