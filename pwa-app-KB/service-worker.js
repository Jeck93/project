const CACHE_NAME = 'pwa-app-v10-fixed-errors'; // Updated version - fixed service worker and netlify errors
const urlsToCache = [
  './',
  './login.html',
  './index.html',
  './form.html',
  './edit.html',
  './status.html',
  './css/performance-optimized.css',
  './css/login-style.css',
  './js/auth.js',
  './js/app.js',
  './js/form.js',
  './js/edit.js',
  './js/sheets-api.js',
  './js/db-utils.js',
  './js/theme-toggle-optimized.js',
  './js/performance-optimized.js',
  './js/revenue-analytics.js',
  // Note: timestamp-utils.js is intentionally NOT cached to avoid stale function issues
  './manifest.json',
  './img/images.jfif'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('PWA App cache opened');
        // Cache files individually to handle missing files gracefully
        return Promise.allSettled(
          urlsToCache.map(url => {
            return cache.add(url).catch(error => {
              console.warn(`Failed to cache ${url}:`, error);
              // Don't fail the entire installation if one file fails
              return null;
            });
          })
        );
      })
      .then(() => {
        console.log('Service worker installation completed');
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service worker installation failed:', error);
      })
  );
});

// Fetch event - serve from cache, block Netlify Identity
self.addEventListener('fetch', event => {
  const url = event.request.url;
  
  // Block Netlify Identity requests
  if (url.includes('netlify-identity') || 
      url.includes('gotrue') ||
      url.includes('identity.netlify.com')) {
    console.log('🚫 Blocked Netlify Identity request:', url);
    event.respondWith(new Response(null, { 
      status: 204,
      statusText: 'No Content'
    }));
    return;
  }
  
  // Skip CSP reporting URLs and Google-specific URLs that cause issues
  if (url.includes('csp.withgoogle.com') || 
      url.includes('googletagmanager.com') ||
      url.includes('google-analytics.com') ||
      url.includes('googlesyndication.com')) {
    console.log('Skipping problematic URL:', url);
    return; // Let the browser handle these requests normally
  }
  
  // Always fetch timestamp-utils.js fresh (no cache) to avoid stale function issues
  if (url.includes('timestamp-utils.js')) {
    console.log('Bypassing cache for timestamp-utils.js to ensure fresh version');
    event.respondWith(
      fetch(event.request.clone()).catch(error => {
        console.warn('Failed to fetch fresh timestamp-utils.js:', error);
        // If network fails, try cache as last resort
        return caches.match(event.request);
      })
    );
    return;
  }

  // Network-first for config.js so credential/config updates take effect immediately
  if (url.includes('config.js')) {
    console.log('Bypassing cache for config.js to ensure fresh configuration');
    event.respondWith(
      fetch(event.request.clone()).then(response => {
        return response;
      }).catch(error => {
        console.warn('Failed to fetch config.js from network, falling back to cache:', error);
        return caches.match(event.request);
      })
    );
    return;
  }
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        // Clone the request because it's a stream
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response because it's a stream
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              // Only cache same-origin requests (but not timestamp-utils.js)
              if (event.request.url.startsWith(self.location.origin) && 
                  !event.request.url.includes('timestamp-utils.js')) {
                cache.put(event.request, responseToCache);
              }
            })
            .catch(error => {
              console.warn('Failed to cache response:', error);
            });
          
          return response;
        }).catch(error => {
          console.warn('Fetch failed for:', event.request.url, error);
          // If fetch fails, try to return cached version or fallback
          return caches.match('./index.html');
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Claim control of all clients
      return self.clients.claim();
    })
  );
});