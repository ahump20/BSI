import type { Metadata } from 'next';
import { WinProbabilityClient } from './WinProbabilityClient';

export const metadata: Metadata = {
  title: 'Win Probability Model',
  description:
    'How BSI calculates real-time win probability — inputs, assumptions, validation, and failure modes.',
  alternates: { canonical: '/models/win-probability' },
};

export default function WinProbabilityPage() {
  return <WinProbabilityClient />;
}
