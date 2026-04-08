import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { EASE_OUT_EXPO } from '../utils/animations';
import type { ReactNode } from 'react';

type Direction = 'up' | 'left' | 'right';

const offsets: Record<Direction, { x?: number; y?: number }> = {
  up: { y: 24 },
  left: { x: -30 },
  right: { x: 30 },
};

export default function ScrollReveal({
  children,
  delay = 0,
  direction = 'up',
  className,
}: {
  children: ReactNode;
  delay?: number;
  direction?: Direction;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const offset = offsets[direction];

  return (
    <motion.div
      className={className}
      initial={reduced ? undefined : { opacity: 0, ...offset }}
      whileInView={reduced ? undefined : { opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={reduced ? undefined : { duration: 0.55, delay, ease: EASE_OUT_EXPO }}
    >
      {children}
    </motion.div>
  );
}
