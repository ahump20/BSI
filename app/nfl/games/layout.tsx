import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'NFL Games This Week | Blaze Sports Intel',
  description: 'NFL weekly schedule with game times, matchups, spreads, and live score links for every game.',
  alternates: { canonical: '/nfl/games' },
  openGraph: {
    title: 'NFL Games This Week | Blaze Sports Intel',
    description: 'NFL weekly schedule and game matchups.',
   images: ogImage('/images/og-nfl.png') },
};

export default function NFLGamesLayout({ children }: { children: ReactNode }) {
  return children;
}
