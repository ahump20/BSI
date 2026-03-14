/**
 * Texas Intelligence — curated content sources for automated aggregation.
 *
 * Used by workers/handlers/texas-intel.ts to fetch YouTube videos,
 * parse RSS feeds, and reference social accounts for oEmbed rendering.
 */

// ─── YouTube Channels ───────────────────────────────────────────────────────

export interface YouTubeSource {
  channelId: string;
  name: string;
  priority: number;
}

export const YOUTUBE_SOURCES: YouTubeSource[] = [
  { channelId: 'UCLGHcS1H5kY7lPKIiGfNa5A', name: 'Texas Longhorns', priority: 1 },
  { channelId: 'UCVZiS9iCP7-QKFP5-cAuhAQ', name: 'SEC Network', priority: 2 },
  { channelId: 'UC6PYMxjg64gauFYLmNpBtiA', name: 'D1Baseball', priority: 3 },
  { channelId: 'UCjTL5bqLvvRckhIYS8H4bMw', name: 'NCAA', priority: 4 },
  { channelId: 'UCEgdi0XIYZVO0Kl_bXKbEMA', name: 'ESPN', priority: 5 },
];

export const YOUTUBE_SEARCH_QUERIES = [
  'Texas Longhorns baseball 2026',
  'Texas Longhorns baseball highlights',
  'Texas baseball SEC',
];

// ─── RSS Feeds ──────────────────────────────────────────────────────────────

export interface RSSSource {
  url: string;
  name: string;
  texasKeywords: string[];
}

export const RSS_SOURCES: RSSSource[] = [
  {
    url: 'https://texassports.com/sports/baseball/news?feed=rss_2.0',
    name: 'Texas Sports',
    texasKeywords: [], // All content is Texas-relevant
  },
  {
    url: 'https://d1baseball.com/feed/',
    name: 'D1Baseball',
    texasKeywords: ['texas', 'longhorns', 'schlossnagle', 'disch-falk'],
  },
  {
    url: 'https://www.baseballamerica.com/feed/',
    name: 'Baseball America',
    texasKeywords: ['texas', 'longhorns', 'schlossnagle'],
  },
  {
    url: 'https://www.espn.com/espn/rss/ncaa/baseball/news',
    name: 'ESPN College Baseball',
    texasKeywords: ['texas', 'longhorns'],
  },
];

// ─── Social Accounts (for oEmbed rendering) ─────────────────────────────────

export interface SocialAccount {
  platform: 'instagram' | 'tiktok';
  handle: string;
  name: string;
}

export const SOCIAL_ACCOUNTS: SocialAccount[] = [
  { platform: 'instagram', handle: 'texasbaseball', name: 'Texas Baseball' },
  { platform: 'instagram', handle: 'texaslonghorns', name: 'Texas Longhorns' },
  { platform: 'tiktok', handle: '@texaslonghorns', name: 'Texas Longhorns' },
  { platform: 'tiktok', handle: '@texasbaseball', name: 'Texas Baseball' },
];
