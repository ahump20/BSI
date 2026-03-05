/**
 * BSI Social Intel — Twitter/X client via RapidAPI.
 *
 * Uses the Twitter v2 search endpoint proxied through RapidAPI,
 * which reuses the RAPIDAPI_KEY already bound across multiple BSI workers.
 *
 * Returns normalized RawPost objects ready for classification.
 */

import type { RawPost } from './types';

const RAPIDAPI_HOST = 'twitter-api45.p.rapidapi.com';
const RAPIDAPI_BASE = `https://${RAPIDAPI_HOST}`;
const FETCH_TIMEOUT = 10_000;
const MAX_RESULTS = 20;

// RapidAPI Twitter search response shape (subset)
interface TwitterTweet {
  tweet_id: string;
  text: string;
  author?: { screen_name?: string };
  created_at?: string;
  full_text?: string;
}

interface TwitterSearchResponse {
  timeline?: TwitterTweet[];
  results?: TwitterTweet[];
  data?: TwitterTweet[];
}

/**
 * Fetch recent tweets about college baseball from RapidAPI Twitter search.
 * Returns [] if RAPIDAPI_KEY is absent or the request fails — non-fatal.
 */
export async function fetchTwitterPosts(rapidApiKey: string | undefined): Promise<RawPost[]> {
  if (!rapidApiKey) {
    console.warn('[twitter] RAPIDAPI_KEY not set — skipping Twitter ingestion');
    return [];
  }

  const query = encodeURIComponent('college baseball (injury OR transfer OR commit OR roster OR lineup) -is:retweet lang:en');
  const url = `${RAPIDAPI_BASE}/search.php?query=${query}&count=${MAX_RESULTS}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const res = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      console.warn(`[twitter] HTTP ${res.status} from RapidAPI`);
      return [];
    }

    const body = (await res.json()) as TwitterSearchResponse;
    const tweets: TwitterTweet[] = body.timeline ?? body.results ?? body.data ?? [];

    return tweets.map((t): RawPost => ({
      platform: 'twitter',
      post_id: t.tweet_id ?? String(Math.random()), // fallback id if missing
      post_url: t.tweet_id ? `https://twitter.com/i/web/status/${t.tweet_id}` : null,
      post_text: (t.full_text ?? t.text ?? '').slice(0, 1000),
      author: t.author?.screen_name ?? null,
      posted_at: t.created_at ? new Date(t.created_at).toISOString() : new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('[twitter] fetch failed:', err instanceof Error ? err.message : err);
    return [];
  }
}
