import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'NBA Standings | Blaze Sports Intel',
  description: 'Current NBA standings by conference with win-loss records, games back, and playoff seeding for the Eastern and Western Conferences.',
  alternates: { canonical: '/nba/standings' },
  openGraph: {
    title: 'NBA Standings | Blaze Sports Intel',
    description: 'NBA conference standings and playoff seeding.',
  },
};

export default function NBAStandingsLayout({ children }: { children: ReactNode }) {
  return children;
}
