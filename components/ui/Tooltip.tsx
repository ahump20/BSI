'use client';

import type { ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  side?: 'top' | 'bottom';
  className?: string;
}

export function Tooltip({ content, children, side = 'top', className = '' }: TooltipProps) {
  const positionClass = side === 'top'
    ? 'bottom-full left-1/2 -translate-x-1/2 mb-2'
    : 'top-full left-1/2 -translate-x-1/2 mt-2';

  return (
    <span className={`relative inline-flex group ${className}`}>
      {children}
      <span
        role="tooltip"
        className={`
          pointer-events-none absolute ${positionClass} z-[1070]
          whitespace-nowrap rounded-md border border-border px-2 py-1
          bg-[var(--bsi-bg-secondary,#161620)] text-text-primary font-mono text-[10px]
          opacity-0 transition-opacity group-hover:opacity-100
        `}
      >
        {content}
      </span>
    </span>
  );
}
