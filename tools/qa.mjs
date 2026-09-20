// Static QA over dist/: run `node tools/qa.mjs` after a build. Exits 1 when something is broken.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const pages = [];
(function walk(dir) { for (const f of readdirSync(dir)) { const p = join(dir, f); statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') && pages.push(p); } })(DIST);

const problems = [];
const ids = (html) => [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const fileFor = (path) => { const p = join(DIST, path.split('?')[0]); return existsSync(p) && statSync(p).isDirectory() ? join(p, 'index.html') : p; };
const images = new Set();

for (const file of pages) {
  const html = readFileSync(file, 'utf8');
  const rel = file.slice(DIST.length).replace(/\\/g, '/');
  const bad = (msg) => problems.push(`${rel}: ${msg}`);
  const visible = html.replace(/<script[\s\S]*?<\/script>/g, '');

  if ((html.match(/<h1[\s>]/g) || []).length !== 1) bad('needs exactly one <h1>');
  if (/\bundefined\b|\[object Object\]|NaN/.test(visible)) bad('contains "undefined" / "[object Object]" / NaN');
  const token = visible.match(/\{(pp|group|groupSize|cap|save|age)\}/); if (token) bad(`unfilled token ${token[0]}`);
  const dup = ids(html).filter((x, i, a) => a.indexOf(x) !== i); if (dup.length) bad(`duplicate ids: ${[...new Set(dup)].join(', ')}`);
  for (const m of html.matchAll(/<img\b[^>]*>/g)) { if (!/\salt="/.test(m[0])) bad(`img without alt: ${m[0].slice(0, 80)}`); const s = m[0].match(/\ssrc="(https:[^"]+)"/); if (s) images.add(s[1].replace(/&amp;/g, '&')); }
  if (!/<title>[^<]{20,}/.test(html)) bad('missing/short <title>');
  const noindex = /name="robots" content="noindex/.test(html);
  if (!noindex) {
    const d = html.match(/name="description" content="([^"]*)"/); if (!d || d[1].length < 70 || d[1].length > 170) bad(`meta description length ${d ? d[1].length : 0}`);
    if (!/rel="canonical"/.test(html)) bad('no canonical');
    if ((html.match(/hreflang=/g) || []).length < 4) bad('missing hreflang alternates');
  }
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch { bad('invalid JSON-LD'); } }

  for (const m of html.matchAll(/\s(?:href|src)="(\/[^"]*)"/g)) {
    const [path, hash] = m[1].split('#');
    const target = fileFor(path);
    if (!existsSync(target)) { bad(`broken link ${m[1]}`); continue; }
    if (hash && hash !== 'book' && target.endsWith('.html') && !ids(readFileSync(target, 'utf8')).includes(hash)) bad(`missing anchor ${m[1]}`);
  }
  for (const m of html.matchAll(/\shref="#([^"]+)"/g)) if (!ids(html).includes(m[1])) bad(`missing anchor #${m[1]}`);
}

// remote photos must exist
await Promise.all([...images].map(async (u) => { try { const r = await fetch(u, { method: 'HEAD' }); if (!r.ok) problems.push(`image ${r.status}: ${u}`); } catch (e) { problems.push(`image unreachable: ${u}`); } }));

console.log(`${pages.length} pages, ${images.size} remote images checked`);
if (problems.length) { console.error(problems.map((p) => '  ✗ ' + p).join('\n')); process.exit(1); }
console.log('  ✓ no problems found');
