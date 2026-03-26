import type { Metadata } from 'next';
import WeeklyPulseClient from './WeeklyPulseClient';

export const metadata: Metadata = {
  title: 'Weekly Pulse | College Baseball | Blaze Sports Intel',
  description:
    'This week in college baseball — top performers, biggest movers, and conference trends. Computed from BSI Savant advanced metrics.',
  openGraph: {
    title: 'Weekly Pulse | College Baseball',
    description:
      'BSI computes the week\'s top performers and biggest statistical movers from its own sabermetric engine.',
  },
  alternates: { canonical: '/college-baseball/weekly-pulse' },
};

export default function WeeklyPulsePage() {
  return <WeeklyPulseClient />;
}
