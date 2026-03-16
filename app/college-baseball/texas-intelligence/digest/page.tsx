import type { Metadata } from 'next';
import TexasDigestClient from './TexasDigestClient';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Weekly Intel Digest — Texas Longhorns Intelligence | BSI',
  description:
    'Weekly Texas Longhorns baseball summary — record, standout performers, upcoming series, and ranking movement.',
};

export default function TexasDigestPage() {
  return <TexasDigestClient />;
}
