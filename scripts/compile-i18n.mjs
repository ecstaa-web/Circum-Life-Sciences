import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCALE = path.join(ROOT, 'i18n', 'locales');
const OUT = path.join(ROOT, 'js', 'i18n');
const LANGS = ['fr', 'en', 'de', 'it'];

function toBundle(json) {
  const b = { fr: {}, en: {}, de: {}, it: {} };
  for (const [key, vals] of Object.entries(json)) {
    for (const lang of LANGS) {
      if (vals[lang] != null) b[lang][key] = vals[lang];
    }
  }
  return b;
}

fs.mkdirSync(OUT, { recursive: true });

const common = JSON.parse(fs.readFileSync(path.join(LOCALE, 'common.json'), 'utf8'));
fs.writeFileSync(path.join(OUT, 'common.js'), `window.CIRCUM_I18N_COMMON=${JSON.stringify(toBundle(common))};\n`);

const pages = fs.readdirSync(LOCALE).filter((f) => f.endsWith('.json') && f !== 'common.json');
for (const file of pages) {
  const pageId = file.replace('.json', '');
  const data = JSON.parse(fs.readFileSync(path.join(LOCALE, file), 'utf8'));
  fs.writeFileSync(path.join(OUT, `page-${pageId}.js`), `window.CIRCUM_I18N_PAGE=${JSON.stringify(toBundle(data))};\n`);
  console.log('Compiled', file, Object.keys(data).length, 'keys');
}

console.log('Done.');
