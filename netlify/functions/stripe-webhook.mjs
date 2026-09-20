// POST /api/stripe-webhook — confirms seats when a payment completes, frees them when a checkout expires.
// Stripe dashboard → Developers → Webhooks → endpoint https://YOUR-DOMAIN/api/stripe-webhook
// events: checkout.session.completed, checkout.session.expired
import { createHmac, timingSafeEqual } from 'node:crypto';
import { json, store, confirmSession, releaseHold } from './lib/shared.mjs';

function verify(payload, header, secret) {
  const pairs = String(header || '').split(',').map((kv) => kv.trim().split('='));
  const t = pairs.find(([k]) => k === 't')?.[1];
  const sigs = pairs.filter(([k]) => k === 'v1').map(([, v]) => v); // several while a secret is being rolled
  if (!t || !sigs.length || Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const expected = Buffer.from(createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex'));
  return sigs.some((v) => { const b = Buffer.from(v); return b.length === expected.length && timingSafeEqual(expected, b); });
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
  if (event.type === 'checkout.session.completed') await confirmSession(s, session);
  else await releaseHold(s, date, session.metadata.hold);
  return json(200, { ok: true });
};

export const config = { path: '/api/stripe-webhook' };
