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
      document.body.style.overflow = isOpen ? 'hidden' : '';
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

  function initLangSwitcher() {
    var current = getCurrentLang();
    ensureLangIndicator();
    setLangActive(current);
    translatePage(current);
    // Defer position to next frame so layout is settled
    requestAnimationFrame(function(){ moveLangIndicator(current); });
    document.querySelectorAll('.lang-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        var lang = btn.dataset.lang;
        try { localStorage.setItem(STORAGE, lang); } catch(e) {}
        setLangActive(lang);
        translatePage(lang);
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
    function update() {
      var y = window.scrollY || window.pageYOffset || 0;
      nav.classList.toggle('scrolled', y > 12);
      ticking = false;
    }
    window.addEventListener('scroll', function() {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
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
  var API_BASE = (window.CIRCUM_API_BASE || '') + '/api';

  function showMessage(messageEl, text, isError) {
    if (!messageEl) return;
    messageEl.classList.remove('show', 'error');
    messageEl.classList.add('show');
    if (isError) messageEl.classList.add('error');
    messageEl.textContent = text;
    try { window.scrollTo({ top: messageEl.offsetTop - 100, behavior: 'smooth' }); } catch (e) {}
  }

  function submitNewsletter(form) {
    var consentCb = form.querySelector('input[type="checkbox"][id*="consent"], input[type="checkbox"][required]');
    var data = {
      firstname: (form.querySelector('[name="firstname"]') || {}).value || '',
      lastname: (form.querySelector('[name="lastname"]') || {}).value || '',
      email: (form.querySelector('[name="email"]') || {}).value || '',
      company: (form.querySelector('[name="company"]') || {}).value || '',
      role: (form.querySelector('[name="role"]') || {}).value || '',
      lang: (form.querySelector('[name="lang"]') || {}).value || getCurrentLang(),
      consent: consentCb ? !!consentCb.checked : true
    };
    // strip-form (email only): synthesize names
    if (!data.firstname && data.email) data.firstname = data.email.split('@')[0];
    if (!data.lastname) data.lastname = '-';
    return fetch(API_BASE + '/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  function submitCareers(form) {
    var fd = new FormData(form);
    return fetch(API_BASE + '/careers/apply', { method: 'POST', body: fd });
  }

  function submitContact(form) {
    // No dedicated endpoint -> reuse newsletter store as a generic lead (best-effort), or fail gracefully.
    var data = {
      firstname: (form.querySelector('[name="firstname"]') || {}).value || 'Contact',
      lastname: (form.querySelector('[name="lastname"]') || {}).value || '-',
      email: (form.querySelector('[name="email"]') || {}).value || '',
      company: (form.querySelector('[name="company"]') || {}).value || '',
      role: (form.querySelector('[name="subject"]') || form.querySelector('[name="role"]') || {}).value || '',
      lang: getCurrentLang(),
      consent: true
    };
    return fetch(API_BASE + '/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  function initForms() {
    document.querySelectorAll('form[data-form]').forEach(function(form) {
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

  function initHomeVideo() {
    var video = document.querySelector('.hero-video-bg');
    if (video) video.play().catch(function() {});
  }

  function initSmoothScroll() {
    if (!('requestAnimationFrame' in window) || !('addEventListener' in window)) return;
    var targetScroll = window.scrollY;
    var isAnimating = false;

    function animate() {
      var current = window.scrollY;
      var delta = targetScroll - current;
      if (Math.abs(delta) < 0.5) {
        isAnimating = false;
        return;
      }
      window.scrollTo(0, current + delta * 0.14);
      requestAnimationFrame(animate);
    }

    window.addEventListener('wheel', function(event) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      event.preventDefault();
      targetScroll += event.deltaY * 1.2;
      targetScroll = Math.max(0, Math.min(targetScroll, document.documentElement.scrollHeight - window.innerHeight));
      if (!isAnimating) {
        isAnimating = true;
        requestAnimationFrame(animate);
      }
    }, { passive: false });
  }

  function scrollToHash() {
    var hash = window.location.hash.slice(1);
    if (!hash) return;
    var target = document.getElementById(hash);
    if (target) {
      setTimeout(function() {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
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
    
    document.querySelectorAll('.figure-value').forEach(function(el) {
      observer.observe(el);
    });
  }

  function animateRollingCountUp(element) {
    var text = element.textContent.trim();
    var match = text.match(/^([\d,]+)/);
    if (!match) return;
    
    var finalValue = parseInt(match[1].replace(/,/g, ''), 10);
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
      
      // Preserve the sup element (m², +, %)
      var supMatch = originalHTML.match(/<sup>[^<]*<\/sup>/);
      var newHTML = formattedValue + (supMatch ? supMatch[0] : '');
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

  function initDynamicNews() {
    if ((document.body.dataset || {}).page !== 'news') return;
    var grid = document.querySelector('.news-grid');
    if (!grid) return;

    fetch(API_BASE + '/news').then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function(items) {
      if (!Array.isArray(items) || !items.length) return;
      var lang = getCurrentLang();
      grid.innerHTML = items.map(function(n, idx) {
        var variant = n.variant && n.variant !== 1 ? ' v' + n.variant : '';
        return '' +
          '<article class="news-card reveal visible" data-testid="news-card-' + idx + '">' +
            '<div class="news-card-visual' + variant + '">' +
              '<span class="news-card-tag">' + escapeHTML(n.tag) + '</span>' +
            '</div>' +
            '<div class="news-card-body">' +
              '<div class="news-card-date">' + escapeHTML(formatDateForLocale(n.date, lang)) + '</div>' +
              '<h3 class="news-card-title">' + escapeHTML(n.title) + '</h3>' +
              '<p class="news-card-summary">' + escapeHTML(n.summary) + '</p>' +
            '</div>' +
          '</article>';
      }).join('');
    }).catch(function() { /* keep static fallback if API fails */ });
  }

  // ===== Init all =====
  document.addEventListener('DOMContentLoaded', function() {
    initMobileNav();
    initReveal();
    initLangSwitcher();
    initNavScroll();
    initFileInputs();
    initForms();
    initHomeVideo();
    initCountUpAnimation();
    initDynamicNews();
    scrollToHash();
  });
})();
