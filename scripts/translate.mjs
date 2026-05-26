/**
 * French → EN / DE / IT for Circum Life Sciences site content.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Exact phrase overrides (highest quality) */
const PHRASES = {
  'Accueil': { en: 'Home', de: 'Startseite', it: 'Home' },
  'À propos': { en: 'About', de: 'Über uns', it: 'Chi siamo' },
  'Découvrir Circum': { en: 'Discover Circum', de: 'Circum entdecken', it: 'Scopri Circum' },
  'Nous contacter': { en: 'Contact us', de: 'Kontaktieren Sie uns', it: 'Contattateci' },
  'Nous rencontrer': { en: 'Meet us', de: 'Uns treffen', it: 'Incontrateci' },
  'Découvrir les fondateurs': { en: 'Meet the founders', de: 'Die Gründer kennenlernen', it: 'Scopri i fondatori' },
  'Explorer →': { en: 'Explore →', de: 'Entdecken →', it: 'Esplora →' },
  'S\'inscrire →': { en: 'Subscribe →', de: 'Anmelden →', it: 'Iscriviti →' },
  'Sites européens': { en: 'European sites', de: 'Europäische Standorte', it: 'Siti europei' },
  'Opérateurs qualifiés': { en: 'Qualified operators', de: 'Qualifizierte Mitarbeiter', it: 'Operatori qualificati' },
  'Intégration verticale': { en: 'Vertical integration', de: 'Vertikale Integration', it: 'Integrazione verticale' },
  'Force One · Tunisie': { en: 'Force One · Tunisia', de: 'Force One · Tunesien', it: 'Force One · Tunisia' },
  'Notre mission': { en: 'Our mission', de: 'Unsere Mission', it: 'La nostra missione' },
  'Notre expertise': { en: 'Our expertise', de: 'Unsere Expertise', it: 'La nostra expertise' },
  'Notre entreprise': { en: 'Our company', de: 'Unser Unternehmen', it: 'La nostra azienda' },
  'Les trois fondateurs': { en: 'The three founders', de: 'Die drei Gründer', it: 'I tre fondatori' },
  'Implantation': { en: 'Locations', de: 'Standorte', it: 'Presenza' },
  'Présidente': { en: 'President', de: 'Präsidentin', it: 'Presidente' },
  'Directeur général': { en: 'Chief Executive Officer', de: 'Geschäftsführer', it: 'Direttore generale' },
  'Directeur technique': { en: 'Chief Technical Officer', de: 'Technischer Direktor', it: 'Direttore tecnico' },
  'Genève · Suisse': { en: 'Geneva · Switzerland', de: 'Genf · Schweiz', it: 'Ginevra · Svizzera' },
  'Lyon · France': { en: 'Lyon · France', de: 'Lyon · Frankreich', it: 'Lione · Francia' },
  'Tunis · Tunisie': { en: 'Tunis · Tunisia', de: 'Tunis · Tunesien', it: 'Tunisi · Tunisia' },
  'Siège · Gouvernance': { en: 'Headquarters · Governance', de: 'Hauptsitz · Governance', it: 'Sede · Governance' },
  'R&D · QARA · Laboratoire': { en: 'R&D · QARA · Laboratory', de: 'F&E · QARA · Labor', it: 'R&S · QARA · Laboratorio' },
  'Force One · Production': { en: 'Force One · Production', de: 'Force One · Produktion', it: 'Force One · Produzione' },
  'Suisse · France · Tunisie': { en: 'Switzerland · France · Tunisia', de: 'Schweiz · Frankreich · Tunesien', it: 'Svizzera · Francia · Tunisia' },
  '3 sites · 1 équipe · Couverture CDMO complète': {
    en: '3 sites · 1 team · Full CDMO coverage',
    de: '3 Standorte · 1 Team · Vollständige CDMO-Abdeckung',
    it: '3 siti · 1 team · Copertura CDMO completa',
  },
  'Laboratoire CDMO indépendant · Dispositifs médicaux': {
    en: 'Independent CDMO laboratory · Medical devices',
    de: 'Unabhängiges CDMO-Labor · Medizinprodukte',
    it: 'Laboratorio CDMO indipendente · Dispositivi medici',
  },
  'Conception industrielle': { en: 'Industrial design', de: 'Industrielle Konstruktion', it: 'Progettazione industriale' },
  'Fabrication intégrée': { en: 'Integrated manufacturing', de: 'Integrierte Fertigung', it: 'Produzione integrata' },
  'Conformité & Qualité': { en: 'Compliance & Quality', de: 'Konformität & Qualität', it: 'Conformità & Qualità' },
  'Moulage par injection': { en: 'Injection molding', de: 'Spritzguss', it: 'Stampaggio a iniezione' },
  'Assemblage & Stérilisation': { en: 'Assembly & Sterilization', de: 'Montage & Sterilisation', it: 'Assemblaggio & Sterilizzazione' },
  'votre@email.com': { en: 'your@email.com', de: 'ihre@email.de', it: 'vostra@email.com' },
  'Adresse email': { en: 'Email address', de: 'E-Mail-Adresse', it: 'Indirizzo email' },
};

