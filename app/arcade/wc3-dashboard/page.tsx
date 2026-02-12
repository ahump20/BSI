import { Metadata } from 'next';
import { WC3Dashboard } from '@/components/wc3-dashboard/WC3Dashboard';

export const metadata: Metadata = {
  title: 'BSI Command Center Dashboard | Blaze Sports Intel',
  description:
    'State-of-the-art cross-sport command center with live game cards, predictive analytics, standings snapshots, and intelligence feeds.',
};

export default function WC3DashboardPage() {
  return <WC3Dashboard />;
}
