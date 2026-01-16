'use client';

import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';

export interface PlayByPlaySectionProps {
  period: string;
  periodLabel: string;
  playCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function PlayByPlaySection({
  period,
  periodLabel,
  playCount,
  isExpanded,
  onToggle,
  children,
}: PlayByPlaySectionProps) {
  return (
    <Card variant="default" padding="none">
      {/* Period header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
        aria-expanded={isExpanded}
        aria-controls={`period-${period}-plays`}
      >
        <span className="text-sm font-semibold text-white">{periodLabel}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50">{playCount} plays</span>
          <svg
            className={`w-4 h-4 text-white/50 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Period plays */}
      {isExpanded && (
        <div id={`period-${period}-plays`} className="border-t border-white/10">
          {children}
        </div>
      )}
    </Card>
  );
}

export default PlayByPlaySection;
