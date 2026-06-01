/* Merges common + page dictionaries; used by main.js */
(function () {
  'use strict';
  window.CIRCUM_I18N = { fr: {}, en: {}, de: {}, it: {} };
  var langs = ['fr', 'en', 'de', 'it'];

  function merge(source) {
    if (!source) return;
    langs.forEach(function (lang) {
      if (source[lang]) Object.assign(window.CIRCUM_I18N[lang], source[lang]);
    });
  }

  merge(window.CIRCUM_I18N_COMMON);
  merge(window.CIRCUM_I18N_PAGE);
})();
