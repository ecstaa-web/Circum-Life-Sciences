/**
 * Circum STUDIO, Décorations admin (léger, GPU-friendly)
 */
(function (global) {
  'use strict';

  var revealObserver = null;

  function ensureBgLayer() {
    var main = document.querySelector('.admin-main');
    if (!main || main.querySelector('.admin-bg-layer')) return;
    var layer = document.createElement('div');
    layer.className = 'admin-bg-layer';
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML =
      '<div class="admin-bg-mesh"></div>' +
      '<div class="admin-bg-grid"></div>';
    main.insertBefore(layer, main.firstChild);
  }

  function ensureTopbarDecor() {
    var topbar = document.getElementById('admin-topbar');
    if (!topbar || topbar.querySelector('.admin-topbar-glow')) return;
    var glow = document.createElement('div');
    glow.className = 'admin-topbar-glow';
    glow.setAttribute('aria-hidden', 'true');
    topbar.appendChild(glow);
  }

  function initScrollReveal() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.studio-reveal').forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });
    }
    document.querySelectorAll('.studio-reveal:not(.is-visible)').forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  function decorateViewHeaders() {
    document.querySelectorAll('.admin-view .cms-view-header').forEach(function (hdr) {
      if (hdr.classList.contains('studio-header-done')) return;
      hdr.classList.add('studio-header-done', 'studio-view-header', 'studio-reveal');
      if (!hdr.querySelector('.cms-pages-eyebrow')) {
        var view = hdr.closest('.admin-view');
        var label = view && view.id ? view.id.replace('view-', '').replace(/-/g, ' ') : 'studio';
        var eyebrow = document.createElement('span');
        eyebrow.className = 'cms-pages-eyebrow';
        eyebrow.textContent = 'Circum STUDIO · ' + label;
        hdr.insertBefore(eyebrow, hdr.firstChild);
      }
    });
  }

  function init() {
    document.body.classList.add('admin-perf');
    ensureBgLayer();
    ensureTopbarDecor();
    decorateViewHeaders();
    initScrollReveal();
  }

  function refresh() {
    decorateViewHeaders();
    initScrollReveal();
  }

  global.CircumDecor = { init: init, refresh: refresh };
})(window);
