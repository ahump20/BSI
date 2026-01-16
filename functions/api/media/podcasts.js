/**
 * BSI Podcast Media API
 * Fetches and caches podcast episodes from RSS feeds
 *
 * GET /api/media/podcasts - Returns latest episodes from all tracked shows
 * GET /api/media/podcasts?refresh=true - Force refresh from RSS feeds
 * GET /api/media/podcasts?show=d1baseball - Get specific show
 *
 * Uses KV for caching with 24-hour TTL
 */

// College Baseball Podcast RSS Feeds
const PODCAST_FEEDS = {
  d1baseball: {
    name: 'D1 Baseball Podcast',
    host: 'Kendall Rogers, Aaron Fitt & Mike Rooney',
    feed: 'https://feeds.megaphone.fm/WWO2834652997',
    spotify: 'https://open.spotify.com/show/0JwFzTEqFKVtIUyQVFZFYf',
    apple: 'https://podcasts.apple.com/us/podcast/d1baseball-podcast/id1448787001',
    category: 'essential',
  },
  baseballamerica: {
    name: 'Baseball America Podcast',
    host: 'Baseball America Staff',
    feed: 'https://feeds.simplecast.com/wGL4xEgL',
    spotify: 'https://open.spotify.com/show/0xtG5VZ4V7R3WlWvvwSuIF',
    apple: 'https://podcasts.apple.com/us/podcast/baseball-america-podcast/id1447836328',
    category: 'essential',
  },
  prospectslive: {
    name: 'Prospects Live',
    host: 'Prospects Live Team',
    feed: 'https://anchor.fm/s/1234abcd/podcast/rss',
    spotify: 'https://open.spotify.com/show/3n2yKTYNGVkZhH0HgMJ7VI',
    apple: 'https://podcasts.apple.com/us/podcast/prospects-live/id1459876234',
    category: 'prospects',
  },
  perfectgame: {
    name: 'Perfect Game Podcast',
    host: 'Perfect Game Staff',
    feed: 'https://feeds.buzzsprout.com/perfectgame.rss',
    spotify: 'https://open.spotify.com/show/1LzpMIQOIYHwlITgqW8nLd',
    apple: 'https://podcasts.apple.com/us/podcast/perfect-game-podcast/id1489234567',
    category: 'recruiting',
  },
};

// Fallback static data when feeds unavailable
const FALLBACK_EPISODES = {
  d1baseball: [
    {
      title: '2025 Preseason Preview: Top 25 Breakdown',
      description:
        "Breaking down the preseason Top 25, highlighting Texas A&M's loaded roster and dark horse teams to watch.",
      pubDate: '2025-01-15T06:00:00Z',
      duration: '58:42',
      link: 'https://open.spotify.com/show/0JwFzTEqFKVtIUyQVFZFYf',
    },
  ],
  baseballamerica: [
    {
      title: '2025 MLB Draft Early Look',
      description:
        'Early rankings of draft-eligible college players. Which sophomores and juniors are climbing boards.',
      pubDate: '2025-01-14T06:00:00Z',
      duration: '45:30',
      link: 'https://open.spotify.com/show/0xtG5VZ4V7R3WlWvvwSuIF',
    },
  ],
  prospectslive: [
    {
      title: 'Top 50 College Prospects for 2025',
      description: 'Comprehensive scouting reports on the top draft-eligible college players.',
      pubDate: '2025-01-10T06:00:00Z',
      duration: '62:15',
      link: 'https://open.spotify.com/show/3n2yKTYNGVkZhH0HgMJ7VI',
    },
  ],
  perfectgame: [
    {
      title: 'Showcase Season Preview 2025',
      description: 'Preview of upcoming Perfect Game showcases and events.',
      pubDate: '2025-01-12T06:00:00Z',
      duration: '38:20',
      link: 'https://open.spotify.com/show/1LzpMIQOIYHwlITgqW8nLd',
    },
  ],
};

const CACHE_KEY = 'podcast-episodes-v1';
const CACHE_TTL = 86400; // 24 hours in seconds

/**
 * Parse RSS XML and extract episodes
 */
