'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'bsi-recent-pages';
const MAX_PAGES = 5;

export interface RecentPage {
  path: string;
  title: string;
  visitedAt: number;
}

/**
 * Reads the last 5 unique pages the user visited from localStorage.
 * Call `trackPage(path, title)` from layout or page components to record visits.
 */
export function useRecentPages() {
  const [pages, setPages] = useState<RecentPage[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as RecentPage[];
        if (Array.isArray(parsed)) {
          setPages(parsed.slice(0, MAX_PAGES));
        }
      }
    } catch { /* ignore */ }
  }, []);

  return pages;
}

/**
 * Record a page visit. Deduplicates by path, keeps most recent first.
 * Call this from pages/layouts — not from the rail component itself.
 */
export function trackPageVisit(path: string, title: string): void {
  if (typeof window === 'undefined') return;
  // Skip homepage — no value in "pick up where you left off" pointing home
  if (path === '/' || path === '') return;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let pages: RecentPage[] = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) pages = parsed;
    }

    // Remove existing entry for this path
    pages = pages.filter((p) => p.path !== path);

    // Prepend new visit
    pages.unshift({ path, title, visitedAt: Date.now() });

    // Trim to max
    pages = pages.slice(0, MAX_PAGES);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
  } catch { /* ignore */ }
}
