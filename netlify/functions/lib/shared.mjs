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
  if (Number.isNaN(d.getTime()) || !cfg.schedule.weekdays.includes(d.getUTCDay())) return false;
  const now = todayInCuracao();
  const day0 = Date.parse(`${now.ymd}T00:00:00Z`);
  const min = now.hour < cfg.schedule.sameDayCutoffHour ? now.ymd : new Date(day0 + 864e5).toISOString().slice(0, 10);
  const max = new Date(day0 + cfg.schedule.bookAheadDays * 864e5).toISOString().slice(0, 10);
  return ymd >= min && ymd <= max;
}

// One record per evening: { confirmed: [{id, guests, ...}], holds: [{id, guests, expires}] }
export async function readDay(s, ymd) {
  const day = (await s.get(`day/${ymd}`, { type: 'json' })) || { confirmed: [], holds: [] };
  day.holds = day.holds.filter((h) => h.expires > Date.now());
  return day;
}
export const seatsTaken = (day) => [...day.confirmed, ...day.holds].reduce((n, b) => n + b.guests, 0);
export const writeDay = (s, ymd, day) => s.setJSON(`day/${ymd}`, day);
