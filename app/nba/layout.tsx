import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NBA | Blaze Sports Intel',
  description: 'Live NBA scores, standings, team rosters, and player stats. Real-time basketball analytics powered by BSI.',
  openGraph: { title: 'NBA | Blaze Sports Intel', description: 'Live NBA scores, standings, and analytics.' },
};

export default function NBALayout({ children }: { children: ReactNode }) {
  return <div data-sport="nba">{children}</div>;
}
