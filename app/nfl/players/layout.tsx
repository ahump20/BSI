import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'NFL Players | Blaze Sports Intel',
  description: 'NFL player stats, profiles, and performance analytics with real-time data across all positions.',
  alternates: { canonical: '/nfl/players' },
  openGraph: {
    title: 'NFL Players | Blaze Sports Intel',
    description: 'NFL player stats and performance analytics.',
   images: ogImage('/images/og-nfl.png') },
};

export default function NFLPlayersLayout({ children }: { children: ReactNode }) {
  return children;
}
