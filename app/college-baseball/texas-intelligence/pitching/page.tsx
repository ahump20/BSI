import type { Metadata } from 'next';
import TexasPitchingClient from './TexasPitchingClient';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Texas Longhorns Pitching Staff | BSI',
  description:
    'Texas Longhorns pitching staff breakdown with ERA, WHIP, K/9, workload tracking, and rotation vs bullpen splits.',
};

export default function TexasPitchingPage() {
  return <TexasPitchingClient />;
}
