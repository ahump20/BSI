import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'College Baseball Players | Blaze Sports Intel',
  description: 'NCAA Division I baseball player directory with stats, positions, and team affiliations across all D1 programs.',
  alternates: { canonical: '/college-baseball/players' },
  openGraph: {
    title: 'College Baseball Players | Blaze Sports Intel',
    description: 'D1 college baseball player stats and profiles.',
  },
};

export default function CollegeBaseballPlayersLayout({ children }: { children: ReactNode }) {
  return children;
}
