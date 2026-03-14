import { buildMeta, cachedJson, cachedPayloadHeaders, kvGet, kvPut } from '../shared/helpers';
import type { Env } from '../shared/types';

interface RSSItem {
  title?: string;
  description?: string;
  pubDate?: string;
  'itunes:duration'?: string;
  enclosure?: { '@_url'?: string; '@_type'?: string };
  link?: string;
  'itunes:author'?: string;
}

interface PodcastShow {
  key: string;
  name: string;
  host: string;
  feedUrl: string;
  website?: string;
  spotify?: string;
  apple?: string;
  category?: string;
}

type FeedSourceStatus = 'live' | 'empty' | 'degraded';

interface NormalizedEpisode {
  title: string;
  description: string;
  pubDate: string | null;
  duration: string;
  audioUrl: string;
  link: string;
  showKey: string;
  showName: string;
  showHost: string;
  spotify?: string;
  apple?: string;
  category?: string;
}

interface RSSChannelMeta {
  title?: string;
  lastBuildDate?: string;
}

interface PodcastSourceState {
  key: string;
  name: string;
  host: string;
  feedUrl: string;
  website?: string;
  spotify?: string;
  apple?: string;
  category?: string;
  status: FeedSourceStatus;
  totalEpisodes: number;
  channelTitle?: string;
  lastBuildDate?: string;
  message: string;
}

interface ShowFetchResult {
  episodes: NormalizedEpisode[];
  source: PodcastSourceState;
}

interface PodcastFeedResult {
  episodes: NormalizedEpisode[];
  sources: PodcastSourceState[];
  laneStatus: FeedSourceStatus;
  liveAudioAvailable: boolean;
  responsiveShows: number;
  liveShows: number;
  emptyShows: number;
  degradedShows: number;
  statusMessage: string;
}

const PODCAST_SHOWS: PodcastShow[] = [
  {
    key: 'd1baseball',
    name: 'The D1Baseball Podcast',
    host: 'D1Baseball',
    feedUrl: 'https://rss.art19.com/d1baseball',
    website: 'https://www.art19.com/shows/d1baseball',
    spotify: 'https://open.spotify.com/show/2Nx9Zf6UVZeZ7QZM3Or4L8',
    apple: 'https://podcasts.apple.com/us/podcast/the-d1baseball-podcast/id959621656',
    category: 'College Baseball',
  },
  {
    key: 'baseball-america',
    name: 'Baseball America',
    host: 'Baseball America',
    feedUrl: 'https://feeds.redcircle.com/54051e90-c6e1-43ac-9a01-4c8fc92bc79d',
    website: 'https://redcircle.com/shows/54051e90-c6e1-43ac-9a01-4c8fc92bc79d',
    apple: 'https://podcasts.apple.com/us/podcast/baseball-america/id1361685817',
    category: 'Baseball Media',
  },
  {
    key: '11point7',
    name: '11Point7: The College Baseball Podcast',
    host: '11Point7',
    feedUrl: 'https://feed.podbean.com/elevenpointseven/feed.xml',
    website: 'https://elevenpointseven.podbean.com/',
    apple: 'https://podcasts.apple.com/us/podcast/11point7-the-college-baseball-podcast/id1452000247',
    category: 'College Baseball',
  },
];

const CACHE_KEY = 'bsi:media:podcasts:v4';
const CACHE_TTL_SECONDS = 900;

