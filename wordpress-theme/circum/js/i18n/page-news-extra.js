(function () {
  'use strict';
  if (!window.CIRCUM_I18N_PAGE) return;

  var extra = {
    fr: {
      "news.page_hero_title.2": "News &amp; <em>Media.</em>",
      "news.news_card_title.22": "Compamed & Medica Düsseldorf",
      "news.news_card_summary.26": "Notre site tunisien atteint sa pleine capacité opérationnelle avec 4 cleanrooms ISO 7/8 et 120 opérateurs qualifiés.",
      "news.news_card_summary.27": "Notre système qualité est reconduit sans réserve par l'organisme certificateur. Audit annuel passé sur les trois sites.",
      "news.news_card_summary.28": "Circum sera présent du 16 au 19 novembre 2026 sur le stand E-23. Réservez votre créneau avec nos équipes commerciales.",
      "news.news_card_summary.29": "Notre équipe publie une analyse de 40 pages sur les bénéfices de l'intégration verticale dans le secteur des dispositifs médicaux.",
      "news.news_card_summary.30": "Signature d'un partenariat de recherche avec l'Université de Nice sur les polymères biocompatibles avancés. Trois thèses CIFRE lancées.",
      "news.news_card_summary.31": "Lancement des travaux d'une nouvelle cleanroom ISO 7 sur le site Force One. Mise en service prévue au troisième trimestre 2026.",
      "news.empty_articles.32": "Aucune actualité publiée pour le moment. Revenez bientôt pour découvrir nos dernières nouvelles."
    },
    en: {
      "news.page_hero_title.2": "News &amp; <em>Media.</em>",
      "news.news_card_title.22": "Compamed & Medica Düsseldorf",
      "news.news_card_summary.26": "Our Tunisian site reaches full operational capacity with 4 ISO 7/8 cleanrooms and 120 qualified operators.",
      "news.news_card_summary.27": "Our quality management system is renewed without reservation by the certification body. Annual audit passed across all three sites.",
      "news.news_card_summary.28": "Circum will be present from 16 to 19 November 2026 on stand E-23. Book your slot with our sales teams.",
      "news.news_card_summary.29": "Our team publishes a 40-page analysis on the benefits of vertical integration in the medical device sector.",
      "news.news_card_summary.30": "Signing of a research partnership with the University of Nice on advanced biocompatible polymers. Three CIFRE doctoral theses launched.",
      "news.news_card_summary.31": "Construction work begins on a new ISO 7 cleanroom at the Force One site. Commissioning planned for the third quarter of 2026.",
      "news.empty_articles.32": "No news has been published yet. Check back soon for our latest updates."
    },
    de: {
      "news.page_hero_title.2": "News &amp; <em>Media.</em>",
      "news.news_card_title.22": "Compamed & Medica Düsseldorf",
      "news.news_card_summary.26": "Unser tunesischer Standort erreicht die volle Betriebskapazität mit 4 Reinräumen der Klasse ISO 7/8 und 120 qualifizierten Mitarbeitenden.",
      "news.news_card_summary.27": "Unser Qualitätsmanagementsystem wird von der Zertifizierungsstelle ohne Vorbehalt verlängert. Jährliches Audit an allen drei Standorten bestanden.",
      "news.news_card_summary.28": "Circum ist vom 16. bis 19. November 2026 am Stand E-23 vertreten. Reservieren Sie Ihren Termin bei unseren Vertriebsteams.",
      "news.news_card_summary.29": "Unser Team veröffentlicht eine 40-seitige Analyse über die Vorteile der vertikalen Integration im Medizinproduktesektor.",
      "news.news_card_summary.30": "Unterzeichnung einer Forschungspartnerschaft mit der Universität Nizza zu fortschrittlichen biokompatiblen Polymeren. Drei CIFRE-Doktorarbeiten gestartet.",
      "news.news_card_summary.31": "Beginn der Bauarbeiten für einen neuen ISO-7-Reinraum am Standort Force One. Inbetriebnahme für das dritte Quartal 2026 geplant.",
      "news.empty_articles.32": "Derzeit sind keine Neuigkeiten veröffentlicht. Schauen Sie bald wieder vorbei."
    },
    it: {
      "news.page_hero_title.2": "News &amp; <em>Media.</em>",
      "news.news_card_title.22": "Compamed & Medica Düsseldorf",
      "news.news_card_summary.26": "Il nostro sito tunisino raggiunge la piena capacità operativa con 4 cleanroom ISO 7/8 e 120 operatori qualificati.",
      "news.news_card_summary.27": "Il nostro sistema di qualità è rinnovato senza riserve dall'organismo di certificazione. Audit annuale superato sui tre siti.",
      "news.news_card_summary.28": "Circum sarà presente dal 16 al 19 novembre 2026 allo stand E-23. Prenotate il vostro slot con i nostri team commerciali.",
      "news.news_card_summary.29": "Il nostro team pubblica un'analisi di 40 pagine sui vantaggi dell'integrazione verticale nel settore dei dispositivi medici.",
      "news.news_card_summary.30": "Firma di una partnership di ricerca con l'Università di Nizza sui polimeri biocompatibili avanzati. Avviate tre tesi di dottorato CIFRE.",
      "news.news_card_summary.31": "Avvio dei lavori per una nuova cleanroom ISO 7 nel sito Force One. Messa in servizio prevista per il terzo trimestre del 2026.",
      "news.empty_articles.32": "Al momento non ci sono notizie pubblicate. Tornate presto per scoprire le nostre ultime novità."
    }
  };

  ['fr', 'en', 'de', 'it'].forEach(function (lang) {
    window.CIRCUM_I18N_PAGE[lang] = Object.assign(window.CIRCUM_I18N_PAGE[lang] || {}, extra[lang] || {});
  });
})();
