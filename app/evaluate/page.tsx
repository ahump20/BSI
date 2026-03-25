import type { Metadata } from 'next';
import EvaluateClient from './EvaluateClient';

export const metadata: Metadata = {
  title: 'Player Evaluation | Blaze Sports Intel',
  description:
    'Search and evaluate any player across college baseball, MLB, NFL, and NBA with percentile-based rankings. Compare players side-by-side with unified evaluation cards.',
  openGraph: {
    title: 'Player Evaluation | Blaze Sports Intel',
    description:
      'Cross-sport player evaluation with percentile rankings. Search any player, see where they rank, compare side-by-side.',
  },
  alternates: { canonical: '/evaluate' },
};

export default function EvaluatePage() {
  return <EvaluateClient />;
}
