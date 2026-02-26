import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'College Baseball Conferences | Blaze Sports Intel',
  description: 'NCAA Division I baseball conference pages with standings, team rosters, and conference schedules for SEC, Big 12, ACC, and all D1 conferences.',
  alternates: { canonical: '/college-baseball/conferences' },
  openGraph: {
    title: 'College Baseball Conferences | Blaze Sports Intel',
    description: 'D1 baseball conference standings and schedules.',
  },
};

export default function CollegeBaseballConferencesLayout({ children }: { children: ReactNode }) {
  return children;
}
