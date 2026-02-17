import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MLB Analytics | BSI',
  description: 'Live MLB standings, scores, player stats, and division breakdowns.',
  openGraph: { title: 'MLB Analytics | BSI', description: 'Live MLB standings, scores, player stats, and division breakdowns.' },
};

export default function MLBLayout({ children }: { children: ReactNode }) {
  return <div data-sport="mlb">{children}</div>;
}
