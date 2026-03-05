import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Game Briefs | BSI Intel',
  description: 'Post-game analysis briefs with leverage moments, deciding stats, and win probability context.',
  alternates: { canonical: '/intel/game-briefs' },
  openGraph: {
    title: 'Game Briefs | Blaze Sports Intel',
    description: 'Pre-game intelligence and matchup analysis.',
  },
};

export default function GameBriefsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
