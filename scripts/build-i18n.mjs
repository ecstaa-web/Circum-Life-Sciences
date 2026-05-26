/**
 * Annotate HTML with data-i18n keys and build js/i18n/*.js bundles.
 * Run: node scripts/build-i18n.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TRANSLATIONS } from './translations-db.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const PAGES = [
  { file: 'index.html', id: 'home' },
  { file: 'apropos.html', id: 'apropos' },
  { file: 'fondateurs.html', id: 'fondateurs' },
  { file: 'design.html', id: 'design' },
  { file: 'fabrication.html', id: 'fabrication' },
  { file: 'clients.html', id: 'clients' },
  { file: 'news.html', id: 'news' },
  { file: 'newsletter.html', id: 'newsletter' },
  { file: 'carrieres.html', id: 'carrieres' },
  { file: 'contact.html', id: 'contact' },
];

const LANGS = ['fr', 'en', 'de', 'it'];

/** CSS selectors → key suffix (relative to page id or "common") */
const RULES = [
  { scope: 'common', sel: 'nav-mobile-title', key: 'mobile.title', attr: 'text' },
  { scope: 'common', sel: 'nav-mobile-section a', key: 'mobile.link', attr: 'text', each: true },
  { scope: 'common', sel: 'nav-submenu a', key: 'submenu', attr: 'text', each: true },
  { scope: 'common', sel: 'newsletter-strip-title', key: 'strip.title', attr: 'html' },
  { scope: 'common', sel: 'newsletter-strip-text', key: 'strip.text', attr: 'text' },
  { scope: 'common', sel: 'newsletter-strip-form input[type=email]', key: 'strip.placeholder', attr: 'placeholder' },
  { scope: 'common', sel: 'newsletter-strip-form input[type=email]', key: 'strip.emailAria', attr: 'aria-label' },
  { scope: 'common', sel: 'newsletter-strip-form button', key: 'strip.submit', attr: 'text' },
  { scope: 'common', sel: 'cta-final-eyebrow', key: 'cta.eyebrow', attr: 'text' },
  { scope: 'common', sel: 'cta-final-title', key: 'cta.title', attr: 'html' },
  { scope: 'common', sel: 'cta-final-text', key: 'cta.text', attr: 'text' },
  { scope: 'common', sel: 'cta-final-actions .btn span:first-child', key: 'cta.btn', attr: 'text', each: true },
  { scope: 'common', sel: 'footer-desc', key: 'footer.desc', attr: 'text' },
  { scope: 'common', sel: 'footer-col-title', key: 'footer.col', attr: 'text', each: true },
  { scope: 'common', sel: 'footer-list a', key: 'footer.link', attr: 'text', each: true },
  { scope: 'common', sel: 'footer-contact-item strong', key: 'footer.contactLabel', attr: 'text', each: true },
  { scope: 'common', sel: 'footer-contact-item span', key: 'footer.contactVal', attr: 'text', each: true },
  { scope: 'common', sel: 'footer-bottom small', key: 'footer.copy', attr: 'text' },
  { scope: 'common', sel: 'footer-legal a', key: 'footer.legal', attr: 'text', each: true },
  { scope: 'page', sel: 'page-hero-breadcrumb a', key: 'breadcrumb.home', attr: 'text' },
  { scope: 'page', sel: 'page-hero-breadcrumb span:last-child', key: 'breadcrumb.current', attr: 'text' },
  { scope: 'page', sel: 'page-hero-eyebrow', key: 'hero.eyebrow', attr: 'text' },
  { scope: 'page', sel: 'page-hero-title', key: 'hero.title', attr: 'html' },
  { scope: 'page', sel: 'page-hero-subtitle', key: 'hero.subtitle', attr: 'text' },
  { scope: 'page', sel: 'section-label', key: 'section.label', attr: 'text', each: true },
  { scope: 'page', sel: 'section-title', key: 'section.title', attr: 'html', each: true },
  { scope: 'page', sel: 'section-lead', key: 'section.lead', attr: 'text', each: true },
  { scope: 'page', sel: 'hero-eyebrow span', key: 'hero.eyebrow', attr: 'text' },
  { scope: 'page', sel: 'hero-title', key: 'hero.title', attr: 'html' },
  { scope: 'page', sel: 'hero-subtitle', key: 'hero.subtitle', attr: 'text' },
  { scope: 'page', sel: 'hero-meta span', key: 'hero.meta', attr: 'text', each: true },
  { scope: 'page', sel: 'hero-actions .btn > span:first-child', key: 'hero.btn', attr: 'text', each: true },
  { scope: 'page', sel: 'mission-title', key: 'mission.title', attr: 'html' },
  { scope: 'page', sel: 'mission-text', key: 'mission.text', attr: 'text', each: true },
  { scope: 'page', sel: 'pillar-title', key: 'pillar.title', attr: 'text', each: true },
  { scope: 'page', sel: 'pillar-text', key: 'pillar.text', attr: 'text', each: true },
  { scope: 'page', sel: 'pillar-list-item', key: 'pillar.item', attr: 'text', each: true },
  { scope: 'page', sel: 'pillar-link', key: 'pillar.link', attr: 'text', each: true },
  { scope: 'page', sel: 'figure-label', key: 'figure.label', attr: 'text', each: true },
  { scope: 'page', sel: 'world-title', key: 'world.title', attr: 'html' },
  { scope: 'page', sel: 'world-text', key: 'world.text', attr: 'text' },
  { scope: 'page', sel: 'world-site-city', key: 'world.city', attr: 'text', each: true },
  { scope: 'page', sel: 'world-site-role', key: 'world.role', attr: 'text', each: true },
  { scope: 'page', sel: 'founder-name', key: 'founder.name', attr: 'text', each: true },
  { scope: 'page', sel: 'founder-role', key: 'founder.role', attr: 'text', each: true },
  { scope: 'page', sel: 'founder-bio', key: 'founder.bio', attr: 'text', each: true },
  { scope: 'page', sel: 'prose-enhanced p', key: 'prose.p', attr: 'html', each: true },
  { scope: 'page', sel: 'prose-enhanced h3', key: 'prose.h3', attr: 'text', each: true },
  { scope: 'page', sel: 'kpi-bar-label', key: 'kpi.label', attr: 'text', each: true },
  { scope: 'page', sel: 'highlight-quote', key: 'quote', attr: 'html', each: true },
  { scope: 'page', sel: 'site-card-flag', key: 'site.flag', attr: 'text', each: true },
  { scope: 'page', sel: 'site-card-city', key: 'site.city', attr: 'text', each: true },
  { scope: 'page', sel: 'site-card-country', key: 'site.country', attr: 'text', each: true },
  { scope: 'page', sel: 'site-card-role', key: 'site.role', attr: 'text', each: true },
  { scope: 'page', sel: 'value-card-title', key: 'value.title', attr: 'text', each: true },
  { scope: 'page', sel: 'value-card-text', key: 'value.text', attr: 'text', each: true },
  { scope: 'page', sel: 'gov-block-title', key: 'gov.title', attr: 'text', each: true },
  { scope: 'page', sel: 'gov-block-text', key: 'gov.text', attr: 'text', each: true },
  { scope: 'page', sel: 'policy-card-title', key: 'policy.title', attr: 'text', each: true },
  { scope: 'page', sel: 'policy-card-text', key: 'policy.text', attr: 'text', each: true },
  { scope: 'page', sel: 'service-card-title', key: 'service.title', attr: 'text', each: true },
  { scope: 'page', sel: 'service-card-text', key: 'service.text', attr: 'text', each: true },
  { scope: 'page', sel: 'feature-block-title', key: 'feature.title', attr: 'text', each: true },
  { scope: 'page', sel: 'feature-block-text', key: 'feature.text', attr: 'text', each: true },
  { scope: 'page', sel: 'news-card-tag', key: 'news.tag', attr: 'text', each: true },
  { scope: 'page', sel: 'news-card-title', key: 'news.title', attr: 'text', each: true },
  { scope: 'page', sel: 'news-card-text', key: 'news.text', attr: 'text', each: true },
  { scope: 'page', sel: 'job-card-title', key: 'job.title', attr: 'text', each: true },
  { scope: 'page', sel: 'job-card-meta span', key: 'job.meta', attr: 'text', each: true },
  { scope: 'page', sel: 'job-card-text', key: 'job.text', attr: 'text', each: true },
  { scope: 'page', sel: 'contact-card-city', key: 'contact.city', attr: 'text', each: true },
  { scope: 'page', sel: 'contact-card-country', key: 'contact.country', attr: 'text', each: true },
  { scope: 'page', sel: 'contact-card-detail', key: 'contact.detail', attr: 'text', each: true },
  { scope: 'page', sel: 'contact-card-info', key: 'contact.info', attr: 'html', each: true },
  { scope: 'page', sel: 'form-label', key: 'form.label', attr: 'text', each: true },
  { scope: 'page', sel: 'form-hint', key: 'form.hint', attr: 'text', each: true },
  { scope: 'page', sel: 'form-checkbox label', key: 'form.consent', attr: 'html', each: true },
  { scope: 'page', sel: 'form-section-title', key: 'form.section', attr: 'text', each: true },
  { scope: 'page', sel: 'timeline-year', key: 'timeline.year', attr: 'text', each: true },
  { scope: 'page', sel: 'timeline-title', key: 'timeline.title', attr: 'text', each: true },
  { scope: 'page', sel: 'timeline-text', key: 'timeline.text', attr: 'text', each: true },
  { scope: 'page', sel: 'archive-issue-title', key: 'archive.title', attr: 'text', each: true },
  { scope: 'page', sel: 'archive-issue-desc', key: 'archive.desc', attr: 'text', each: true },
  { scope: 'page', sel: 'stat-label', key: 'stat.label', attr: 'text', each: true },
  { scope: 'page', sel: 'benefit-title', key: 'benefit.title', attr: 'text', each: true },
  { scope: 'page', sel: 'benefit-text', key: 'benefit.text', attr: 'text', each: true },
  { scope: 'page', sel: 'client-type-title', key: 'client.title', attr: 'text', each: true },
  { scope: 'page', sel: 'client-type-text', key: 'client.text', attr: 'text', each: true },
  { scope: 'page', sel: 'commitment-title', key: 'commit.title', attr: 'text', each: true },
  { scope: 'page', sel: 'commitment-text', key: 'commit.text', attr: 'text', each: true },
];

