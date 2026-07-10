'use strict';

var CACHE = 'circum-hero-videos-v2';
var VIDEO_FILES = [
  'hero.mp4',
  'apropos-hero.mp4',
  'design-hero.mp4',
  'fabrication-hero.mp4',
  'clients-hero.mp4',
  'contact-hero.mp4'
];

function videoUrls() {
  return VIDEO_FILES.map(function (file) {
    return new URL('assets/video/' + file, self.location).href;
  });
}

function isHeroVideo(url) {
  return url.pathname.indexOf('/assets/video/') !== -1 && /\.mp4$/i.test(url.pathname);
}

self.addEventListener('install', function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return Promise.all(
        videoUrls().map(function (url) {
          return fetch(url).then(function (response) {
            if (response.ok) return cache.put(url, response);
          }).catch(function () {});
        })
      );
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (key) { return key !== CACHE; }).map(function (key) {
          return caches.delete(key);
        })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;

  var url;
  try { url = new URL(request.url); } catch (e) { return; }
  if (!isHeroVideo(url)) return;

  event.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(request).then(function (cached) {
        if (cached) return cached;
        return fetch(request).then(function (response) {
          if (response.ok) cache.put(request, response.clone());
          return response;
        });
      });
    })
  );
});
