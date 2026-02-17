import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MLB | Blaze Sports Intel',
  description: 'Live MLB scores, standings, player stats, box scores, and advanced sabermetrics. Real-time baseball analytics powered by BSI.',
  openGraph: { title: 'MLB | Blaze Sports Intel', description: 'Live MLB scores, standings, and advanced analytics.' },
};

export default function MLBLayout({ children }: { children: ReactNode }) {
  return <div data-sport="mlb">{children}</div>;
}
