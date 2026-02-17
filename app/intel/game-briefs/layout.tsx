import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Game Briefs | BSI Intel',
  description: 'Post-game analysis briefs with leverage moments, deciding stats, and win probability context.',
};

export default function GameBriefsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