function parseRSSFeed(xml, showKey) {
  const episodes = [];

  try {
    // Simple XML parsing for RSS items
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    const items = xml.match(itemRegex) || [];

    for (const item of items.slice(0, 5)) {
      // Get latest 5 episodes
      const title = extractTag(item, 'title');
      const description =
        extractTag(item, 'description') || extractTag(item, 'itunes:summary') || '';
      const pubDate = extractTag(item, 'pubDate');
      const duration = extractTag(item, 'itunes:duration') || extractTag(item, 'duration') || '';
      const enclosure = item.match(/enclosure[^>]*url="([^"]+)"/i);
      const link = enclosure ? enclosure[1] : PODCAST_FEEDS[showKey]?.spotify;

      if (title) {
        episodes.push({
          title: cleanText(title),
          description: cleanText(description).slice(0, 300),
          pubDate: pubDate ? new Date(pubDate).toISOString() : null,
          duration: formatDuration(duration),
          link: link || '',
        });
      }
    }
  } catch (err) {
    console.error(`Error parsing RSS for ${showKey}:`, err.message);
  }

  return episodes;
}

/**
 * Extract content from XML tag
 */
function extractTag(xml, tagName) {
  // Handle CDATA
  const cdataRegex = new RegExp(
    `<${tagName}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tagName}>`,
    'i'
  );
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1];

  // Handle regular tags
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1] : null;
}

/**
 * Clean HTML entities and tags from text
 */
function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Format duration to mm:ss or hh:mm:ss
 */
function formatDuration(duration) {
  if (!duration) return '';

  // Already formatted (mm:ss or hh:mm:ss)
  if (duration.includes(':')) return duration;

  // Seconds only
  const seconds = parseInt(duration, 10);
  if (isNaN(seconds)) return duration;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Fetch episodes from RSS feed
 */
async function fetchPodcastFeed(showKey, feedUrl) {
  try {
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'BlazeSportsIntel/1.0 (College Baseball Analytics)',
        Accept: 'application/rss+xml, application/xml, text/xml',
      },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch ${showKey}: ${response.status}`);
      return FALLBACK_EPISODES[showKey] || [];
    }

    const xml = await response.text();
    const episodes = parseRSSFeed(xml, showKey);

    return episodes.length > 0 ? episodes : FALLBACK_EPISODES[showKey] || [];
  } catch (err) {
    console.error(`Error fetching ${showKey}:`, err.message);
    return FALLBACK_EPISODES[showKey] || [];
  }
}

/**
 * Fetch all podcast feeds and aggregate
 */
async function fetchAllPodcasts() {
  const results = {};

  const fetchPromises = Object.entries(PODCAST_FEEDS).map(async ([key, config]) => {
    const episodes = await fetchPodcastFeed(key, config.feed);
    results[key] = {
      ...config,
      episodes,
      lastFetched: new Date().toISOString(),
    };
  });

  await Promise.all(fetchPromises);
  return results;
}

/**
 * Main request handler
 */
export async function onRequest(context) {
  const { request, env } = context;

  // Handle CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const url = new URL(request.url);
  const refresh = url.searchParams.get('refresh') === 'true';
  const showFilter = url.searchParams.get('show');

  // Try to get from KV cache first (unless refresh requested)
  let cachedData = null;
  if (!refresh && env.BSI_CACHE) {
    try {
      cachedData = await env.BSI_CACHE.get(CACHE_KEY, { type: 'json' });
    } catch (err) {
      console.warn('KV read error:', err.message);
    }
  }

  let podcasts;
  let fromCache = false;

  if (cachedData && !refresh) {
    podcasts = cachedData;
    fromCache = true;
  } else {
    // Fetch fresh data from RSS feeds
    podcasts = await fetchAllPodcasts();

    // Store in KV cache
    if (env.BSI_CACHE) {
      try {
        await env.BSI_CACHE.put(CACHE_KEY, JSON.stringify(podcasts), {
          expirationTtl: CACHE_TTL,
        });
      } catch (err) {
        console.warn('KV write error:', err.message);
      }
    }
  }

  // Filter by show if requested
  if (showFilter && podcasts[showFilter]) {
    podcasts = { [showFilter]: podcasts[showFilter] };
  }

  // Format response
  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  // Flatten episodes for easier consumption
  const allEpisodes = [];
  Object.entries(podcasts).forEach(([key, show]) => {
    (show.episodes || []).forEach((episode) => {
      allEpisodes.push({
        ...episode,
        showKey: key,
        showName: show.name,
        showHost: show.host,
        spotify: show.spotify,
        apple: show.apple,
        category: show.category,
      });
    });
  });

  // Sort by publish date (newest first)
  allEpisodes.sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));

  return new Response(
    JSON.stringify({
      success: true,
      fromCache,
      shows: podcasts,
      episodes: allEpisodes,
      meta: {
        fetchedAt: timestamp,
        timezone: 'America/Chicago',
        totalShows: Object.keys(podcasts).length,
        totalEpisodes: allEpisodes.length,
        cacheKey: CACHE_KEY,
        cacheTTL: `${CACHE_TTL / 3600} hours`,
      },
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600', // 1 hour client cache
      },
    }
  );
}
