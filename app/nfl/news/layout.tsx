import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'NFL News | Blaze Sports Intel',
  description: 'Latest NFL news, trade rumors, injury reports, and analysis from Blaze Sports Intel.',
  alternates: { canonical: '/nfl/news' },
  openGraph: {
    title: 'NFL News | Blaze Sports Intel',
    description: 'NFL news, trade rumors, and injury updates.',
  },
};

export default function NFLNewsLayout({ children }: { children: ReactNode }) {
  return children;
}
