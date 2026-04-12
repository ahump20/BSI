'use client';

/**
 * Shared empty / loading / error block for every box-score surface.
 *
 * Broadcast-grade full-panel treatment — not a postage stamp. Fills the
 * space it owns with atmosphere: bronze corner marks, press-box header
 * band, centered mark, a hair-line rule, and an Oswald title. Replaces
 * the per-client inline SVG blobs that drifted across MLB, College
 * Baseball, NBA, NFL, and CFB.
 */

interface BoxScoreEmptyStateProps {
  state?: 'empty' | 'loading' | 'error';
  message?: string;
  hint?: string;
  /** Optional sub-label shown in the header band, e.g. 'AWAITING FIRST PITCH'. */
  subtitle?: string;
}

const DEFAULTS: Record<
  NonNullable<BoxScoreEmptyStateProps['state']>,
  { message: string; hint: string; subtitle: string }
> = {
  empty: {
    subtitle: 'Awaiting First Pitch',
    message: 'Box score populates once the game is underway',
    hint: 'Batting, pitching, and the full line — every at-bat, every pitch, every inning — will show up here the moment the first play goes in the books.',
  },
  loading: {
    subtitle: 'Compiling',
    message: 'Loading box score',
    hint: 'Pulling the latest line and pitch-by-pitch detail.',
  },
  error: {
    subtitle: 'Signal Lost',
    message: 'Box score data temporarily unavailable',
    hint: 'We hit a wall reaching the data source. Try again in a moment.',
  },
};

export function BoxScoreEmptyState({
  state = 'empty',
  message,
  hint,
  subtitle,
}: BoxScoreEmptyStateProps) {
  const defaults = DEFAULTS[state];
  const resolvedMessage = message ?? defaults.message;
  const resolvedHint = hint ?? defaults.hint;
  const resolvedSubtitle = subtitle ?? defaults.subtitle;

  return (
    <section
      className="heritage-card corner-marks relative overflow-hidden"
      role={state === 'error' ? 'alert' : undefined}
      aria-busy={state === 'loading' || undefined}
    >
      {/* Press-box header band */}
      <header className="surface-lifted border-b border-border-vintage px-4 md:px-6 py-3 flex items-center justify-between gap-3">
        <span className="heritage-stamp">BOX SCORE</span>
        <span className="text-text-tertiary text-[0.65rem] md:text-xs font-display uppercase tracking-[0.25em]">
          {resolvedSubtitle}
        </span>
      </header>

      {/* Centered broadcast graphic */}
      <div className="relative px-6 py-14 md:py-20 text-center min-h-[22rem] flex flex-col items-center justify-center">
        {/* Atmospheric glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 30%, rgba(191, 87, 0, 0.08) 0%, transparent 55%)',
          }}
        />

        {/* Centered diamond mark */}
        <div
          aria-hidden="true"
          className="relative mb-6 flex items-center justify-center"
        >
          <div className="absolute w-32 h-[1px] bg-bsi-primary/40" />
          <div className="relative w-3 h-3 rotate-45 bg-bsi-primary shadow-[0_0_12px_rgba(191,87,0,0.45)]" />
        </div>

        {/* Oswald title */}
        <h3
          className="relative font-display uppercase tracking-[0.18em] text-text-primary text-xl md:text-2xl lg:text-[1.65rem] leading-tight max-w-[32rem]"
          style={{ fontFamily: 'var(--bsi-font-display)' }}
        >
          {resolvedMessage}
        </h3>

        {/* Hair rule */}
        <div className="relative my-5 w-16 h-px bg-gradient-to-r from-transparent via-heritage-bronze to-transparent opacity-60" />

        {/* Body copy */}
        <p className="relative text-text-tertiary text-sm md:text-[0.95rem] leading-relaxed max-w-xl">
          {resolvedHint}
        </p>
      </div>
    </section>
  );
}
