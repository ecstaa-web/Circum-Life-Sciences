(function () {
  'use strict';

  var STORAGE = 'nereis.lang';
  var dict = {
    fr: {
      'nav.collection': 'Collection',
      'nav.maison': 'La Maison',
      'nav.experiences': 'Expériences',
      'nav.concierge': 'Concierge',
      'nav.contact': 'Audience privée',
      'hero.kicker': 'Maison fondée à Monaco · MMXIV',
      'hero.title': 'L’horizon, <em>comme demeure.</em>',
      'hero.lede': 'Nereïs assemble, acquiert et confie les yachts d’exception — du day boat carboné au navire explorateur. Une maison discrète, pour ceux qui ne demandent jamais le prix en premier.',
      'hero.cta1': 'Entrer dans la collection',
      'hero.cta2': 'Demander une audience',
      'hero.meta': 'Port Hercules',
      'hero.scroll': 'Défiler',
      'footer.rights': 'Tous droits réservés.'
    },
    en: {
      'nav.collection': 'Collection',
      'nav.maison': 'The House',
      'nav.experiences': 'Experiences',
      'nav.concierge': 'Concierge',
      'nav.contact': 'Private audience',
      'hero.kicker': 'House founded in Monaco · MMXIV',
      'hero.title': 'The horizon, <em>as a home.</em>',
      'hero.lede': 'Nereïs sources, commissions and places exceptional yachts — from carbon day boats to explorer vessels. A discreet house, for those who never ask the price first.',
      'hero.cta1': 'Enter the collection',
      'hero.cta2': 'Request an audience',
      'hero.meta': 'Port Hercules',
      'hero.scroll': 'Scroll',
      'footer.rights': 'All rights reserved.'
    }
  };

  function detect() {
    try {
      var saved = localStorage.getItem(STORAGE);
      if (saved === 'fr' || saved === 'en') return saved;
    } catch (e) {}
    var nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'fr';
    return String(nav).toLowerCase().indexOf('en') === 0 ? 'en' : 'fr';
  }

  function apply(lang) {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var value = dict[lang] && dict[lang][key];
      if (value) el.textContent = value;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-html');
      var value = dict[lang] && dict[lang][key];
      if (value) el.innerHTML = value;
    });
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });
    try { localStorage.setItem(STORAGE, lang); } catch (e) {}
  }

  var current = detect();
  apply(current);
  document.querySelectorAll('.lang-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      apply(btn.getAttribute('data-lang'));
    });
  });
})();
