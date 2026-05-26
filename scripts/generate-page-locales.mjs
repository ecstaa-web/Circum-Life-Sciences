/**
 * Extract translatable strings from HTML (by class) and build locale JSON with EN/DE/IT.
 * Run: node scripts/generate-page-locales.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { tr } from './translate.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCALE_DIR = path.join(ROOT, 'i18n', 'locales');

const PAGES = {
  home: 'index.html',
  apropos: 'apropos.html',
  fondateurs: 'fondateurs.html',
  design: 'design.html',
  fabrication: 'fabrication.html',
  clients: 'clients.html',
  news: 'news.html',
  newsletter: 'newsletter.html',
  carrieres: 'carrieres.html',
  contact: 'contact.html',
};

const CLASSES = [
  'page-hero-eyebrow',
  'page-hero-title',
  'page-hero-subtitle',
  'page-hero-breadcrumb',
  'hero-eyebrow',
  'hero-title',
  'hero-subtitle',
  'hero-meta',
  'mission-title',
  'mission-text',
  'section-label',
  'section-title',
  'section-lead',
  'pillar-title',
  'pillar-text',
  'pillar-list-item',
  'pillar-link',
  'figure-label',
  'world-title',
  'world-text',
  'world-site-city',
  'world-site-role',
  'founder-name',
  'founder-role',
  'founder-bio',
  'prose-enhanced',
  'kpi-bar-label',
  'highlight-quote',
  'site-card-flag',
  'site-card-city',
  'site-card-country',
  'site-card-role',
  'value-card-title',
  'value-card-text',
  'gov-block-title',
  'gov-block-text',
  'policy-card-title',
  'policy-card-text',
  'service-card-title',
  'service-card-text',
  'feature-block-title',
  'feature-block-text',
  'news-card-tag',
  'news-card-date',
  'news-card-title',
  'news-card-text',
  'job-card-title',
  'job-card-meta',
  'job-card-text',
  'contact-card-city',
  'contact-card-country',
  'contact-card-detail',
  'contact-card-info',
  'form-label',
  'form-hint',
  'form-section-title',
  'form-checkbox',
  'timeline-year',
  'timeline-title',
  'timeline-text',
  'archive-issue-title',
  'archive-issue-desc',
  'stat-label',
  'benefit-title',
  'benefit-text',
  'client-type-title',
  'client-type-text',
  'commitment-title',
  'commitment-text',
  'newsletter-strip-title',
  'newsletter-strip-text',
  'cta-final-eyebrow',
  'cta-final-title',
  'cta-final-text',
  'footer-desc',
  'footer-col-title',
  'nav-mobile-title',
];

function extractFromHtml(html, pageId) {
  const entries = {};
  let idx = 0;

  for (const cls of CLASSES) {
    const re = new RegExp(
      `<([a-z][a-z0-9]*)\\b[^>]*class="[^"]*\\b${cls}\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/\\1>`,
      'gi'
    );
    let m;
    while ((m = re.exec(html)) !== null) {
      const inner = m[2].trim();
      if (!inner || inner.length < 2) continue;
      const isHtml = /<[a-z][\s>]/i.test(inner);
      const fr = isHtml
        ? inner.replace(/\s+/g, ' ').trim()
        : inner.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (!fr || fr.length < 2) continue;
      idx++;
      const key = `${pageId}.${cls.replace(/-/g, '_')}.${idx}`;
      entries[key] = {
        fr: isHtml ? inner.replace(/\n\s*/g, '').trim() : fr,
        en: tr(fr, 'en', isHtml ? inner : null),
        de: tr(fr, 'de', isHtml ? inner : null),
        it: tr(fr, 'it', isHtml ? inner : null),
        _html: isHtml,
      };
    }
  }

  // Buttons in hero/cta with span text
  const btnRe = /<a[^>]*class="[^"]*btn[^"]*"[^>]*>\s*<span>([^<]+)<\/span>/gi;
  let bm;
  let bi = 0;
  while ((bm = btnRe.exec(html)) !== null) {
    const fr = bm[1].trim();
    if (fr.length < 2) continue;
    bi++;
    const key = `${pageId}.btn.${bi}`;
    entries[key] = { fr, en: tr(fr, 'en'), de: tr(fr, 'de'), it: tr(fr, 'it') };
  }

  // Select options
  const optRe = /<option[^>]*value="([^"]*)"[^>]*>([^<]+)<\/option>/gi;
  let om;
  let oi = 0;
  while ((om = optRe.exec(html)) !== null) {
    const fr = om[2].trim();
    if (!fr || fr.startsWith('—')) continue;
    oi++;
    const key = `${pageId}.option.${oi}`;
    entries[key] = { fr, en: tr(fr, 'en'), de: tr(fr, 'de'), it: tr(fr, 'it') };
  }

  // Input placeholders
  const phRe = /placeholder="([^"]+)"/gi;
  let pm;
  let pi = 0;
  while ((pm = phRe.exec(html)) !== null) {
    const fr = pm[1].trim();
    pi++;
    const key = `${pageId}.placeholder.${pi}`;
    entries[key] = { fr, en: tr(fr, 'en'), de: tr(fr, 'de'), it: tr(fr, 'it') };
  }

  return entries;
}

function annotateHtml(html, entries, pageId) {
  let idx = {};
  for (const cls of CLASSES) {
    const re = new RegExp(
      `(<([a-z][a-z0-9]*)\\b[^>]*class="[^"]*\\b${cls}\\b[^"]*"([^>]*)>)`,
      'gi'
    );
    html = html.replace(re, (match, g1, tag, attrs) => {
      if (match.includes('data-i18n')) return match;
      idx[cls] = (idx[cls] || 0) + 1;
      const key = `${pageId}.${cls.replace(/-/g, '_')}.${idx[cls]}`;
      if (!entries[key]) return match;
      const useHtml = entries[key]._html;
      const attr = useHtml ? 'data-i18n-html' : 'data-i18n';
      return `<${tag} ${attr}="${key}"${attrs}>`;
    });
  }
  return html;
}

fs.mkdirSync(LOCALE_DIR, { recursive: true });

for (const [pageId, file] of Object.entries(PAGES)) {
  const filePath = path.join(ROOT, file);
  let html = fs.readFileSync(filePath, 'utf8');
  const entries = extractFromHtml(html, pageId);
  const locale = {};
  for (const [k, v] of Object.entries(entries)) {
    locale[k] = { fr: v.fr, en: v.en, de: v.de, it: v.it };
  }
  fs.writeFileSync(path.join(LOCALE_DIR, `${pageId}.json`), JSON.stringify(locale, null, 2));
  html = annotateHtml(html, entries, pageId);
  html = html.replace(/src="circum-logo\.png"/g, 'src="assets/img/circum-logo.svg"');
  html = html.replace(/href="circum-logo\.png"/g, 'href="assets/img/circum-logo.svg"');
  fs.writeFileSync(filePath, html);
  console.log(pageId, Object.keys(locale).length, 'keys');
}

console.log('Done generating page locales.');
