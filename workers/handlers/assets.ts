/**
 * R2 Asset Delivery — serves brand/hero images from bsi-web-assets and blazesports-assets.
 *
 * Route: GET /api/assets/:bucket/*
 * Bucket aliases:
 *   "brand"  → WEB_ASSETS  (bsi-web-assets)  — sized logos, brand grid
 *   "images" → BRAND_ASSETS (blazesports-assets) — hero banners, stadium photos
 *
 * Cache: brand assets get immutable 1-year, hero images get 1-day.
 * 404 returns JSON, not HTML.
 */
import type { Env } from '../shared/types';

const BUCKET_MAP: Record<string, keyof Pick<Env, 'WEB_ASSETS' | 'BRAND_ASSETS'>> = {
  brand: 'WEB_ASSETS',
  images: 'BRAND_ASSETS',
};

/** Content-type fallback when R2 metadata is missing */
const EXT_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.json': 'application/json',
};

function contentTypeFromKey(key: string): string {
  const ext = key.slice(key.lastIndexOf('.')).toLowerCase();
  return EXT_TYPES[ext] || 'application/octet-stream';
}

export async function handleAssetRequest(
  request: Request,
  env: Env,
  bucketAlias: string,
  objectKey: string,
): Promise<Response> {
  const bindingName = BUCKET_MAP[bucketAlias];
  if (!bindingName) {
    return Response.json(
      { error: 'Unknown asset bucket', validBuckets: Object.keys(BUCKET_MAP) },
      { status: 400 },
    );
  }

  const bucket = env[bindingName];
  if (!bucket) {
    return Response.json({ error: 'Asset bucket not configured' }, { status: 503 });
  }

  // Resolve the R2 key: "brand" alias maps to brand/* prefix in bsi-web-assets,
  // "images" alias maps to images/* prefix in blazesports-assets.
  const r2Key = `${bucketAlias}/${objectKey}`;
  const object = await bucket.get(r2Key);

  if (!object) {
    return Response.json(
      { error: 'Asset not found', bucket: bucketAlias, key: r2Key },
      { status: 404 },
    );
  }

  const contentType =
    object.httpMetadata?.contentType || contentTypeFromKey(objectKey);

  // Brand logos (bsi-web-assets) already have immutable cache headers in R2 metadata.
  // Hero images (blazesports-assets) get 1-day cache.
  const isImmutable = bucketAlias === 'brand';
  const cacheControl = isImmutable
    ? 'public, max-age=31536000, immutable'
    : 'public, max-age=86400';

  return new Response(object.body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
      'Access-Control-Allow-Origin': '*',
      'X-BSI-Asset-Bucket': bucketAlias,
    },
  });
}
