/**
 * Game Videos API Route
 *
 * Returns video highlights for a game.
 *
 * GET /api/game/:gameId/videos?sport=mlb|nfl|nba|cbb|cfb
 */

import { ESPNUnifiedAdapter, type SportKey } from '@/lib/adapters/espn-unified-adapter';
import type { VideoHighlight, VideoSource } from '@/lib/types/adapters';

interface Env {
  BSI_CACHE?: KVNamespace;
  BSI_VIDEOS?: R2Bucket;
}

const SPORT_MAP: Record<string, SportKey> = {
  mlb: 'mlb',
  nfl: 'nfl',
  nba: 'nba',
  cbb: 'cbb',
  ncaab: 'ncaab',
  cfb: 'ncaaf',
  ncaaf: 'ncaaf',
  wnba: 'wnba',
  nhl: 'nhl',
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { gameId } = context.params;
  const url = new URL(context.request.url);
  const sportParam = url.searchParams.get('sport') || 'mlb';
  const sport = SPORT_MAP[sportParam.toLowerCase()] || 'mlb';

  if (!gameId || typeof gameId !== 'string') {
    return new Response(JSON.stringify({ error: 'Game ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const adapter = new ESPNUnifiedAdapter(context.env.BSI_CACHE);
    const summary = await adapter.getGameSummary(sport, gameId);

    // Extract videos from ESPN response
    const espnVideos = summary.videos || [];
    const highlights = summary.highlights?.items || [];

    // Normalize videos
    const normalizedVideos: VideoHighlight[] = [
      ...espnVideos.map((v: any) => normalizeESPNVideo(v)),
      ...highlights.map((h: any) => normalizeHighlight(h)),
    ].filter((v) => v.videoUrl);

    // Check for BSI-curated videos in R2 (if available)
    let bsiVideos: VideoHighlight[] = [];
    if (context.env.BSI_VIDEOS) {
      try {
        const listResult = await context.env.BSI_VIDEOS.list({
          prefix: `games/${sport}/${gameId}/`,
        });
        bsiVideos = listResult.objects.map((obj) => ({
          id: obj.key,
          title: extractTitleFromKey(obj.key),
          description: '',
          thumbnailUrl: `https://videos.blazesportsintel.com/${obj.key.replace(/\.[^/.]+$/, '.jpg')}`,
          videoUrl: obj.key,
          source: 'CLOUDFLARE_STREAM' as VideoSource,
          duration: 0,
          featured: obj.key.includes('featured'),
        }));
      } catch (e) {
        console.warn('[Videos API] R2 lookup failed:', e);
      }
    }

    // Combine and deduplicate
    const allVideos = [...bsiVideos, ...normalizedVideos];
    const uniqueVideos = deduplicateVideos(allVideos);

    // Sort: featured first, then by recency
    uniqueVideos.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });

    return new Response(
      JSON.stringify({
        success: true,
        videos: uniqueVideos,
        count: uniqueVideos.length,
        sources: {
          bsi: bsiVideos.length,
          espn: normalizedVideos.length,
        },
        dataStamp: {
          timestamp: new Date().toISOString(),
          source: 'ESPN + BSI',
          sport,
        },
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300',
        },
      }
    );
  } catch (error) {
    console.error(`[Videos API] Error fetching videos for ${gameId}:`, error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch videos',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

function normalizeESPNVideo(video: any): VideoHighlight {
  const links = video.links || {};
  const mobileLink = links.mobile?.href || links.web?.href || '';
  const source = links.source?.href || '';

  return {
    id: video.id?.toString() || `espn-${Date.now()}`,
    title: video.headline || video.title || 'Game Highlight',
    description: video.description || video.caption || '',
    thumbnailUrl: video.thumbnail || video.posterImages?.default?.href || '',
    videoUrl: mobileLink || source,
    source: 'ESPN' as VideoSource,
    duration: video.duration || 0,
    featured: video.premium || false,
  };
}

function normalizeHighlight(highlight: any): VideoHighlight {
  const video = highlight.video || highlight;
  const links = video.links || {};

  return {
    id: video.id?.toString() || highlight.id?.toString() || `hl-${Date.now()}`,
    title: video.headline || video.title || highlight.headline || 'Highlight',
    description: video.description || highlight.description || '',
    thumbnailUrl: video.thumbnail || video.posterImages?.default?.href || highlight.thumbnail || '',
    videoUrl: links.mobile?.href || links.web?.href || links.source?.href || '',
    source: 'ESPN' as VideoSource,
    duration: video.duration || 0,
    featured: false,
  };
}

function extractTitleFromKey(key: string): string {
  // Convert "games/mlb/12345/top-play-hr.mp4" to "Top Play Hr"
  const filename = key.split('/').pop() || '';
  const name = filename.replace(/\.[^/.]+$/, '');
  return name
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function deduplicateVideos(videos: VideoHighlight[]): VideoHighlight[] {
  const seen = new Set<string>();
  return videos.filter((v) => {
    const key = v.title.toLowerCase().replace(/\s+/g, '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
