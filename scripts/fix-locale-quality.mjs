/**
 * Apply high-quality manual translations for critical UI strings.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const LOCALE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'i18n', 'locales');

const QUALITY = {
  'home.hero_eyebrow.1': {
    en: 'Independent CDMO laboratory · Medical devices',
    de: 'Unabhängiges CDMO-Labor · Medizinprodukte',
    it: 'Laboratorio CDMO indipendente · Dispositivi medici',
  },
  'home.hero_title.2': {
    fr: 'Concevoir, développer<br>et fabriquer <em>les dispositifs médicaux</em><br><strong>de demain.</strong>',
    en: 'Design, develop<br>and manufacture <em>the medical devices</em><br><strong>of tomorrow.</strong>',
    de: 'Entwickeln, konstruieren<br>und fertigen <em>die Medizinprodukte</em><br><strong>von morgen.</strong>',
    it: 'Progettare, sviluppare<br>e produrre <em>i dispositivi medici</em><br><strong>di domani.</strong>',
  },
  'home.hero_subtitle.3': {
    en: 'Circum Life Sciences is a vertically integrated CDMO operating in medical devices and life sciences — full coverage from design to manufacturing.',
    de: 'Circum Life Sciences ist ein vertikal integriertes CDMO in Medizinprodukten und Life Sciences — vollständige Abdeckung von der Konstruktion bis zur Fertigung.',
    it: 'Circum Life Sciences è un CDMO integrato verticalmente nei dispositivi medici e nelle life sciences — copertura completa dalla progettazione alla produzione.',
  },
  'home.hero_meta.4': {
    en: 'Switzerland · France · Tunisia',
    de: 'Schweiz · Frankreich · Tunesien',
    it: 'Svizzera · Francia · Tunisia',
  },
  'home.hero_meta.5': {
    fr: '3 sites · 1 équipe · Couverture CDMO complète',
    en: '3 sites · 1 team · Full CDMO coverage',
    de: '3 Standorte · 1 Team · Vollständige CDMO-Abdeckung',
    it: '3 siti · 1 team · Copertura CDMO completa',
  },
  'home.mission_title.5': {
    fr: 'Soutenir notre industrie avec <strong>des solutions innovantes</strong> et <em>fiables.</em>',
    en: 'Supporting our industry with <strong>innovative</strong> and <em>reliable</em> solutions.',
    de: 'Unsere Branche mit <strong>innovativen</strong> und <em>zuverlässigen</em> Lösungen unterstützen.',
    it: 'Sostenere il nostro settore con soluzioni <strong>innovative</strong> e <em>affidabili.</em>',
  },
  'home.mission_text.6': {
    en: 'Our purpose: improving healthcare treatments for our partners. We offer a broad range of medical technologies tailored to your specific needs — because your requirements are unique.',
    de: 'Unser Auftrag: Gesundheitsversorgung für unsere Partner verbessern. Wir bieten ein breites Spektrum medizinischer Technologien, angepasst an Ihre spezifischen Anforderungen.',
    it: 'La nostra missione: migliorare i trattamenti sanitari per i nostri partner. Offriamo un\'ampia gamma di tecnologie mediche adattate alle vostre esigenze specifiche.',
  },
  'home.mission_text.7': {
    en: 'Our integrated approach delivers innovative, reliable products, accelerates time to market and ensures success. We work with companies of all sizes — from startups to global medtech leaders.',
    de: 'Unser ganzheitlicher Ansatz liefert innovative, zuverlässige Produkte, beschleunigt die Markteinführung und sichert den Erfolg. Wir arbeiten mit Unternehmen jeder Größe.',
    it: 'Il nostro approccio integrato offre prodotti innovativi e affidabili, accelera il time to market e garantisce il successo. Collaboriamo con aziende di ogni dimensione.',
  },
  'home.section_title.12': {
    fr: 'Trois piliers, <em>une seule chaîne de valeur.</em>',
    en: 'Three pillars, <em>one value chain.</em>',
    de: 'Drei Säulen, <em>eine Wertschöpfungskette.</em>',
    it: 'Tre pilastri, <em>una sola catena del valore.</em>',
  },
  'home.world_title.24': {
    fr: '<strong>Circum</strong> dans <em>le monde.</em>',
    en: '<strong>Circum</strong> around <em>the world.</em>',
    de: '<strong>Circum</strong> in <em>der Welt.</em>',
    it: '<strong>Circum</strong> nel <em>mondo.</em>',
  },
  'home.section_title.13': {
    fr: 'Trois expertises, <em>une exigence partagée.</em>',
    en: 'Three areas of expertise, <em>one shared standard.</em>',
    de: 'Drei Kompetenzen, <em>ein gemeinsamer Anspruch.</em>',
    it: 'Tre competenze, <em>un\'exigenza condivisa.</em>',
  },
};

for (const file of fs.readdirSync(LOCALE).filter((f) => f.endsWith('.json'))) {
  const p = path.join(LOCALE, file);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  let n = 0;
  for (const [key, vals] of Object.entries(QUALITY)) {
    if (!data[key]) continue;
    Object.assign(data[key], vals);
    n++;
  }
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
  if (n) console.log(file, n, 'quality fixes');
}

// Fix index.html hero markup
const indexPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
html = html.replace(
  /<div data-i18n="home\.hero_eyebrow\.1"><span>[^<]*<\/span><\/motion>/,
  '<div class="hero-eyebrow reveal" data-i18n="home.hero_eyebrow.1">Laboratoire CDMO indépendant · Dispositifs médicaux</div>'
);
html = html.replace(/<\/?motion>/g, '');
if (!html.includes('data-i18n-html="home.hero_title.2"')) {
  html = html.replace(
    /<h1 class="hero-title reveal">[\s\S]*?<\/h1>/,
    '<h1 class="hero-title reveal" data-i18n-html="home.hero_title.2">Concevoir, développer<br>et fabriquer <em>les dispositifs médicaux</em><br><strong>de demain.</strong></h1>'
  );
  html = html.replace(
    /<p class="hero-subtitle reveal">[\s\S]*?<\/p>/,
    '<p class="hero-subtitle reveal" data-i18n="home.hero_subtitle.3">Circum Life Sciences est une entreprise CDMO intégrée verticalement, opérant dans les domaines des dispositifs médicaux et des sciences de la vie. Une couverture complète, de la conception à la fabrication.</p>'
  );
  html = html.replace(
    /<div class="hero-meta reveal">\s*<span>Suisse[^<]*<\/span>\s*<span>3 sites[^<]*<\/span>\s*<\/div>/,
    '<div class="hero-meta reveal"><span data-i18n="home.hero_meta.4">Suisse · France · Tunisie</span><span data-i18n="home.hero_meta.5">3 sites · 1 équipe · Couverture CDMO complète</span></div>'
  );
  html = html.replace(
    /<h2 class="mission-title">[\s\S]*?<\/h2>/,
    '<h2 class="mission-title" data-i18n-html="home.mission_title.5">Soutenir notre industrie avec <strong>des solutions innovantes</strong> et <em>fiables.</em></h2>'
  );
  html = html.replace(
    /<p class="mission-text">Notre raison d'être[\s\S]*?<\/p>\s*<p class="mission-text">Notre approche globale/,
    '<p class="mission-text" data-i18n="home.mission_text.6">Notre raison d\'être : améliorer les traitements de santé pour le compte de nos partenaires. Nous proposons une large gamme de technologies médicales et adaptons notre offre à vos besoins spécifiques · parce que vos exigences sont uniques.</p>\n      <p class="mission-text" data-i18n="home.mission_text.7">Notre approche globale'
  );
}
fs.writeFileSync(indexPath, html);
console.log('Fixed index.html hero');
