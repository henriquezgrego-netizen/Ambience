// Local preview server: serves dist/ and mocks the /api endpoints (no Stripe, no real payments).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const PORT = process.env.PORT || 4173;
const ROOT = 'dist';
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json' };
const json = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };

// sample availability so the calendar shows open / few-left / sold-out states
function mockBooked() {
  const booked = {}; const d = new Date();
  for (let i = 0, n = 0; i < 60; i++) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (![4, 5, 6, 0].includes(d.getUTCDay())) continue;
    n++;
    booked[d.toISOString().slice(0, 10)] = n % 7 === 3 ? 20 : n % 4 === 1 ? 16 : n % 3 === 0 ? 9 : 4;
  }
  return booked;
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/availability') return json(res, 200, { capacity: 20, booked: mockBooked(), demo: true });
  if (url.pathname === '/api/create-checkout' && req.method === 'POST') {
    let body = ''; for await (const c of req) body += c;
    const lang = JSON.parse(body || '{}').lang;
    return setTimeout(() => json(res, 200, { url: `${lang && lang !== 'en' ? `/${lang}` : ''}/booking/success/?demo=1` }), 900);
  }
  if (req.method === 'POST') { res.writeHead(200); return res.end('ok'); } // Netlify Forms stand-in
  const p = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
  let file = join(ROOT, p);
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(await readFile(join(ROOT, '404.html')).catch(() => 'Not found'));
  }
}).listen(PORT, () => console.log(`Ambience preview → http://localhost:${PORT}`));
