import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'MLB News | Blaze Sports Intel',
  description: 'Latest MLB news, trade rumors, free agency updates, and analysis from Blaze Sports Intel.',
  alternates: { canonical: '/mlb/news' },
  openGraph: {
    title: 'MLB News | Blaze Sports Intel',
    description: 'MLB news, trade rumors, and free agency updates.',
  },
};

export default function MLBNewsLayout({ children }: { children: ReactNode }) {
  return children;
}
