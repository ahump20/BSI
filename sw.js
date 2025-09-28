/**
 * BLAZE SPORTS INTEL - SERVICE WORKER
 * Championship Intelligence Platform
 * Aggressive Caching for Sub-100ms Performance
 *
 * Staff Engineer: Austin Humphrey
 * Deep South Sports Authority
 */

const CACHE_VERSION = 'blaze-v1.2.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Cache strategies configuration
const CACHE_STRATEGIES = {
  STATIC_ASSETS: {
    pattern: /\.(js|css|png|jpg|jpeg|gif|svg|webp|woff2|woff|ico)$/,
    strategy: 'CacheFirst',
    ttl: 86400000 // 24 hours
  },
  API_CALLS: {
    pattern: /\/api\//,
    strategy: 'NetworkFirst',
    ttl: 300000 // 5 minutes
  },
  HTML_PAGES: {
    pattern: /\.html$|\/$/,
    strategy: 'StaleWhileRevalidate',
    ttl: 3600000 // 1 hour
  },
  LIVE_DATA: {
    pattern: /\/live\/|\/realtime\//,
    strategy: 'NetworkOnly',
    ttl: 0
  }
};

// Critical resources to cache immediately
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/css/critical.css',
  '/js/core.js',
  '/js/performance-optimizer.js',
  '/manifest.json',
  '/offline.html'
];

