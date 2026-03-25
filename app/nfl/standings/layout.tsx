import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'NFL Standings | Blaze Sports Intel',
  description: 'Current NFL standings by division with win-loss records, conference standings, and playoff positioning.',
  alternates: { canonical: '/nfl/standings' },
  openGraph: {
    title: 'NFL Standings | Blaze Sports Intel',
    description: 'NFL division standings and playoff positioning.',
   images: ogImage('/images/og-nfl.png') },
  twitter: {
    card: 'summary_large_image',
    title: 'NFL Standings | Blaze Sports Intel',
    description: 'NFL division standings and playoff positioning.',
    images: ['/images/og-nfl.png'],
  },
};

export default function NFLStandingsLayout({ children }: { children: ReactNode }) {
  return children;
}
