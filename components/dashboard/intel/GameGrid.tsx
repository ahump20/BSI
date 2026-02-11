'use client';

import { useCallback, useRef, useState } from 'react';
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/Skeleton';
import type { IntelGame, IntelSport } from '@/lib/intel/types';
import { GameCardStandard } from './GameCardStandard';

interface GameGridProps {
    hero: IntelGame | undefined;
    marquee: IntelGame[];
    standard: IntelGame[];
    isLoading: boolean;
    onSelectGame: (game: IntelGame) => void;
    heroCard?: React.ReactNode;
    marqueeCards?: React.ReactNode;
    sport?: IntelSport;
}

const gridVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
};

/**
 * Hook for swipe gesture handling on the marquee carousel.
 * Supports touch swipe + scroll-snap for smooth mobile UX.
 */
function useSwipeCarousel() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 4);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  const scrollBy = useCallback((direction: 'left' | 'right') => {
        const el = scrollRef.current;
        if (!el) return;
        const cardWidth = 260;
        el.scrollBy({ left: direction === 'right' ? cardWidth : -cardWidth, behavior: 'smooth' });
        requestAnimationFrame(updateScrollState);
  }, [updateScrollState]);

  return { scrollRef, canScrollLeft, canScrollRight, scrollBy, updateScrollState };
}

export function GameGrid({
    hero,
    marquee,
    standard,
    isLoading,
    onSelectGame,
    heroCard,
    marqueeCards,
    sport = 'all',
}: GameGridProps) {
    const totalGames = (hero ? 1 : 0) + marquee.length + standard.length;
    const { scrollRef, canScrollLeft, canScrollRight, scrollBy, updateScrollState } = useSwipeCarousel();

  return (
    <div className="intel-panel mb-4">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <span className="intel-section-label">
          <Activity
            className="h-3.5 w-3.5 inline-block mr-1.5 -mt-0.5"
            style={{ color: 'var(--bsi-intel-accent, var(--bsi-cyan, #06B6D4))' }}
          />
          Slate
        </span>
        <span
          className="text-[10px] tracking-wide uppercase"
          style={{ fontFamily: 'var(--intel-mono)', color: 'var(--intel-text-caption)' }}
        >
          {isLoading ? '...' : `${totalGames} games`}
        </span>
      </div>
      <hr className="intel-rule mx-4" />
      <div className="px-4 pb-4 pt-3">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              variants={gridVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <Skeleton className="h-32 w-full !rounded-[2px]" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-20 !rounded-[2px]" />
                <Skeleton className="h-20 !rounded-[2px]" />
              </div>
            </motion.div>
          ) : totalGames === 0 ? (
            <motion.div
              key="empty"
              variants={gridVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="intel-panel-elevated p-8 text-center"
            >
              <p className="text-sm" style={{ color: 'var(--intel-text-body)' }}>No games found for this filter.</p>
              <p className="mt-1 text-[11px]" style={{ fontFamily: 'var(--intel-mono)', color: 'var(--intel-text-caption)' }}>
                Try switching the sport or clearing the team lens.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={sport}
              variants={gridVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {/* Hero card */}
              {heroCard ||
                (hero && <GameCardStandard game={hero} onClick={() => onSelectGame(hero)} />)}

              {/* Marquee carousel with swipe gestures */}
              {marqueeCards ||
                (marquee.length > 0 && (
                  <div className="relative group">
                    {/* Navigation arrows (visible on hover / desktop) */}
                    {canScrollLeft && (
                      <button
                        onClick={() => scrollBy('left')}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-black/60 text-white/70 hover:text-white hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity -ml-3"
                        aria-label="Scroll left"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                    )}
                    {canScrollRight && (
                      <button
                        onClick={() => scrollBy('right')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-black/60 text-white/70 hover:text-white hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity -mr-3"
                        aria-label="Scroll right"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    )}

                    {/* Swipeable container */}
                    <div
                      ref={scrollRef}
                      onScroll={updateScrollState}
                      className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory scroll-smooth touch-pan-x"
                      style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
                    >
                      {marquee.map((g) => (
                        <div key={g.id} className="min-w-[240px] flex-1 snap-start">
                          <GameCardStandard game={g} onClick={() => onSelectGame(g)} />
                        </div>
                      ))}
                    </div>

                    {/* Scroll indicators (mobile) */}
                    {marquee.length > 2 && (
                      <div className="flex justify-center gap-1 mt-2 sm:hidden">
                        {marquee.map((g) => (
                          <span
                            key={g.id}
                            className="w-1.5 h-1.5 rounded-full bg-white/20"
                            aria-hidden
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}

              {/* Standard cards */}
              {standard.length > 0 && (
                <div className="space-y-2">
                  {standard.map((g) => (
                    <GameCardStandard key={g.id} game={g} onClick={() => onSelectGame(g)} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
