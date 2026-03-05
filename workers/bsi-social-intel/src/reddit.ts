/**
 * BSI Social Intel — Reddit client.
 *
 * Reads r/collegebaseball new posts via the public JSON API (no auth required).
 * Returns normalized RawPost objects ready for classification.
 */

import type { RawPost } from './types';

const REDDIT_BASE = 'https://www.reddit.com';
const SUBREDDIT = 'collegebaseball';
const FETCH_LIMIT = 25;
const FETCH_TIMEOUT = 10_000;

// Reddit JSON API post shape (subset)
interface RedditPost {
  data: {
    id: string;
    title: string;
    selftext: string;
    url: string;
    permalink: string;
    author: string;
    created_utc: number;
    score: number;
    num_comments: number;
  };
}

interface RedditListing {
  data: {
    children: RedditPost[];
  };
}

/**
 * Fetch the latest posts from r/collegebaseball.
 * Returns up to FETCH_LIMIT posts as RawPost objects.
 * Returns [] on any network or parse error — non-fatal, pipeline continues.
 */
export async function fetchRedditPosts(): Promise<RawPost[]> {
  const url = `${REDDIT_BASE}/r/${SUBREDDIT}/new.json?limit=${FETCH_LIMIT}&raw_json=1`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'BSI-Social-Intel/1.0 (college baseball analytics)',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      console.warn(`[reddit] HTTP ${res.status} fetching r/${SUBREDDIT}`);
      return [];
    }

    const listing = (await res.json()) as RedditListing;
    const children = listing.data?.children ?? [];

    return children.map((child): RawPost => {
      const d = child.data;
      // Combine title + selftext for richer classification signal
      const combined = d.selftext ? `${d.title}\n\n${d.selftext}` : d.title;
      return {
        platform: 'reddit',
        post_id: d.id,
        post_url: `${REDDIT_BASE}${d.permalink}`,
        post_text: combined.slice(0, 2000), // guard against wall-of-text posts
        author: d.author ?? null,
        posted_at: new Date(d.created_utc * 1000).toISOString(),
      };
    });
  } catch (err) {
    console.warn('[reddit] fetch failed:', err instanceof Error ? err.message : err);
    return [];
  }
}