const WORDS_EN = [
  ['dispositifs médicaux', 'medical devices'],
  ['sciences de la vie', 'life sciences'],
  ['intégrée verticalement', 'vertically integrated'],
  ['intégré verticalement', 'vertically integrated'],
  ['mise sur le marché', 'time to market'],
  ['affaires réglementaires', 'regulatory affairs'],
  ['Notre ', 'Our '],
  ['Nous ', 'We '],
  ['Votre ', 'Your '],
  ['vos ', 'your '],
  ['notre ', 'our '],
  ['nous ', 'we '],
  ['des ', ''],
  ['les ', 'the '],
  ['une ', 'a '],
  ['un ', 'a '],
  [' et ', ' and '],
  [' pour ', ' for '],
  [' avec ', ' with '],
  [' dans ', ' in '],
  [' sur ', ' on '],
  [' de ', ' of '],
  [' du ', ' of the '],
  [' à ', ' to '],
];

const WORDS_DE = [
  ['dispositifs médicaux', 'Medizinprodukte'],
  ['sciences de la vie', 'Life Sciences'],
  ['Notre ', 'Unsere '],
  ['Nous ', 'Wir '],
  [' et ', ' und '],
  [' pour ', ' für '],
  [' avec ', ' mit '],
];

const WORDS_IT = [
  ['dispositifs médicaux', 'dispositivi medici'],
  ['sciences de la vie', 'life sciences'],
  ['Notre ', 'La nostra '],
  ['Nous ', 'Noi '],
  [' et ', ' e '],
  [' pour ', ' per '],
  [' avec ', ' con '],
];

function normalize(s) {
  return s.replace(/\s+/g, ' ').trim();
}

function applyWords(text, pairs) {
  let out = text;
  for (const [fr, to] of pairs) {
    out = out.split(fr).join(to);
  }
  return out.replace(/\s+/g, ' ').trim();
}

function translatePlain(text, lang) {
  const n = normalize(text);
  if (PHRASES[n]?.[lang]) return PHRASES[n][lang];
  if (lang === 'en') return applyWords(n, WORDS_EN);
  if (lang === 'de') return applyWords(n, WORDS_DE);
  if (lang === 'it') return applyWords(n, WORDS_IT);
  return n;
}

/** Translate HTML preserving tags */
export function translateHtml(html, lang) {
  if (lang === 'fr') return html;
  return html.replace(/>([^<]+)</g, (m, text) => {
    const t = text.trim();
    if (!t) return m;
    return '>' + translatePlain(t, lang) + '<';
  });
}

// Load extended overrides from generated file if present
let extended = {};
const extPath = path.join(ROOT, 'i18n', 'translate-overrides.json');
if (fs.existsSync(extPath)) {
  extended = JSON.parse(fs.readFileSync(extPath, 'utf8'));
}

export function tr(text, lang, htmlOriginal = null) {
  if (lang === 'fr') return htmlOriginal || text;
  const n = normalize(text);
  if (PHRASES[n]?.[lang]) return htmlOriginal ? translateHtml(htmlOriginal, lang) : PHRASES[n][lang];
  if (extended[n]?.[lang]) return htmlOriginal ? translateHtml(htmlOriginal, lang) : extended[n][lang];
  if (htmlOriginal) return translateHtml(htmlOriginal, lang);
  return translatePlain(text, lang);
}

/** Build extended overrides from fr-strings.json */
export function buildExtendedOverrides() {
  const frPath = path.join(ROOT, 'scripts', 'fr-strings.json');
  if (!fs.existsSync(frPath)) return;
  const strings = JSON.parse(fs.readFileSync(frPath, 'utf8'));
  const out = {};
  for (const s of strings) {
    const n = normalize(s);
    if (n.length < 4 || n.length > 400) continue;
    if (PHRASES[n]) continue;
    out[n] = {
      en: translatePlain(n, 'en'),
      de: translatePlain(n, 'de'),
      it: translatePlain(n, 'it'),
    };
  }
  fs.writeFileSync(extPath, JSON.stringify(out, null, 0));
  console.log('Wrote', Object.keys(out).length, 'extended overrides');
}

if (process.argv[1]?.endsWith('translate.mjs')) {
  buildExtendedOverrides();
}
