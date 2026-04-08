'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';

interface DataTransitionProps {
  value: string | number;
  children: ReactNode;
  mode?: 'flip' | 'fade' | 'flash';
  className?: string;
}

const variants = {
  flip: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  flash: {
    initial: { opacity: 0, scale: 1.1 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
};

export function DataTransition({
  value,
  children,
  mode = 'flip',
  className = '',
}: DataTransitionProps) {
  const v = variants[mode];

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={String(value)}
        initial={v.initial}
        animate={v.animate}
        exit={v.exit}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className={className}
      >
        {children}
      </motion.span>
    </AnimatePresence>
  );
}
