import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'NFL Teams | Blaze Sports Intel',
  description: 'All 32 NFL teams with rosters, schedules, stats, and analytics across the AFC and NFC.',
  alternates: { canonical: '/nfl/teams' },
  openGraph: {
    title: 'NFL Teams | Blaze Sports Intel',
    description: 'NFL team pages with rosters, schedules, and stats.',
  },
};

export default function NFLTeamsLayout({ children }: { children: ReactNode }) {
  return children;
}
