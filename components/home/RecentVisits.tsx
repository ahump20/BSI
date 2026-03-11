'use client';

import Link from 'next/link';
import { useRecentPages } from '@/lib/hooks/useRecentPages';

/**
 * "Pick up where you left off" — horizontal rail of recently visited pages.
 * Only renders if the user has visit history in localStorage.
 */
export function RecentVisits() {
  const pages = useRecentPages();

  // No history — don't render
  if (pages.length === 0) return null;

  return (
    <section className="py-4 px-4 sm:px-6 lg:px-8" aria-label="Recently visited pages">
      <div className="max-w-6xl mx-auto">
        <h2
          className="text-xs font-semibold uppercase tracking-widest mb-3"
          style={{ color: 'var(--bsi-dust)', fontFamily: 'var(--bsi-font-data)' }}
        >
          Pick up where you left off
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {pages.map((page) => (
            <Link
              key={page.path}
              href={page.path}
              className="heritage-card flex-shrink-0 px-4 py-3 transition-all duration-300 hover:-translate-y-0.5 group"
              style={{ borderLeft: '2px solid var(--bsi-primary)' }}
            >
              <span
                className="text-sm font-semibold uppercase tracking-wide whitespace-nowrap group-hover:text-[var(--bsi-primary)] transition-colors"
                style={{ color: 'var(--bsi-bone)', fontFamily: 'var(--bsi-font-display)' }}
              >
                {page.title}
              </span>
              <span
                className="block text-[10px] mt-0.5"
                style={{ color: 'var(--bsi-dust)', fontFamily: 'var(--bsi-font-data)' }}
              >
                {formatRecency(page.visitedAt)}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function formatRecency(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}
