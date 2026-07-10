/* Merges common + page dictionaries; used by main.js. */
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
      "carrieres.benefit_text.31": "Zug, Nice, Sousse : nos équipes circulent entre les sites pour les projets transverses. Une opportunité d'expérience européenne réelle.",
      "form.sending": "Envoi en cours...",
      "form.error.required": "Veuillez compléter les champs obligatoires.",
      "form.error.server": "Erreur lors de l'envoi. Veuillez réessayer.",
      "form.error.wp": "Les formulaires seront actifs une fois le site publié sur WordPress.",
      "form.success.default": "Merci, votre demande a bien été envoyée.",
      "form.success.newsletter": "Merci, vous êtes inscrit à la newsletter.",
      "form.success.contact": "Merci, votre demande a bien été envoyée.",
      "form.success.careers": "Merci, votre candidature a bien été envoyée."
    },
    en: {
      "home.world_site_city.39": "Zug · Switzerland",
      "home.world_site_city.40": "Nice · France",
      "home.world_site_city.41": "Sousse · Tunisia",
      "carrieres.benefit_text.31": "Zug, Nice, Sousse: our teams move across sites for cross-functional projects. Real European experience on the ground.",
      "form.sending": "Sending...",
      "form.error.required": "Please complete the required fields.",
      "form.error.server": "Error while sending. Please try again.",
      "form.error.wp": "Forms will be active once the site is published on WordPress.",
      "form.success.default": "Thank you, your request has been sent.",
      "form.success.newsletter": "Thank you, you are subscribed to the newsletter.",
      "form.success.contact": "Thank you, your request has been sent.",
      "form.success.careers": "Thank you, your application has been sent."
    },
    de: {
      "home.world_site_city.39": "Zug · Schweiz",
      "home.world_site_city.40": "Nizza · Frankreich",
      "home.world_site_city.41": "Sousse · Tunesien",
      "carrieres.benefit_text.31": "Zug, Nizza, Sousse: standortübergreifende Projekte mit echter europäischer Erfahrung.",
      "form.sending": "Wird gesendet...",
      "form.error.required": "Bitte füllen Sie die Pflichtfelder aus.",
      "form.error.server": "Fehler beim Senden. Bitte erneut versuchen.",
      "form.error.wp": "Formulare sind aktiv, sobald die Website auf WordPress veröffentlicht ist.",
      "form.success.default": "Vielen Dank, Ihre Anfrage wurde gesendet.",
      "form.success.newsletter": "Vielen Dank, Sie sind für den Newsletter angemeldet.",
      "form.success.contact": "Vielen Dank, Ihre Anfrage wurde gesendet.",
      "form.success.careers": "Vielen Dank, Ihre Bewerbung wurde gesendet."
    },
    it: {
      "home.world_site_city.39": "Zugo · Svizzera",
      "home.world_site_city.40": "Nizza · Francia",
      "home.world_site_city.41": "Sousse · Tunisia",
      "carrieres.benefit_text.31": "Zugo, Nizza, Sousse: team operativi tra i siti per progetti trasversali.",
      "form.sending": "Invio in corso...",
      "form.error.required": "Compilate i campi obbligatori.",
      "form.error.server": "Errore durante l'invio. Riprovate.",
      "form.error.wp": "I moduli saranno attivi una volta pubblicato il sito su WordPress.",
      "form.success.default": "Grazie, la vostra richiesta è stata inviata.",
      "form.success.newsletter": "Grazie, siete iscritti alla newsletter.",
      "form.success.contact": "Grazie, la vostra richiesta è stata inviata.",
      "form.success.careers": "Grazie, la vostra candidatura è stata inviata."
    }
  });
})();
