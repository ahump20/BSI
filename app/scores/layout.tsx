import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Scores | BSI',
  description: 'Cross-sport live scoreboard.',
  openGraph: { title: 'Live Scores | BSI', description: 'Cross-sport live scoreboard.' },
};

export default function ScoresLayout({ children }: { children: ReactNode }) {
  return <div data-page="scores">{children}</div>;
}
