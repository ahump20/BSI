/**
 * Blaze Sports Intel - Service Worker
 * Provides offline capabilities, caching, and PWA features
 */

const CACHE_VERSION = 'bsi-v2';
const CACHE_NAME = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/images/bsi-logo-nav.png',
  '/images/texas-soil.jpg',
  '/images/birth-certificate.jpg',
  '/images/blaze-and-austin.jpg',
  '/images/dad-and-kid.jpg',
  '/images/longhorns-kid.jpg',
  '/images/titans-halloween.jpg',
  '/images/headshot.jpg',
  // Core pages
  '/dashboard',
  '/analytics',
  '/tools',
  // Sport-specific scores
  '/scores/mlb',
  '/scores/nfl',
  '/scores/nba',
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[BSI SW] Precaching app shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('bsi-') && name !== CACHE_NAME && name !== RUNTIME_CACHE)
            .map((name) => {
              console.log('[BSI SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests (except fonts and images)
  if (url.origin !== location.origin && !url.pathname.match(/\.(woff2|woff|ttf|jpg|jpeg|png|gif|webp|svg)$/)) {
    return;
  }

  // Stale-while-revalidate for API calls (faster perceived load)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version
          return cachedResponse;
        }

        // Clone the request
        const fetchRequest = request.clone();

        return fetch(fetchRequest)
          .then((response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache runtime assets
            if (url.origin === location.origin) {
              caches.open(RUNTIME_CACHE)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });
            }

            return response;
          })
          .catch(() => {
            // Offline fallback
            if (request.destination === 'document') {
              return caches.match('/');
            }
          });
      })
  );
});

// Background sync for analytics/data
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-analytics') {
    event.waitUntil(syncAnalytics());
  }
});

async function syncAnalytics() {
  console.log('[BSI SW] Syncing analytics data');
  // Placeholder for future analytics sync
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update from Blaze Sports Intel',
    icon: '/images/bsi-logo-192.png',
    badge: '/images/bsi-logo-192.png',
    vibrate: [200, 100, 200],
    tag: 'bsi-notification',
    data: {
      url: '/',
    },
  };

  event.waitUntil(
    self.registration.showNotification('Blaze Sports Intel', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
