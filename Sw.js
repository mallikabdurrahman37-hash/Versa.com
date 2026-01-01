const CACHE_NAME = 'versa-app-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/manifest.json',
  '/css/style.css',
  '/css/responsive.css',
  '/js/firebase-config.js',
  '/js/auth.js',
  '/assets/logo.png',
  '/assets/3d-bg.png'
];

// 1. Install Event (Cache the files)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching all assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// 2. Fetch Event (Serve files from cache if offline)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached file if found, otherwise fetch from internet
        return response || fetch(event.request);
      })
  );
});

// 3. Activate Event (Clean up old caches)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
});
