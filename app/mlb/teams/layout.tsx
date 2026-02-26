import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'MLB Teams | Blaze Sports Intel',
  description: 'All 30 MLB teams with rosters, schedules, stats, and team analytics across the American and National Leagues.',
  alternates: { canonical: '/mlb/teams' },
  openGraph: {
    title: 'MLB Teams | Blaze Sports Intel',
    description: 'MLB team pages with rosters, schedules, and stats.',
  },
};

export default function MLBTeamsLayout({ children }: { children: ReactNode }) {
  return children;
}
