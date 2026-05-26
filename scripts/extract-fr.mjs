import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html') && f !== 'circum (4).html');

const strings = new Set();

for (const file of files) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const blocks = html.match(/<main[\s\S]*?<\/main>|<footer[\s\S]*?<\/footer>|nav-mobile[\s\S]*?<\/motion>|newsletter-strip[\s\S]*?<\/section>|cta-final[\s\S]*?<\/section>/gi) || [];
  const chunk = blocks.join(' ') || html;
  const texts = chunk.match(/>([^<]{2,})</g) || [];
  texts.forEach((t) => {
    const s = t.slice(1, -1).replace(/\s+/g, ' ').trim();
    if (s && !/^[\d\s°.+©→\-/|]+$/.test(s) && s.length < 500) strings.add(s);
  });
}

const arr = [...strings].sort();
fs.writeFileSync(path.join(ROOT, 'scripts', 'fr-strings.json'), JSON.stringify(arr, null, 2));
console.log('Extracted', arr.length, 'unique strings');
