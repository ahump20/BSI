import type { Metadata } from 'next';
import { DiamondDynastyCollectionsClient } from '@/components/mlb-the-show/DiamondDynastyCollectionsClient';

export const metadata: Metadata = {
  title: 'Diamond Dynasty Collections | MLB The Show 26 | Blaze Sports Intel',
  description:
    'Collection-aware Diamond Dynasty surface for series, set, and acquisition-location groupings with cost bands and card counts.',
};

export default function DiamondDynastyCollectionsPage() {
  return <DiamondDynastyCollectionsClient />;
}
