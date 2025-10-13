/**
 * BLAZE SPORTS INTEL - INTELLIGENT ASSET DELIVERY WORKER
 *
 * Serves optimal neural substrate assets based on device capabilities
 *
 * Features:
 * - GPU capability detection from User-Agent
 * - Adaptive shader selection (high-end vs low-end)
 * - INT8 vs INT4 NeRF model selection
 * - Progressive loading support
 * - Immutable cache headers (1-year max-age)
 * - Content-addressed assets (SHA-256 hashing)
 *
 * Endpoints:
 * - GET /assets/shaders/:shader.wgsl - WebGPU shaders
 * - GET /assets/models/:model.bin - NeRF model weights
 * - GET /assets/audio/:sound.opus - Spatial audio samples
 * - GET /assets/field-snapshots/:snapshot.msgpack - Field state snapshots
 *
 * @version 1.0.0
 * @author Austin Humphrey <austin@blazesportsintel.com>
 */

// Device tier thresholds (GPU performance score 0-10)
const DEVICE_TIERS = {
  high: 7.0, // Desktop GPUs, M1/M2 Pro, RTX 30/40 series
  medium: 4.0, // Integrated GPUs, M1 base, GTX 16 series
  low: 0.0, // Mobile GPUs, older integrated
} as const;

type DeviceTier = keyof typeof DEVICE_TIERS;

// Asset mappings
const SHADER_VARIANTS = {
  'nerf.wgsl': {
    high: 'shaders/nerf/nerf-high.wgsl',
    medium: 'shaders/nerf/nerf-medium.wgsl',
    low: 'shaders/nerf/nerf-low.wgsl',
  },
  'morphogenic-field.wgsl': {
    high: 'shaders/field/morphogenic-field-high.wgsl',
    medium: 'shaders/field/morphogenic-field-medium.wgsl',
    low: 'shaders/field/morphogenic-field-low.wgsl',
  },
} as const;

const MODEL_VARIANTS = {
  'cardinals-stadium.bin': {
    high: 'models/nerf/cardinals-stadium-int8.bin', // 5MB
    medium: 'models/nerf/cardinals-stadium-int8.bin', // 5MB
    low: 'models/nerf/cardinals-stadium-int4.bin', // 2.5MB
  },
  'yankees-stadium.bin': {
    high: 'models/nerf/yankees-stadium-int8.bin',
    medium: 'models/nerf/yankees-stadium-int8.bin',
    low: 'models/nerf/yankees-stadium-int4.bin',
  },
  'dodgers-stadium.bin': {
    high: 'models/nerf/dodgers-stadium-int8.bin',
    medium: 'models/nerf/dodgers-stadium-int8.bin',
    low: 'models/nerf/dodgers-stadium-int4.bin',
  },
} as const;

// CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Range',
  'Access-Control-Expose-Headers': 'Content-Range, Accept-Ranges, Content-Length',
} as const;

// Cache headers (immutable assets)
const IMMUTABLE_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=31536000, immutable', // 1 year
  'X-Content-Type-Options': 'nosniff',
} as const;

/**
 * Detect device tier from User-Agent
 */
function detectDeviceTier(request: Request): DeviceTier {
  const userAgent = request.headers.get('User-Agent') || '';
  const gpuHint = request.headers.get('Device-Memory'); // GB of RAM (proxy for GPU)

  // Parse User-Agent for GPU clues
  const ua = userAgent.toLowerCase();

  // High-end indicators
  if (
    ua.includes('mac') && (ua.includes('m1 pro') || ua.includes('m2') || ua.includes('m3')) ||
    ua.includes('rtx 30') || ua.includes('rtx 40') ||
    ua.includes('radeon rx 6') || ua.includes('radeon rx 7') ||
    (gpuHint && parseInt(gpuHint) >= 16) // 16GB+ RAM
  ) {
    return 'high';
  }

  // Low-end indicators (mobile)
  if (
    ua.includes('mobile') ||
    ua.includes('android') ||
    ua.includes('iphone') ||
    ua.includes('ipad') ||
    (gpuHint && parseInt(gpuHint) <= 4) // <= 4GB RAM
  ) {
    return 'low';
  }

  // Medium tier (default)
  return 'medium';
}

