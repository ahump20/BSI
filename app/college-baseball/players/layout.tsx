import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ogImage } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'College Baseball Players | Blaze Sports Intel',
  description: 'Search 1,900+ NCAA Division I baseball players with advanced sabermetrics — wOBA, wRC+, FIP, ERA-, percentile rankings. Filter by conference, position, class year.',
  alternates: { canonical: '/college-baseball/players' },
  openGraph: {
    title: 'College Baseball Players | Blaze Sports Intel',
    description: 'Search 1,900+ D1 players with advanced sabermetrics — wOBA, wRC+, FIP, ERA-.',
   images: ogImage('/images/og-college-baseball.png') },
  twitter: {
    card: 'summary_large_image',
    title: 'College Baseball Players | Blaze Sports Intel',
    description: 'Search 1,900+ D1 players with advanced sabermetrics — wOBA, wRC+, FIP, ERA-.',
    images: ['/images/og-college-baseball.png'],
  },
};

export default function CollegeBaseballPlayersLayout({ children }: { children: ReactNode }) {
  return children;
}
