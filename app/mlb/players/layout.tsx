import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'MLB Players | Blaze Sports Intel',
  description: 'MLB player stats, profiles, and analytics with advanced sabermetrics and real-time performance data.',
  alternates: { canonical: '/mlb/players' },
  openGraph: {
    title: 'MLB Players | Blaze Sports Intel',
    description: 'MLB player stats and advanced sabermetrics.',
  },
};

export default function MLBPlayersLayout({ children }: { children: ReactNode }) {
  return children;
}
