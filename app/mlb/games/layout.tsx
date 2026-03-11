import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'MLB Games Today | Blaze Sports Intel',
  description: 'Today\'s MLB schedule with game times, probable pitchers, matchup previews, and live score links.',
  alternates: { canonical: '/mlb/games' },
  openGraph: {
    title: 'MLB Games Today | Blaze Sports Intel',
    description: 'MLB daily schedule with matchups and game times.',
   images: ogImage('/images/og-mlb.png') },
};

export default function MLBGamesLayout({ children }: { children: ReactNode }) {
  return children;
}
