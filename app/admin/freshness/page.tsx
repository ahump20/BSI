import type { Metadata } from 'next';
import FreshnessClient from './FreshnessClient';

export const metadata: Metadata = {
  title: 'Data Freshness | BSI Admin',
  description: 'Self-watching infrastructure dashboard — real-time freshness status for all BSI data pipelines.',
  robots: { index: false, follow: false },
};

export default function FreshnessPage() {
  return <FreshnessClient />;
}
