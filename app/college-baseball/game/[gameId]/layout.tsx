import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import GameLayoutClient, { useGameData, type CollegeGameData } from './GameLayoutClient';
import { cbbGameParams } from '@/lib/generate-static-params';
import { ogImage } from '@/lib/metadata';

// Re-export for child pages
export { useGameData, type CollegeGameData };

// Fetch real game IDs from the production Worker at build time.
// Falls back to placeholder on any network failure.
export async function generateStaticParams() {
  return cbbGameParams();
}

export const metadata: Metadata = {
  title: 'College Baseball Game | Box Score & Play-by-Play | BSI',
  description: 'Live box score, play-by-play, team stats, and game recap for NCAA Division I college baseball. Real-time updates from Blaze Sports Intel.',
  openGraph: {
    title: 'College Baseball Game | Blaze Sports Intel',
    description: 'Live box score, play-by-play, and game analysis.',
    images: ogImage('/images/og-college-baseball.png'),
  },
};

interface LayoutProps {
  children: ReactNode;
}

export default function CollegeGameLayout({ children }: LayoutProps) {
  return <GameLayoutClient>{children}</GameLayoutClient>;
}
