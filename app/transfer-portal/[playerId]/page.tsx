/**
 * Transfer Portal Player Detail Page (Server Component)
 *
 * Server component wrapper that exports generateStaticParams for static export,
 * then renders the client component for interactivity.
 */

import PortalPlayerClient from './PortalPlayerClient';

// Required for static export with dynamic routes
export function generateStaticParams() {
  // Pre-generate pages for known player IDs (in production, fetch from D1)
  return [
    { playerId: 'bb-2025-001' },
    { playerId: 'bb-2025-002' },
    { playerId: 'bb-2025-003' },
    { playerId: 'bb-2025-004' },
    { playerId: 'bb-2025-005' },
    { playerId: 'bb-2025-006' },
    { playerId: 'bb-2025-007' },
    { playerId: 'bb-2025-008' },
    { playerId: 'bb-2025-009' },
    { playerId: 'bb-2025-010' },
    { playerId: 'cfb-2025-001' },
    { playerId: 'cfb-2025-002' },
    { playerId: 'cfb-2025-003' },
    { playerId: 'cfb-2025-004' },
    { playerId: 'cfb-2025-005' },
    { playerId: 'cfb-2025-006' },
    { playerId: 'cfb-2025-007' },
    { playerId: 'cfb-2025-008' },
  ];
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
