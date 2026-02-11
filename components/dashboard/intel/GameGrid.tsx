'use client';

import { Activity } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import type { IntelGame } from '@/lib/intel/types';
import { GameCardStandard } from './GameCardStandard';

interface GameGridProps {
  hero: IntelGame | undefined;
  marquee: IntelGame[];
  standard: IntelGame[];
  isLoading: boolean;
  onSelectGame: (game: IntelGame) => void;
  heroCard?: React.ReactNode;
  marqueeCards?: React.ReactNode;
}

const fadeSlide = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.2, ease: 'easeOut' as const },
};

export function GameGrid({
  hero,
  marquee,
  standard,
  isLoading,
  onSelectGame,
  heroCard,
  marqueeCards,
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
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full rounded-xl" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
            </div>
          </div>
        ) : totalGames === 0 ? (
          <motion.div
            key="empty"
            {...fadeSlide}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center"
          >
            <p className="text-sm text-white/50">No games found for this filter.</p>
            <p className="mt-1 font-mono text-[11px] text-white/30">Try switching the sport or clearing the team lens.</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={hero?.sport ?? 'grid'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="space-y-3"
            >
              {/* Hero card */}
              {heroCard || (hero && (
                <GameCardStandard game={hero} onClick={() => onSelectGame(hero)} />
              ))}

              {/* Marquee cards */}
              {marqueeCards || (marquee.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
                  {marquee.map((g) => (
                    <div key={g.id} className="min-w-[240px] flex-1">
                      <GameCardStandard game={g} onClick={() => onSelectGame(g)} />
                    </div>
                  ))}
                </div>
              ))}

              {/* Standard cards */}
              {standard.length > 0 && (
                <div className="space-y-2">
                  {standard.map((g, i) => (
                    <motion.div
                      key={g.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, delay: i * 0.03, ease: 'easeOut' }}
                    >
                      <GameCardStandard game={g} onClick={() => onSelectGame(g)} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
}
