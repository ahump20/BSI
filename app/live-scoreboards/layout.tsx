import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Live Scoreboards | Blaze Sports Intel',
  description: 'Follow real-time scoreboards for MLB, NFL, NBA, and college baseball with source and timestamp attribution.',
  alternates: { canonical: '/live-scoreboards' },
};

export default function LiveScoreboardsLayout({ children }: { children: ReactNode }) {
  return children;
}
