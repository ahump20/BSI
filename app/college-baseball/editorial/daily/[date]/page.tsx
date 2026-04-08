import type { Metadata } from 'next';
import DailyEditorialClient from './DailyEditorialClient';
import { dailyEditorialDateParams } from '@/lib/generate-static-params';

export const dynamic = 'force-static';
export const dynamicParams = false;

// Pre-builds last 30 days of editorial dates (YYYY-MM-DD).
// No API call needed — dates are deterministic from build time.
export function generateStaticParams() {
  return dailyEditorialDateParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  return {
    title: `Daily Editorial — ${date} | College Baseball | BSI`,
    description: `College baseball daily editorial digest for ${date}. AI-powered analysis, key storylines, and takeaways from Blaze Sports Intel.`,
    alternates: { canonical: `/college-baseball/editorial/daily/${date}` },
    openGraph: {
      title: `Daily Editorial — ${date} | BSI`,
      description: `College baseball daily editorial digest for ${date}.`,
      type: 'article',
    },
  };
}

export default function DailyEditorialPage() {
  return <DailyEditorialClient />;
}
