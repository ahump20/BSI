import { DailyClient } from './DailyClient';
import type { Metadata } from 'next';

export const dynamicParams = false;

export async function generateStaticParams() {
  // Build a placeholder shell — real dates are handled client-side.
  // The worker serves this shell for any /college-baseball/daily/:date URL,
  // and DailyClient reads the actual date from window.location.
  return [{ date: 'placeholder' }];
}

export async function generateMetadata({ params }: { params: Promise<{ date: string }> }): Promise<Metadata> {
  const { date } = await params;
  const display = date === 'placeholder' ? 'Today' : date;
  return {
    title: `NCAA Baseball Daily — ${display} | Blaze Sports Intel`,
    description: `NCAA baseball daily report. Pregame previews, odds, and last night's results.`,
    openGraph: {
      title: `NCAA Baseball Daily — ${display}`,
      description: `Pregame + recap. Verified data, no invented stats.`,
    },
  };
}

export default async function DailyPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  return <DailyClient date={date} />;
}
