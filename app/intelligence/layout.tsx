import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Intelligence Hub | BSI',
  description:
    'AI-powered sports intelligence — pregame breakdowns, live analysis, and postgame insights across college baseball, MLB, NFL, and college football.',
  openGraph: {
    title: 'Intelligence Hub | BSI',
    description: 'AI-powered sports analysis and pregame intelligence.',
  },
};

export default function IntelligenceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
