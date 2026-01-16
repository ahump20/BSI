'use client';

/**
 * BSI Page Transition
 *
 * Wraps page content with smooth enter/exit animations.
 * Uses AnimatePresence for route transitions.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useReducedMotion } from './hooks';
import { pageTransition } from './variants';

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * Animates page transitions on route changes.
 * Respects prefers-reduced-motion preference.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  // Skip animation if user prefers reduced motion
  if (prefersReducedMotion) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageTransition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default PageTransition;
