/**
 * Split Contact / Carrières into two top-level nav items on all public pages.
 * Run: node scripts/split-nav-contact-careers.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const FRONTEND = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'frontend');

const DESKTOP_OLD =
  /<li class="nav-item">\s*<a class="nav-link(?: active)?" href="contact\.html"><span data-i18n="nav\.contact">Contact<\/span> <span class="nav-link-chev">▾<\/span><\/a>\s*<div class="nav-submenu">\s*<a data-i18n="nav\.sub\.careers" href="carrieres\.html">Carrières<\/a>\s*<\/div>\s*<\/li>/g;

const MOBILE_OLD =
  /<div class="nav-mobile-section">\s*<div class="nav-mobile-title" data-i18n="footer\.col\.contact">Contact<\/div>\s*<a data-i18n="nav\.contact" href="contact\.html">Contact<\/a>\s*<a data-i18n="nav\.sub\.careers" href="carrieres\.html">Carrières<\/a>\s*<\/div>/g;

function desktopNav(active) {
  const contactActive = active === 'contact' ? ' active' : '';
  const careersActive = active === 'carrieres' ? ' active' : '';
  return (
    `<li class="nav-item"><a class="nav-link${contactActive}" data-i18n="nav.contact" href="contact.html">Contact</a></li>\n` +
    `<li class="nav-item"><a class="nav-link${careersActive}" data-i18n="nav.careers" href="carrieres.html">Carrières</a></li>`
  );
}

const MOBILE_NEW = `<div class="nav-mobile-section">
<div class="nav-mobile-title" data-i18n="footer.col.contact">Contact</div>
<a data-i18n="nav.contact" href="contact.html">Contact</a>
</div>
<div class="nav-mobile-section">
<div class="nav-mobile-title" data-i18n="nav.careers">Carrières</div>
<a data-i18n="nav.careers" href="carrieres.html">Carrières</a>
</div>`;

let n = 0;
for (const file of fs.readdirSync(FRONTEND).filter((f) => f.endsWith('.html') && f !== 'admin.html')) {
  const p = path.join(FRONTEND, file);
  let html = fs.readFileSync(p, 'utf8');
  if (!DESKTOP_OLD.test(html) && !html.includes('nav.sub.careers')) continue;

  const active = file === 'contact.html' ? 'contact' : file === 'carrieres.html' ? 'carrieres' : null;
  html = html.replace(DESKTOP_OLD, desktopNav(active));
  html = html.replace(MOBILE_OLD, MOBILE_NEW);
  fs.writeFileSync(p, html, 'utf8');
  console.log('Updated', file);
  n++;
}
console.log('Done.', n, 'file(s)');
