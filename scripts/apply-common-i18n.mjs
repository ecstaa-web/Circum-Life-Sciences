import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const HTML_FILES = fs
  .readdirSync(ROOT)
  .filter((f) => f.endsWith('.html') && !f.startsWith('circum'));

function pageId(file) {
  return file === 'index.html' ? 'home' : file.replace('.html', '');
}

function patch(html, pairs) {
  for (const [from, to] of pairs) {
    if (html.includes(from) && !html.includes(to)) html = html.split(from).join(to);
  }
  return html;
}

for (const file of HTML_FILES) {
  let html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const pid = pageId(file);

  html = html.replace(/src="circum-logo\.png"/g, 'src="assets/img/circum-logo.svg"');
  html = html.replace(/href="circum-logo\.png"/g, 'href="assets/img/circum-logo.svg"');

  html = patch(html, [
    ['<a href="apropos.html" >Notre entreprise</a>', '<a href="apropos.html" data-i18n="nav.sub.company">Notre entreprise</a>'],
    ['<a href="apropos.html#valeurs" >Nos valeurs</a>', '<a href="apropos.html#valeurs" data-i18n="nav.sub.values">Nos valeurs</a>'],
    ['<a href="apropos.html#board" >Board & Conseil stratégique</a>', '<a href="apropos.html#board" data-i18n="nav.sub.board">Board & Conseil stratégique</a>'],
    ['<a href="apropos.html#environnement" >Politique environnementale</a>', '<a href="apropos.html#environnement" data-i18n="nav.sub.environment">Politique environnementale</a>'],
    ['<a href="fondateurs.html" >Les trois fondateurs</a>', '<a href="fondateurs.html" data-i18n="nav.sub.founders">Les trois fondateurs</a>'],
    ['<a href="design.html#conception" >Conception</a>', '<a href="design.html#conception" data-i18n="nav.sub.conception">Conception</a>'],
    ['<a href="design.html#qara" >Qualité & Affaires Réglementaires</a>', '<a href="design.html#qara" data-i18n="nav.sub.qara">Qualité & Affaires Réglementaires</a>'],
    ['<a href="design.html#laboratoire" >Laboratoire</a>', '<a href="design.html#laboratoire" data-i18n="nav.sub.lab">Laboratoire</a>'],
    ['<a href="design.html#vv" >Vérification & Validation</a>', '<a href="design.html#vv" data-i18n="nav.sub.vv">Vérification & Validation</a>'],
    ['<a href="fabrication.html#force-one" >Force One</a>', '<a href="fabrication.html#force-one" data-i18n="nav.sub.forceone">Force One</a>'],
    ['<a href="fabrication.html#moulage" >Moulage par injection</a>', '<a href="fabrication.html#moulage" data-i18n="nav.sub.molding">Moulage par injection</a>'],
    ['<a href="fabrication.html#assemblage" >Assemblage</a>', '<a href="fabrication.html#assemblage" data-i18n="nav.sub.assembly">Assemblage</a>'],
    ['<a href="fabrication.html#sterilisation" >Stérilisation</a>', '<a href="fabrication.html#sterilisation" data-i18n="nav.sub.sterilization">Stérilisation</a>'],
    ['<motion class="nav-mobile-title">À propos</motion>', '<div class="nav-mobile-title" data-i18n="mobile.title.about">À propos</div>'],
    ['<div class="nav-mobile-title">À propos</div>', '<div class="nav-mobile-title" data-i18n="mobile.title.about">À propos</div>'],
    ['<div class="nav-mobile-title">Services</div>', '<div class="nav-mobile-title" data-i18n="mobile.title.services">Services</motion>'],
    ['<h3 class="newsletter-strip-title">', '<h3 class="newsletter-strip-title" data-i18n-html="strip.title">'],
    ['<p class="newsletter-strip-text">', '<p class="newsletter-strip-text" data-i18n="strip.text">'],
    ['placeholder="votre@email.com"', 'data-i18n-placeholder="strip.placeholder" placeholder="votre@email.com"'],
    [`<button type="submit">S'inscrire →</button>`, `<button type="submit" data-i18n="strip.submit">S'inscrire →</button>`],
    ['<div class="cta-final-eyebrow">', '<div class="cta-final-eyebrow" data-i18n="cta.eyebrow">'],
    ['<h2 class="cta-final-title">', '<h2 class="cta-final-title" data-i18n-html="cta.title">'],
    ['<p class="cta-final-text">', '<p class="cta-final-text" data-i18n="cta.text">'],
    ['<p class="footer-desc">', '<p class="footer-desc" data-i18n="footer.desc">'],
    ['<div class="footer-col-title">Société</div>', '<div class="footer-col-title" data-i18n="footer.col.company">Société</div>'],
    ['<div class="footer-col-title">Services</div>', '<div class="footer-col-title" data-i18n="footer.col.services">Services</div>'],
    ['<motion class="footer-col-title">Contact</motion>', '<div class="footer-col-title" data-i18n="footer.col.contact">Contact</div>'],
    ['<motion class="footer-col-title">Contact</motion>', '<div class="footer-col-title" data-i18n="footer.col.contact">Contact</div>'],
    ['<div class="footer-col-title">Contact</div>', '<div class="footer-col-title" data-i18n="footer.col.contact">Contact</div>'],
    ['<small>© 2026', '<small data-i18n="footer.copy">© 2026'],
    ['<a href="apropos.html" >À propos</a>', '<a href="apropos.html" data-i18n="footer.link.about">À propos</a>'],
    ['<a href="fondateurs.html" >Fondateurs</a>', '<a href="fondateurs.html" data-i18n="footer.link.founders">Fondateurs</a>'],
    ['<a href="apropos.html#valeurs" >Nos valeurs</a>', '<a href="apropos.html#valeurs" data-i18n="footer.link.values">Nos valeurs</a>'],
    ['<a href="apropos.html#environnement" >Environnement</a>', '<a href="apropos.html#environnement" data-i18n="footer.link.environment">Environnement</a>'],
    ['<a href="carrieres.html" >Carrières</a>', '<a href="carrieres.html" data-i18n="footer.link.careers">Carrières</a>'],
    ['<a href="design.html" >Design & Développement</a>', '<a href="design.html" data-i18n="footer.link.design">Design & Développement</a>'],
    ['<a href="fabrication.html" >Fabrication</a>', '<a href="fabrication.html" data-i18n="footer.link.manufacturing">Fabrication</a>'],
    ['<a href="fabrication.html#force-one" >Force One</a>', '<a href="fabrication.html#force-one" data-i18n="footer.link.forceone">Force One</a>'],
    ['<a href="clients.html" >Nos clients</a>', '<a href="clients.html" data-i18n="footer.link.clients">Nos clients</a>'],
    ['<a href="news.html" >News & Media</a>', '<a href="news.html" data-i18n="footer.link.news">News & Media</a>'],
    ['<strong>Siège · Suisse</strong>', '<strong data-i18n="footer.hq">Siège · Suisse</strong>'],
    ['<span>Genève, Suisse</span>', '<span data-i18n="footer.geneva">Genève, Suisse</span>'],
    ['<strong>Email</strong>', '<strong data-i18n="footer.email">Email</strong>'],
    ['<strong>Newsletter</strong>', '<strong data-i18n="footer.newsletter">Newsletter</strong>'],
    ['style="color: var(--pink-light);">S\'inscrire →</a>', 'style="color: var(--pink-light);" data-i18n="footer.subscribe">S\'inscrire →</a>'],
    ['<a href="#">Mentions légales</a>', '<a href="#" data-i18n="footer.legal.mentions">Mentions légales</a>'],
    ['<a href="#">Confidentialité</a>', '<a href="#" data-i18n="footer.legal.privacy">Confidentialité</a>'],
    ['<a href="#">Cookies</a>', '<a href="#" data-i18n="footer.legal.cookies">Cookies</a>'],
    ['<span>Contactez-nous</span><span class="btn-arrow">', '<span data-i18n="cta.btn.contact">Contactez-nous</span><span class="btn-arrow">'],
    ['<span>À propos de nous</span></a>', '<span data-i18n="cta.btn.about">À propos de nous</span></a>'],
    ['<a href="news.html" >News & Media</a>', '<a href="news.html" data-i18n="mobile.news">News & Media</a>'],
  ]);

  html = html.replace(/<\/?motion>/g, '');
  html = html.replace(
    '<div class="cta-final-eyebrow" data-i18n="cta.eyebrow">',
    '<div class="cta-final-eyebrow" data-i18n="cta.eyebrow">'
  );

  const scripts = `<script src="js/i18n/common.js"></script>
<script src="js/i18n/page-${pid}.js"></script>
<script src="js/i18n/loader.js"></script>
<script src="js/main.js" defer></script>`;

  html = html.replace(/<script src="js\/i18n[^<]+<\/script>\s*/g, '');
  html = html.replace(/<script src="js\/main\.js" defer><\/script>\s*/g, '');
  if (!html.includes('js/i18n/loader.js')) {
    html = html.replace('</body>', scripts + '\n</body>');
  }

  if (!html.includes('data-i18n-title')) {
    html = html.replace(/<title>([^<]*)<\/title>/, `<title data-i18n-title="meta.${pid}.title">$1</title>`);
  }

  fs.writeFileSync(path.join(ROOT, file), html);
  console.log('Patched', file);
}
