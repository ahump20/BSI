import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Team Comparison | College Baseball Savant | BSI',
  description:
    'Compare advanced metrics (wOBA, wRC+, FIP, ERA, K/9, BB/9) between any two D1 college baseball programs side-by-side.',
  alternates: { canonical: '/college-baseball/savant/team-compare' },
};

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
