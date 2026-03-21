import { PlayerDetailClient } from './PlayerDetailClient';

// Static export requires dynamicParams = false; real player IDs resolve
// at runtime via the Worker placeholder fallback pattern.
export const dynamicParams = false;

export async function generateStaticParams() {
  return [];
}

export default function PlayerDetailPage() {
  return <PlayerDetailClient />;
}
