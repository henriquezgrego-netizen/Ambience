// POST /api/stripe-webhook — confirms seats when a payment completes, frees them when a checkout expires.
// Stripe dashboard → Developers → Webhooks → endpoint https://YOUR-DOMAIN/api/stripe-webhook
// events: checkout.session.completed, checkout.session.expired
import { createHmac, timingSafeEqual } from 'node:crypto';
import { json, store, readDay, writeDay } from './lib/shared.mjs';

function verify(payload, header, secret) {
  const parts = Object.fromEntries(String(header).split(',').map((kv) => kv.split('=')));
  if (!parts.t || !parts.v1 || Math.abs(Date.now() / 1000 - Number(parts.t)) > 300) return false;
  const expected = createHmac('sha256', secret).update(`${parts.t}.${payload}`).digest('hex');
  const a = Buffer.from(expected), b = Buffer.from(parts.v1);
  return a.length === b.length && timingSafeEqual(a, b);
}

export default async (req) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return json(503, { error: 'webhook_not_configured' });
  const payload = await req.text();
  if (!verify(payload, req.headers.get('stripe-signature'), secret)) return json(400, { error: 'bad_signature' });

  const event = JSON.parse(payload);
  const session = event.data?.object;
  const date = session?.metadata?.date;
  if (!date || !['checkout.session.completed', 'checkout.session.expired'].includes(event.type)) return json(200, { ignored: true });

  const s = store();
  const day = await readDay(s, date);
  day.holds = day.holds.filter((h) => h.id !== session.id);
  if (event.type === 'checkout.session.completed' && session.payment_status === 'paid' && !day.confirmed.some((c) => c.id === session.id)) {
    const m = session.metadata;
    day.confirmed.push({
      id: session.id, guests: Number(m.guests), name: m.name, email: session.customer_details?.email || session.customer_email,
      phone: m.phone, stay: m.stay, note: m.note, hookah: Number(m.hookah), bottle: Number(m.bottle), lang: m.lang,
      amount: session.amount_total / 100, paidAt: new Date().toISOString(),
    });
  }
  await writeDay(s, date, day);
  return json(200, { ok: true });
};

export const config = { path: '/api/stripe-webhook' };
