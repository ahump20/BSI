'use client';

/**
 * Shared empty / loading / error block for every box-score surface.
 *
 * Replaces the per-client inline SVG blobs that drifted independently
 * across MLB, College Baseball, NBA, NFL, and CFB. Heritage-styled.
 */

interface BoxScoreEmptyStateProps {
  state?: 'empty' | 'loading' | 'error';
  message?: string;
  hint?: string;
}

const DEFAULTS: Record<NonNullable<BoxScoreEmptyStateProps['state']>, { message: string; hint: string }> = {
  empty: {
    message: 'Box score not available yet',
    hint: 'The full box score populates once the first pitch, snap, or tip is in the books.',
  },
  loading: {
    message: 'Loading box score',
    hint: 'Pulling the latest line and pitch-by-pitch detail.',
  },
  error: {
    message: 'Box score data temporarily unavailable',
    hint: 'We hit a wall reaching the data source. Try again in a moment.',
  },
};

export function BoxScoreEmptyState({
  state = 'empty',
  message,
  hint,
}: BoxScoreEmptyStateProps) {
  const defaults = DEFAULTS[state];
  const resolvedMessage = message ?? defaults.message;
  const resolvedHint = hint ?? defaults.hint;

  return (
    <section
      className="heritage-card corner-marks relative overflow-hidden px-6 py-10 text-center"
      role={state === 'error' ? 'alert' : undefined}
      aria-busy={state === 'loading' || undefined}
    >
      <span className="heritage-stamp mb-4 inline-block">BOX SCORE</span>
      <div className="section-rule mx-auto" />
      <p className="text-text-primary text-base font-medium">{resolvedMessage}</p>
      <p className="text-text-tertiary text-sm mt-2 max-w-md mx-auto">{resolvedHint}</p>
    </section>
  );
}
