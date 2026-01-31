import TeamStatsClient from './TeamStatsClient';
// Force static generation with dynamic params disabled
export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
  return [];
}

export default function TeamStatsPage() {
  return <TeamStatsClient />;
}
