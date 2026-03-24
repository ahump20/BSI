import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'MLB Teams | Blaze Sports Intel',
  description: 'All 30 MLB teams with rosters, schedules, stats, and team analytics across the American and National Leagues.',
  alternates: { canonical: '/mlb/teams' },
  openGraph: {
    title: 'MLB Teams | Blaze Sports Intel',
    description: 'MLB team pages with rosters, schedules, and stats.',
   images: ogImage('/images/og-mlb.png') },
  twitter: {
    card: 'summary_large_image',
    title: 'MLB Teams | Blaze Sports Intel',
    description: 'MLB team pages with rosters, schedules, and stats.',
    images: ['/images/og-mlb.png'],
  },
};

export default function MLBTeamsLayout({ children }: { children: ReactNode }) {
  return children;
}
