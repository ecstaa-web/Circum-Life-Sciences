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
      if (dict[key] !== undefined) el.innerHTML = dict[key];
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

  // ===== Form submission (demo, no backend) =====
  function initForms() {
    document.querySelectorAll('form[data-form]').forEach(function(form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Basic required validation
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
        if (!valid) {
          if (messageEl) {
            messageEl.classList.remove('show');
            messageEl.classList.add('show', 'error');
            var errKey = 'form.error.required';
            messageEl.textContent = (I18N[getCurrentLang()] && I18N[getCurrentLang()][errKey]) || 'Veuillez compléter les champs obligatoires.';
          }
          return;
        }

        // Simulate submit
        var submitBtn = form.querySelector('[type="submit"]');
        if (submitBtn) {
          var orig = submitBtn.innerHTML;
          submitBtn.disabled = true;
          var sendingKey = 'form.sending';
          var cur = getCurrentLang();
          submitBtn.innerHTML = (I18N[cur] && I18N[cur][sendingKey]) || 'Envoi en cours...';
          setTimeout(function() {
            submitBtn.disabled = false;
            submitBtn.innerHTML = orig;
            form.reset();
            if (messageEl) {
              messageEl.classList.remove('error');
              messageEl.classList.add('show');
              var type = form.dataset.form;
              var L = I18N[getCurrentLang()] || {};
              if (type === 'newsletter') {
                messageEl.textContent = L['form.success.newsletter'] || messageEl.textContent;
              } else if (type === 'careers') {
                messageEl.textContent = L['form.success.careers'] || messageEl.textContent;
              } else if (type === 'contact') {
                messageEl.textContent = L['form.success.contact'] || messageEl.textContent;
              } else {
                messageEl.textContent = L['form.success.default'] || messageEl.textContent;
              }
              window.scrollTo({ top: messageEl.offsetTop - 100, behavior: 'smooth' });
            }
          }, 1200);
        }
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

  // ===== Logo scroll to top animation =====
  function initLogoScrollToTop() {
    var logo = document.querySelector('.nav-logo');
    if (!logo) return;

    logo.addEventListener('click', function(e) {
      var isOnHome = document.body.dataset.page === 'home';
      if (isOnHome) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
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
    initLogoScrollToTop();
    scrollToHash();
  });
})();
