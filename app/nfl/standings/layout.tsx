import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'NFL Standings | Blaze Sports Intel',
  description: 'Current NFL standings by division with win-loss records, conference standings, and playoff positioning.',
  alternates: { canonical: '/nfl/standings' },
  openGraph: {
    title: 'NFL Standings | Blaze Sports Intel',
    description: 'NFL division standings and playoff positioning.',
  },
};

export default function NFLStandingsLayout({ children }: { children: ReactNode }) {
  return children;
}
