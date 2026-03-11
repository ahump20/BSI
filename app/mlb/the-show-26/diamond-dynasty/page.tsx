import type { Metadata } from 'next';
import { DiamondDynastyHubClient } from '@/components/mlb-the-show/DiamondDynastyHubClient';

export const metadata: Metadata = {
  title: 'Diamond Dynasty | MLB The Show 26 | Blaze Sports Intel',
  description:
    'Diamond Dynasty market command center with compatibility-mode official The Show sourcing, captain spotlight, collection routing, and card-market intelligence.',
};

export default function DiamondDynastyHubPage() {
  return <DiamondDynastyHubClient />;
}
