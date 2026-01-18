import { redirect } from 'next/navigation';

/**
 * Redirect /games to /scores
 * This handles legacy links and user expectations
 */
export default function GamesPage() {
  redirect('/scores');
}
