import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'MLB At-Bats | Blaze Sports Intel',
  description: 'MLB at-bat tracking and pitch-level analytics with plate appearance outcomes and matchup breakdowns.',
  alternates: { canonical: '/mlb/abs' },
  openGraph: {
    title: 'MLB At-Bats | Blaze Sports Intel',
    description: 'MLB pitch-level analytics and at-bat tracking.',
   images: ogImage('/images/og-mlb.png') },
};

export default function MLBAbsLayout({ children }: { children: ReactNode }) {
  return children;
}
