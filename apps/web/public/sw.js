/**
 * Blaze Sports Intel - Service Worker
 *
 * Features:
 * - Offline support for static assets
 * - Network-first strategy for API calls
 * - Cache-first for static assets
 * - Background sync for data refresh
 */

const CACHE_NAME = 'blaze-sports-intel-v1';
const STATIC_CACHE = 'blaze-static-v1';
const DATA_CACHE = 'blaze-data-v1';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/features',
  '/command-center',
  '/copilot',
  '/baseball',
  '/football',
  '/basketball',
  '/manifest.json',
  '/css/graphics-engine.css',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS.map(url => {
        return new Request(url, { cache: 'reload' });
      })).catch(err => {
        console.log('[SW] Failed to cache some assets:', err);
      });
    })
  );

  // Take control immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name !== STATIC_CACHE && name !== DATA_CACHE;
          })
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );

  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API calls - network first, fall back to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Static assets and pages - cache first, fall back to network
  event.respondWith(cacheFirstStrategy(request));
});

// Network-first strategy for API calls
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DATA_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline fallback for API calls
    return new Response(
      JSON.stringify({
        success: false,
        error: 'You are offline. Data will refresh when connection is restored.',
        offline: true,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Cache-first strategy for static assets
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Update cache in background
    fetchAndCache(request);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Fetch failed:', request.url);

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/') || new Response(
        `<!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Offline - Blaze Sports Intel</title>
            <style>
              body {
                font-family: system-ui, sans-serif;
                background: #0b1120;
                color: #e2e8f0;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                text-align: center;
                padding: 2rem;
              }
              .container {
                max-width: 400px;
              }
              h1 {
                color: #fbbf24;
                margin-bottom: 1rem;
              }
              p {
                color: #94a3b8;
                line-height: 1.6;
              }
              button {
                margin-top: 1.5rem;
                padding: 0.75rem 1.5rem;
                background: linear-gradient(135deg, #fbbf24, #f97316);
                border: none;
                border-radius: 999px;
                color: #0b1120;
                font-weight: 600;
                cursor: pointer;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>You're Offline</h1>
              <p>It looks like you've lost your internet connection. Some features may be unavailable until you're back online.</p>
              <button onclick="location.reload()">Try Again</button>
            </div>
          </body>
        </html>`,
        {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    throw error;
  }
}

// Background fetch and cache update
async function fetchAndCache(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse);
    }
  } catch (error) {
    // Silently fail - we already have a cached version
  }
}

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body || 'New update from Blaze Sports Intel',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
    actions: [
      {
        action: 'open',
        title: 'View',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Blaze Sports Intel', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if found
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      return clients.openWindow(url);
    })
  );
});

// Background sync for data refresh
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Implement background data sync logic here
  console.log('[SW] Syncing data in background...');
}

console.log('[SW] Service worker loaded');
