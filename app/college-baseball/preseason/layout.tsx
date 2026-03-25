import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'College Baseball Preseason | Blaze Sports Intel',
  description: 'College baseball preseason previews, Power 25 rankings, conference breakdowns, and rivalry matchup analysis for the upcoming NCAA season.',
  alternates: { canonical: '/college-baseball/preseason' },
  openGraph: {
    title: 'College Baseball Preseason | Blaze Sports Intel',
    description: 'Preseason college baseball previews and rankings.',
   images: ogImage('/images/og-college-baseball.png') },
  twitter: {
    card: 'summary_large_image',
    title: 'College Baseball Preseason | Blaze Sports Intel',
    description: 'Preseason college baseball previews and rankings.',
    images: ['/images/og-college-baseball.png'],
  },
};

export default function CollegeBaseballPreseasonLayout({ children }: { children: ReactNode }) {
  return children;
}
