/* ==========================================================================
   CIRCUM LIFE SCIENCES — SHARED SCRIPTS
   ========================================================================== */

(function() {
  'use strict';

  // ===== Mobile nav toggle =====
  function initMobileNav() {
    var toggle = document.querySelector('.nav-toggle');
    var mobile = document.querySelector('.nav-mobile');
    if (!toggle || !mobile) return;
    toggle.addEventListener('click', function() {
      mobile.classList.toggle('open');
      var spans = toggle.querySelectorAll('span');
      var isOpen = mobile.classList.contains('open');
      spans[0].style.transform = isOpen ? 'rotate(45deg) translate(4px, 4px)' : '';
      spans[1].style.opacity = isOpen ? '0' : '1';
      spans[2].style.transform = isOpen ? 'rotate(-45deg) translate(5px, -5px)' : '';
      document.body.classList.toggle('nav-open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
      if (window.lenis) {
        if (isOpen && typeof window.lenis.stop === 'function') window.lenis.stop();
        else if (!isOpen && typeof window.lenis.start === 'function') window.lenis.start();
      }
    });
  }

  function initLogoHomeTransition() {
    var logo = document.querySelector('.nav-logo[href$="index.html"]');
    if (!logo) return;

    logo.addEventListener('click', function(event) {
      var targetHref = logo.getAttribute('href') || 'index.html';
      var currentPath = (window.location.pathname || '').replace(/\/+$/, '');
      var onHomePage = /(^|\/)index\.html$/i.test(currentPath) || currentPath === '' || currentPath === '/';

      if (onHomePage) {
        event.preventDefault();
        if (window.lenis && typeof window.lenis.scrollTo === 'function') {
          // Slower, fluid glide back to the top (easeOutExpo).
          window.lenis.scrollTo(0, {
            duration: 1.8,
            easing: function(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }
          });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }

      event.preventDefault();
      var start = window.scrollY || window.pageYOffset || 0;
      var duration = 180;
      var startTime = null;

      function animate(now) {
        if (startTime === null) startTime = now;
        var progress = Math.min((now - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        window.scrollTo(0, start * (1 - eased));

        if (progress < 1) {
          requestAnimationFrame(animate);
          return;
        }

        window.location.href = targetHref;
      }

      requestAnimationFrame(animate);
    });
  }

  // ===== Logo light/dark theming =====
  // Injects a white logo overlay so CSS can crossfade between the dark (color)
  // logo on light backgrounds and the light (white) logo on dark backgrounds.
  function initLogoTheme() {
    var DARK = 'assets/img/circum-logo-dark.png';
    var LIGHT = 'assets/img/circum-logo-light.png';
    // Preload both so the crossfade never flashes
    [DARK, LIGHT].forEach(function(s) { var im = new Image(); im.src = s; });

    document.querySelectorAll('.nav-logo').forEach(function(link) {
      var base = link.querySelector('.nav-logo-img');
      if (!base) return;
      base.classList.add('nav-logo-dark');
      base.setAttribute('src', DARK);
      if (!link.querySelector('.nav-logo-light')) {
        var light = document.createElement('img');
        light.className = 'nav-logo-img nav-logo-light';
        light.src = LIGHT;
        light.alt = '';
        light.setAttribute('aria-hidden', 'true');
        light.setAttribute('decoding', 'async');
        base.insertAdjacentElement('afterend', light);
      }
    });

    // Footer always sits on a dark navy background -> white logo
    document.querySelectorAll('.footer-logo-img').forEach(function(img) {
      img.setAttribute('src', LIGHT);
    });
  }

  // ===== Smooth scroll helpers (logo + in-page anchors) =====
  function navOffset() {
    var nav = document.querySelector('.nav');
    return (nav ? nav.getBoundingClientRect().height : 80) + 12;
  }

  function smoothScrollTo(target) {
    var off = navOffset();
    if (window.lenis && typeof window.lenis.scrollTo === 'function') {
      window.lenis.scrollTo(target, { offset: -off, duration: 1.15 });
    } else {
      var y = target.getBoundingClientRect().top + (window.scrollY || window.pageYOffset || 0) - off;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  }

  function closeMobileNav() {
    var mobile = document.querySelector('.nav-mobile.open');
    if (!mobile) return;
    mobile.classList.remove('open');
    document.body.style.overflow = '';
    var toggle = document.querySelector('.nav-toggle');
    if (toggle) {
      var spans = toggle.querySelectorAll('span');
      if (spans[0]) spans[0].style.transform = '';
      if (spans[1]) spans[1].style.opacity = '1';
      if (spans[2]) spans[2].style.transform = '';
    }
  }

  // Intercept clicks on links pointing to an anchor on the CURRENT page and
  // animate the scroll (same feel as the logo). Cross-page anchor links keep
  // navigating; scrollToHash() animates once the destination page loads.
  function initAnchorScroll() {
    var curPath = window.location.pathname.replace(/\/+$/, '');
    document.addEventListener('click', function(e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      var raw = a.getAttribute('href') || '';
      if (raw.indexOf('#') === -1) return;
      var url;
      try { url = new URL(a.href, window.location.href); } catch (_) { return; }
      if (!url.hash || url.hash === '#') return;
      var pureHash = raw.charAt(0) === '#';
      var samePath = url.pathname.replace(/\/+$/, '') === curPath;
      if (!pureHash && !samePath) return; // different page: let it navigate
      var id;
      try { id = decodeURIComponent(url.hash.slice(1)); } catch (_) { id = url.hash.slice(1); }
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      closeMobileNav();
      smoothScrollTo(target);
      if (window.history && window.history.pushState) {
        window.history.pushState(null, '', url.hash);
      }
    });
  }

  // ===== Floating localisation mini-map (hover) =====
  // Works on any element carrying data-map-lat / data-map-lng (apropos site
  // cards, home implantation cards, ...). Renders static OpenStreetMap tiles
  // with a centered pin — no zoom controls, no attribution banner.
  function initSiteMapBubble() {
    var cards = document.querySelectorAll('[data-map-lat]');
    if (!cards.length) return;
    if (window.matchMedia && window.matchMedia('(max-width: 640px)').matches) return;

    var bubble, mapEl, titleEl, coordsEl, loadedCard = null, rafId = null, mx = 0, my = 0;

    function build() {
      bubble = document.createElement('div');
      bubble.className = 'site-map-bubble';
      bubble.innerHTML =
        '<div class="site-map-bubble-head">' +
          '<span class="site-map-bubble-title"></span>' +
          '<span class="site-map-bubble-coords"></span>' +
        '</div>' +
        '<div class="site-map-bubble-map" title="\u00a9 OpenStreetMap">' +
          '<span class="site-map-bubble-pin">' +
            '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">' +
              '<path fill="#f365b4" stroke="#ffffff" stroke-width="1.4" d="M12 1.6c-4 0-7.2 3.1-7.2 7 0 5 7.2 13 7.2 13s7.2-8 7.2-13c0-3.9-3.2-7-7.2-7z"/>' +
              '<circle cx="12" cy="8.6" r="2.6" fill="#ffffff"/>' +
            '</svg>' +
          '</span>' +
        '</div>';
      document.body.appendChild(bubble);
      mapEl = bubble.querySelector('.site-map-bubble-map');
      titleEl = bubble.querySelector('.site-map-bubble-title');
      coordsEl = bubble.querySelector('.site-map-bubble-coords');
    }

    function fmtCoords(lat, lng) {
      return Math.abs(lat).toFixed(2) + '\u00b0' + (lat >= 0 ? 'N' : 'S') +
        ' \u00b7 ' + Math.abs(lng).toFixed(2) + '\u00b0' + (lng >= 0 ? 'E' : 'O');
    }

    function renderTiles(lat, lng, zoom) {
      var W = mapEl.clientWidth || 300, H = mapEl.clientHeight || 180;
      var scale = Math.pow(2, zoom);
      function lon2x(lon) { return (lon + 180) / 360 * scale; }
      function lat2y(la) { var r = la * Math.PI / 180; return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * scale; }
      var originX = lon2x(lng) * 256 - W / 2;
      var originY = lat2y(lat) * 256 - H / 2;
      var old = mapEl.querySelectorAll('img.tile');
      for (var i = 0; i < old.length; i++) old[i].parentNode.removeChild(old[i]);
      var pin = mapEl.querySelector('.site-map-bubble-pin');
      var t0x = Math.floor(originX / 256), t1x = Math.floor((originX + W) / 256);
      var t0y = Math.floor(originY / 256), t1y = Math.floor((originY + H) / 256);
      for (var tx = t0x; tx <= t1x; tx++) {
        for (var ty = t0y; ty <= t1y; ty++) {
          if (ty < 0 || ty >= scale) continue;
          var xt = ((tx % scale) + scale) % scale;
          var img = document.createElement('img');
          img.className = 'tile';
          img.alt = '';
          img.draggable = false;
          img.src = 'https://tile.openstreetmap.org/' + zoom + '/' + xt + '/' + ty + '.png';
          img.style.left = (tx * 256 - originX) + 'px';
          img.style.top = (ty * 256 - originY) + 'px';
          mapEl.insertBefore(img, pin);
        }
      }
    }

    function position() {
      rafId = null;
      if (!bubble) return;
      var bw = bubble.offsetWidth || 300, bh = bubble.offsetHeight || 220;
      var pad = 16, off = 20;
      var x = mx + off, y = my + off;
      if (x + bw + pad > window.innerWidth) x = mx - bw - off;
      if (y + bh + pad > window.innerHeight) y = my - bh - off;
      if (x < pad) x = pad;
      if (y < pad) y = pad;
      bubble.style.left = x + 'px';
      bubble.style.top = y + 'px';
    }

    function onMove(e) {
      mx = e.clientX; my = e.clientY;
      if (!rafId) rafId = requestAnimationFrame(position);
    }

    Array.prototype.forEach.call(cards, function (card) {
      card.addEventListener('mouseenter', function (e) {
        if (!bubble) build();
        mx = e.clientX; my = e.clientY;
        if (loadedCard !== card) {
          loadedCard = card;
          var lat = parseFloat(card.getAttribute('data-map-lat'));
          var lng = parseFloat(card.getAttribute('data-map-lng'));
          var zoom = parseInt(card.getAttribute('data-map-zoom'), 10) || 12;
          titleEl.textContent = card.getAttribute('data-map-label') || '';
          coordsEl.textContent = fmtCoords(lat, lng);
          renderTiles(lat, lng, zoom);
        }
        position();
        bubble.classList.add('is-visible');
      });
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', function () {
        if (bubble) bubble.classList.remove('is-visible');
      });
    });
  }

  // ===== Reveal on scroll =====
  function initReveal() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach(function(el) { el.classList.add('visible'); });
      return;
    }
    var obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(function(el) { obs.observe(el); });
  }

  // ===== Language switcher =====
  var STORAGE = 'circum.lang';
  var LANGS = ['fr','en','de','it'];

  function detectBrowserLang() {
    try {
      var nav = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || navigator.userLanguage || 'fr'];
      for (var i = 0; i < nav.length; i++) {
        var code = (nav[i] || '').toLowerCase().split('-')[0];
        if (LANGS.indexOf(code) > -1) return code;
      }
    } catch(e) {}
    return 'fr';
  }

  function getCurrentLang() {
    try {
      var saved = localStorage.getItem(STORAGE);
      if (saved && LANGS.indexOf(saved) > -1) return saved;
    } catch(e) {}
    // First visit: auto-detect navigator language (FR default)
    var detected = detectBrowserLang();
    try { localStorage.setItem(STORAGE, detected); } catch(e) {}
    return detected;
  }

  function setLangActive(lang) {
    document.querySelectorAll('.lang-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    moveLangIndicator(lang);
  }

  // Sliding indicator for the language pill
  function ensureLangIndicator() {
    var sw = document.querySelector('.lang-switch');
    if (!sw) return null;
    var ind = sw.querySelector('.lang-indicator');
    if (!ind) {
      ind = document.createElement('span');
      ind.className = 'lang-indicator';
      ind.setAttribute('aria-hidden', 'true');
      sw.insertBefore(ind, sw.firstChild);
    }
    return ind;
  }

  function moveLangIndicator(lang) {
    var sw = document.querySelector('.lang-switch');
    if (!sw) return;
    var ind = ensureLangIndicator();
    var target = sw.querySelector('.lang-btn[data-lang="' + lang + '"]');
    if (!ind || !target) return;
    var swRect = sw.getBoundingClientRect();
    var tRect = target.getBoundingClientRect();
    var left = tRect.left - swRect.left;
    var width = tRect.width;
    ind.style.left = left + 'px';
    ind.style.width = width + 'px';
  }

  var I18N = (typeof window.CIRCUM_I18N !== 'undefined') ? window.CIRCUM_I18N : {};

  // Charge les surcharges admin depuis l'API (MongoDB) et les fusionne dans I18N.
  function loadContentOverrides() {
    var base = (window.CIRCUM_API_BASE != null ? window.CIRCUM_API_BASE : '');
    return fetch(base + '/api/content/overrides', { credentials: 'same-origin' })
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(overrides) {
        if (!overrides) return;
        LANGS.forEach(function(lang) {
          if (overrides[lang]) Object.assign(I18N[lang], overrides[lang]);
        });
      })
      .catch(function() { /* hors ligne ou API indisponible : textes statiques */ });
  }

  function translatePage(lang) {
    if (!I18N[lang]) return;
    var dict = I18N[lang];

    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      var key = el.getAttribute('data-i18n');
      if (dict[key] !== undefined) el.innerHTML = dict[key];
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function(el) {
      var key = el.getAttribute('data-i18n-html');
      if (dict[key] === undefined) return;
      // Guard: do not overwrite containers that hold form controls (would destroy them)
      if (el.querySelector('input, select, textarea, button')) {
        // Translate the first <label> child instead, preserving controls
        var lbl = el.querySelector('label');
        if (lbl) lbl.innerHTML = dict[key];
        return;
      }
      el.innerHTML = dict[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (dict[key] !== undefined) el.placeholder = dict[key];
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function(el) {
      var key = el.getAttribute('data-i18n-aria');
      if (dict[key] !== undefined) el.setAttribute('aria-label', dict[key]);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function(el) {
      var key = el.getAttribute('data-i18n-title');
      if (dict[key] !== undefined) el.textContent = dict[key];
    });
    document.querySelectorAll('[data-i18n-alt]').forEach(function(el) {
      var key = el.getAttribute('data-i18n-alt');
      if (dict[key] !== undefined) el.setAttribute('alt', dict[key]);
    });

    var pageId = document.body.dataset.page;
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && pageId && dict['meta.' + pageId + '.description']) {
      metaDesc.setAttribute('content', dict['meta.' + pageId + '.description']);
    }

    document.documentElement.setAttribute('lang', lang);
  }

  function applyLang(lang) {
    if (!I18N[lang]) return;
    try { localStorage.setItem(STORAGE, lang); } catch(e) {}
    setLangActive(lang);
    translatePage(lang);
    requestAnimationFrame(function(){ moveLangIndicator(lang); });
  }

  window.CIRCUM_I18N_API = {
    getLang: getCurrentLang,
    setLang: applyLang,
    translate: translatePage
  };

  function initLangSwitcher() {
    var current = getCurrentLang();
    ensureLangIndicator();
    applyLang(current);
    document.querySelectorAll('.lang-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        var lang = btn.dataset.lang;
        applyLang(lang);
      });
    });
    window.addEventListener('resize', function() {
      var saved = (function(){
        try { return localStorage.getItem(STORAGE) || 'fr'; } catch(e) { return 'fr'; }
      })();
      moveLangIndicator(saved);
    });
  }

  // ===== Nav scroll state (glass intensifies on scroll) =====
  function initNavScroll() {
    var nav = document.querySelector('.nav');
    if (!nav) return;
    var ticking = false;
    var SCROLL_THRESHOLD = 40;

    function getScrollY() {
      if (window.lenis && typeof window.lenis.scroll === 'number') {
        return window.lenis.scroll;
      }
      return window.scrollY || window.pageYOffset || 0;
    }

    function needsLenisTransformPin() {
      return document.documentElement.classList.contains('lenis')
        && document.getElementById('lenis-root') == null;
    }

    function applyFixedPin(scrollY) {
      var pin = needsLenisTransformPin() ? 'translate3d(0,' + scrollY + 'px,0)' : '';
      nav.style.transform = pin;
      var mobile = document.querySelector('.nav-mobile.open');
      if (mobile) mobile.style.transform = pin;
    }

    function update() {
      var scrollY = getScrollY();
      nav.classList.toggle('scrolled', scrollY > SCROLL_THRESHOLD);
      nav.classList.toggle('nav-lenis-pinned', needsLenisTransformPin());
      applyFixedPin(scrollY);
      ticking = false;
    }

    function scheduleUpdate() {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }

    function bindLenis() {
      if (window.lenis && typeof window.lenis.on === 'function') {
        window.lenis.on('scroll', scheduleUpdate);
        return true;
      }
      return false;
    }

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('circum:lenis-ready', function() {
      bindLenis();
      update();
    });
    if (!bindLenis()) {
      setTimeout(function() {
        bindLenis();
        update();
      }, 300);
    }
    update();
  }

  // ===== File input display =====
  function initFileInputs() {
    document.querySelectorAll('.form-file input[type="file"]').forEach(function(input) {
      input.addEventListener('change', function() {
        var name = this.files && this.files[0] ? this.files[0].name : '';
        var wrap = this.closest('.form-file');
        if (!wrap) return;
        var nameEl = wrap.querySelector('.form-file-name');
        if (!nameEl) {
          nameEl = document.createElement('span');
          nameEl.className = 'form-file-name';
          wrap.appendChild(nameEl);
        }
        nameEl.textContent = name ? '✓ ' + name : '';
      });
    });
  }

  // ===== Form submission (real backend) =====
  var API_BASE_FALLBACK = 'http://127.0.0.1:8000/api';

  function isLocalDevHost() {
    var h = window.location.hostname;
    return h === 'localhost' || h === '127.0.0.1';
  }

  function getApiBase() {
    if (window.__circumResolvedApiBase) return window.__circumResolvedApiBase;
    if (window.CIRCUM_API_BASE != null) return window.CIRCUM_API_BASE + '/api';
    return '/api';
  }

  function rememberApiBaseFromUrl(fullUrl) {
    var idx = fullUrl.indexOf('/api');
    if (idx >= 0) window.__circumResolvedApiBase = fullUrl.slice(0, idx + 4);
  }

  function apiFetchUrls(path) {
    var urls = [];
    var port = window.location.port;
    var onProxyPort = port === '3000';
    if (isLocalDevHost() && !onProxyPort) {
      urls.push(API_BASE_FALLBACK + path);
    }
    urls.push(getApiBase() + path);
    if (isLocalDevHost() && onProxyPort && urls.indexOf(API_BASE_FALLBACK + path) === -1) {
      urls.push(API_BASE_FALLBACK + path);
    }
    return urls;
  }

  function fetchJsonApi(path, options) {
    options = options || {};
    var urls = apiFetchUrls(path);
    function attempt(i) {
      if (i >= urls.length) return Promise.reject(new Error('API unavailable'));
      return fetch(urls[i], options).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json().then(function (json) {
          rememberApiBaseFromUrl(urls[i]);
          return json;
        });
      }).catch(function (err) {
        if (i + 1 < urls.length) return attempt(i + 1);
        throw err;
      });
    }
    return attempt(0);
  }

  function showMessage(messageEl, text, isError) {
    if (!messageEl) return;
    messageEl.classList.remove('show', 'error');
    messageEl.classList.add('show');
    if (isError) messageEl.classList.add('error');
    messageEl.textContent = text;
    try { window.scrollTo({ top: messageEl.offsetTop - 100, behavior: 'smooth' }); } catch (e) {}
  }

  function ensureHoneypot(form) {
    if (form.querySelector('[name="website"]')) return;
    var hp = document.createElement('div');
    hp.className = 'form-honeypot';
    hp.setAttribute('aria-hidden', 'true');
    var input = document.createElement('input');
    input.type = 'text';
    input.name = 'website';
    input.tabIndex = -1;
    input.autocomplete = 'off';
    hp.appendChild(input);
    form.insertBefore(hp, form.firstChild);
  }

  function submitNewsletter(form) {
    var consentCb = form.querySelector('input[type="checkbox"][name="consent"], input[type="checkbox"][id*="consent"], input[type="checkbox"][required]');
    var implicitConsent = form.getAttribute('data-implicit-consent') === 'true';
    var websiteEl = form.querySelector('[name="website"]');
    var data = {
      firstname: (form.querySelector('[name="firstname"]') || {}).value || '',
      lastname: (form.querySelector('[name="lastname"]') || {}).value || '',
      email: (form.querySelector('[name="email"]') || {}).value || '',
      company: (form.querySelector('[name="company"]') || {}).value || '',
      role: (form.querySelector('[name="role"]') || {}).value || '',
      lang: (form.querySelector('[name="lang"]') || {}).value || getCurrentLang(),
      consent: consentCb ? !!consentCb.checked : implicitConsent,
      website: websiteEl ? websiteEl.value : ''
    };
    // strip-form (email only): synthesize names
    if (!data.firstname && data.email) data.firstname = data.email.split('@')[0];
    if (!data.lastname) data.lastname = '-';
    return fetch(getApiBase() + '/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  function submitCareers(form) {
    var fd = new FormData(form);
    return fetch(getApiBase() + '/careers/apply', { method: 'POST', body: fd });
  }

  function submitContact(form) {
    var fd = new FormData(form);
    fd.set('lang', getCurrentLang());
    return fetch(getApiBase() + '/contact/submit', { method: 'POST', body: fd });
  }

  function initForms() {
    document.querySelectorAll('form[data-form]').forEach(function(form) {
      ensureHoneypot(form);
      form.addEventListener('submit', function(e) {
        e.preventDefault();

        var required = form.querySelectorAll('[required]');
        var valid = true;
        required.forEach(function(field) {
          if (!field.value || (field.type === 'checkbox' && !field.checked)) {
            valid = false;
            field.style.borderColor = 'var(--error)';
          } else {
            field.style.borderColor = '';
          }
        });

        var messageEl = form.querySelector('.form-message');
        var type = form.dataset.form;
        var L = I18N[getCurrentLang()] || {};

        if (!valid) {
          showMessage(messageEl, L['form.error.required'] || 'Veuillez compléter les champs obligatoires.', true);
          return;
        }

        var submitBtn = form.querySelector('[type="submit"]');
        var orig = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = L['form.sending'] || 'Envoi en cours...';
        }

        var req;
        if (type === 'newsletter') req = submitNewsletter(form);
        else if (type === 'careers') req = submitCareers(form);
        else if (type === 'contact') req = submitContact(form);
        else req = submitContact(form);

        req.then(function(res) {
          return res.ok ? res.json() : res.json().then(function(j) { throw new Error(j.detail || 'error'); }).catch(function() { throw new Error('HTTP ' + res.status); });
        }).then(function() {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = orig; }
          form.reset();
          var successKey = 'form.success.' + (type || 'default');
          showMessage(messageEl, L[successKey] || L['form.success.default'] || 'Merci, votre demande a bien été envoyée.', false);
        }).catch(function(err) {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = orig; }
          showMessage(messageEl, (L['form.error.server'] || 'Erreur lors de l\'envoi. Veuillez réessayer.') + ' (' + (err.message || 'network') + ')', true);
        });
      });
    });
  }

  var PAGE_VIDEOS = {
    'index.html': 'assets/video/hero.mp4',
    'apropos.html': 'assets/video/apropos-hero.mp4',
    'design.html': 'assets/video/design-hero.mp4',
    'fabrication.html': 'assets/video/fabrication-hero.mp4',
    'clients.html': 'assets/video/clients-hero.mp4',
    'contact.html': 'assets/video/contact-hero.mp4',
    'newsletter.html': 'assets/video/clients-hero.mp4',
    'carrieres.html': 'assets/video/fabrication-hero.mp4'
  };

  function initVideoPrefetch() {
    function warmFromHref(href) {
      if (!href) return;
      var path = href.split('#')[0].split('?')[0];
      if (!path || path.indexOf('://') !== -1) return;
      var file = path.split('/').pop() || 'index.html';
      if (file === '' || path === '/') file = 'index.html';
      var videoSrc = PAGE_VIDEOS[file];
      if (!videoSrc) return;
      if (window.CircumHeroVideo && typeof window.CircumHeroVideo.warm === 'function') {
        window.CircumHeroVideo.warm(videoSrc, true);
        return;
      }
      var preload = document.createElement('link');
      preload.rel = 'prefetch';
      preload.as = 'fetch';
      preload.href = videoSrc;
      preload.crossOrigin = 'anonymous';
      document.head.appendChild(preload);
    }
    document.querySelectorAll('a[href]').forEach(function (link) {
      function warm() {
        warmFromHref(link.getAttribute('href'));
      }
      link.addEventListener('mouseenter', warm, { passive: true });
      link.addEventListener('focus', warm, { passive: true });
      link.addEventListener('touchstart', warm, { passive: true, once: true });
    });
  }

  function initSmoothScroll() {
    if (!('requestAnimationFrame' in window) || !('addEventListener' in window)) return;
    // Skip on touch devices: native momentum is smoother than JS lerp.
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var targetScroll = window.scrollY;
    var isAnimating = false;
    var ease = 0.12; // lower = smoother but slower

    function maxScroll() {
      return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    }

    function animate() {
      var current = window.scrollY;
      var delta = targetScroll - current;
      if (Math.abs(delta) < 0.5) {
        window.scrollTo(0, targetScroll);
        isAnimating = false;
        return;
      }
      window.scrollTo(0, current + delta * ease);
      requestAnimationFrame(animate);
    }

    // Keep target in sync if user scrolls via keyboard, anchor, or programmatic scroll
    window.addEventListener('scroll', function () {
      if (!isAnimating) targetScroll = window.scrollY;
    }, { passive: true });

    window.addEventListener('wheel', function(event) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      // Ignore very small touchpad deltas to keep native feel on macOS trackpads using pixel mode
      // Only smooth-lerp for real mouse-wheel "lines/pages" mode (deltaMode > 0) and large pixel deltas.
      var d = event.deltaY;
      if (event.deltaMode === 0 && Math.abs(d) < 25) return;
      event.preventDefault();
      targetScroll = Math.max(0, Math.min(targetScroll + d * 1.1, maxScroll()));
      if (!isAnimating) {
        isAnimating = true;
        requestAnimationFrame(animate);
      }
    }, { passive: false });

    // Smooth anchor links
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var href = a.getAttribute('href');
        if (!href || href === '#' || href.length < 2) return;
        var target = document.getElementById(href.slice(1));
        if (!target) return;
        e.preventDefault();
        var rect = target.getBoundingClientRect();
        targetScroll = Math.max(0, Math.min(window.scrollY + rect.top - 80, maxScroll()));
        if (!isAnimating) { isAnimating = true; requestAnimationFrame(animate); }
      });
    });
  }

  function scrollToHash() {
    var hash = window.location.hash.slice(1);
    if (!hash) return;
    var id;
    try { id = decodeURIComponent(hash); } catch (_) { id = hash; }
    var target = document.getElementById(id);
    if (!target) return;
    function run() {
      var off = navOffset();
      if (window.lenis && typeof window.lenis.scrollTo === 'function') {
        // Start from the top so the scroll is visibly animated on arrival
        window.lenis.scrollTo(0, { immediate: true });
        requestAnimationFrame(function() {
          window.lenis.scrollTo(target, { offset: -off, duration: 1.3 });
        });
      } else {
        window.scrollTo(0, 0);
        var y = target.getBoundingClientRect().top + (window.scrollY || 0) - off;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    }
    // Wait for Lenis (created in the per-page module after main.js) and layout
    setTimeout(run, 260);
  }

  // ===== Count-up animation for numbers (rolling effect) =====
  function initCountUpAnimation() {
    if (!('IntersectionObserver' in window)) return;
    
    var countedElements = new Set();
    
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting && !countedElements.has(entry.target)) {
          countedElements.add(entry.target);
          animateRollingCountUp(entry.target);
        }
      });
    }, { threshold: 0.5 });
    
    document.querySelectorAll('.figure-value, .fabrication-stat-value').forEach(function(el) {
      observer.observe(el);
    });
  }

  function animateRollingCountUp(element) {
    var text = element.textContent.trim();
    var explicitTarget = element.getAttribute('data-count-target');
    var suffix = element.getAttribute('data-count-suffix') || '';
    var match = text.match(/^[\d\s,/.+-]+/);
    if (!match && !explicitTarget) return;

    var finalValue = explicitTarget ? parseInt(explicitTarget, 10) : parseInt(match[0].replace(/[\s,/+.]/g, ''), 10);
    if (isNaN(finalValue)) return;
    
    var startValue = 0;
    var duration = 1800; // 1.8 seconds for rapid rolling effect
    var startTime = Date.now();
    var originalHTML = element.innerHTML;
    var isRolling = true;
    
    function updateCount() {
      var elapsed = Date.now() - startTime;
      var progress = Math.min(elapsed / duration, 1);
      
      // Easing function: ease-out-quart (fast start, slow end for smooth landing)
      var easeProgress = 1 - Math.pow(1 - progress, 4);
      var currentValue = Math.floor(startValue + (finalValue - startValue) * easeProgress);
      
      // Format with thousands separator
      var formattedValue = currentValue.toLocaleString('fr-FR');
      
      // Preserve any existing sup element or explicit suffix (/5, etc.)
      var supMatch = originalHTML.match(/<sup>[^<]*<\/sup>/);
      var newHTML = formattedValue + (supMatch ? supMatch[0] : suffix);
      element.innerHTML = newHTML;
      
      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        // Ensure final value is exactly displayed
        element.innerHTML = originalHTML;
        isRolling = false;
      }
    }
    
    updateCount();
  }

  // ===== Dynamic news loader =====
  var NEWS_FALLBACK = [
    { id: 'a1000001-0000-4000-8000-000000000001', title: 'Compamed & Medica Düsseldorf', summary: 'Circum Life Sciences sera au prochain salon Compamed à Düsseldorf du 17 au 20 novembre 2025 — Hall 8 B, Booth D03.', tag: 'Salon', date: '2025-11-17', variant: 1, body_html: '<p>Circum Life Sciences sera au prochain salon Compamed à Düsseldorf du <strong>17 au 20 novembre 2025</strong>, Hall 8 B, Booth D03.</p><p>Venez rencontrer nos équipes pour découvrir nos capacités CDMO intégrées — de la conception à la fabrication.</p>' },
    { id: 'a1000001-0000-4000-8000-000000000002', title: 'Inauguration Force One', summary: 'Inauguration officielle de notre site de production Force One en Tunisie.', tag: 'Inauguration', date: '2025-10-15', variant: 2, body_html: '<p>Inauguration officielle du site <strong>Force One</strong> — notre nouvelle usine ISO 7.</p><p>4 000 m² de bâtiment, 700 m² de salle propre, avec possibilités d\'extension. Moulage, assemblage et stérilisation sous notre système qualité intégré.</p>' },
    { id: 'a1000001-0000-4000-8000-000000000003', title: 'Communiqué de presse — 2 octobre 2025', summary: 'Publication du communiqué de presse officiel de Circum Life Sciences.', tag: 'Presse', date: '2025-10-02', variant: 3, body_html: '<p>Communiqué de presse du <strong>2 octobre 2025</strong> — COMMUNIQUE_PRESSE_021025.</p><p>Retrouvez l\'ensemble de nos actualités et publications sur cette page News &amp; Media.</p>' },
    { id: 'a1000001-0000-4000-8000-000000000004', title: 'Commission européenne : exclusion des entreprises chinoises', summary: 'La Commission européenne limite la part des intrants originaires de Chine dans les achats publics de dispositifs médicaux de plus de 5 M€.', tag: 'Réglementaire', date: '2025-06-01', variant: 4, body_html: '<p>La Commission européenne a décidé d\'exclure les entreprises chinoises des achats, par les pouvoirs publics de l\'Union européenne, de dispositifs médicaux d\'un montant supérieur à 5 millions d\'euros.</p><p>Cette mesure limite à 50 % la part que les intrants originaires de Chine peuvent représenter dans les offres retenues.</p><p><a href="https://ec.europa.eu/commission/presscorner/detail/fr/ip_25_1569" rel="noopener noreferrer" target="_blank">Lire le communiqué de la Commission européenne</a></p>' },
    { id: 'a1000001-0000-4000-8000-000000000005', title: 'WHX Dubai — Booth S11.D18A', summary: 'Retrouvez-nous au WHX expo à Dubaï sur notre stand S11.D18A.', tag: 'Salon', date: '2026-02-01', variant: 5, body_html: '<p>You can visit us in Dubai at <strong>WHX expo</strong> on our booth <strong>S11.D18A</strong>.</p><p>Meet our team and discover our vertically integrated CDMO capabilities for medical devices.</p>' },
    { id: 'a1000001-0000-4000-8000-000000000006', title: 'DeviceMed — Mars 2026', summary: 'Circum Life Sciences au DeviceMed en mars 2026.', tag: 'Presse', date: '2026-03-01', variant: 6, body_html: '<p><strong>DeviceMed</strong> — Mars 2026.</p><p>Retrouvez Circum Life Sciences dans les pages de DeviceMed pour nos dernières actualités industrielles et réglementaires.</p>' },
    { id: 'a1000001-0000-4000-8000-000000000007', title: 'Happy New Year — Bonne Année 2026', summary: 'Happy New Year — Bonne Année — Frohes neues Jahr — Buon Anno.', tag: 'Actualité', date: '2026-01-01', variant: 1, body_html: '<p><strong>Happy New Year</strong> — Bonne Année — Frohes neues Jahr — Buon Anno.</p><p>Toute l\'équipe Circum Life Sciences vous souhaite une excellente année 2026, riche en innovations et en partenariats durables.</p>' }
  ];

  function getNewsFallbackById(id) {
    for (var i = 0; i < NEWS_FALLBACK.length; i++) {
      if (NEWS_FALLBACK[i].id === id) return NEWS_FALLBACK[i];
    }
    return null;
  }

  function formatDateForLocale(iso, lang) {
    try {
      var d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      var localeMap = { fr: 'fr-FR', en: 'en-GB', de: 'de-DE', it: 'it-IT' };
      var locale = localeMap[lang] || 'fr-FR';
      return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) { return iso; }
  }

  function escapeHTML(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function newsMediaUrl(filename) {
    if (!filename) return '';
    return getApiBase() + '/news/media/' + encodeURIComponent(filename);
  }

  function renderNewsArticle(root, article) {
    var lang = getCurrentLang();
    var coverHtml = article.cover_image
      ? '<div class="news-article-cover"><img src="' + escapeHTML(newsMediaUrl(article.cover_image)) + '" alt=""/></div>'
      : '<div class="news-article-cover news-article-cover-fallback v' + (article.variant || 1) + '"></div>';
    var gallery = (article.gallery || []).map(function (name) {
      return '<figure class="news-article-gallery-item"><img src="' + escapeHTML(newsMediaUrl(name)) + '" alt=""/></figure>';
    }).join('');
    root.innerHTML =
      coverHtml +
      '<div class="news-article-meta">' +
        '<span class="news-article-tag">' + escapeHTML(article.tag) + '</span>' +
        '<time class="news-article-date">' + escapeHTML(formatDateForLocale(article.date, lang)) + '</time>' +
      '</div>' +
      '<h1 class="news-article-title">' + escapeHTML(article.title) + '</h1>' +
      '<div class="news-article-body prose">' + (article.body_html || ('<p>' + escapeHTML(article.summary || '') + '</p>')) + '</div>' +
      (gallery ? '<div class="news-article-gallery">' + gallery + '</div>' : '');
    document.title = article.title + ' · Circum Life Sciences';
  }

  function renderNewsGrid(grid, items) {
    var lang = getCurrentLang();
    grid.innerHTML = items.map(function (n, idx) {
      var variant = !n.cover_image && n.variant && n.variant !== 1 ? ' v' + n.variant : '';
      var visualStyle = n.cover_image
        ? ' style="background-image:url(\'' + newsMediaUrl(n.cover_image).replace(/'/g, '%27') + '\');"'
        : '';
      var card =
        '<article class="news-card reveal visible">' +
          '<div class="news-card-visual' + variant + '"' + visualStyle + '>' +
            '<span class="news-card-tag">' + escapeHTML(n.tag) + '</span>' +
          '</div>' +
          '<div class="news-card-body">' +
            '<div class="news-card-date">' + escapeHTML(formatDateForLocale(n.date, lang)) + '</div>' +
            '<h3 class="news-card-title">' + escapeHTML(n.title) + '</h3>' +
            '<p class="news-card-summary">' + escapeHTML(n.summary) + '</p>' +
          '</div>' +
        '</article>';
      if (n.id) {
        return '<a class="news-card-link" href="news-article.html?id=' + encodeURIComponent(n.id) + '" data-testid="news-card-' + idx + '">' + card + '</a>';
      }
      return '<div class="news-card-link" data-testid="news-card-' + idx + '">' + card + '</div>';
    }).join('');
  }

  function initDynamicNews() {
    if ((document.body.dataset || {}).page !== 'news') return;
    var grid = document.querySelector('.news-grid');
    if (!grid) return;

    renderNewsGrid(grid, NEWS_FALLBACK);

    fetchJsonApi('/news').then(function (items) {
      if (Array.isArray(items) && items.length) {
        renderNewsGrid(grid, items);
      }
    }).catch(function () { /* garde les cartes fallback cliquables */ });
  }

  function initNewsArticle() {
    if ((document.body.dataset || {}).page !== 'news-article') return;
    var params = new URLSearchParams(window.location.search);
    var id = params.get('id');
    var root = document.getElementById('news-article-root');
    if (!id || !root) {
      if (root) root.innerHTML = '<p class="news-article-error">Article introuvable.</p>';
      return;
    }

    var fallback = getNewsFallbackById(id);
    if (fallback) renderNewsArticle(root, fallback);

    fetchJsonApi('/news/' + encodeURIComponent(id)).then(function (article) {
      renderNewsArticle(root, article);
    }).catch(function () {
      if (!fallback) {
        root.innerHTML = '<p class="news-article-error">Article introuvable ou indisponible.</p>';
      }
    });
  }

  function monthLabel(iso, lang) {
    try {
      var d = new Date(iso);
      var localeMap = { fr: 'fr-FR', en: 'en-GB', de: 'de-DE', it: 'it-IT' };
      var locale = localeMap[lang] || 'fr-FR';
      return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    } catch (e) { return iso; }
  }

  function initDynamicIssues() {
    if ((document.body.dataset || {}).page !== 'newsletter') return;
    var grid = document.getElementById('newsletter-archives');
    if (!grid) return;

    fetch(getApiBase() + '/newsletter/issues').then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (data) {
      if (!data || !Array.isArray(data.items) || !data.items.length) return;
      var lang = getCurrentLang();
      grid.innerHTML = data.items.map(function (i, idx) {
        var label = monthLabel(i.date, lang);
        // capitalize first letter
        label = label.charAt(0).toUpperCase() + label.slice(1);
        var inner =
          '<div class="newsletter-issue-num"><strong>' + escapeHTML(i.quarter) + '</strong><span>' + escapeHTML(String(i.year)) + '</span></div>' +
          '<div>' +
            '<div class="newsletter-issue-date">' + escapeHTML(label) + '</div>' +
            '<h3 class="newsletter-issue-title">' + escapeHTML(i.title) + '</h3>' +
            '<p class="newsletter-issue-summary">' + escapeHTML(i.summary) + '</p>' +
            (i.link ? '<a class="newsletter-issue-link" href="' + escapeHTML(i.link) + '" target="_blank" rel="noopener">Lire le numéro →</a>' : '<span class="newsletter-issue-link">Lire le numéro →</span>') +
          '</div>';
        if (i.link) {
          return '<a class="newsletter-issue" data-testid="issue-card-' + idx + '" href="' + escapeHTML(i.link) + '" target="_blank" rel="noopener" style="text-decoration:none;color:inherit;">' + inner + '</a>';
        }
        return '<div class="newsletter-issue" data-testid="issue-card-' + idx + '">' + inner + '</div>';
      }).join('');
    }).catch(function () { /* keep static fallback */ });
  }

  function maybeLoadVisualEditor() {
    if (window.parent === window) return;
    if (new URLSearchParams(location.search).get('circum_edit') !== '1') return;
    var s = document.createElement('script');
    s.src = '/js/visual-editor.js';
    s.async = true;
    document.body.appendChild(s);
  }

  // ===== Init all =====
  document.addEventListener('DOMContentLoaded', function() {
    if ('scrollRestoration' in history) {
      try { history.scrollRestoration = 'manual'; } catch (e) {}
    }
    initMobileNav();
    initLogoTheme();
    initLogoHomeTransition();
    initAnchorScroll();
    initSiteMapBubble();
    initReveal();
    initDynamicNews();
    initNewsArticle();
    loadContentOverrides().then(function() {
      initLangSwitcher();
      initNavScroll();
      initFileInputs();
      initForms();
      initVideoPrefetch();
      initCountUpAnimation();
      initDynamicIssues();
      scrollToHash();
      maybeLoadVisualEditor();
    });
  });
})();
