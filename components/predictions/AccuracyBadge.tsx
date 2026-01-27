'use client';

import type { JSX } from 'react';

interface AccuracyBadgeProps {
  brierScore: number;
  sampleSize?: number;
}

function getAccuracyGrade(brierScore: number): { grade: string; label: string; color: string } {
  if (brierScore <= 0.1) return { grade: 'A+', label: 'Excellent', color: 'text-success' };
  if (brierScore <= 0.12) return { grade: 'A', label: 'Very Good', color: 'text-success' };
  if (brierScore <= 0.15) return { grade: 'B+', label: 'Good', color: 'text-gold' };
  if (brierScore <= 0.18) return { grade: 'B', label: 'Above Average', color: 'text-gold' };
  if (brierScore <= 0.21) return { grade: 'C+', label: 'Average', color: 'text-text-secondary' };
  if (brierScore <= 0.25)
    return { grade: 'C', label: 'Below Average', color: 'text-text-tertiary' };
  return { grade: 'D', label: 'Poor', color: 'text-error' };
}

export function AccuracyBadge({ brierScore, sampleSize }: AccuracyBadgeProps): JSX.Element {
  const accuracy = getAccuracyGrade(brierScore);
  const accuracyPercent = Math.round((1 - brierScore) * 100);

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center justify-center w-8 h-8 rounded-lg bg-bg-tertiary border border-border-subtle ${accuracy.color}`}
      >
        <span className="text-sm font-bold">{accuracy.grade}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-white">{accuracyPercent}% Accurate</span>
        {sampleSize && (
          <span className="text-xs text-text-tertiary">
            {sampleSize.toLocaleString()} predictions
          </span>
        )}
      </div>
    </div>
  );
}
