// GET /api/confirm-booking?session_id=cs_... — called by the success page.
// Verifies the payment with Stripe, confirms the seats (in case the webhook is slow or not set up)
// and returns the booking summary to display.
import { json, store, stripeGet, confirmSession } from './lib/shared.mjs';

export default async (req) => {
  if (!process.env.STRIPE_SECRET_KEY) return json(503, { error: 'payments_not_configured' });
  const id = new URL(req.url).searchParams.get('session_id') || '';
  if (!/^cs_[A-Za-z0-9_]{10,200}$/.test(id)) return json(400, { error: 'bad_session' });

  const { ok, data: session } = await stripeGet(`checkout/sessions/${id}`);
  if (!ok) return json(404, { error: 'not_found' });
  if (!(await confirmSession(store(), session))) return json(402, { error: 'not_paid' });

  const m = session.metadata;
  return json(200, { date: m.date, guests: Number(m.guests), total: session.amount_total / 100, currency: session.currency });
};

export const config = { path: '/api/confirm-booking' };
