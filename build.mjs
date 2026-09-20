// Static site generator: src/ -> dist/ (one fully translated page set per language, for SEO).
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { renderHome, renderSuccess, render404, hasWhatsapp } from './src/page.mjs';

const cfg = JSON.parse(readFileSync('src/config.json', 'utf8'));
const langs = ['en', 'nl', 'es'];
const pathOf = (l) => (l === 'en' ? '/' : `/${l}/`);
const DIST = 'dist';

const vars = {
  pp: cfg.pricing.perPerson,
  group: cfg.pricing.groupPrice,
  groupSize: cfg.pricing.groupSize,
  save: cfg.pricing.perPerson * cfg.pricing.groupSize - cfg.pricing.groupPrice,
  cap: cfg.capacity,
  age: cfg.minAge,
};
// fills build-time tokens; unknown tokens ({n}, {total}, ...) are left for the browser
const fill = (v) =>
  typeof v === 'string' ? v.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m))
  : Array.isArray(v) ? v.map(fill)
  : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fill(x)]))
  : v;

const v = createHash('sha1').update(readFileSync('src/styles.css')).update(readFileSync('src/app.js')).digest('hex').slice(0, 8);

const out = (file, content) => { const p = join(DIST, file); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, content); };

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
cpSync('src/assets', join(DIST, 'assets'), { recursive: true });
cpSync('src/assets/favicon.ico', join(DIST, 'favicon.ico'));
cpSync('src/styles.css', join(DIST, 'assets/styles.css'));
cpSync('src/app.js', join(DIST, 'assets/app.js'));

for (const lang of langs) {
  const t = fill(JSON.parse(readFileSync(`src/i18n/${lang}.json`, 'utf8')));
  const ctx = { t, cfg, lang, langs, pathOf, v };
  const base = pathOf(lang).slice(1);
  out(`${base}index.html`, renderHome(ctx));
  out(`${base}booking/success/index.html`, renderSuccess(ctx));
  if (lang === 'en') out('404.html', render404(ctx));
}

const today = new Date().toISOString().slice(0, 10);
out('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${langs.map((l) => `  <url>
    <loc>${cfg.siteUrl}${pathOf(l)}</loc>
    <lastmod>${today}</lastmod>
${langs.map((a) => `    <xhtml:link rel="alternate" hreflang="${a}" href="${cfg.siteUrl}${pathOf(a)}"/>`).join('\n')}
    <xhtml:link rel="alternate" hreflang="x-default" href="${cfg.siteUrl}/"/>
  </url>`).join('\n')}
</urlset>
`);
out('robots.txt', `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /booking/\nDisallow: /nl/booking/\nDisallow: /es/booking/\n\nSitemap: ${cfg.siteUrl}/sitemap.xml\n`);
out('site.webmanifest', JSON.stringify({
  name: cfg.brand, short_name: 'Ambience', start_url: '/', display: 'standalone', background_color: '#0a0806', theme_color: '#0a0806',
  icons: [{ src: '/assets/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/assets/icon-512.png', sizes: '512x512', type: 'image/png' }],
}, null, 2));
out('_headers', `/assets/*\n  Cache-Control: public, max-age=604800\n/*\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: SAMEORIGIN\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n`);

const placeholders = [];
if (!hasWhatsapp(cfg)) placeholders.push('contact.whatsapp (WhatsApp buttons stay hidden until it is real)');
if (!cfg.contact.email) placeholders.push('contact.email (empty: no email is shown on the site)');
if (cfg.siteUrl.includes('netlify.app')) placeholders.push('siteUrl (switch to your own domain once it is connected)');
console.log(`built ${langs.length} languages -> ${DIST}/`);
if (placeholders.length) console.warn('! placeholder values still in src/config.json:', placeholders.join(', '));
