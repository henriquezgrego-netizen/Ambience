# Ambience Curaçao — website

Black & gold marketing site with an online booking + payment flow. Static HTML (one fully translated page set per language for SEO) plus three small Netlify Functions for Stripe Checkout and seat availability.

## Run it locally

```bash
npm install
npm run dev
```

Opens on http://localhost:4173. The local server **mocks** availability and payment ("Preview mode"), so you can click through the whole booking flow without Stripe.

## Where to change things

| What | File |
| --- | --- |
| Prices, capacity (20), days/times, contact details, domain, photos | `src/config.json` |
| All text — English / Dutch / Spanish, including the SEO landing pages (`pages` array: slug, title, sections, FAQ) | `src/i18n/en.json`, `nl.json`, `es.json` |
| Page structure, SEO tags, structured data | `src/page.mjs` |
| Design, logo intro animation | `src/styles.css` |
| Booking flow, calendar, interactions | `src/app.js` |
| Logo → transparent PNGs, favicons, share image | `npm run assets` (reads `tools/logo-source.jpg`) |

After any change run `npm run build` (output in `dist/`), then `node tools/qa.mjs` to check every page for broken links, missing alts, bad meta tags and unreachable photos.

## Before going live — checklist

1. `src/config.json`: WhatsApp and Instagram are real. Still open: a public **email** (`contact.email` is empty, so no email is shown anywhere), your own **domain** (`siteUrl`) and the exact Google Maps link. The build prints a warning while placeholders remain.
2. Confirm the **upgrade prices** (`addons.hookah` = $95, `addons.bottle` = $220 are placeholders) and the inclusions/policies in the text (welcome drink, doormat size, 48-hour cancellation, free parking, private events 8–60 guests).
3. Replace the stock photos (`images` in `src/config.json` are Unsplash photo IDs) with photos of the real landhuis and evenings. To use your own files, put them in `src/assets/` and adapt `img()` in `src/page.mjs`.
4. Deployed on Netlify as project `ambience-curacao` → https://ambience-curacao.netlify.app (build settings live in `netlify.toml`). The project is linked to https://github.com/henriquezgrego-netizen/Ambience — **every push to `main` deploys automatically**. When you connect your own domain, update `siteUrl` in `src/config.json` and push.
5. In Netlify → Environment variables set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` (see `.env.example`).
6. In Stripe → Developers → Webhooks add `https://YOUR-DOMAIN/api/stripe-webhook` with events `checkout.session.completed` and `checkout.session.expired`. Turn on Stripe's customer email receipts.
7. Netlify → Forms: enable form detection so "private-event" requests arrive by email.
8. Submit `https://YOUR-DOMAIN/sitemap.xml` in Google Search Console and create a Google Business Profile (biggest single win for "things to do in Curaçao" searches).

## How booking works

- Evenings: Thu–Sun, max 20 guests. Bookable until 2 PM Curaçao time on the day, up to 120 days ahead.
- Pricing: $85 pp; every 6 guests pay the $375 group price, and 5 guests are automatically rounded to the group price because it is cheaper.
- `POST /api/create-checkout` re-validates date, seats and prices on the server, **reserves the seats atomically** (optimistic locking, so two guests can never both get the last seats), then opens a Stripe Checkout session. The hold lasts 31 minutes. Rate-limited per IP.
- `POST /api/stripe-webhook` confirms the seats when payment succeeds and frees them when a checkout expires.
- `GET /api/confirm-booking?session_id=…` is called by the success page: it verifies the payment with Stripe, confirms the seats (so bookings are safe even if the webhook is slow or missing) and returns the summary shown to the guest.
- `GET /api/availability` feeds the calendar (available / few left / sold out). Bookings are stored in Netlify Blobs (store `bookings`, one record per evening) — view them with `netlify blobs:list bookings`.
- The guest's selections survive a trip to Stripe and back (cancel link or browser Back). If checkout can't be opened the guest gets a pre-filled WhatsApp message (or email while no WhatsApp number is configured).
- CSS/JS URLs carry a content hash (`?v=`), so a deploy is picked up immediately despite the long cache on `/assets`.
