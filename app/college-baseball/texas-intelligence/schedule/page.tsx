import type { Metadata } from 'next';
import TexasScheduleClient from './TexasScheduleClient';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Texas Longhorns Schedule — Difficulty Heat Map | BSI',
  description:
    'Texas Longhorns 2026 baseball schedule with game results, upcoming opponents, and conference difficulty tracking.',
};

export default function TexasSchedulePage() {
  return <TexasScheduleClient />;
}