// Install event - cache critical resources
self.addEventListener('install', event => {
  console.log('🔥 Service Worker: Installing Blaze Championship Cache');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('🏆 Service Worker: Precaching critical resources');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('✅ Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Service Worker: Installation failed', error);
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  console.log('🔥 Service Worker: Activating Blaze Championship Cache');

  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        const deletePromises = cacheNames
          .filter(cacheName => {
            return cacheName.startsWith('blaze-') && !cacheName.includes(CACHE_VERSION);
          })
          .map(cacheName => {
            console.log(`🧹 Service Worker: Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          });

        return Promise.all(deletePromises);
      })
      .then(() => {
        console.log('✅ Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Determine cache strategy
  const strategy = getCacheStrategy(request);

  switch (strategy.name) {
    case 'CacheFirst':
      event.respondWith(cacheFirst(request, strategy));
      break;
    case 'NetworkFirst':
      event.respondWith(networkFirst(request, strategy));
      break;
    case 'StaleWhileRevalidate':
      event.respondWith(staleWhileRevalidate(request, strategy));
      break;
    case 'NetworkOnly':
      event.respondWith(networkOnly(request));
      break;
    default:
      event.respondWith(staleWhileRevalidate(request, strategy));
  }
});

// Cache First Strategy - for static assets
async function cacheFirst(request, strategy) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      // Check if cache is still fresh
      const cacheDate = new Date(cachedResponse.headers.get('date') || 0);
      const age = Date.now() - cacheDate.getTime();

      if (age < strategy.ttl) {
        console.log(`🎯 Cache HIT: ${request.url}`);
        return cachedResponse;
      }
    }

    // Fetch from network
    console.log(`🌐 Network fetch: ${request.url}`);
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      cache.put(request, responseClone);
    }

    return networkResponse;
  } catch (error) {
    console.error(`❌ Cache First failed for ${request.url}:`, error);

    // Return cached version as fallback
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    return cachedResponse || createErrorResponse();
  }
}

// Network First Strategy - for API calls
async function networkFirst(request, strategy) {
  try {
    console.log(`🌐 Network first: ${request.url}`);
    const networkResponse = await fetch(request, {
      ...request,
      headers: {
        ...request.headers,
        'Cache-Control': 'no-cache'
      }
    });

    // Cache successful API responses
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      const responseClone = networkResponse.clone();

      // Add timestamp header for cache freshness
      const response = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: {
          ...responseClone.headers,
          'sw-cache-timestamp': Date.now().toString()
        }
      });

      cache.put(request, response);
    }

    return networkResponse;
  } catch (error) {
    console.warn(`⚠️ Network first fallback for ${request.url}:`, error);

    // Fallback to cache
    const cache = await caches.open(API_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      // Check cache age
      const cacheTimestamp = cachedResponse.headers.get('sw-cache-timestamp');
      const age = Date.now() - parseInt(cacheTimestamp || '0');

      if (age < strategy.ttl) {
        console.log(`🎯 API Cache fallback: ${request.url}`);
        return cachedResponse;
      }
    }

    return createErrorResponse('Network unavailable');
  }
}

// Stale While Revalidate Strategy - for HTML pages
async function staleWhileRevalidate(request, strategy) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);

  // Start network request immediately
  const networkPromise = fetch(request)
    .then(networkResponse => {
      if (networkResponse.ok) {
        // Update cache with fresh response
        const responseClone = networkResponse.clone();
        cache.put(request, responseClone);
      }
      return networkResponse;
    })
    .catch(error => {
      console.warn(`⚠️ Network error for ${request.url}:`, error);
      return null;
    });

  // Return cached response immediately if available
  if (cachedResponse) {
    console.log(`🎯 Stale cache served: ${request.url}`);

    // Update in background
    networkPromise.catch(() => {}); // Ignore errors

    return cachedResponse;
  }

  // Wait for network if no cache
  console.log(`🌐 Network wait: ${request.url}`);
  return networkPromise || createErrorResponse();
}

// Network Only Strategy - for live data
async function networkOnly(request) {
  try {
    console.log(`🌐 Network only: ${request.url}`);
    return await fetch(request, {
      cache: 'no-cache'
    });
  } catch (error) {
    console.error(`❌ Network only failed for ${request.url}:`, error);
    return createErrorResponse('Live data unavailable');
  }
}

// Determine cache strategy based on request
function getCacheStrategy(request) {
  const url = request.url;

  for (const [name, config] of Object.entries(CACHE_STRATEGIES)) {
    if (config.pattern.test(url)) {
      return {
        name: config.strategy,
        ttl: config.ttl
      };
    }
  }

  // Default strategy
  return {
    name: 'StaleWhileRevalidate',
    ttl: 3600000
  };
}

// Create error response
function createErrorResponse(message = 'Service unavailable') {
  return new Response(
    JSON.stringify({
      error: true,
      message,
      timestamp: new Date().toISOString(),
      source: 'service_worker'
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json',
        'X-Served-By': 'Blaze-Service-Worker'
      }
    }
  );
}

// Background sync for failed requests
self.addEventListener('sync', event => {
  if (event.tag === 'blaze-background-sync') {
    console.log('🔄 Background sync: Retrying failed requests');
    event.waitUntil(syncFailedRequests());
  }
});

// Sync failed requests
async function syncFailedRequests() {
  // Implementation for retrying failed API calls
  // This would be used for analytics or other non-critical data
  console.log('🔄 Syncing failed requests...');
}

// Push notifications
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    console.log('📱 Push notification received:', data);

    const options = {
      body: data.body || 'New championship update available!',
      icon: '/assets/icon-192.png',
      badge: '/assets/badge-72.png',
      tag: 'blaze-notification',
      data: data.data || {},
      actions: [
        {
          action: 'view',
          title: 'View Update',
          icon: '/assets/action-view.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/assets/action-dismiss.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Blaze Sports Intel', options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  console.log('📱 Notification clicked:', event.notification);

  event.notification.close();

  if (event.action === 'view') {
    const url = event.notification.data.url || '/';
    event.waitUntil(
      clients.openWindow(url)
    );
  }
});

// Message handling for cache control
self.addEventListener('message', event => {
  const { type, payload } = event.data;

  switch (type) {
    case 'CACHE_CLEAR':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;

    case 'CACHE_STATS':
      getCacheStats().then(stats => {
        event.ports[0].postMessage(stats);
      });
      break;

    case 'FORCE_UPDATE':
      forceUpdate().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;

    default:
      console.log('📨 Unknown message type:', type);
  }
});

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  const deletePromises = cacheNames
    .filter(name => name.startsWith('blaze-'))
    .map(name => caches.delete(name));

  await Promise.all(deletePromises);
  console.log('🧹 All caches cleared');
}

// Get cache statistics
async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {};

  for (const cacheName of cacheNames) {
    if (cacheName.startsWith('blaze-')) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      stats[cacheName] = {
        entries: keys.length,
        urls: keys.map(request => request.url)
      };
    }
  }

  return {
    version: CACHE_VERSION,
    caches: stats,
    timestamp: new Date().toISOString()
  };
}

// Force update
async function forceUpdate() {
  // Clear caches and force refresh
  await clearAllCaches();

  // Notify all clients to refresh
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'FORCE_REFRESH',
      message: 'Service worker updated - refreshing...'
    });
  });
}

console.log('🔥 Blaze Sports Intel Service Worker: Ready for championship performance!');