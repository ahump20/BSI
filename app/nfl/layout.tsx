import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NFL Analytics | BSI',
  description: 'NFL team stats, standings, and game analysis across all 32 teams.',
  openGraph: { title: 'NFL Analytics | BSI', description: 'NFL team stats, standings, and game analysis across all 32 teams.' },
};

export default function NFLLayout({ children }: { children: ReactNode }) {
  return <div data-sport="nfl">{children}</div>;
}
