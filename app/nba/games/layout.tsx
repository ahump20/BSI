import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'NBA Games Tonight | Blaze Sports Intel',
  description: 'Tonight\'s NBA schedule with game times, matchups, and live score links for every game on the slate.',
  alternates: { canonical: '/nba/games' },
  openGraph: {
    title: 'NBA Games Tonight | Blaze Sports Intel',
    description: 'NBA daily schedule and live game matchups.',
  },
};

export default function NBAGamesLayout({ children }: { children: ReactNode }) {
  return children;
}
