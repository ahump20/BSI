import { redirect } from 'next/navigation';

/**
 * /dashboard/intel → /intel redirect
 *
 * The intel dashboard has been consolidated to a single canonical route at /intel.
 * This redirect preserves any existing bookmarks or links to /dashboard/intel.
 */
export default function DashboardIntelRedirect() {
  redirect('/intel');
}
