import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Search | Blaze Sports Intel',
  description: 'Search across all BSI content — teams, players, scores, standings, articles, and analytics across MLB, NFL, NBA, and NCAA.',
  alternates: { canonical: '/search' },
  openGraph: {
    title: 'Search | Blaze Sports Intel',
    description: 'Search all BSI sports content and analytics.',
  },
};

export default function SearchLayout({ children }: { children: ReactNode }) {
  return children;
}
