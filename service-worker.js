const CACHE = 'tpk-analyzer-cache-v1';
const FILES = ['/', '/index.html', '/style.css', '/script.js', '/manifest.json'];
self.addEventListener('install', (evt) => {
  evt.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener('activate', (evt) => {
  evt.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => { if(k !== CACHE) return caches.delete(k); }))));
  self.clients.claim();
});
self.addEventListener('fetch', (evt) => {
  evt.respondWith(caches.match(evt.request).then(r => r || fetch(evt.request)));
});
