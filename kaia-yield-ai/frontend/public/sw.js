// =======================================================
// KAIA YIELD AI - SERVICE WORKER
// PWA Service Worker for LINE Mini dApp caching and offline support
// =======================================================

const CACHE_NAME = 'kaia-yield-ai-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/line-dapp',
  '/manifest.json',
  '/offline.html',
  // Add your static assets here
];

// API endpoints to cache with network-first strategy
const API_CACHE_PATTERNS = [
  /^\/api\/strategies/,
  /^\/api\/yield/,
  /^\/api\/game/,
  /^\/api\/analytics/
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching static resources');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Failed to cache static resources:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all pages
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Handle API requests
  if (isApiRequest(url)) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  // Default: network first, then cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => cache.put(request, responseClone))
            .catch((error) => console.log('Cache put error:', error));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request)
          .then((cachedResponse) => {
            return cachedResponse || caches.match(OFFLINE_URL);
          });
      })
  );
});

// Handle navigation requests (pages)
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Cache the response
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());

    return networkResponse;
  } catch (error) {
    console.log('📱 Network failed, serving from cache');

    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fallback to offline page
    return caches.match(OFFLINE_URL);
  }
}

// Handle API requests with network-first strategy and background sync
async function handleApiRequest(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    // Try network first
    const networkResponse = await fetch(request);

    if (networkResponse.status === 200) {
      // Cache successful API responses (with shorter TTL)
      const responseClone = networkResponse.clone();

      // Add timestamp to cached response
      const responseWithTimestamp = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: {
          ...Object.fromEntries(responseClone.headers.entries()),
          'sw-cache-timestamp': Date.now().toString()
        }
      });

      cache.put(request, responseWithTimestamp);
    }

    return networkResponse;
  } catch (error) {
    console.log('🌐 API network failed, checking cache');

    // Try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      // Check if cached response is still valid (5 minutes for API responses)
      const cacheTimestamp = cachedResponse.headers.get('sw-cache-timestamp');
      const isStale = cacheTimestamp && (Date.now() - parseInt(cacheTimestamp)) > 5 * 60 * 1000;

      if (!isStale) {
        console.log('📦 Serving fresh cached API response');
        return cachedResponse;
      } else {
        console.log('⏰ Cached API response is stale');
      }
    }

    // Return a fallback response for API failures
    return new Response(JSON.stringify({
      success: false,
      error: 'Network unavailable',
      cached: true,
      message: 'You are offline. Some data may be outdated.'
    }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  const cache = await caches.open(CACHE_NAME);

  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    console.log('📦 Serving cached static asset');
    return cachedResponse;
  }

  // Try network
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('❌ Failed to fetch static asset:', request.url);

    // Return a placeholder or fallback
    return new Response('', {
      status: 404,
      statusText: 'Not Found'
    });
  }
}

// Helper functions
function isApiRequest(url) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
}

function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.woff', '.woff2'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext));
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);

  if (event.tag === 'background-sync-api') {
    event.waitUntil(replayFailedApiRequests());
  }
});

// Replay failed API requests when online
async function replayFailedApiRequests() {
  try {
    // Get failed requests from IndexedDB or cache
    const failedRequests = await getFailedRequests();

    for (const requestData of failedRequests) {
      try {
        const response = await fetch(requestData.url, requestData.options);
        if (response.ok) {
          console.log('✅ Successfully replayed request:', requestData.url);
          // Remove from failed requests list
          await removeFailedRequest(requestData.id);
        }
      } catch (error) {
        console.log('❌ Failed to replay request:', requestData.url, error);
      }
    }
  } catch (error) {
    console.error('Background sync error:', error);
  }
}

// Handle push notifications for USDT yield updates
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification received');

  let notificationData = {
    title: 'KAIA YIELD AI',
    body: 'You have new updates!',
    icon: '/images/icon-192x192.png',
    badge: '/images/badge-72x72.png',
    tag: 'kaia-yield-update',
    data: {
      url: '/line-dapp'
    }
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.log('Failed to parse push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'View Details',
          icon: '/images/action-view.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/images/action-dismiss.png'
        }
      ]
    })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'view' || !event.action) {
    const urlToOpen = event.notification.data?.url || '/line-dapp';

    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if the app is already open
          for (const client of clientList) {
            if (client.url.includes(urlToOpen) && 'focus' in client) {
              return client.focus();
            }
          }

          // Open new window/tab
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

// Helper functions for failed request management
async function getFailedRequests() {
  // Implement IndexedDB storage for failed requests
  return [];
}

async function removeFailedRequest(id) {
  // Implement removal from IndexedDB
}

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('📨 Message received in SW:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

console.log('🤖 KAIA YIELD AI Service Worker loaded successfully');