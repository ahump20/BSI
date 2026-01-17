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

  // Check if binding exists
  if (!env.BLAZECRAFT_ASSETS) {
    return new Response('R2 binding BLAZECRAFT_ASSETS not configured', { status: 500 });
  }

  // Reconstruct path from catch-all
  const pathSegments = params.path as string[];
  const assetPath = `assets/${pathSegments.join('/')}`;

  try {
    // Debug: return path being looked up
    console.log(`Looking up: ${assetPath}`);

    const object = await env.BLAZECRAFT_ASSETS.get(assetPath);

    if (!object) {
      return new Response(`Not found in R2: ${assetPath}`, { status: 404 });
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
  } catch (err) {
    return new Response(`Error: ${err instanceof Error ? err.message : 'Unknown'}`, { status: 500 });
  }
};
