/**
 * College Baseball Service Worker
 * Provides offline caching and improved performance
 *
 * Cache Strategy:
 * - Network-first for API calls (with cache fallback)
 * - Cache-first for static assets
 */

const CACHE_NAME = 'college-baseball-v1';
const API_CACHE_NAME = 'college-baseball-api-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/college-baseball-demo.html',
  '/college-baseball/games/',
  '/college-baseball/games/index.html',
  '/college-baseball/games/api-integration.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME)
            .map((name) => {
              console.log('[Service Worker] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with appropriate caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/college-baseball/')) {
    event.respondWith(handleAPIRequest(request));
    return;
  }

  // Handle static assets with cache-first strategy
  event.respondWith(handleStaticRequest(request));
});

/**
 * Network-first strategy for API calls
 * Falls back to cache if network fails
 */
async function handleAPIRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);

  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    console.log('[Service Worker] Network failed, using cache for:', request.url);

    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // No cache available, return error response
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Network unavailable and no cached data',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Cache-first strategy for static assets
 * Falls back to network if not in cache
 */
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);

  // Check cache first
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  // Not in cache, fetch from network
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Failed to fetch:', request.url, error);

    // Return a fallback response for HTML requests
    if (request.headers.get('accept')?.includes('text/html')) {
      return new Response(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Offline - College Baseball</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
                color: white;
                text-align: center;
                padding: 2rem;
              }
              h1 { font-size: 2rem; margin-bottom: 1rem; }
              p { font-size: 1.125rem; opacity: 0.9; }
              button {
                margin-top: 2rem;
                padding: 1rem 2rem;
                background: white;
                color: #1e40af;
                border: none;
                border-radius: 8px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
              }
            </style>
          </head>
          <body>
            <div>
              <h1>⚾ You're Offline</h1>
              <p>College Baseball scores will be available when you're back online.</p>
              <button onclick="location.reload()">Try Again</button>
            </div>
          </body>
        </html>
        `,
        {
          status: 503,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }

    return new Response('Service Unavailable', { status: 503 });
  }
}

// Handle push notifications (future feature)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received:', event);

  if (!event.data) return;

  try {
    const data = event.data.json();

    const options = {
      body: data.body || 'Game update available',
      icon: '/icons/baseball-icon-192.png',
      badge: '/icons/baseball-badge-72.png',
      vibrate: [200, 100, 200],
      tag: data.tag || 'game-update',
      requireInteraction: false,
      data: {
        url: data.url || '/college-baseball/games/'
      }
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || 'College Baseball Update',
        options
      )
    );
  } catch (error) {
    console.error('[Service Worker] Push notification error:', error);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event);

  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/college-baseball/games/')
  );
});

console.log('[Service Worker] Script loaded');
