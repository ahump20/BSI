'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import type { IntelGame } from '@/lib/intel/types';
import { GameCardMarquee } from './GameCardMarquee';

interface MarqueeCarouselProps {
  games: IntelGame[];
  onSelectGame: (game: IntelGame) => void;
}

/**
 * Swipeable horizontal carousel for marquee game cards.
 * Uses Framer Motion drag constraints for native-feeling touch/mouse swipe.
 */
export function MarqueeCarousel({ games, onSelectGame }: MarqueeCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  if (games.length === 0) return null;

  return (
    <div ref={containerRef} className="overflow-hidden -mx-1 px-1">
      <motion.div
        className="flex gap-3 cursor-grab active:cursor-grabbing"
        drag="x"
        dragConstraints={containerRef}
        dragElastic={0.12}
        dragTransition={{ bounceStiffness: 300, bounceDamping: 30 }}
        style={{ touchAction: 'pan-y' }}
      >
        {games.map((g) => (
          <motion.div
            key={g.id}
            className="min-w-[260px] max-w-[320px] flex-shrink-0"
          >
            <GameCardMarquee game={g} onClick={() => onSelectGame(g)} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
