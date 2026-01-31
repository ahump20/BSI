/**
 * Transfer Portal Player Detail Page (Server Component)
 *
 * Server component wrapper that exports generateStaticParams for static export,
 * then renders the client component for interactivity.
 */

import PortalPlayerClient from './PortalPlayerClient';

// Return empty array — all player pages render client-side via fallback
export function generateStaticParams() {
  return [];
}

// Page metadata
export const metadata = {
  title: 'Player Profile | Transfer Portal | BSI',
  description: 'Detailed player profile, stats, and transfer timeline on Blaze Sports Intel.',
};

interface PageProps {
  params: Promise<{ playerId: string }>;
}

export default async function PortalPlayerPage({ params }: PageProps) {
  const { playerId } = await params;
  return <PortalPlayerClient playerId={playerId} />;
}
