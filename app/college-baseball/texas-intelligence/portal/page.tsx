import type { Metadata } from 'next';
import TexasPortalClient from './TexasPortalClient';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Texas Transfer Portal Intelligence | BSI',
  description: 'Texas Longhorns transfer portal activity — incoming targets, departures, and roster impact analysis.',
  openGraph: {
    title: 'Texas Portal Intelligence | Blaze Sports Intel',
    description: 'Transfer portal intelligence for Texas Longhorns baseball.',
    type: 'website',
  },
};

export default function TexasPortalPage() {
  return <TexasPortalClient />;
}
