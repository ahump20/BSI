import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Texas Week 2 Recap: The Cycle, The Shutout, The Statement | Blaze Sports Intel',
  description:
    'Texas swept Michigan State 3-0 at UFCU Disch-Falk Field to open 8-0. Robbins hit for the cycle (first Longhorn since 2015). Riojas struck out 10 in Game 1. Volantis threw a complete-game shutout. Full box scores and analysis.',
  openGraph: {
    title: 'Texas Week 2 Recap: Sweep of Michigan State | Blaze Sports Intel',
    description:
      'Robbins hit for the cycle. Riojas fanned 10. Volantis threw a shutout. Texas is 8-0. The complete three-game breakdown.',
    type: 'article',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
