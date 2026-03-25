'use client';

import dynamic from 'next/dynamic';

const SavantHubClient = dynamic(
  () => import('./SavantHubClient'),
  { ssr: false }
);

export default function SavantPage() {
  return <SavantHubClient />;
}
