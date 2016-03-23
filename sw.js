const cacheName = 'v1::static';

self.addEventListener('install', e => {
  // once the SW is installed, go ahead and fetch the resources
  // to make this work offline
  e.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll([
        '/laser-game-canvas/',
        'css/fonts/icons.woff',
        'css/style.css',
        'config.js',
        'game.js',
        'interface.js',
        'levels.js',
        'modernizr.js',
        'mouse.js',
        'utils.js',
        'sounds/blackhole.wav',
        'sounds/init.wav',
        'sounds/prism.wav',
        'sounds/tap.wav',
        'sounds/glass.wav',
        'sounds/mirror.wav',
        'sounds/solution.wav',
        'sounds/victory.wav'
      ]).then(() => self.skipWaiting());
    })
  );
});

// when the browser fetches a url, either response with
// the cached object or go ahead and fetch the actual url
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});