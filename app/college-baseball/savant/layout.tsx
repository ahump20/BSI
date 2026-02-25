import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'College Baseball Savant | Advanced Analytics | Blaze Sports Intel',
  description:
    'Advanced sabermetric analytics for 300+ D1 college baseball programs. wOBA, FIP, wRC+, park factors, conference strength — the metrics MLB Savant tracks, applied to the college game for the first time.',
  alternates: { canonical: '/college-baseball/savant' },
  openGraph: {
    title: 'College Baseball Savant | Advanced Analytics',
    description:
      'Advanced sabermetric analytics for 300+ D1 programs. wOBA, FIP, wRC+, park factors, conference strength.',
  },
};

export default function SavantLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
