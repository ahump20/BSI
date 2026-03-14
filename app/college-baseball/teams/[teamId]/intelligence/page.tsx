import { redirect } from 'next/navigation';

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ teamId: 'texas' }];
}

export async function generateMetadata({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const titles: Record<string, string> = {
    texas: 'Texas Longhorns — Program Intelligence | BSI',
  };
  return {
    title: titles[teamId] || `${teamId} — Program Intelligence | BSI`,
    description: 'Deep program analytics with live-computed sabermetrics, conference positioning, and roster intelligence.',
  };
}

export default async function IntelligencePage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;

  // Texas has a dedicated hub — redirect there
  if (teamId === 'texas') {
    redirect('/college-baseball/texas-intelligence/');
  }

  // Future teams would render a generic intelligence client here
  return null;
}
