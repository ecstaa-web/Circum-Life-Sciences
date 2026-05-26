/**
 * Split monolithic circum (4).html into multi-page static site.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'circum (4).html');
const OUT = ROOT;

const PAGE_MAP = {
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

const PAGE_TITLES = {
  home: 'Circum Life Sciences · Laboratoire CDMO intégré',
  apropos: 'À propos · Circum Life Sciences',
  fondateurs: 'Les fondateurs · Circum Life Sciences',
  design: 'Design & Développement · Circum Life Sciences',
  fabrication: 'Fabrication · Circum Life Sciences',
  clients: 'Nos clients · Circum Life Sciences',
  news: 'News & Media · Circum Life Sciences',
  newsletter: 'Newsletter · Circum Life Sciences',
  carrieres: 'Carrières · Circum Life Sciences',
  contact: 'Contact · Circum Life Sciences',
};

function pageHref(pageId, hash) {
  const file = PAGE_MAP[pageId] || 'index.html';
  return hash ? `${file}#${hash}` : file;
}

function transformLinks(html) {
  return html
    .replace(
      /<a\s+href="#"\s*((?:[^>]*?\s+)*)data-page="([^"]+)"(?:\s+data-hash="([^"]+)")?([^>]*)>/gi,
      (_, attrs, page, hash, rest) => {
        const clean = attrs
          .replace(/\s*data-page="[^"]*"\s*/gi, '')
          .replace(/\s*data-hash="[^"]*"\s*/gi, '');
        return `<a href="${pageHref(page, hash)}" ${clean}${rest}>`;
      }
    )
    .replace(/<main class="page(?: active)?" data-page-id="[^"]*">/g, '<main class="page-content">');
}

function extractBase64Video(html) {
  const videoMatch = html.match(/<source src="(data:video\/mp4;base64,[^"]+)"/);
  if (!videoMatch) return html;
  const dataUrl = videoMatch[1];
  const b64 = dataUrl.split(',')[1];
  const buf = Buffer.from(b64, 'base64');
  const videoPath = path.join(OUT, 'assets', 'video');
  fs.mkdirSync(videoPath, { recursive: true });
  fs.writeFileSync(path.join(videoPath, 'hero.mp4'), buf);
  console.log(`Extracted hero video: ${(buf.length / 1024 / 1024).toFixed(2)} MB`);

  const posterMatch = html.match(/poster="(data:image\/jpeg;base64,[^"]+)"/);
  if (posterMatch) {
    const pB64 = posterMatch[1].split(',')[1];
    const pBuf = Buffer.from(pB64, 'base64');
    const imgPath = path.join(OUT, 'assets', 'img');
    fs.mkdirSync(imgPath, { recursive: true });
    fs.writeFileSync(path.join(imgPath, 'hero-poster.jpg'), pBuf);
    html = html.replace(posterMatch[0], 'poster="assets/img/hero-poster.jpg"');
  }

  return html.replace(
    /<source src="data:video\/mp4;base64,[^"]+"[^>]*>/,
    '<source src="assets/video/hero.mp4" type="video/mp4">'
  );
}

const NAV_ACTIVE = {
  home: [],
  apropos: ['nav.about'],
  fondateurs: ['nav.about'],
  design: ['nav.design'],
  fabrication: ['nav.manufacturing'],
  clients: ['nav.clients'],
  news: ['nav.news'],
  contact: ['nav.contact'],
};

function markNavActive(shell, i18nKey) {
  let s = shell;
  const spanRe = new RegExp(
    `(<a href="[^"]*"\\s+)class="nav-link"(><span data-i18n="${i18nKey}")`
  );
  const directRe = new RegExp(
    `(<a href="[^"]*"\\s+)class="nav-link"( data-i18n="${i18nKey}")`
  );
  s = s.replace(spanRe, '$1class="nav-link active"$2');
  s = s.replace(directRe, '$1class="nav-link active"$2');
  return s;
}

const html = fs.readFileSync(SRC, 'utf8');

// --- CSS ---
const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (!styleMatch) throw new Error('No <style> found');
let css = styleMatch[1];
css = css.replace(
  /\/\* ===== SPA ROUTER ===== \*\/[\s\S]*?@keyframes pageIn[\s\S]*?\}/,
  '/* Multi-page: no SPA router */'
);
const cssDir = path.join(OUT, 'css');
fs.mkdirSync(cssDir, { recursive: true });
fs.writeFileSync(path.join(cssDir, 'main.css'), css.trim() + '\n');

// --- i18n + main JS ---
const i18nMatch = html.match(/<script>\s*window\.CIRCUM_I18N = [\s\S]*?};\s*<\/script>/);
const mainScriptMatch = html.match(
  /<script>\s*\/\* ={5,}[\s\S]*?CIRCUM LIFE SCIENCES — SHARED SCRIPTS[\s\S]*?\}\)\(\);\s*<\/script>/
);
if (!i18nMatch || !mainScriptMatch) throw new Error('Scripts not found');

