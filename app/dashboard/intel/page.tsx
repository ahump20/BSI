import { redirect } from 'next/navigation';

/**
 * /dashboard/intel is consolidated into /intel.
 * This page performs a permanent redirect so bookmarks and crawlers
 * follow the canonical route.
 */
export default function DashboardIntelRedirect() {
    redirect('/intel');
}
