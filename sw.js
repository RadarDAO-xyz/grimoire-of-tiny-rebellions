const CACHE = 'grimoire-v1';

const SHELL = [
  '/',
  '/index.html',
  '/guestbook.html',
  '/origins.html',
  '/grimoire-index.html',
  '/css/style.css',
  '/js/config.js',
  '/js/field.js',
  '/js/guestbook.js',
  '/manifest.json',
  '/assets/background/clouds2.png',
  '/assets/cards_rect_fb.png',
  '/assets/cards_rectangle_noshadow.png',
  '/assets/cards_sq_fb.png',
  '/assets/radar-logo.png',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/assets/icons/apple-touch-icon.png',
  '/data/charms.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // don't intercept Supabase or cross-origin requests
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
