import type { Metadata } from 'next';
import TexasNILClient from './TexasNILClient';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Texas Longhorns NIL Intelligence | BSI',
  description:
    'NIL valuations, WAR-to-NIL efficiency, and draft leverage analysis for Texas Longhorns baseball players.',
};

export default function TexasNILPage() {
  return <TexasNILClient />;
}
