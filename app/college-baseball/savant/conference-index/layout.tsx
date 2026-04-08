import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conference Strength Index | College Baseball Savant | BSI',
  description:
    'Conference-level strength rankings for D1 college baseball — strength index, average wOBA, ERA, inter-conference win percentage, and run environment.',
  alternates: { canonical: '/college-baseball/savant/conference-index' },
};

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
