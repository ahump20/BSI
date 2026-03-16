import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { ogImage } from '@/lib/metadata';
import { SavantSubNav } from '@/components/analytics/SavantSubNav';

export const metadata: Metadata = {
  title: 'College Baseball Savant | Free Park-Adjusted Sabermetrics | BSI',
  description:
    'Free park-adjusted sabermetrics for 300+ D1 college baseball programs. wOBA, wRC+, FIP, park factors, conference strength index — updated every 6 hours. The only public Baseball Savant equivalent for college baseball.',
  alternates: { canonical: '/college-baseball/savant' },
  openGraph: {
    title: 'College Baseball Savant | Free Park-Adjusted Sabermetrics',
    description:
      'Free park-adjusted wOBA, wRC+, FIP, park factors, and conference strength for 300+ D1 programs. Updated every 6 hours.',
    images: ogImage('/images/og-college-baseball.png'),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'College Baseball Savant | Free Park-Adjusted Sabermetrics',
    description:
      'Free park-adjusted wOBA, wRC+, FIP, park factors, and conference strength for 300+ D1 programs. Updated every 6 hours.',
    images: ['/images/og-college-baseball.png'],
  },
};

export default function SavantLayout({ children }: { children: ReactNode }) {
  return (
    <div className="savant-theme">
      <SavantSubNav />
      {children}
    </div>
  );
}
