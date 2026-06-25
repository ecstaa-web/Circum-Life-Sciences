/* Merges common + page dictionaries; used by main.js.
   Surcharges admin (MongoDB) fusionnées ensuite dans main.js via /api/content/overrides. */
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
  merge(window.CIRCUM_I18N_SITE);
  merge(window.CIRCUM_I18N_GLOBAL);
  merge({
    fr: {
      "home.world_site_city.39": "Zug · Suisse",
      "home.world_site_city.40": "Nice · France",
      "home.world_site_city.41": "Sousse · Tunisie",
      "carrieres.benefit_text.31": "Zug, Nice, Sousse : nos équipes circulent entre les sites pour les projets transverses. Une opportunité d'expérience européenne réelle."
    },
    en: {
      "home.world_site_city.39": "Zug · Switzerland",
      "home.world_site_city.40": "Nice · France",
      "home.world_site_city.41": "Sousse · Tunisia",
      "carrieres.benefit_text.31": "Zug, Nice, Sousse: our teams move across sites for cross-functional projects. Real European experience on the ground."
    },
    de: {
      "home.world_site_city.39": "Zug · Schweiz",
      "home.world_site_city.40": "Nizza · Frankreich",
      "home.world_site_city.41": "Sousse · Tunesien",
      "carrieres.benefit_text.31": "Zug, Nizza, Sousse: standortübergreifende Projekte mit echter europäischer Erfahrung."
    },
    it: {
      "home.world_site_city.39": "Zugo · Svizzera",
      "home.world_site_city.40": "Nizza · Francia",
      "home.world_site_city.41": "Sousse · Tunisia",
      "carrieres.benefit_text.31": "Zugo, Nizza, Sousse: team operativi tra i siti per progetti trasversali."
    }
  });
})();