function normalizeHtml(s) {
  return s.replace(/\s+/g, ' ').trim();
}

function getInner(el, attr) {
  if (attr === 'placeholder' || attr === 'aria-label') return el.getAttribute(attr) || '';
  if (attr === 'text') return normalizeHtml(el.textContent);
  return normalizeHtml(el.innerHTML);
}

function setI18nAttr(el, key, attr) {
  if (attr === 'html') el.setAttribute('data-i18n-html', key);
  else if (attr === 'placeholder') el.setAttribute('data-i18n-placeholder', key);
  else if (attr === 'aria-label') el.setAttribute('data-i18n-aria', key);
  else el.setAttribute('data-i18n', key);
}

/** Simple DOM parse via regex — match class on tags */
function queryByClass(html, className) {
  const re = new RegExp(
    `<([a-z][a-z0-9]*)\\b[^>]*class="[^"]*\\b${className}\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/\\1>`,
    'gi'
  );
  const results = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    results.push({ full: m[0], tag: m[1], inner: m[2] });
  }
  return results;
}

function lookupTranslation(key, lang) {
  const entry = TRANSLATIONS[key];
  if (!entry) return null;
  return entry[lang] ?? entry.fr ?? null;
}

function buildBundles() {
  const bundles = { common: {}, home: {}, apropos: {}, fondateurs: {}, design: {}, fabrication: {}, clients: {}, news: {}, newsletter: {}, carrieres: {}, contact: {} };

  for (const key of Object.keys(TRANSLATIONS)) {
    const [scope, ...rest] = key.split('.');
    const pageId = scope === 'common' ? 'common' : scope;
    if (!bundles[pageId]) bundles[pageId] = {};
    for (const lang of LANGS) {
      if (!bundles[pageId][lang]) bundles[pageId][lang] = {};
      bundles[pageId][lang][key] = TRANSLATIONS[key][lang];
    }
  }
  return bundles;
}

