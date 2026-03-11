import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'MLB Stats | Blaze Sports Intel',
  description: 'MLB statistics leaderboards with batting, pitching, and fielding stats including advanced metrics and sabermetric analysis.',
  alternates: { canonical: '/mlb/stats' },
  openGraph: {
    title: 'MLB Stats | Blaze Sports Intel',
    description: 'MLB stat leaderboards and advanced metrics.',
   images: ogImage('/images/og-mlb.png') },
};

export default function MLBStatsLayout({ children }: { children: ReactNode }) {
  return children;
}
