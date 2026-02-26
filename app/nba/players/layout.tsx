import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'NBA Players | Blaze Sports Intel',
  description: 'NBA player stats, profiles, and performance analytics with real-time data across all positions.',
  alternates: { canonical: '/nba/players' },
  openGraph: {
    title: 'NBA Players | Blaze Sports Intel',
    description: 'NBA player stats and performance analytics.',
  },
};

export default function NBAPlayersLayout({ children }: { children: ReactNode }) {
  return children;
}
