import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'College Baseball Games | Blaze Sports Intel',
  description: 'Today\'s NCAA Division I baseball schedule with game times, matchups, and live score links across all D1 conferences.',
  alternates: { canonical: '/college-baseball/games' },
  openGraph: {
    title: 'College Baseball Games | Blaze Sports Intel',
    description: 'NCAA baseball schedule and game matchups.',
  },
};

export default function CollegeBaseballGamesLayout({ children }: { children: ReactNode }) {
  return children;
}
