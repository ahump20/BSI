import { afterEach, describe, expect, it, vi } from 'vitest';

import { handlePodcasts } from '../../workers/handlers/media';

const sampleRssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>College Baseball Feed</title>
    <item>
      <title>Opening Day &amp; Intel</title>
      <description><![CDATA[<p>What matters &amp; why before first pitch.</p>]]></description>
      <pubDate>Thu, 12 Mar 2026 12:00:00 &#43;0000</pubDate>
      <itunes:duration>372</itunes:duration>
      <enclosure url="https://cdn.example.com/opening-day-intel.mp3" type="audio/mpeg" />
      <link>https://example.com/opening-day-intel</link>
    </item>
  </channel>
</rss>`;

const emptyRssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>Mazin&#39;s Podcast</title>
    <lastBuildDate>Tue, 18 Jul 2023 20:18:12 -0400</lastBuildDate>
    <description><![CDATA[<p>A podcast where I have experts over in the field of medicine.</p>]]></description>
  </channel>
</rss>`;

function createMockKV() {
  const store = new Map<string, string>();
  return {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    put: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
  };
}

describe('/api/media/podcasts', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns normalized podcast episodes with the BSI meta contract', async () => {
    const fetchMock = vi.fn().mockImplementation(async () =>
      new Response(sampleRssFeed, {
        status: 200,
        headers: { 'Content-Type': 'application/rss+xml' },
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const response = await handlePodcasts({ KV: createMockKV() } as any);

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const body = (await response.json()) as {
      success: boolean;
      episodes: Array<{
        title: string;
        description: string;
        duration: string;
        audioUrl: string;
        link: string;
      }>;
      meta: {
        source: string;
        fetched_at: string;
        timezone: string;
        totalShows: number;
        totalEpisodes: number;
        liveShows: number;
        emptyShows: number;
        degradedShows: number;
        responsiveShows: number;
        laneStatus: 'live' | 'empty' | 'degraded';
        liveAudioAvailable: boolean;
        statusMessage: string;
      };
      sources: Array<{
        key: string;
        status: 'live' | 'empty' | 'degraded';
        totalEpisodes: number;
      }>;
    };

    expect(body.success).toBe(true);
    expect(body.episodes).toHaveLength(3);
    expect(body.sources).toMatchObject([
      { key: 'd1baseball', status: 'live', totalEpisodes: 1 },
      { key: 'baseball-america', status: 'live', totalEpisodes: 1 },
      { key: '11point7', status: 'live', totalEpisodes: 1 },
    ]);
    expect(body.episodes[0]).toMatchObject({
      title: 'Opening Day & Intel',
      description: 'What matters & why before first pitch.',
      pubDate: 'Thu, 12 Mar 2026 12:00:00 +0000',
      duration: '06:12',
      audioUrl: 'https://cdn.example.com/opening-day-intel.mp3',
      link: 'https://example.com/opening-day-intel',
    });
    expect(body.meta).toMatchObject({
      source: 'bsi-media-podcasts',
      timezone: 'America/Chicago',
      totalShows: 3,
      totalEpisodes: 3,
      liveShows: 3,
      emptyShows: 0,
      degradedShows: 0,
      responsiveShows: 3,
      laneStatus: 'live',
      liveAudioAvailable: true,
      statusMessage: '3 external episodes are live through the verified market feed lane.',
    });
    expect(Date.parse(body.meta.fetched_at)).not.toBeNaN();
  });

  it('reports an empty feed lane when configured sources respond without episodes', async () => {
    const fetchMock = vi.fn().mockImplementation(async () =>
      new Response(emptyRssFeed, {
        status: 200,
        headers: { 'Content-Type': 'application/rss+xml' },
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const response = await handlePodcasts({ KV: createMockKV() } as any);
    const body = (await response.json()) as {
      episodes: Array<unknown>;
      meta: {
        totalShows: number;
        totalEpisodes: number;
        liveShows: number;
        emptyShows: number;
        degradedShows: number;
        responsiveShows: number;
        laneStatus: 'live' | 'empty' | 'degraded';
        liveAudioAvailable: boolean;
        statusMessage: string;
      };
      sources: Array<{
        key: string;
        status: 'live' | 'empty' | 'degraded';
        totalEpisodes: number;
        channelTitle?: string;
        lastBuildDate?: string;
      }>;
    };

    expect(body.episodes).toEqual([]);
    expect(body.sources).toMatchObject([
      { key: 'd1baseball', status: 'empty', totalEpisodes: 0, channelTitle: "Mazin's Podcast", lastBuildDate: 'Tue, 18 Jul 2023 20:18:12 -0400' },
      { key: 'baseball-america', status: 'empty', totalEpisodes: 0, channelTitle: "Mazin's Podcast", lastBuildDate: 'Tue, 18 Jul 2023 20:18:12 -0400' },
      { key: '11point7', status: 'empty', totalEpisodes: 0, channelTitle: "Mazin's Podcast", lastBuildDate: 'Tue, 18 Jul 2023 20:18:12 -0400' },
    ]);
    expect(body.meta).toMatchObject({
      totalShows: 3,
      totalEpisodes: 0,
      liveShows: 0,
      emptyShows: 3,
      degradedShows: 0,
      responsiveShows: 3,
      laneStatus: 'empty',
      liveAudioAvailable: false,
      statusMessage: 'Configured market podcast feeds responded, but no public episodes were exposed.',
    });
  });
});