const jsDir = path.join(OUT, 'js');
fs.mkdirSync(jsDir, { recursive: true });
fs.writeFileSync(
  path.join(jsDir, 'i18n.js'),
  i18nMatch[0].replace('<script>', '').replace('</script>', '').trim() + '\n'
);

let mainJs = mainScriptMatch[0]
  .replace('<script>', '')
  .replace('</script>', '')
  .trim();
const spaIdx = mainJs.indexOf('/* ===== SPA ROUTER ===== */');
if (spaIdx !== -1) mainJs = mainJs.slice(0, spaIdx).trim();

if (!mainJs.includes('initHomeVideo')) {
  mainJs = mainJs.replace(
    '  // ===== Init all =====',
    `  function initHomeVideo() {
    var video = document.querySelector('.hero-video-bg');
    if (video) video.play().catch(function() {});
  }

  function scrollToHash() {
    var hash = window.location.hash.slice(1);
    if (!hash) return;
    var target = document.getElementById(hash);
    if (target) {
      setTimeout(function() {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }

  // ===== Init all =====`
  );
  mainJs = mainJs.replace(
    '    initForms();\n  });',
    '    initForms();\n    initHomeVideo();\n    scrollToHash();\n  });'
  );
}

fs.writeFileSync(path.join(jsDir, 'main.js'), mainJs + '\n');

// --- Extract regions ---
const bodyStart = html.indexOf('<body>') + 6;
const bodyEnd = html.indexOf('</body>');
const body = html.slice(bodyStart, bodyEnd);

const topbarStart = body.indexOf('<motion>');
const topbarStartReal = body.indexOf('<motion>') === -1 ? body.indexOf('<motion>') : body.indexOf('<div class="topbar">');
const shellStart = body.indexOf('<motion>') === -1 ? body.indexOf('<motion>') : body.indexOf('<motion>');
const shellStart2 = body.indexOf('<div class="topbar">');
const firstMain = body.indexOf('<main class="page');
const globalTailStart = body.indexOf('<section class="newsletter-strip">');
const globalTailEnd = body.indexOf('</footer>', globalTailStart) + '</footer>'.length;

const shell = body.slice(shellStart2, firstMain);
const globalTail = body.slice(globalTailStart, globalTailEnd);

// Parse each <main> block
const mainRegex = /<main class="page[^"]*" data-page-id="([^"]+)">([\s\S]*?)<\/main>/g;
const pages = {};
let m;
while ((m = mainRegex.exec(body)) !== null) {
  pages[m[1]] = m[2].trim();
}

function shellForPage(pageId) {
  let s = transformLinks(shell);
  const keys = NAV_ACTIVE[pageId] || [];
  keys.forEach((i18nKey) => {
    s = markNavActive(s, i18nKey);
  });
  if (pageId === 'home') {
    s = s.replace(/class="nav-logo"/, 'class="nav-logo" aria-current="page"');
  }
  return s;
}

function tailForPage(pageId) {
  let t = transformLinks(globalTail);
  if (pageId === 'newsletter') {
    t = t.replace(/<section class="newsletter-strip">[\s\S]*?<\/section>\s*/m, '');
  }
  return t;
}

function buildPage(pageId, content) {
  let mainContent = transformLinks(content);
  if (pageId === 'home') {
    mainContent = extractBase64Video(mainContent);
  }

  const title = PAGE_TITLES[pageId] || 'Circum Life Sciences';
  const desc =
    pageId === 'home'
      ? 'Entreprise CDMO intégrée verticalement, dispositifs médicaux et sciences de la vie. Suisse · France · Tunisie.'
      : 'Circum Life Sciences — CDMO dispositifs médicaux. Suisse · France · Tunisie.';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="stylesheet" href="css/main.css">
<link rel="preload" href="circum-logo.png" as="image">
${pageId === 'home' ? '<link rel="preload" href="assets/video/hero.mp4" as="video" type="video/mp4">' : ''}
</head>
<body data-page="${pageId}">

${shellForPage(pageId)}

<main class="page-content">
${mainContent}
</main>

${tailForPage(pageId)}

<script src="js/i18n.js" defer></script>
<script src="js/main.js" defer></script>
</body>
</html>
`;
}

for (const [pageId, content] of Object.entries(pages)) {
  const filename = PAGE_MAP[pageId];
  if (!filename) continue;
  const outHtml = buildPage(pageId, content);
  fs.writeFileSync(path.join(OUT, filename), outHtml);
  const size = fs.statSync(path.join(OUT, filename)).size;
  console.log(`Wrote ${filename} (${(size / 1024).toFixed(1)} KB)`);
}

console.log('Done. Original kept as circum (4).html');