/**
 * Get appropriate shader variant
 */
function getShaderAsset(shaderName: string, tier: DeviceTier): string | null {
  const variants = SHADER_VARIANTS[shaderName as keyof typeof SHADER_VARIANTS];
  return variants ? variants[tier] : null;
}

/**
 * Get appropriate model variant
 */
function getModelAsset(modelName: string, tier: DeviceTier): string | null {
  const variants = MODEL_VARIANTS[modelName as keyof typeof MODEL_VARIANTS];
  return variants ? variants[tier] : null;
}

/**
 * Main handler
 */
export async function onRequest(context: {
  request: Request;
  env: Env;
  params: { route: string[] };
}): Promise<Response> {
  const { request, env, params } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  // Extract route path
  const routeParts = params.route || [];
  const assetType = routeParts[0]; // 'shaders', 'models', 'audio', 'field-snapshots'
  const assetName = routeParts.slice(1).join('/'); // 'nerf/nerf.wgsl', 'cardinals-stadium.bin'

  if (!assetType || !assetName) {
    return new Response(JSON.stringify({ error: 'Invalid asset path' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // Detect device tier
  const deviceTier = detectDeviceTier(request);

  // Determine actual R2 key based on asset type and device tier
  let r2Key: string | null = null;

  switch (assetType) {
    case 'shaders':
      r2Key = getShaderAsset(assetName, deviceTier);
      break;
    case 'models':
      r2Key = getModelAsset(assetName, deviceTier);
      break;
    case 'audio':
      // Audio files are not device-dependent
      r2Key = `audio/spatial/${assetName}`;
      break;
    case 'field-snapshots':
      // Field snapshots are not device-dependent
      r2Key = `field-snapshots/${assetName}`;
      break;
    default:
      return new Response(JSON.stringify({ error: 'Unknown asset type' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
  }

  if (!r2Key) {
    return new Response(JSON.stringify({ error: 'Asset not found' }), {
      status: 404,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Fetch from R2
    const object = await env.R2_ASSETS.get(r2Key, {
      range: request.headers, // Support range requests for progressive loading
    });

    if (!object) {
      return new Response(JSON.stringify({ error: 'Asset not found in storage' }), {
        status: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Determine content type
    const contentType = getContentType(r2Key);

    // Build response headers
    const headers: Record<string, string> = {
      ...CORS_HEADERS,
      ...IMMUTABLE_CACHE_HEADERS,
      'Content-Type': contentType,
      'Content-Length': String(object.size),
      'ETag': object.etag,
      'X-Device-Tier': deviceTier, // Debug header
      'X-R2-Key': r2Key, // Debug header
    };

    // Add range headers if present
    if (object.range) {
      headers['Content-Range'] = `bytes ${object.range.offset}-${object.range.offset + object.range.length - 1}/${object.size}`;
      headers['Accept-Ranges'] = 'bytes';
    }

    // Track metrics in Analytics Engine
    if (env.ANALYTICS) {
      context.waitUntil(
        env.ANALYTICS.writeDataPoint({
          blobs: [assetType, assetName, deviceTier, r2Key],
          doubles: [object.size, Date.now()],
          indexes: [assetType, deviceTier],
        })
      );
    }

    // Return asset
    return new Response(object.body, {
      status: object.range ? 206 : 200,
      headers,
    });
  } catch (error) {
    console.error('[AssetDelivery] Error fetching asset:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch asset',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Determine content type from file extension
 */
function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'wgsl':
      return 'text/plain; charset=utf-8'; // WGSL shader code
    case 'bin':
      return 'application/octet-stream'; // Binary NeRF weights
    case 'opus':
      return 'audio/opus'; // Opus audio
    case 'msgpack':
      return 'application/x-msgpack'; // MessagePack compressed data
    case 'json':
      return 'application/json';
    default:
      return 'application/octet-stream';
  }
}

// Type definitions
interface Env {
  R2_ASSETS: R2Bucket;
  ANALYTICS?: AnalyticsEngineDataset;
}
