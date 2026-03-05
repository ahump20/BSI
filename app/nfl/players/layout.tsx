import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'NFL Players | Blaze Sports Intel',
  description: 'NFL player stats, profiles, and performance analytics with real-time data across all positions.',
  alternates: { canonical: '/nfl/players' },
  openGraph: {
    title: 'NFL Players | Blaze Sports Intel',
    description: 'NFL player stats and performance analytics.',
  },
};

export default function NFLPlayersLayout({ children }: { children: ReactNode }) {
  return children;
}
