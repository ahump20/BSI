import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'College Baseball Standings | Blaze Sports Intel',
  description: 'NCAA Division I baseball conference standings with win-loss records, conference records, and RPI rankings updated daily.',
  alternates: { canonical: '/college-baseball/standings' },
  openGraph: {
    title: 'College Baseball Standings | Blaze Sports Intel',
    description: 'D1 baseball conference standings updated daily.',
   images: ogImage('/images/og-college-baseball.png') },
};

export default function CollegeBaseballStandingsLayout({ children }: { children: ReactNode }) {
  return children;
}
