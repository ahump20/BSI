/**
 * Blaze Field — Production CDN Worker
 *
 * Serves the Vite-built game from R2 with:
 * - COOP/COEP headers (required for Havok SharedArrayBuffer)
 * - Cache-Control: immutable for hashed assets, 5min for index.html
 * - Brotli compression (handled by Cloudflare edge)
 * - Custom 404 page
 * - Analytics beacon endpoint
 */

export interface Env {
  ASSETS: R2Bucket;
}

const SECURITY_HEADERS = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.glb': 'model/gltf-binary',
  '.gltf': 'application/gltf+json',
  '.webmanifest': 'application/manifest+json',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Analytics beacon
    if (url.pathname === '/api/beacon' && request.method === 'POST') {
      // Fire-and-forget — don't block response
      return new Response(null, { status: 204 });
    }

    // Determine asset path
    let path = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);

    // Try R2
    const object = await env.ASSETS.get(path);
    if (!object) {
      // SPA fallback — serve index.html for non-asset paths
      const ext = path.includes('.') ? path.slice(path.lastIndexOf('.')) : '';
      if (!ext) {
        const fallback = await env.ASSETS.get('index.html');
        if (fallback) {
          return buildResponse(fallback, 'index.html', false);
        }
      }
      return new Response(notFoundHtml(), {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8', ...SECURITY_HEADERS },
      });
    }

    const isHashed = /[-\.][a-zA-Z0-9]{8,}\.(js|css|wasm|glb|png|jpg|webp)$/.test(path);
    return buildResponse(object, path, isHashed);
  },
};

function buildResponse(object: R2ObjectBody, path: string, immutable: boolean): Response {
  const ext = path.includes('.') ? path.slice(path.lastIndexOf('.')) : '.html';
  const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';

  const cacheControl = immutable
    ? 'public, max-age=31536000, immutable'
    : 'public, max-age=300';

  return new Response(object.body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
      'ETag': object.httpEtag,
      ...SECURITY_HEADERS,
    },
  });
}

function notFoundHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Blaze Field — Not Found</title>
  <style>
    body { margin:0; background:#0a0a0a; color:#f5f5f5; font-family:system-ui,sans-serif;
           display:flex; align-items:center; justify-content:center; min-height:100vh; }
    .box { text-align:center; }
    h1 { font-size:4rem; margin:0; color:#f97316; }
    p { font-size:1.2rem; margin:1rem 0; opacity:0.7; }
    a { color:#f97316; text-decoration:none; }
    a:hover { text-decoration:underline; }
  </style>
</head>
<body>
  <div class="box">
    <h1>404</h1>
    <p>Play not found. Return to the <a href="/">field</a>.</p>
  </div>
</body>
</html>`;
}
