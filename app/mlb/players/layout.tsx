import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'MLB Players | Blaze Sports Intel',
  description: 'MLB player stats, profiles, and analytics with advanced sabermetrics and real-time performance data.',
  alternates: { canonical: '/mlb/players' },
  openGraph: {
    title: 'MLB Players | Blaze Sports Intel',
    description: 'MLB player stats and advanced sabermetrics.',
   images: ogImage('/images/og-mlb.png') },
  twitter: {
    card: 'summary_large_image',
    title: 'MLB Players | Blaze Sports Intel',
    description: 'MLB player stats and advanced sabermetrics.',
    images: ['/images/og-mlb.png'],
  },
};

export default function MLBPlayersLayout({ children }: { children: ReactNode }) {
  return children;
}
