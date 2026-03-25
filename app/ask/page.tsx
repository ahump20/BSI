import type { Metadata } from 'next';
import AskClient from './AskClient';

export const metadata: Metadata = {
  title: 'Ask BSI | Blaze Sports Intel',
  description:
    'Ask any sports question and get a real answer. Cross-sport AI concierge powered by live data across college baseball, MLB, NFL, and NBA.',
  openGraph: {
    title: 'Ask BSI | Blaze Sports Intel',
    description:
      'Cross-sport AI concierge. Ask about scores, standings, player stats, and advanced analytics — backed by live BSI data.',
  },
  alternates: { canonical: '/ask' },
};

export default function AskPage() {
  return <AskClient />;
}
