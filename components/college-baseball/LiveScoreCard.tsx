'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import type { LiveGame } from '@/lib/hooks/useLiveScores';

// =============================================================================
// Score digit animation — highlights briefly on change
// =============================================================================

function AnimatedScore({
  value,
  isWinner,
  isScheduled,
}: {
  value: number | null;
  isWinner: boolean;
  isScheduled: boolean;
}) {
  const prevRef = useRef(value);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (prevRef.current !== value && value !== null && prevRef.current !== null) {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 1200);
      prevRef.current = value;
      return () => clearTimeout(timer);
    }
    prevRef.current = value;
  }, [value]);

  return (
    <motion.span
      className={`text-2xl font-bold font-mono ${
        isScheduled
          ? 'text-[rgba(196,184,165,0.5)]'
          : isWinner
            ? 'text-[var(--bsi-bone)]'
            : 'text-[var(--bsi-dust)]'
      }`}
      animate={flash ? { scale: [1, 1.3, 1], color: ['', 'var(--bsi-accent)', ''] } : {}}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {value !== null ? value : '-'}
    </motion.span>
  );
}

// =============================================================================
// Live indicator dot
// =============================================================================

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
    </span>
  );
}

// =============================================================================
// LiveScoreCard
// =============================================================================

interface LiveScoreCardProps {
  game: LiveGame;
  /** Show animation transitions (disable for initial render batch) */
  animate?: boolean;
  /** Timestamp of last data message — displayed as "Xs ago" during live games */
  lastMessageAt?: Date;
}

export function LiveScoreCard({ game, animate = true, lastMessageAt }: LiveScoreCardProps) {
  const isLive = game.status === 'in';
  const isFinal = game.status === 'post';
  const isScheduled = game.status === 'pre';

  const awayWon = isFinal && game.awayTeam.score > game.homeTeam.score;
  const homeWon = isFinal && game.homeTeam.score > game.awayTeam.score;

  // Format time from ISO string
  const gameTime = (() => {
    if (!game.startTime) return '';
    try {
      return new Date(game.startTime).toLocaleTimeString('en-US', {
        timeZone: 'America/Chicago',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  })();

  // Inning display
  const inningDisplay = (() => {
    if (!isLive) return null;
    if (game.inning) {
      const half = game.inningHalf === 'top' ? 'Top' : game.inningHalf === 'bottom' ? 'Bot' : '';
      const outs = game.outs !== undefined ? ` | ${game.outs} Out` : '';
      return `${half} ${game.inning}${outs}`;
    }
    return 'Live';
  })();

  const Wrapper = animate ? motion.div : 'div';
  const wrapperProps = animate
    ? {
        layout: true,
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 0.3 },
      }
    : {};

  return (
    <Wrapper {...(wrapperProps as Record<string, unknown>)}>
      <Link href={`/college-baseball/game/${game.id}`} className="block">
        <div
          className={`bg-graphite rounded-sm border transition-all hover:border-[var(--bsi-primary)] hover:bg-[var(--surface-press-box)] ${
            isLive ? 'border-success' : 'border-[var(--border-vintage)]'
          }`}
        >
          {/* Status Bar */}
          <div
            className={`px-4 py-2 rounded-t-sm flex items-center justify-between ${
              isLive
                ? 'bg-success/20'
                : isFinal
                  ? 'bg-[var(--surface-dugout)]'
                  : 'bg-[var(--bsi-primary)]/20'
            }`}
          >
            <span
              className={`text-xs font-semibold uppercase ${
                isLive
                  ? 'text-success'
                  : isFinal
                    ? 'text-[rgba(196,184,165,0.5)]'
                    : 'text-[var(--bsi-primary)]'
              }`}
            >
              {isLive ? (
                <span className="flex items-center gap-1.5">
                  <LiveDot />
                  {inningDisplay}
                </span>
              ) : isFinal ? (
                'Final'
              ) : game.status === 'postponed' ? (
                'Postponed'
              ) : game.status === 'cancelled' ? (
                'Cancelled'
              ) : (
                gameTime
              )}
            </span>

            <AnimatePresence>
              {isLive && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1.5 px-2 py-0.5 bg-success/20 text-success text-[10px] font-bold uppercase rounded-full tracking-wider"
                >
                  LIVE
                  {lastMessageAt && (
                    <span className="text-success/60 font-normal normal-case tracking-normal">
                      {Math.floor((Date.now() - lastMessageAt.getTime()) / 1000)}s ago
                    </span>
                  )}
                </motion.span>
              )}
            </AnimatePresence>

            <span className="text-xs text-[rgba(196,184,165,0.5)] bg-[var(--surface-dugout)]/60 px-2 py-0.5 rounded-sm">
              {game.homeTeam.conference || game.awayTeam.conference || 'NCAA'}
            </span>
          </div>

          {/* Teams */}
          <div className="p-4 space-y-3">
            {/* Away Team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[var(--surface-dugout)] rounded-full flex items-center justify-center text-xs font-bold text-[var(--bsi-primary)]">
                  {game.awayTeam.shortName?.slice(0, 3).toUpperCase() || 'AWY'}
                </div>
                <div>
                  <p
                    className={`font-semibold ${
                      awayWon ? 'text-[var(--bsi-bone)]' : 'text-[var(--bsi-dust)]'
                    }`}
                  >
                    {game.awayTeam.ranking && (
                      <span className="text-[var(--bsi-primary)] text-xs mr-1">
                        #{game.awayTeam.ranking}
                      </span>
                    )}
                    {game.awayTeam.name}
                  </p>
                  {game.awayTeam.record && (
                    <p className="text-xs text-[rgba(196,184,165,0.5)]">{game.awayTeam.record}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {awayWon && (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-success" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                )}
                <AnimatedScore
                  value={!isScheduled ? game.awayTeam.score : null}
                  isWinner={awayWon}
                  isScheduled={isScheduled}
                />
              </div>
            </div>

            {/* Home Team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[var(--surface-dugout)] rounded-full flex items-center justify-center text-xs font-bold text-[var(--bsi-primary)]">
                  {game.homeTeam.shortName?.slice(0, 3).toUpperCase() || 'HME'}
                </div>
                <div>
                  <p
                    className={`font-semibold ${
                      homeWon ? 'text-[var(--bsi-bone)]' : 'text-[var(--bsi-dust)]'
                    }`}
                  >
                    {game.homeTeam.ranking && (
                      <span className="text-[var(--bsi-primary)] text-xs mr-1">
                        #{game.homeTeam.ranking}
                      </span>
                    )}
                    {game.homeTeam.name}
                  </p>
                  {game.homeTeam.record && (
                    <p className="text-xs text-[rgba(196,184,165,0.5)]">{game.homeTeam.record}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {homeWon && (
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-success" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                )}
                <AnimatedScore
                  value={!isScheduled ? game.homeTeam.score : null}
                  isWinner={homeWon}
                  isScheduled={isScheduled}
                />
              </div>
            </div>
          </div>

          {/* Venue Footer */}
          {game.venue && game.venue !== 'TBD' && (
            <div className="px-4 pb-3 text-xs text-[rgba(196,184,165,0.5)] border-t border-[var(--border-vintage)] pt-3">
              {game.venue}
            </div>
          )}
        </div>
      </Link>
    </Wrapper>
  );
}
