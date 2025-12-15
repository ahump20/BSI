/**
 * Videos API Route
 *
 * Manages video highlights stored in Cloudflare Stream.
 *
 * GET /api/videos - List all videos
 * GET /api/videos?gameId=xxx - List videos for a game
 * GET /api/videos?sport=mlb - List videos for a sport
 */

interface Env {
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_STREAM_TOKEN?: string;
  BSI_VIDEOS?: R2Bucket;
  BSI_CACHE?: KVNamespace;
}

interface StreamVideo {
  uid: string;
  thumbnail: string;
  preview: string;
  playback: {
    hls: string;
    dash: string;
  };
  meta: {
    name?: string;
    gameId?: string;
    sport?: string;
    featured?: string;
    timestamp?: string;
  };
  created: string;
  duration: number;
  size: number;
  status: {
    state: string;
    pctComplete?: number;
  };
}

interface VideoResponse {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  source: 'CLOUDFLARE_STREAM';
  duration: number;
  featured: boolean;
  gameId?: string;
  sport?: string;
  createdAt: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const gameId = url.searchParams.get('gameId');
  const sport = url.searchParams.get('sport');
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);

  // Check for Stream credentials
  if (!context.env.CLOUDFLARE_ACCOUNT_ID || !context.env.CLOUDFLARE_STREAM_TOKEN) {
    // Fallback to R2 bucket if Stream not configured
    return await fetchFromR2(context.env, gameId, sport, limit);
  }

  try {
    // Fetch videos from Cloudflare Stream
    const streamUrl = `https://api.cloudflare.com/client/v4/accounts/${context.env.CLOUDFLARE_ACCOUNT_ID}/stream`;

    const response = await fetch(streamUrl, {
      headers: {
        Authorization: `Bearer ${context.env.CLOUDFLARE_STREAM_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Stream API error: ${response.status}`);
    }

    const data: { result: StreamVideo[]; success: boolean } = await response.json();

    if (!data.success) {
      throw new Error('Stream API returned unsuccessful response');
    }

    // Filter and transform videos
    let videos = data.result
      .filter((v) => v.status.state === 'ready')
      .map((v) => transformStreamVideo(v));

    // Filter by gameId if provided
    if (gameId) {
      videos = videos.filter((v) => v.gameId === gameId);
    }

    // Filter by sport if provided
    if (sport) {
      videos = videos.filter((v) => v.sport === sport.toLowerCase());
    }

    // Sort: featured first, then by date
    videos.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Apply limit
    videos = videos.slice(0, limit);

    return new Response(
      JSON.stringify({
        success: true,
        videos,
        count: videos.length,
        source: 'cloudflare-stream',
        dataStamp: {
          timestamp: new Date().toISOString(),
          source: 'Cloudflare Stream',
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
    console.error('[Videos API] Error fetching from Stream:', error);

    // Fallback to R2
    return await fetchFromR2(context.env, gameId, sport, limit);
  }
};

function transformStreamVideo(video: StreamVideo): VideoResponse {
  return {
    id: video.uid,
    title: video.meta?.name || 'Untitled Video',
    description: '',
    thumbnailUrl: video.thumbnail,
    videoUrl: video.playback.hls,
    source: 'CLOUDFLARE_STREAM',
    duration: video.duration,
    featured: video.meta?.featured === 'true',
    gameId: video.meta?.gameId,
    sport: video.meta?.sport,
    createdAt: video.created,
  };
}

async function fetchFromR2(
  env: Env,
  gameId: string | null,
  sport: string | null,
  limit: number
): Promise<Response> {
  if (!env.BSI_VIDEOS) {
    return new Response(
      JSON.stringify({
        success: true,
        videos: [],
        count: 0,
        source: 'none',
        message: 'No video storage configured',
        dataStamp: {
          timestamp: new Date().toISOString(),
          source: 'None',
        },
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
        },
      }
    );
  }

  try {
    let prefix = 'videos/';
    if (sport) {
      prefix = `videos/${sport.toLowerCase()}/`;
    }
    if (gameId) {
      prefix = `videos/${sport || 'all'}/${gameId}/`;
    }

    const listResult = await env.BSI_VIDEOS.list({
      prefix,
      limit,
    });

    const videos: VideoResponse[] = listResult.objects
      .filter((obj) => obj.key.match(/\.(mp4|webm|mov)$/i))
      .map((obj) => {
        const parts = obj.key.split('/');
        const filename = parts[parts.length - 1];
        const title = filename
          .replace(/\.[^/.]+$/, '')
          .split(/[-_]/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');

        return {
          id: obj.key,
          title,
          description: '',
          thumbnailUrl: obj.key.replace(/\.[^/.]+$/, '.jpg'),
          videoUrl: `https://videos.blazesportsintel.com/${obj.key}`,
          source: 'CLOUDFLARE_STREAM' as const,
          duration: 0, // Unknown from R2 metadata
          featured: filename.includes('featured'),
          gameId: parts.length >= 3 ? parts[2] : undefined,
          sport: parts.length >= 2 ? parts[1] : undefined,
          createdAt: obj.uploaded.toISOString(),
        };
      });

    return new Response(
      JSON.stringify({
        success: true,
        videos,
        count: videos.length,
        source: 'r2',
        dataStamp: {
          timestamp: new Date().toISOString(),
          source: 'Cloudflare R2',
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
    console.error('[Videos API] R2 error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch videos',
        videos: [],
        count: 0,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
