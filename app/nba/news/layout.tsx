import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'NBA News | Blaze Sports Intel',
  description: 'Latest NBA news, trade rumors, free agency updates, and analysis from Blaze Sports Intel.',
  alternates: { canonical: '/nba/news' },
  openGraph: {
    title: 'NBA News | Blaze Sports Intel',
    description: 'NBA news, trade rumors, and free agency updates.',
  },
};

export default function NBANewsLayout({ children }: { children: ReactNode }) {
  return children;
}
