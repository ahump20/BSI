import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'College Baseball Preseason | Blaze Sports Intel',
  description: 'College baseball preseason previews, Power 25 rankings, conference breakdowns, and rivalry matchup analysis for the upcoming NCAA season.',
  alternates: { canonical: '/college-baseball/preseason' },
  openGraph: {
    title: 'College Baseball Preseason | Blaze Sports Intel',
    description: 'Preseason college baseball previews and rankings.',
  },
};

export default function CollegeBaseballPreseasonLayout({ children }: { children: ReactNode }) {
  return children;
}
