'use client';

/**
 * OffSeasonBanner — contextual notice shown on sport scoreboard pages when the
 * data we're rendering is all well in the past or all well in the future.
 *
 * Motivation: if a visitor hits /nfl/scores in April, we don't want them to see
 * a single Super Bowl result from February with zero context and conclude the
 * page is broken. Same for CFB in April showing August preseason futures.
 *
 * Detection logic:
 * - `pastOnly`  → all visible games are final and the newest is > staleThresholdDays old
 * - `futureOnly` → all visible games are scheduled and the soonest is > staleThresholdDays away
 * - otherwise → renders nothing
 */

import { Card } from '@/components/ui/Card';

export type SeasonState = 'in-season' | 'past-only' | 'future-only';

interface GameLike {
  date: string | undefined;
  isCompleted: boolean;
  isLive: boolean;
  isScheduled: boolean;
}

interface DetectOptions {
  /** Days into the past before a "final only" page is considered offseason. */
  staleThresholdDays?: number;
  /** Days into the future before a "scheduled only" page is considered preseason. */
  futureThresholdDays?: number;
}

/**
 * Detect the season state from a list of games. Pure function — no React.
 */
export function detectSeasonState(
  games: GameLike[],
  opts: DetectOptions = {},
): { state: SeasonState; referenceDate: Date | null } {
  const stale = (opts.staleThresholdDays ?? 14) * 24 * 60 * 60 * 1000;
  const future = (opts.futureThresholdDays ?? 14) * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const live = games.filter((g) => g.isLive);
  const scheduled = games.filter((g) => g.isScheduled && !g.isCompleted && !g.isLive);
  const final = games.filter((g) => g.isCompleted);

  // Any live or imminent-scheduled game means we're in-season — do not nag.
  if (live.length > 0) return { state: 'in-season', referenceDate: null };
  if (scheduled.length > 0) {
    const soonestMs = Math.min(
      ...scheduled
        .map((g) => (g.date ? Date.parse(g.date) : NaN))
        .filter((t) => !Number.isNaN(t)),
    );
    if (Number.isFinite(soonestMs) && soonestMs - now <= future) {
      return { state: 'in-season', referenceDate: null };
    }
    // All scheduled games are far in the future — preseason state.
    if (Number.isFinite(soonestMs)) {
      return { state: 'future-only', referenceDate: new Date(soonestMs) };
    }
  }

  // Only finals remain. Find the newest.
  if (final.length > 0) {
    const newestMs = Math.max(
      ...final
        .map((g) => (g.date ? Date.parse(g.date) : NaN))
        .filter((t) => !Number.isNaN(t)),
    );
    if (Number.isFinite(newestMs) && now - newestMs > stale) {
      return { state: 'past-only', referenceDate: new Date(newestMs) };
    }
  }

  return { state: 'in-season', referenceDate: null };
}

function formatDaysAgo(d: Date): string {
  const days = Math.round((Date.now() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (days <= 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  if (months === 1) return 'last month';
  return `${months} months ago`;
}

function formatDaysFromNow(d: Date): string {
  const days = Math.round((d.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (days <= 1) return 'tomorrow';
  if (days < 30) return `in ${days} days`;
  const months = Math.round(days / 30);
  if (months === 1) return 'next month';
  return `in ${months} months`;
}

interface OffSeasonBannerProps {
  state: SeasonState;
  referenceDate: Date | null;
  /** Display name for the sport, e.g. "NFL", "College Football". */
  sportLabel: string;
  /** Short season-timing phrase, e.g. "2026 regular season begins in September". */
  seasonTimingHint?: string;
}

export function OffSeasonBanner({
  state,
  referenceDate,
  sportLabel,
  seasonTimingHint,
}: OffSeasonBannerProps) {
  if (state === 'in-season' || !referenceDate) return null;

  const isPast = state === 'past-only';
  const headline = `${sportLabel} is in the offseason`;
  const detail = isPast
    ? `The most recent result showing here is from ${formatDaysAgo(referenceDate)}. ${seasonTimingHint ?? 'Check back when the season resumes.'}`
    : `The soonest game on the schedule is ${formatDaysFromNow(referenceDate)}. ${seasonTimingHint ?? 'Live scores will populate once the season begins.'}`;

  return (
    <Card
      variant="default"
      padding="md"
      className="mb-6"
      style={{
        background: 'rgba(191, 87, 0, 0.06)',
        borderColor: 'rgba(191, 87, 0, 0.24)',
      }}
    >
      <div className="flex items-start gap-3">
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5 shrink-0 mt-0.5"
          fill="none"
          stroke="#BF5700"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
        <div>
          <p className="font-semibold uppercase tracking-wider text-sm text-bsi-bone font-display">
            {headline}
          </p>
          <p className="text-sm text-bsi-dust mt-1 leading-relaxed">{detail}</p>
        </div>
      </div>
    </Card>
  );
}
