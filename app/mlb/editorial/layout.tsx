import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MLB Editorial | Blaze Sports Intel',
  description:
    'Season previews, division analysis, and long-form MLB coverage. The depth this sport has always deserved.',
  alternates: { canonical: '/mlb/editorial' },
  openGraph: {
    title: 'MLB Editorial | Blaze Sports Intel',
    description:
      'Season previews, division analysis, and long-form MLB coverage.',
  },
};

export default function MLBEditorialLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
