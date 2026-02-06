import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NFL | Blaze Sports Intel',
  description: 'Live NFL scores, standings, team rosters, and game stats. Real-time football analytics powered by BSI.',
  openGraph: { title: 'NFL | Blaze Sports Intel', description: 'Live NFL scores, standings, and analytics.' },
};

export default function NFLLayout({ children }: { children: ReactNode }) {
  return <div data-sport="nfl">{children}</div>;
}
