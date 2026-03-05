import { DailyClient } from './DailyClient';
import type { Metadata } from 'next';

export const dynamicParams = false;

export async function generateStaticParams() {
  return [
    { date: '2026-02-14' },
    { date: '2026-02-13' },
  ];
}

export async function generateMetadata({ params }: { params: Promise<{ date: string }> }): Promise<Metadata> {
  const { date } = await params;
  return {
    title: `NCAA Baseball Daily — ${date} | Blaze Sports Intel`,
    description: `NCAA baseball daily report for ${date}. Pregame previews, odds, and last night's results.`,
    openGraph: {
      title: `NCAA Baseball Daily — ${date}`,
      description: `Pregame + recap for ${date}. Verified data, no invented stats.`,
    },
  };
}

export default async function DailyPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  return <DailyClient date={date} />;
}
