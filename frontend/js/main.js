/* Nereïs — shared interactions */
(function () {
  'use strict';

  var cursor = document.querySelector('.cursor');
  var dot = document.querySelector('.cursor-dot');
  var mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  var pos = { x: mouse.x, y: mouse.y };

  function tick() {
    pos.x += (mouse.x - pos.x) * 0.16;
    pos.y += (mouse.y - pos.y) * 0.16;
    if (cursor) cursor.style.transform = 'translate(' + pos.x + 'px,' + pos.y + 'px)';
    if (dot) dot.style.transform = 'translate(' + mouse.x + 'px,' + mouse.y + 'px)';
    requestAnimationFrame(tick);
  }

  if (window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('mousemove', function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest('a, button, .filter-chip, input, textarea, select, .gallery img')) {
        if (cursor) cursor.classList.add('is-hover');
      }
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest('a, button, .filter-chip, input, textarea, select, .gallery img')) {
        if (cursor) cursor.classList.remove('is-hover');
      }
    });
    tick();
  }

  var preloader = document.querySelector('.preloader');
  window.addEventListener('load', function () {
    setTimeout(function () {
      if (preloader) preloader.classList.add('hide');
      document.body.classList.add('page-enter');
    }, 700);
  });
  setTimeout(function () {
    if (preloader) preloader.classList.add('hide');
  }, 2800);

  var header = document.querySelector('.site-header');
  var progress = document.querySelector('.header-progress');
  function onScroll() {
    var y = window.scrollY || 0;
    if (header) header.classList.toggle('scrolled', y > 24);
    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var toggle = document.querySelector('.menu-toggle');
  var mobile = document.querySelector('.mobile-nav');
  if (toggle && mobile) {
    toggle.addEventListener('click', function () {
      var open = !mobile.classList.contains('open');
      mobile.classList.toggle('open', open);
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    mobile.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mobile.classList.remove('open');
        toggle.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('visible'); });
  }

  document.querySelectorAll('[data-count]').forEach(function (el) {
    var target = Number(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    var started = false;
    function run() {
      if (started) return;
      started = true;
      var start = performance.now();
      function frame(now) {
        var t = Math.min(1, (now - start) / 1400);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (t < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
    if ('IntersectionObserver' in window) {
      var cio = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { run(); cio.disconnect(); }
      }, { threshold: 0.4 });
      cio.observe(el);
    } else run();
  });

  var year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());

  window.Nereis = window.Nereis || {};
  window.Nereis.formatPrice = function (n) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  };
})();
