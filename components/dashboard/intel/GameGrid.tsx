'use client';

import { Activity } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
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

  return (
    <Card variant="default" padding="none" className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle size="sm" className="flex items-center gap-2">
            <Activity className="h-4 w-4" style={{ color: 'var(--bsi-intel-accent, var(--bsi-cyan, #06B6D4))' }} />
            Slate
          </CardTitle>
          <Badge variant="outline" className="text-[10px] font-mono">
            {isLoading ? '...' : `${totalGames} games`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
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
              <Skeleton className="h-32 w-full rounded-xl" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
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
              className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center"
            >
              <p className="text-sm text-white/50">No games found for this filter.</p>
              <p className="mt-1 font-mono text-[11px] text-white/30">Try switching the sport or clearing the team lens.</p>
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
              {heroCard || (hero && (
                <GameCardStandard game={hero} onClick={() => onSelectGame(hero)} />
              ))}

              {/* Marquee cards with scroll-snap for swipe */}
              {marqueeCards || (marquee.length > 0 && (
                <div
                  className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory scroll-smooth"
                  style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
                >
                  {marquee.map((g) => (
                    <div key={g.id} className="min-w-[240px] flex-1 snap-start">
                      <GameCardStandard game={g} onClick={() => onSelectGame(g)} />
                    </div>
                  ))}
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
      </CardContent>
    </Card>
  );
}
