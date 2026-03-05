import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'College Baseball Teams | Blaze Sports Intel',
  description: 'Browse all NCAA Division I baseball programs with team pages, rosters, schedules, and season stats.',
  alternates: { canonical: '/college-baseball/teams' },
  openGraph: {
    title: 'College Baseball Teams | Blaze Sports Intel',
    description: 'All D1 baseball team pages with rosters and stats.',
  },
};

export default function CollegeBaseballTeamsLayout({ children }: { children: ReactNode }) {
  return children;
}
