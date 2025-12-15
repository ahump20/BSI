/**
 * Blaze Sports Intel - Service Worker
 * PHASE 20-B: Progressive Web App with Offline Support
 *
 * Caching Strategies:
 * - Static assets: Cache-first with network fallback
 * - API calls: Network-first with cache fallback
 * - Images: Cache-first with stale-while-revalidate
 * - Analytics: Network-only
 *
 * Version: 1.0.0
 */

const CACHE_VERSION = 'blaze-sports-v3-pwa';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/analytics',
  '/analytics/index.html',
  '/mlb',
  '/nfl',
  '/college-baseball',
  '/college-baseball/draft',
  '/college-baseball/draft/index.html',
  '/college-baseball/tools/compare.html',
  '/college-baseball/recruiting/tracker.html',
  '/college-baseball/players',
  '/college-baseball/players/index.html',
  '/college-baseball/teams',
  '/college-baseball/teams/index.html',
  '/js/analytics.min.js',
  '/js/analytics-statcast.min.js',
  '/js/advanced-stats.js',
  '/js/feedback-widget.min.js',
  '/js/data-freshness-component.min.js',
  '/js/error-handler.min.js',
  '/js/loading-skeletons.min.js',
  '/public/js/touch-gestures.min.js',
  '/public/css/analytics.css',
  '/manifest.json',
  '/offline.html'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/mlb/statcast/health',
  '/api/mlb/standings',
  '/api/nfl/standings',
  '/api/live/ncaa/games'
];

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v' + CACHE_VERSION);

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker v' + CACHE_VERSION);

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('blaze-sports-') && cacheName !== STATIC_CACHE && cacheName !== API_CACHE && cacheName !== IMAGE_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated');
        return self.clients.claim(); // Take control of all pages
      })
  );
});

/**
 * Fetch event - handle all network requests
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!request.url.startsWith('http')) {
    return;
  }

  // API requests: Network-first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithCache(request, API_CACHE));
    return;
  }

  // Images: Cache-first with stale-while-revalidate
  if (request.destination === 'image' || /\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(url.pathname)) {
    event.respondWith(cacheFirstWithRevalidate(request, IMAGE_CACHE));
    return;
  }

  // Analytics and tracking: Network-only
  if (url.pathname.includes('analytics-engine') || url.pathname.includes('track')) {
    event.respondWith(fetch(request));
    return;
  }

  // Static assets: Cache-first with network fallback
  event.respondWith(cacheFirstWithFallback(request, STATIC_CACHE));
});

/**
 * Network-first strategy with cache fallback
 * Best for API calls where fresh data is preferred
 */
async function networkFirstWithCache(request, cacheName) {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);

    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline response for API calls
    return new Response(JSON.stringify({
      success: false,
      error: 'Offline - data not available',
      cached: false,
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Cache-first strategy with network fallback
 * Best for static assets that rarely change
 */
async function cacheFirstWithFallback(request, cacheName) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    // Fallback to network
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Failed to fetch:', request.url);

    // If it's an HTML page, return offline page
    if (request.headers.get('Accept')?.includes('text/html')) {
      const offlinePage = await caches.match('/offline.html');
      if (offlinePage) {
        return offlinePage;
      }
    }

    // Return generic offline response
    return new Response('Offline - resource not available', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

/**
 * Cache-first with background revalidation
 * Best for images and assets that can show stale data while updating
 */
async function cacheFirstWithRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Return cached response immediately
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse);
      }
    }).catch(() => {
      // Silently fail background update
    });

    return cachedResponse;
  }

  // No cached version, fetch from network
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Image not available offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

/**
 * Background Sync - retry failed API calls
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-api-calls') {
    event.waitUntil(syncApiCalls());
  }
});

async function syncApiCalls() {
  console.log('[SW] Syncing failed API calls');
  // Implement queue for failed requests
  // This would typically use IndexedDB to store failed requests
}

/**
 * Push notification handling
 */
self.addEventListener('push', (event) => {
  const data = event.data.json();

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.primaryKey,
      url: data.url || '/'
    },
    actions: [
      {
        action: 'view',
        title: 'View Game',
        icon: '/icons/view-icon.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close-icon.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

/**
 * Notification click handling
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

/**
 * Message handling from clients
 */
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }

  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

console.log('[SW] Service Worker loaded');
