// Shared by the booking functions: config, pricing rules and seat bookkeeping (Netlify Blobs).
import { getStore } from '@netlify/blobs';

import cfg from '../../../src/config.json' with { type: 'json' }; // inlined by esbuild at deploy time
export { cfg };
export const HOLD_MINUTES = 31; // Stripe's minimum checkout expiry is 30 minutes

export const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
export const store = () => getStore({ name: 'bookings', consistency: 'strong' });

// Same rule as the browser (src/app.js): groups of 6 pay the group price, and we round up to a group when that is cheaper.
export function ticketTotal(n) {
  const { perPerson, groupSize, groupPrice } = cfg.pricing;
  const g = Math.floor(n / groupSize), r = n % groupSize;
  const normal = g * groupPrice + r * perPerson, roundUp = (g + 1) * groupPrice;
  return r && roundUp < normal ? roundUp : normal;
}

export function todayInCuracao() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: cfg.schedule.timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false }).formatToParts(new Date()).map((p) => [p.type, p.value]));
  return { ymd: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) % 24 };
}

export function isBookableDate(ymd) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
  const d = new Date(`${ymd}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== ymd || !cfg.schedule.weekdays.includes(d.getUTCDay())) return false;
  const now = todayInCuracao();
  const day0 = Date.parse(`${now.ymd}T00:00:00Z`);
  const min = now.hour < cfg.schedule.sameDayCutoffHour ? now.ymd : new Date(day0 + 864e5).toISOString().slice(0, 10);
  const max = new Date(day0 + cfg.schedule.bookAheadDays * 864e5).toISOString().slice(0, 10);
  return ymd >= min && ymd <= max;
}

// One record per evening: { confirmed: [{id, guests, ...}], holds: [{id, guests, expires}] }
const emptyDay = () => ({ confirmed: [], holds: [] });
const prune = (day) => { day.holds = (day.holds || []).filter((h) => h.expires > Date.now()); day.confirmed ||= []; return day; };
export const seatsTaken = (day) => [...day.confirmed, ...day.holds].reduce((n, b) => n + b.guests, 0);

export async function readDay(s, ymd) {
  return prune((await s.get(`day/${ymd}`, { type: 'json' })) || emptyDay());
}

// Read-modify-write with optimistic locking, so two guests paying at the same moment can never
// both take the last seats. `mutate(day)` may return false to abort without writing.
export async function updateDay(s, ymd, mutate) {
  const key = `day/${ymd}`;
  for (let attempt = 0; attempt < 6; attempt++) {
    const found = await s.getWithMetadata(key, { type: 'json' });
    const day = prune(found?.data || emptyDay());
    if (mutate(day) === false) return { ok: false, day };
    const res = await s.setJSON(key, day, found ? { onlyIfMatch: found.etag } : { onlyIfNew: true });
    if (res.modified) return { ok: true, day };
    await new Promise((r) => setTimeout(r, 40 + Math.random() * 120)); // someone else wrote first: re-read and retry
  }
  throw new Error(`could not update ${key}: too much contention`);
}

export async function stripeGet(path) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, { headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` } });
  return { ok: res.ok, data: await res.json() };
}

// Turns a paid Checkout Session into a confirmed booking. Idempotent: the webhook and the
// success page may both call it for the same session.
export async function confirmSession(s, session) {
  const m = session.metadata || {};
  if (!m.date || session.payment_status !== 'paid') return false;
  await updateDay(s, m.date, (day) => {
    day.holds = day.holds.filter((h) => h.id !== m.hold);
    if (day.confirmed.some((c) => c.id === session.id)) return;
    day.confirmed.push({
      id: session.id, guests: Number(m.guests), name: m.name, email: session.customer_details?.email || session.customer_email,
      phone: m.phone, stay: m.stay || '', note: m.note || '', hookah: Number(m.hookah || 0), bottle: Number(m.bottle || 0), lang: m.lang,
      amount: session.amount_total / 100, paidAt: new Date().toISOString(),
    });
  });
  return true;
}

export const releaseHold = (s, ymd, holdId) => updateDay(s, ymd, (day) => {
  const before = day.holds.length;
  day.holds = day.holds.filter((h) => h.id !== holdId);
  return day.holds.length !== before; // nothing to release → skip the write
});
