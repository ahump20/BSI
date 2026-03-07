import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'MLB Standings 2026 | Blaze Sports Intel',
  description: 'Current MLB standings by division with win-loss records, games back, winning percentage, and wild card positioning.',
  alternates: { canonical: '/mlb/standings' },
  openGraph: {
    title: 'MLB Standings 2026 | Blaze Sports Intel',
    description: 'MLB division standings with records and wild card race.',
   images: ogImage('/images/og-mlb.png') },
};

export default function MLBStandingsLayout({ children }: { children: ReactNode }) {
  return children;
}
