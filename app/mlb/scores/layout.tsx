import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'MLB Scores Today | Blaze Sports Intel',
  description: 'Live MLB scores with real-time updates, box scores, and line scores for every game across the American and National Leagues.',
  alternates: { canonical: '/mlb/scores' },
  openGraph: {
    title: 'MLB Scores Today | Blaze Sports Intel',
    description: 'Live MLB scores with real-time box score updates.',
  },
};

export default function MLBScoresLayout({ children }: { children: ReactNode }) {
  return children;
}
