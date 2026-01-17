/**
 * R2 Asset Proxy for BlazeCraft
 * Serves 3D assets (GLB, JSON) from R2 bucket
 */

interface Env {
  BLAZECRAFT_ASSETS: R2Bucket;
}

const MIME_TYPES: Record<string, string> = {
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
};

export const onRequest: PagesFunction<Env> = async (context) => {
  const { params, env } = context;

  // Reconstruct path from catch-all
  const pathSegments = params.path as string[];
  const assetPath = `assets/${pathSegments.join('/')}`;

  // Get from R2
  const object = await env.BLAZECRAFT_ASSETS.get(assetPath);

  if (!object) {
    return new Response(`Asset not found: ${assetPath}`, { status: 404 });
  }

  // Determine content type
  const ext = assetPath.substring(assetPath.lastIndexOf('.'));
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // Return with caching headers
  return new Response(object.body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
