// A "service worker" is a small script the browser runs in the background,
// separate from your page. Its main job here: cache key files so the site
// still loads (in a basic form) even with no internet connection.

const CACHE_NAME = 'rooms-master-cache-v5';

// Files to save for offline use. Keep this list to the essentials —
// caching every single photo would make installs slow.
const FILES_TO_CACHE = [
  'index.html',
  'style.css',
  'upgrade.css',
  'script.js',
  'coffee-details.js',
  'manifest.json'
];

// Runs once, when the service worker is first installed.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// Cleans up old cache versions when a new service worker takes over.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Every time the page requests a file, check the cache first.
// If it's not cached, fall back to the real network request.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
