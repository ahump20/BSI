'use client';

import { ReactNode } from 'react';

/**
 * Page transition wrapper.
 *
 * Currently a passthrough. Framer-motion page transitions with
 * key={pathname} break Next.js App Router's in-place page swap
 * on static exports — the key change unmounts the subtree,
 * disrupting client-side routing. Add transitions back via
 * template.tsx when Next.js supports it natively.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function MotionProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
