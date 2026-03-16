import type { Metadata } from 'next';
import TexasCompareClient from './TexasCompareClient';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Player Comparison — Texas Longhorns Intelligence | BSI',
  description:
    'Side-by-side player comparison for the Texas Longhorns roster. Compare sabermetric profiles, HAV-F composites, and season stats across any two players.',
};

export default function TexasComparePage() {
  return <TexasCompareClient />;
}
