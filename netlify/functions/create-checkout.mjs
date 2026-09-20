// POST /api/create-checkout -> { url } (Stripe Checkout).
// Prices and seats are always re-checked here, never trusted from the browser.
import { cfg, json, store, readDay, writeDay, seatsTaken, ticketTotal, isBookableDate, HOLD_MINUTES } from './lib/shared.mjs';

const clean = (v, max = 200) => String(v ?? '').replace(/\p{Cc}/gu, ' ').trim().slice(0, max);
const ADDON_NAMES = { hookah: 'Hookah & Bites', bottle: 'Bottle, Hookah & Bites' };

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return json(503, { error: 'payments_not_configured' });

  let b;
  try { b = await req.json(); } catch { return json(400, { error: 'bad_json' }); }

  const date = clean(b.date, 10);
  const guests = Number.parseInt(b.guests, 10);
  const lang = ['en', 'nl', 'es'].includes(b.lang) ? b.lang : 'en';
  const name = clean(b.name, 120), email = clean(b.email, 160), phone = clean(b.phone, 40);
  const addons = Object.fromEntries(Object.keys(cfg.addons).map((k) => [k, Math.max(0, Math.min(4, Number.parseInt(b.addons?.[k], 10) || 0))]));

  if (!isBookableDate(date)) return json(400, { error: 'bad_date' });
  if (!(guests >= 1 && guests <= cfg.capacity)) return json(400, { error: 'bad_guests' });
  if (name.length < 3 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || phone.replace(/\D/g, '').length < 7) return json(400, { error: 'bad_details' });

  const s = store();
  const day = await readDay(s, date);
  const remaining = cfg.capacity - seatsTaken(day);
  if (guests > remaining) return json(409, { error: 'sold_out', remaining: Math.max(0, remaining) });

  const origin = new URL(req.url).origin;
  const home = lang === 'en' ? '/' : `/${lang}/`;
  const p = new URLSearchParams();
  p.set('mode', 'payment');
  p.set('locale', lang);
  p.set('customer_email', email);
  p.set('success_url', `${origin}${home}booking/success/?session_id={CHECKOUT_SESSION_ID}`);
  p.set('cancel_url', `${origin}${home}#book`);
  p.set('expires_at', String(Math.floor(Date.now() / 1000) + HOLD_MINUTES * 60));
  p.set('payment_intent_data[description]', `Ambience ${date} · ${guests} guests · ${name}`);
  const meta = { date, guests, name, phone, lang, stay: clean(b.stay), note: clean(b.note, 400), hookah: addons.hookah, bottle: addons.bottle };
  for (const [k, v] of Object.entries(meta)) p.set(`metadata[${k}]`, String(v));

  const lines = [{ name: `Ambience Paint & Sip — ${date} (${guests} ${guests === 1 ? 'guest' : 'guests'})`, amount: ticketTotal(guests), qty: 1 }];
  for (const k of Object.keys(addons)) if (addons[k]) lines.push({ name: ADDON_NAMES[k] || k, amount: cfg.addons[k].price, qty: addons[k] });
  lines.forEach((l, i) => {
    p.set(`line_items[${i}][quantity]`, String(l.qty));
    p.set(`line_items[${i}][price_data][currency]`, cfg.currency.toLowerCase());
    p.set(`line_items[${i}][price_data][unit_amount]`, String(Math.round(l.amount * 100)));
    p.set(`line_items[${i}][price_data][product_data][name]`, l.name);
  });

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: p,
  });
  const session = await res.json();
  if (!res.ok) { console.error('stripe error', session.error?.message); return json(502, { error: 'stripe_error' }); }

  // hold the seats while the guest is paying; released by the webhook or when the hold expires
  day.holds.push({ id: session.id, guests, expires: Date.now() + HOLD_MINUTES * 60_000 });
  await writeDay(s, date, day);
  return json(200, { url: session.url });
};

export const config = { path: '/api/create-checkout' };
