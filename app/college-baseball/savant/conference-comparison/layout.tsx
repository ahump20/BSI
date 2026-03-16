import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conference Comparison | College Baseball Savant | BSI',
  description:
    'Side-by-side conference metrics — strength index, wOBA, ERA, inter-conference win percentage — for any two D1 baseball conferences.',
  alternates: { canonical: '/college-baseball/savant/conference-comparison' },
};

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
