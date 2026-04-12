import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'College Baseball Savant | The Public Baseball Savant for College | BSI',
  description:
    'The depth scouts and front offices use, free and public. Park-adjusted wOBA, wRC+, FIP, park factors, and conference strength index for every D1 program — built because the audience deserved it and nobody else was going to.',
  alternates: { canonical: '/college-baseball/savant' },
  openGraph: {
    title: 'College Baseball Savant | The Public Baseball Savant for College',
    description:
      'Park-adjusted wOBA, wRC+, FIP, park factors, and conference strength for every D1 program. Built for the fans nobody built for.',
    images: ogImage('/images/og-college-baseball.png'),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'College Baseball Savant | The Public Baseball Savant for College',
    description:
      'Park-adjusted wOBA, wRC+, FIP, park factors, and conference strength for every D1 program. Built for the fans nobody built for.',
    images: ['/images/og-college-baseball.png'],
  },
};

export default function SavantLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
