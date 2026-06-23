(function () {
  'use strict';

  var SLOW_PAGES = { contact: true, design: true };
  var MAX_WARM = 2;

  var ALL_VIDEOS = [
    'assets/video/hero.mp4',
    'assets/video/apropos-hero.mp4',
    'assets/video/design-hero.mp4',
    'assets/video/fabrication-hero.mp4',
    'assets/video/clients-hero.mp4',
    'assets/video/contact-hero.mp4'
  ];

  var blobCache = window.__circumHeroBlobCache || (window.__circumHeroBlobCache = new Map());
  var warmPending = Object.create(null);
  var warmQueue = [];
  var warmActive = 0;

  function markReady(video) {
    if (video.classList.contains('is-ready')) return;
    video.classList.add('is-ready');
  }

  function applyBlobIfCached(video) {
    var original = video.getAttribute('data-hero-src') || video.getAttribute('src');
    if (!original || original.indexOf('blob:') === 0) {
      original = video.getAttribute('data-hero-src');
    }
    if (!original) return null;
    if (!video.getAttribute('data-hero-src')) {
      video.setAttribute('data-hero-src', original);
    }
    var blobUrl = blobCache.get(original);
    if (blobUrl) {
      video.src = blobUrl;
    }
    return original;
  }

  function storeBlob(src, blob) {
    if (!src || !blob || blobCache.has(src)) return;
    blobCache.set(src, URL.createObjectURL(blob));
  }

  function drainWarmQueue() {
    while (warmActive < MAX_WARM && warmQueue.length) {
      var src = warmQueue.shift();
      if (!src || blobCache.has(src) || warmPending[src]) continue;
      warmPending[src] = true;
      warmActive += 1;
      fetch(src, { credentials: 'same-origin' })
        .then(function (response) {
          if (!response.ok) throw new Error('warm failed');
          return response.blob();
        })
        .then(function (blob) {
          storeBlob(src, blob);
        })
        .catch(function () {})
        .finally(function () {
          warmPending[src] = false;
          warmActive -= 1;
          drainWarmQueue();
        });
    }
  }

  function warmVideo(src, priority) {
    if (!src || blobCache.has(src) || warmPending[src]) return;
    if (priority) {
      warmQueue.unshift(src);
    } else {
      warmQueue.push(src);
    }
    drainWarmQueue();
  }

  function warmAllVideosExcept(current) {
    ALL_VIDEOS.forEach(function (src) {
      if (src !== current) warmVideo(src, false);
    });
  }

  function warmNavTargets() {
    document.querySelectorAll('.nav-links a[href], .nav-mobile a[href], .footer-list a[href]').forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href) return;
      var path = href.split('#')[0].split('?')[0];
      if (!path || path.indexOf('://') !== -1) return;
      var file = path.split('/').pop() || 'index.html';
      if (file === '' || path === '/') file = 'index.html';
      var map = {
        'index.html': 'assets/video/hero.mp4',
        'apropos.html': 'assets/video/apropos-hero.mp4',
        'design.html': 'assets/video/design-hero.mp4',
        'fabrication.html': 'assets/video/fabrication-hero.mp4',
        'clients.html': 'assets/video/clients-hero.mp4',
        'contact.html': 'assets/video/contact-hero.mp4',
        'newsletter.html': 'assets/video/clients-hero.mp4',
        'carrieres.html': 'assets/video/fabrication-hero.mp4'
      };
      if (map[file]) warmVideo(map[file], true);
    });
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('sw.js', { scope: './' }).catch(function () {});
  }

  function initHeroVideo(video) {
    if (!video || video.dataset.heroInit === '1') return;
    video.dataset.heroInit = '1';

    var page = document.body && document.body.getAttribute('data-page');
    if (page && SLOW_PAGES[page]) {
      video.playbackRate = 0.55;
    }

    var src = applyBlobIfCached(video);
    if (src) warmVideo(src, true);

    function onReady() {
      markReady(video);
    }

    if (video.readyState >= 1) {
      onReady();
    } else {
      video.addEventListener('loadedmetadata', onReady, { once: true });
      video.addEventListener('loadeddata', onReady, { once: true });
      video.addEventListener('canplay', onReady, { once: true });
    }

    video.play().catch(function () {});
  }

  function boot() {
    document.querySelectorAll('.hero-video-bg').forEach(initHeroVideo);
    warmNavTargets();
    var currentSrc = null;
    document.querySelectorAll('.hero-video-bg').forEach(function (video) {
      var src = video.getAttribute('data-hero-src') || video.getAttribute('src');
      if (src && src.indexOf('blob:') !== 0) currentSrc = src;
    });
    var idleWarm = function () {
      if (navigator.connection && navigator.connection.saveData) return;
      warmAllVideosExcept(currentSrc);
    };
    if ('requestIdleCallback' in window) {
      requestIdleCallback(idleWarm, { timeout: 800 });
    } else {
      setTimeout(idleWarm, 500);
    }
    registerServiceWorker();
  }

  window.addEventListener('pageshow', function (event) {
    if (!event.persisted) return;
    document.querySelectorAll('.hero-video-bg').forEach(function (video) {
      video.classList.remove('is-ready');
      video.dataset.heroInit = '';
      applyBlobIfCached(video);
      try { video.currentTime = 0; } catch (e) {}
      initHeroVideo(video);
    });
  });

  window.CircumHeroVideo = {
    warm: warmVideo,
    ALL: ALL_VIDEOS
  };

  boot();
})();