function writeI18nJs() {
  const bundles = buildBundles();
  const outDir = path.join(ROOT, 'js', 'i18n');
  fs.mkdirSync(outDir, { recursive: true });

  // common.js
  const common = { fr: {}, en: {}, de: {}, it: {} };
  for (const lang of LANGS) {
    Object.assign(common[lang], bundles.common[lang] || {});
    // nav keys from TRANSLATIONS with nav. prefix
    for (const [k, v] of Object.entries(TRANSLATIONS)) {
      if (k.startsWith('nav.') || k.startsWith('topbar.') || k.startsWith('meta.')) {
        common[lang][k] = v[lang];
      }
    }
  }
  fs.writeFileSync(
    path.join(outDir, 'common.js'),
    `window.CIRCUM_I18N_COMMON=${JSON.stringify(common, null, 0)};\n`
  );

  for (const { id } of PAGES) {
    const pageBundle = { fr: {}, en: {}, de: {}, it: {} };
    for (const lang of LANGS) {
      for (const [k, v] of Object.entries(TRANSLATIONS)) {
        if (k.startsWith(id + '.')) pageBundle[lang][k] = v[lang];
      }
    }
    fs.writeFileSync(
      path.join(outDir, `page-${id}.js`),
      `window.CIRCUM_I18N_PAGE=${JSON.stringify(pageBundle, null, 0)};\n`
    );
  }
}

