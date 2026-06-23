(function () {
  'use strict';
  if (!window.CIRCUM_I18N_PAGE) return;

  var extra = {
    fr: {
      "apropos.env_card_title.60": "01 · Empreinte carbone",
      "apropos.env_card_text.60": "Trajectoire de réduction des émissions GES alignée sur les objectifs européens. Mesure annuelle des Scopes 1, 2 et 3, bilan public.",
      "apropos.env_card_title.61": "02 · Énergies renouvelables",
      "apropos.env_card_text.61": "Force One intègre progressivement le solaire. Bureaux européens alimentés en électricité 100% renouvelable, éclairage industriel LED.",
      "apropos.env_card_title.62": "03 · Économie circulaire",
      "apropos.env_card_text.62": "Tri sélectif sur tous les sites, recyclage des polymères de production. Objectif : zéro déchet en décharge non valorisée d'ici fin 2027.",
      "apropos.env_card_title.63": "04 · Sourcing responsable",
      "apropos.env_card_text.63": "Évaluation systématique des fournisseurs sur critères environnementaux et sociaux. Audit annuel des partenaires stratégiques."
    },
    en: {
      "apropos.env_card_title.60": "01 · Carbon footprint",
      "apropos.env_card_text.60": "GHG emissions reduction trajectory aligned with European targets. Annual measurement of Scopes 1, 2 and 3, public report.",
      "apropos.env_card_title.61": "02 · Renewable energy",
      "apropos.env_card_text.61": "Force One is progressively integrating solar power. European offices powered by 100% renewable electricity, LED industrial lighting.",
      "apropos.env_card_title.62": "03 · Circular economy",
      "apropos.env_card_text.62": "Selective sorting across all sites, recycling of production polymers. Target: zero waste sent to non-recovered landfill by the end of 2027.",
      "apropos.env_card_title.63": "04 · Responsible sourcing",
      "apropos.env_card_text.63": "Systematic assessment of suppliers against environmental and social criteria. Annual audit of strategic partners."
    },
    de: {
      "apropos.env_card_title.60": "01 · CO2-Fußabdruck",
      "apropos.env_card_text.60": "Reduktionspfad der THG-Emissionen im Einklang mit den europäischen Zielen. Jährliche Messung der Scopes 1, 2 und 3, öffentliche Bilanz.",
      "apropos.env_card_title.61": "02 · Erneuerbare Energien",
      "apropos.env_card_text.61": "Force One integriert schrittweise Solarenergie. Europäische Büros werden mit 100% erneuerbarem Strom versorgt, industrielle LED-Beleuchtung.",
      "apropos.env_card_title.62": "03 · Kreislaufwirtschaft",
      "apropos.env_card_text.62": "Mülltrennung an allen Standorten, Recycling der Produktionspolymere. Ziel: kein Abfall auf nicht verwerteten Deponien bis Ende 2027.",
      "apropos.env_card_title.63": "04 · Verantwortungsvolle Beschaffung",
      "apropos.env_card_text.63": "Systematische Bewertung der Lieferanten nach ökologischen und sozialen Kriterien. Jährliches Audit der strategischen Partner."
    },
    it: {
      "apropos.env_card_title.60": "01 · Impronta di carbonio",
      "apropos.env_card_text.60": "Traiettoria di riduzione delle emissioni di GES allineata agli obiettivi europei. Misurazione annuale degli Scope 1, 2 e 3, bilancio pubblico.",
      "apropos.env_card_title.61": "02 · Energie rinnovabili",
      "apropos.env_card_text.61": "Force One integra progressivamente il solare. Uffici europei alimentati con elettricità 100% rinnovabile, illuminazione industriale LED.",
      "apropos.env_card_title.62": "03 · Economia circolare",
      "apropos.env_card_text.62": "Raccolta differenziata in tutti i siti, riciclo dei polimeri di produzione. Obiettivo: zero rifiuti in discarica non valorizzata entro fine 2027.",
      "apropos.env_card_title.63": "04 · Approvvigionamento responsabile",
      "apropos.env_card_text.63": "Valutazione sistematica dei fornitori secondo criteri ambientali e sociali. Audit annuale dei partner strategici."
    }
  };

  ['fr', 'en', 'de', 'it'].forEach(function (lang) {
    window.CIRCUM_I18N_PAGE[lang] = Object.assign(window.CIRCUM_I18N_PAGE[lang] || {}, extra[lang] || {});
  });
})();
