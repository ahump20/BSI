import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Park Factors | College Baseball Savant | BSI',
  description:
    'Park-adjusted run factors for every D1 college baseball venue — runs, hits, and home run factors normalized across conferences and ballparks.',
  alternates: { canonical: '/college-baseball/savant/park-factors' },
};

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
