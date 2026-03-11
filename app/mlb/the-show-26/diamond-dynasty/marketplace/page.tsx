import type { Metadata } from 'next';
import { DiamondDynastyMarketplaceClient } from '@/components/mlb-the-show/DiamondDynastyMarketplaceClient';

export const metadata: Metadata = {
  title: 'Diamond Dynasty Marketplace | MLB The Show 26 | Blaze Sports Intel',
  description:
    'Searchable MLB The Show 26 Diamond Dynasty marketplace tracker with card filters, WBC-aware views, and live buy/sell pricing when sourceable.',
};

export default function DiamondDynastyMarketplacePage() {
  return <DiamondDynastyMarketplaceClient />;
}
