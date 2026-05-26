/** Remove erroneous <motion> tags and restore hero-eyebrow class across HTML files */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const file of fs.readdirSync(ROOT).filter((f) => f.endsWith('.html') && !f.includes('circum ('))) {
  let html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const before = html;
  html = html.replace(/<\/?motion>/g, '');
  html = html.replace(/Services<\/motion>/g, 'Services</motion>'.replace('</motion>', '</motion>'));
  html = html.replace(/Services<\/motion>/g, 'Services</div>');
  if (html !== before) {
    fs.writeFileSync(path.join(ROOT, file), html);
    console.log('Cleaned', file);
  }
}
