import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Research | Blaze Sports Intel',
  description:
    'Original research and deep analysis on NIL valuation, college baseball economics, and the structural gaps in sports media coverage.',
};

export default function ResearchLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
