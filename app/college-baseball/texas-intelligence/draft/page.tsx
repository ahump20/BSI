import type { Metadata } from 'next';
import TexasDraftClient from './TexasDraftClient';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Texas Draft Board & Pro Pipeline | BSI',
  description: 'Texas Longhorns baseball draft projections — HAV-F evaluations, draft tier rankings, and prospect analysis.',
  openGraph: {
    title: 'Texas Draft Board | Blaze Sports Intel',
    description: 'Draft-eligible Texas Longhorns ranked by HAV-F composite score.',
    type: 'website',
  },
};

export default function TexasDraftPage() {
  return <TexasDraftClient />;
}