function annotateFile(filePath, pageId) {
  let html = fs.readFileSync(filePath, 'utf8');
  let counter = {};

  function fullKey(scope, suffix, idx) {
    const base = scope === 'common' ? `common.${suffix}` : `${pageId}.${suffix}`;
    if (idx === undefined) return base;
    const n = (counter[base] = (counter[base] || 0) + 1);
    return `${base}.${n}`;
  }

  for (const rule of RULES) {
    const scope = rule.scope === 'common' ? 'common' : pageId;
    const className = rule.sel.split(/[\s.#[]/)[0].replace(/:.*/, '');
    if (!className) continue;

    const re = new RegExp(
      `(<([a-z][a-z0-9]*)\\b[^>]*class="[^"]*\\b${rule.sel.replace('.', '\\.')}\\b`,
      'gi'
    );
    // Use simpler class-only match
    const cls = rule.sel.includes(' ') ? rule.sel.split(' ').pop().split(/[#:]/)[0] : rule.sel.split(/[#:]/)[0];
    const tagRe = new RegExp(
      `<([a-z][a-z0-9]*)(\\s[^>]*)?class="([^"]*\\b${cls}\\b[^"]*)"([^>]*)>([\\s\\S]*?)<\\/\\1>`,
      'gi'
    );
    let match;
    let idx = 0;
    while ((match = tagRe.exec(html)) !== null) {
      idx++;
      const fullTag = match[0];
      const inner = match[5];
      const key = fullKey(scope, rule.key, rule.each ? idx : undefined);
      if (!TRANSLATIONS[key]) continue;

      let attrName;
      if (rule.attr === 'html') attrName = 'data-i18n-html';
      else if (rule.attr === 'placeholder') attrName = 'data-i18n-placeholder';
      else if (rule.attr === 'aria-label') attrName = 'data-i18n-aria';
      else attrName = 'data-i18n';

      if (fullTag.includes(attrName + '=')) continue;

      const patched = fullTag.replace(/<([a-z][a-z0-9]*)/, `<$1 ${attrName}="${key}"`);
      html = html.replace(fullTag, patched);
    }
  }

  // Logo path
  html = html.replace(/src="circum-logo\.png"/g, 'src="assets/img/circum-logo.svg"');
  html = html.replace(/href="circum-logo\.png"/g, 'href="assets/img/circum-logo.svg"');

  // i18n scripts
  const pageScript = `js/i18n/page-${pageId}.js`;
  const scripts = `<script src="js/i18n/common.js"></script>\n<script src="${pageScript}"></script>\n<script src="js/main.js" defer></script>`;
  html = html.replace(
    /<script src="js\/i18n\.js"><\/script>\s*<script src="js\/main\.js" defer><\/script>/,
    scripts
  );

  // meta title i18n
  if (!html.includes('data-i18n-title')) {
    html = html.replace(/<title>([^<]*)<\/title>/, `<title data-i18n-title="meta.${pageId}.title">$1</title>`);
  }

  fs.writeFileSync(filePath, html);
  console.log('Annotated', path.basename(filePath));
}

// Manual annotation pass: apply data-i18n from TRANSLATIONS keys directly in HTML via key map
function applyTranslationsToHtml() {
  for (const { file, id } of PAGES) {
    annotateFile(path.join(ROOT, file), id);
  }
}

writeI18nJs();
applyTranslationsToHtml();
console.log('i18n build complete. Keys:', Object.keys(TRANSLATIONS).length);
