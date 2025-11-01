/**
 * Player Clutch Performance Page
 *
 * Route: /players/:id/clutch
 */

import { ClutchPerformanceDashboard } from '@/components/clutch/ClutchPerformanceDashboard';

interface PageProps {
  params: { id: string };
  searchParams: { season?: string };
}

export default function PlayerClutchPage({ params, searchParams }: PageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <ClutchPerformanceDashboard
        playerId={params.id}
        season={searchParams.season}
      />
    </div>
  );
}

export const metadata = {
  title: 'Clutch Performance Analysis',
  description: 'Deep dive into player clutch performance with biometric context',
};
