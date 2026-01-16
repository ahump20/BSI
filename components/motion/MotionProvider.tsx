'use client';

/**
 * BSI Motion Provider
 *
 * Wraps the app with LazyMotion for code-split animation features.
 * Only loads the DOM animation features we actually use.
 */

import { LazyMotion, domAnimation } from 'framer-motion';
import type { ReactNode } from 'react';

interface MotionProviderProps {
  children: ReactNode;
}

/**
 * Provides Framer Motion context with lazy-loaded features.
 * Use this at the app root to enable animations with minimal bundle impact.
 */
export function MotionProvider({ children }: MotionProviderProps) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}

export default MotionProvider;