function stripHtml(input: string): string {
  return decodeHtmlEntities(input.replace(/<[^>]*>/g, '').trim());
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&#x([0-9a-f]+);/gi, (_, value: string) => String.fromCodePoint(parseInt(value, 16)))
    .replace(/&#(\d+);/g, (_, value: string) => String.fromCodePoint(parseInt(value, 10)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function extractTagValue(source: string, tag: string): string | undefined {
  const tagMatch = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i').exec(source);
  if (!tagMatch) return undefined;

  const rawValue = tagMatch[1]?.trim();
  if (!rawValue) return undefined;

  const cdataMatch = /^<!\[CDATA\[([\s\S]*?)\]\]>$/i.exec(rawValue);
  const value = cdataMatch ? cdataMatch[1] : rawValue;
  return decodeHtmlEntities(value.trim());
}

function parseDuration(raw: string | undefined): string {
  if (!raw) return '00:00';
  if (/^\d+$/.test(raw)) {
    const totalSeconds = parseInt(raw, 10);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return raw;
}

function getSourceMessage(status: FeedSourceStatus, totalEpisodes: number): string {
  if (status === 'live') {
    return `${totalEpisodes} external episode${totalEpisodes === 1 ? ' is' : 's are'} live through the verified market feed lane.`;
  }
  if (status === 'empty') {
    return 'Configured market podcast feeds responded, but no public episodes were exposed.';
  }
  return 'Configured market podcast feeds did not return usable feed data.';
}

function extractChannelMeta(xml: string): RSSChannelMeta {
  const channelMatch = /<channel>([\s\S]*?)<\/channel>/i.exec(xml);
  const channelBody = channelMatch?.[1] ?? xml;

  return {
    title: extractTagValue(channelBody, 'title'),
    lastBuildDate: extractTagValue(channelBody, 'lastBuildDate'),
  };
}

function extractItemsFromXml(xml: string): RSSItem[] {
  const items: RSSItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const enclosureMatch = /<enclosure[^>]*url=["']([^"']+)["'][^>]*>/i.exec(block);

    items.push({
      title: extractTagValue(block, 'title'),
      description: extractTagValue(block, 'description') ?? extractTagValue(block, 'itunes:summary'),
      pubDate: extractTagValue(block, 'pubDate'),
      'itunes:duration': extractTagValue(block, 'itunes:duration'),
      enclosure: enclosureMatch ? { '@_url': enclosureMatch[1] } : undefined,
      link: extractTagValue(block, 'link'),
      'itunes:author': extractTagValue(block, 'itunes:author'),
    });
  }

  return items;
}

async function fetchShowData(show: PodcastShow): Promise<ShowFetchResult> {
  try {
    const response = await fetch(show.feedUrl, {
      headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
      cf: { cacheTtl: 600 },
    });

    if (!response.ok) {
      return {
        episodes: [],
        source: {
          key: show.key,
          name: show.name,
          host: show.host,
          feedUrl: show.feedUrl,
          website: show.website,
          spotify: show.spotify,
          apple: show.apple,
          category: show.category,
          status: 'degraded',
          totalEpisodes: 0,
          message: `Feed request failed with HTTP ${response.status}.`,
        },
      };
    }

    const xml = await response.text();
    const items = extractItemsFromXml(xml);
    const channel = extractChannelMeta(xml);
    const episodes = items.map((item): NormalizedEpisode => ({
      title: item.title ?? 'Untitled Episode',
      description: stripHtml(item.description ?? ''),
      pubDate: item.pubDate ?? null,
      duration: parseDuration(item['itunes:duration']),
      audioUrl: item.enclosure?.['@_url'] ?? '',
      link: item.link ?? show.website ?? show.apple ?? show.spotify ?? show.feedUrl,
      showKey: show.key,
      showName: show.name,
      showHost: show.host,
      spotify: show.spotify,
      apple: show.apple,
      category: show.category,
    }));
    const status: FeedSourceStatus = episodes.length > 0 ? 'live' : 'empty';

    return {
      episodes,
      source: {
        key: show.key,
        name: show.name,
        host: show.host,
        feedUrl: show.feedUrl,
        website: show.website,
        spotify: show.spotify,
        apple: show.apple,
        category: show.category,
        status,
        totalEpisodes: episodes.length,
        channelTitle: channel.title,
        lastBuildDate: channel.lastBuildDate,
        message: getSourceMessage(status, episodes.length),
      },
    };
  } catch {
    return {
      episodes: [],
      source: {
        key: show.key,
        name: show.name,
        host: show.host,
        feedUrl: show.feedUrl,
        website: show.website,
        spotify: show.spotify,
        apple: show.apple,
        category: show.category,
        status: 'degraded',
        totalEpisodes: 0,
        message: 'Configured market podcast feeds did not return usable feed data.',
      },
    };
  }
}

async function fetchAllEpisodes(): Promise<PodcastFeedResult> {
  const results = await Promise.allSettled(PODCAST_SHOWS.map((show) => fetchShowData(show)));

  const episodes: NormalizedEpisode[] = [];
  const sources: PodcastSourceState[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      episodes.push(...result.value.episodes);
      sources.push(result.value.source);
      continue;
    }

    sources.push({
      key: 'unknown',
      name: 'Unknown source',
      host: 'BSI Network',
      feedUrl: '',
      status: 'degraded',
      totalEpisodes: 0,
      message: 'Configured market podcast feeds did not return usable feed data.',
    });
  }

  episodes.sort((a, b) => {
    const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return dateB - dateA;
  });

  const liveShows = sources.filter((source) => source.status === 'live').length;
  const emptyShows = sources.filter((source) => source.status === 'empty').length;
  const degradedShows = sources.filter((source) => source.status === 'degraded').length;
  const responsiveShows = sources.length - degradedShows;
  const laneStatus: FeedSourceStatus = liveShows > 0 ? 'live' : emptyShows > 0 ? 'empty' : 'degraded';

  return {
    episodes,
    sources,
    laneStatus,
    liveAudioAvailable: episodes.length > 0,
    responsiveShows,
    liveShows,
    emptyShows,
    degradedShows,
    statusMessage: getSourceMessage(laneStatus, episodes.length),
  };
}

export async function handlePodcasts(env: Env): Promise<Response> {
  const cached = await kvGet<Record<string, unknown>>(env.KV, CACHE_KEY);
  if (cached) {
    return cachedJson(cached, 200, CACHE_TTL_SECONDS, cachedPayloadHeaders(cached));
  }

  const feedResult = await fetchAllEpisodes();
  const payload = {
    success: true,
    fromCache: false,
    episodes: feedResult.episodes,
    sources: feedResult.sources,
    meta: {
      ...buildMeta('bsi-media-podcasts'),
      totalShows: PODCAST_SHOWS.length,
      totalEpisodes: feedResult.episodes.length,
      responsiveShows: feedResult.responsiveShows,
      liveShows: feedResult.liveShows,
      emptyShows: feedResult.emptyShows,
      degradedShows: feedResult.degradedShows,
      laneStatus: feedResult.laneStatus,
      liveAudioAvailable: feedResult.liveAudioAvailable,
      statusMessage: feedResult.statusMessage,
      cacheTTL: `${CACHE_TTL_SECONDS}s`,
    },
  };

  await kvPut(env.KV, CACHE_KEY, payload, CACHE_TTL_SECONDS);
  return cachedJson(payload, 200, CACHE_TTL_SECONDS, { 'X-Cache': 'MISS' });
}
