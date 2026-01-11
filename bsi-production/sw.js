/**
 * Blaze Sports Intel - Service Worker
 * Provides offline capabilities, caching, and PWA features
 */

const CACHE_VERSION = 'bsi-v3';
const CACHE_NAME = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const SCORES_CACHE = `${CACHE_VERSION}-scores`;

// IndexedDB for scores
const DB_NAME = 'bsi-offline';
const DB_VERSION = 1;
const SCORES_STORE = 'scores';
const MAX_GAMES_PER_SPORT = 10;

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

// ========================================
// IndexedDB Helpers for Offline Scores
// ========================================

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(SCORES_STORE)) {
        const store = db.createObjectStore(SCORES_STORE, { keyPath: 'sport' });
        store.createIndex('lastUpdated', 'lastUpdated', { unique: false });
      }
    };
  });
}

async function saveScores(sport, games) {
  try {
    const db = await openDB();
    const tx = db.transaction(SCORES_STORE, 'readwrite');
    const store = tx.objectStore(SCORES_STORE);

    // Limit to MAX_GAMES_PER_SPORT most recent games
    const limitedGames = Array.isArray(games) ? games.slice(0, MAX_GAMES_PER_SPORT) : [];

    store.put({
      sport,
      games: limitedGames,
      lastUpdated: new Date().toISOString(),
      cachedAt: Date.now()
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch (e) {
    console.error('[BSI SW] Error saving scores:', e);
  }
}

async function getScores(sport) {
  try {
    const db = await openDB();
    const tx = db.transaction(SCORES_STORE, 'readonly');
    const store = tx.objectStore(SCORES_STORE);

    return new Promise((resolve) => {
      const request = store.get(sport);
      request.onsuccess = () => {
        db.close();
        resolve(request.result || null);
      };
      request.onerror = () => {
        db.close();
        resolve(null);
      };
    });
  } catch (e) {
    console.error('[BSI SW] Error getting scores:', e);
    return null;
  }
}

// Parse sport from API path
function parseSportFromPath(pathname) {
  const matches = pathname.match(/\/api\/(mlb|nfl|nba|ncaa|college-baseball|cfb|ncaab)\/scores/);
  return matches ? matches[1] : null;
}

// Handle scores requests with enhanced caching
async function handleScoresRequest(request, sport) {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Clone before reading
      const clonedResponse = networkResponse.clone();
      const data = await clonedResponse.json();

      // Save to IndexedDB for offline use
      const games = data.games || data.scores || data;
      if (Array.isArray(games)) {
        saveScores(sport, games);
      }

      // Return network response with offline indicator
      const modifiedData = {
        ...data,
        _offline: false,
        _cachedAt: null
      };

      return new Response(JSON.stringify(modifiedData), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-BSI-Source': 'network'
        }
      });
    }

    // Network failed, fall through to offline cache
    throw new Error('Network response not ok');
  } catch (e) {
    // Network failed, try IndexedDB
    console.log('[BSI SW] Network failed, checking offline cache for', sport);
    const cached = await getScores(sport);

    if (cached) {
      const offlineData = {
        games: cached.games,
        _offline: true,
        _cachedAt: cached.lastUpdated,
        _message: 'Showing cached scores from ' + new Date(cached.lastUpdated).toLocaleString('en-US', {
          timeZone: 'America/Chicago',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        })
      };

      return new Response(JSON.stringify(offlineData), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-BSI-Source': 'offline-cache'
        }
      });
    }

    // No cached data available
    return new Response(JSON.stringify({
      games: [],
      _offline: true,
      _cachedAt: null,
      _message: 'No cached scores available. Connect to the internet to load scores.'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-BSI-Source': 'offline-empty'
      }
    });
  }
}

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

  // Enhanced caching for score API calls with IndexedDB
  const sport = parseSportFromPath(url.pathname);
  if (sport && url.pathname.includes('/scores')) {
    event.respondWith(handleScoresRequest(request, sport));
    return;
  }

  // Stale-while-revalidate for other API calls
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
