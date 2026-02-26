import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'College Baseball | Blaze Sports Intel',
  description: 'NCAA Division I baseball scores, rankings, standings, team pages, and transfer portal tracking. Real-time college baseball analytics powered by BSI.',
  alternates: { canonical: '/college-baseball' },
  openGraph: { title: 'College Baseball | Blaze Sports Intel', description: 'NCAA baseball scores, rankings, and transfer portal.' },
};

export default function CollegeBaseballLayout({ children }: { children: ReactNode }) {
  return <div data-sport="college-baseball">{children}</div>;
}
