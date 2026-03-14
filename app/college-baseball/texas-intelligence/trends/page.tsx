import type { Metadata } from 'next';
import TexasTrendsClient from './TexasTrendsClient';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Texas Performance Trends | BSI',
  description: 'Texas Longhorns hot/cold tracker — rolling averages, momentum metrics, and player streak analysis.',
  openGraph: {
    title: 'Texas Performance Trends | Blaze Sports Intel',
    description: 'Who is carrying the team right now? Rolling performance analysis for Texas baseball.',
    type: 'website',
  },
};

export default function TexasTrendsPage() {
  return <TexasTrendsClient />;
}
