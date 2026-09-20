// HTML renderers. build.mjs calls these once per language.

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const U = 'https://images.unsplash.com/';
const src = (id, w, h) => `${U}${id}?auto=format&fit=crop&w=${w}${h ? `&h=${h}` : ''}&q=72`;

function img(id, alt, { w = 800, ratio = null, cls = '', eager = false, sizes = '(max-width: 760px) 100vw, 50vw' } = {}) {
  const widths = [480, 800, 1200, 1600].filter((x) => x <= w * 2);
  const h = (x) => (ratio ? Math.round(x / ratio) : null);
  const srcset = widths.map((x) => `${src(id, x, h(x))} ${x}w`).join(', ');
  return `<img class="${cls}" src="${src(id, w, h(w))}" srcset="${srcset}" sizes="${sizes}" alt="${esc(alt)}" width="${w}" height="${h(w) || Math.round(w * 0.66)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

const ic = {
  cal: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/></svg>',
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.500C5 14.800 12 21 12 21z"/><circle cx="12" cy="9.500" r="2.500"/></svg>',
  door: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 21V4.500A1.500 1.500 0 0 1 7.500 3h9A1.500 1.500 0 0 1 18 4.500V21M3 21h18"/><circle cx="14.500" cy="12.500" r=".8"/></svg>',
  id: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5.500" width="18" height="13" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M5.800 16c.6-1.600 1.800-2.300 3.200-2.300s2.600.7 3.200 2.300M15 10h3.500M15 13.500h3.500"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.500l4.500 4.500L19 7.500"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  ig: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.500" y="3.500" width="17" height="17" rx="4.500"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r=".9" fill="currentColor" stroke="none"/></svg>',
  mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5.500" width="18" height="13" rx="2"/><path d="M3.500 7l8.500 6.500L20.500 7"/></svg>',
  wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.300-4.200A8 8 0 1 1 8.400 19L4 20z"/><path d="M9.300 8.800c-.3 1.200.3 2.700 1.600 4 1.300 1.300 2.800 1.900 4 1.600l.6-1.300-1.700-1-.8.700c-.7-.3-1.500-1.100-1.800-1.800l.7-.8-1-1.700-1.600.300z" fill="currentColor" stroke="none"/></svg>',
  lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.500" width="14" height="10" rx="2"/><path d="M8 10.500V8a4 4 0 0 1 8 0v2.500"/></svg>',
};

const BARS = [12, 26, 44, 66, 100, 66, 44, 26, 12];
const wave = (cls = '') => `<div class="wave ${cls}" aria-hidden="true"><i class="wave-line"></i><span class="wave-bars">${BARS.map((h, i) => `<b style="--h:${h}%;--i:${i}"></b>`).join('')}</span><i class="wave-line"></i></div>`;

function head({ t, cfg, lang, langs, pathOf, v, page = '', title, description, noindex = false, jsonld = [] }) {
  const url = cfg.siteUrl + pathOf(lang) + page;
  const alternates = noindex ? '' : langs.map((l) => `<link rel="alternate" hreflang="${l}" href="${cfg.siteUrl}${pathOf(l)}${page}">`).join('\n  ') + `\n  <link rel="alternate" hreflang="x-default" href="${cfg.siteUrl}${pathOf('en')}${page}">`;
  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  ${noindex ? '<meta name="robots" content="noindex, nofollow">' : `<meta name="keywords" content="${esc(t.meta.keywords)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="${url}">
  ${alternates}`}
  <meta name="theme-color" content="#0a0806">
  <meta name="geo.region" content="CW">
  <meta name="geo.placename" content="Willemstad, Curaçao">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${esc(cfg.brand)}">
  <meta property="og:title" content="${esc(t.meta.ogTitle)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${cfg.siteUrl}/assets/og-image.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="${t.locale}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/favicon.ico" sizes="48x48">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png">
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preconnect" href="https://images.unsplash.com">
  <link rel="preload" as="image" href="/assets/logo-emblem.png">
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/styles.css?v=${v}">
  <noscript><style>.reveal{opacity:1;transform:none}</style></noscript>
  ${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`).join('\n  ')}
</head>`;
}

function header({ t, lang, langs, pathOf, home = '' }) {
  const link = (id, label) => `<a href="${home}#${id}">${label}</a>`;
  return `
<header class="site-header" id="top">
  <a class="brand" href="${pathOf(lang)}" aria-label="Ambience Curaçao">
    <span class="brand-emblem"><img src="/assets/logo-emblem.png" alt="" width="720" height="580"><i class="sheen" style="--mask:url(/assets/logo-emblem.png)"></i></span>
    <img class="brand-word" src="/assets/logo-wordmark.png" alt="Ambience" width="1523" height="190">
  </a>
  <nav class="nav" id="nav" aria-label="Main">
    ${link('experience', t.nav.experience)}
    ${link('evening', t.nav.evening)}
    ${link('packages', t.nav.packages)}
    ${link('private', t.nav.private)}
    ${link('faq', t.nav.faq)}
    <div class="lang" role="group" aria-label="${esc(t.nav.language)}">
      ${langs.map((l) => `<a href="${pathOf(l)}" hreflang="${l}" lang="${l}" ${l === lang ? 'aria-current="true"' : ''}>${l.toUpperCase()}</a>`).join('')}
    </div>
    ${home ? `<a class="btn btn-gold btn-sm" href="${home}#book">${t.nav.book}</a>` : `<button class="btn btn-gold btn-sm" data-book>${t.nav.book}</button>`}
  </nav>
  <button class="burger" id="burger" aria-label="${esc(t.nav.menu)}" aria-expanded="false" aria-controls="nav"><span></span><span></span></button>
</header>`;
}

// WhatsApp only appears once a real number is configured
export const hasWhatsapp = (cfg) => !/^0*$|0000000$/.test(cfg.contact.whatsapp || '');

function footer({ t, cfg, lang, pathOf }) {
  const c = cfg.contact;
  const wa = hasWhatsapp(cfg);
  return `
<footer class="site-footer">
  <div class="wrap footer-grid">
    <div class="footer-brand">
      <img src="/assets/logo-stacked.png" alt="Ambience Curaçao" width="900" height="490" loading="lazy">
      ${wave('wave-live')}
      <p>${t.ft.tag}</p>
    </div>
    <div>
      <h3>${t.ft.explore}</h3>
      <a href="${pathOf(lang)}#experience">${t.nav.experience}</a>
      <a href="${pathOf(lang)}#packages">${t.nav.packages}</a>
      <a href="${pathOf(lang)}#private">${t.nav.private}</a>
      <a href="${pathOf(lang)}#faq">${t.nav.faq}</a>
    </div>
    <div>
      <h3>${t.ft.visit}</h3>
      <p>${t.ft.addr}</p>
      <p>${t.ft.hours}</p>
    </div>
    <div>
      <h3>${t.ft.contact}</h3>
      ${wa ? `<a href="https://wa.me/${c.whatsapp}" target="_blank" rel="noopener">${ic.wa}<span>${c.whatsappDisplay}</span></a>` : ``}
      ${c.email ? `<a href="mailto:${c.email}">${ic.mail}<span>${c.email}</span></a>` : ``}
      <a href="${c.instagram}" target="_blank" rel="noopener">${ic.ig}<span>${c.instagramHandle || 'Instagram'}</span></a>
    </div>
  </div>
  <div class="wrap footer-base">
    <p>© <span data-year>2026</span> ${cfg.brand}. ${t.ft.rights}</p>
    <p>${t.ft.age}</p>
  </div>
</footer>`;
}

export function renderHome(ctx) {
  const { t, cfg, lang, pathOf } = ctx;
  const I = cfg.images;
  const p = cfg.pricing;
  const c = cfg.contact;
  const placeholderPhone = !hasWhatsapp(cfg);

  const business = {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'TouristAttraction'],
    '@id': cfg.siteUrl + '/#business',
    name: cfg.brand,
    description: t.meta.description,
    url: cfg.siteUrl + pathOf(lang),
    image: [cfg.siteUrl + '/assets/og-image.jpg'],
    logo: cfg.siteUrl + '/assets/icon-512.png',
    ...(c.email ? { email: c.email } : {}),
    ...(placeholderPhone ? {} : { telephone: '+' + c.whatsapp }),
    priceRange: `$${p.perPerson} – $${p.groupPrice}`,
    currenciesAccepted: 'USD',
    paymentAccepted: 'Credit Card',
    address: { '@type': 'PostalAddress', streetAddress: c.street, addressLocality: c.city, addressCountry: c.country },
    areaServed: { '@type': 'Country', name: 'Curaçao' },
    availableLanguage: ['English', 'Dutch', 'Spanish', 'Papiamento'],
    touristType: ['Couples', 'Groups of friends', 'Cruise passengers', 'Bachelorette parties'],
    openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Thursday', 'Friday', 'Saturday', 'Sunday'], opens: cfg.schedule.checkIn, closes: cfg.schedule.end }],
    sameAs: [c.instagram],
    makesOffer: [
      { '@type': 'Offer', name: t.pk.soloT, price: p.perPerson, priceCurrency: 'USD', availability: 'https://schema.org/InStock', url: cfg.siteUrl + pathOf(lang) + '#packages' },
      { '@type': 'Offer', name: t.pk.groupT, price: p.groupPrice, priceCurrency: 'USD', availability: 'https://schema.org/InStock', url: cfg.siteUrl + pathOf(lang) + '#packages' },
    ],
  };
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: t.faq.items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
  const siteLd = { '@context': 'https://schema.org', '@type': 'WebSite', name: cfg.brand, url: cfg.siteUrl + pathOf(lang), inLanguage: lang };

  const flow = [1, 2, 3, 4, 5].map((n) => `
        <li class="flow-item reveal">
          <span class="flow-time">${t.flow['t' + n]}</span>
          <span class="flow-dot" aria-hidden="true"></span>
          <div><h3>${t.flow[`t${n}t`]}</h3><p>${t.flow[`t${n}d`]}</p></div>
        </li>`).join('');

  const clientData = {
    lang,
    home: pathOf(lang),
    successUrl: pathOf(lang) + 'booking/success/',
    capacity: cfg.capacity,
    pricing: cfg.pricing,
    addons: { hookah: { price: cfg.addons.hookah.price, name: t.pk.hookahT, desc: t.pk.hookahD }, bottle: { price: cfg.addons.bottle.price, name: t.pk.bottleT, desc: t.pk.bottleD } },
    schedule: cfg.schedule,
    contact: { whatsapp: placeholderPhone ? '' : c.whatsapp, email: c.email },
    t: { ...t.bk, days: t.days, perTable: t.pk.perTable, pvOk: t.pv.ok, pvErr: t.pv.err, pvSending: t.pv.sending, pvSend: t.pv.send, mailFallback: t.bk.mailFallback },
  };

  return `${head({ ...ctx, title: t.meta.title, description: t.meta.description, jsonld: [business, faqLd, siteLd] })}
<body class="has-intro">
<script>try{if(sessionStorage.getItem('amb-intro'))document.body.classList.add('intro-seen')}catch(e){}</script>

<div class="intro" id="intro" aria-hidden="true">
  <div class="intro-glow"></div>
  <div class="intro-logo">
    <div class="il-emblem">
      <div class="il-ring" style="--img:url(/assets/logo-emblem.png)"></div>
      <i class="sheen" style="--mask:url(/assets/logo-emblem.png)"></i>
      <span class="il-glint"></span>
    </div>
    <div class="il-word"><img src="/assets/logo-wordmark.png" alt="" width="1523" height="190"><i class="sheen" style="--mask:url(/assets/logo-wordmark.png)"></i></div>
    ${wave('il-wave')}
    <div class="il-tag"><span>·</span>${t.intro.tag}<span>·</span></div>
  </div>
  <button class="intro-skip" id="introSkip" tabindex="-1">${t.intro.skip}</button>
</div>

<a class="skip-link" href="#main">${t.nav.skip}</a>
${header(ctx)}

<main id="main">
  <section class="hero">
    <div class="hero-media">
      ${img(I.hero, '', { w: 1600, cls: 'hero-img', eager: true, sizes: '100vw' })}
      <canvas id="fireflies" aria-hidden="true"></canvas>
    </div>
    <div class="wrap hero-inner">
      <h1>
        <span class="eyebrow">${t.hero.eyebrow}</span>
        <span class="hero-title"><span>${t.hero.l1}</span> <span>${t.hero.l2}</span><br><span><em>${t.hero.l3}</em></span></span>
      </h1>
      <p class="hero-sub">${t.hero.sub}</p>
      <div class="hero-cta">
        <button class="btn btn-gold" data-book>${t.hero.cta1}${ic.arrow}</button>
        <a class="btn btn-line" href="#private">${t.hero.cta2}</a>
      </div>
      <p class="hero-price"><span>${t.hero.from}</span> <strong>$${p.perPerson}</strong> <span>${t.hero.pp}</span></p>
    </div>
    <a class="hero-scroll" href="#story" aria-label="${esc(t.hero.scroll)}"><span>${t.hero.scroll}</span><i></i></a>
  </section>

  <section class="strip" aria-label="Info">
    <ul class="wrap">
      <li>${ic.cal}<span>${t.strip.days}</span></li>
      <li>${ic.door}<span>${t.strip.checkin}</span></li>
      <li>${ic.clock}<span>${t.strip.time}</span></li>
      <li>${ic.pin}<span>${t.strip.place}</span></li>
      <li>${ic.id}<span>${t.strip.age}</span></li>
    </ul>
  </section>

  <section class="section story" id="story">
    <div class="wrap story-grid">
      <div class="story-media reveal">
        ${img(I.story, t.story.imgAlt, { w: 800, ratio: 0.8, cls: 'story-img' })}
        <div class="story-mat">${img(I.doormat, t.gal.a4, { w: 480, ratio: 1.3, sizes: '240px' })}</div>
      </div>
      <div class="story-copy reveal">
        <p class="eyebrow">${t.story.eyebrow}</p>
        <h2>${t.story.title}</h2>
        <p>${t.story.p1}</p>
        <p>${t.story.p2}</p>
        <dl class="stats">
          <div><dt>${t.story.s1n}</dt><dd>${t.story.s1}</dd></div>
          <div><dt>${t.story.s2n}</dt><dd>${t.story.s2}</dd></div>
          <div><dt>${t.story.s3n}</dt><dd>${t.story.s3}</dd></div>
        </dl>
      </div>
    </div>
  </section>

  <section class="section exp" id="experience">
    <div class="wrap">
      <header class="section-head reveal"><p class="eyebrow">${t.exp.eyebrow}</p><h2>${t.exp.title}</h2>${wave()}</header>
      <div class="cards">
        ${[['paint', 'c1'], ['sip', 'c2'], ['dj', 'c3']].map(([k, c], i) => `
        <article class="card reveal" style="--d:${i * 0.12}s">
          <div class="card-media">${img(I[k], t.exp[c + 'alt'], { w: 800, ratio: 0.82, sizes: '(max-width: 760px) 100vw, 33vw' })}</div>
          <div class="card-body"><span class="card-n">0${i + 1}</span><h3>${t.exp[c + 't']}</h3><p>${t.exp[c]}</p></div>
        </article>`).join('')}
      </div>
    </div>
  </section>

  <section class="section flow" id="evening">
    <div class="wrap flow-grid">
      <header class="section-head left reveal"><p class="eyebrow">${t.flow.eyebrow}</p><h2>${t.flow.title}</h2>
        <div class="flow-photo">${img(I.table, t.gal.a1, { w: 800, ratio: 1.25 })}</div>
      </header>
      <ol class="flow-list">${flow}
      </ol>
    </div>
  </section>

  <section class="section packages" id="packages">
    <div class="wrap">
      <header class="section-head reveal"><p class="eyebrow">${t.pk.eyebrow}</p><h2>${t.pk.title}</h2><p class="lead">${t.pk.lead}</p></header>
      <div class="price-grid">
        <article class="price-card reveal">
          <span class="tag">${t.pk.soloTag}</span>
          <h3>${t.pk.soloT}</h3>
          <p class="price-desc">${t.pk.soloD}</p>
          <p class="price"><sup>$</sup>${p.perPerson}<small>${t.pk.per}</small></p>
          <ul class="ticks">${t.pk.inc.map((x) => `<li>${ic.check}<span>${x}</span></li>`).join('')}</ul>
          <button class="btn btn-gold" data-book data-guests="2">${t.pk.book}${ic.arrow}</button>
        </article>
        <article class="price-card featured reveal" style="--d:.12s">
          <span class="tag">${t.pk.groupTag}</span>
          <h3>${t.pk.groupT}</h3>
          <p class="price-desc">${t.pk.groupD}</p>
          <p class="price"><sup>$</sup>${p.groupPrice}<small>${t.pk.groupPer}</small></p>
          <p class="save">${t.pk.groupSave}</p>
          <ul class="ticks">${t.pk.inc.map((x) => `<li>${ic.check}<span>${x}</span></li>`).join('')}</ul>
          <button class="btn btn-gold" data-book data-guests="${p.groupSize}">${t.pk.bookGroup}${ic.arrow}</button>
        </article>
      </div>

      <header class="section-head sub reveal"><h3 class="h-sub">${t.pk.upT}</h3><p class="lead">${t.pk.upLead}</p></header>
      <div class="up-grid">
        ${[['hookah', I.hookah], ['bottle', I.bottle]].map(([k, id], i) => `
        <article class="up-card reveal" style="--d:${i * 0.12}s">
          <div class="up-media">${img(id, t.pk[k + 'Alt'], { w: 800, ratio: 1.1, sizes: '(max-width: 760px) 100vw, 25vw' })}</div>
          <div class="up-body">
            <h3>${t.pk[k + 'T']}</h3>
            <p>${t.pk[k + 'D']}</p>
            <p class="up-price"><strong>$${cfg.addons[k].price}</strong> ${t.pk.perTable}</p>
            <button class="link-btn" data-book data-addon="${k}">${t.pk.add}${ic.arrow}</button>
          </div>
        </article>`).join('')}
      </div>
      <p class="fineprint reveal">${t.pk.note}</p>
    </div>
  </section>

  <section class="section private" id="private">
    <div class="private-bg">${img(I.private, t.pv.alt, { w: 1600, sizes: '100vw' })}</div>
    <div class="wrap private-grid">
      <div class="reveal">
        <p class="eyebrow">${t.pv.eyebrow}</p>
        <h2>${t.pv.title}</h2>
        <p>${t.pv.p}</p>
        <ul class="ticks">${t.pv.li.map((x) => `<li>${ic.check}<span>${x}</span></li>`).join('')}</ul>
      </div>
      <form class="pv-form reveal" name="private-event" method="POST" data-netlify="true" netlify-honeypot="company" id="pvForm">
        <input type="hidden" name="form-name" value="private-event">
        <input type="hidden" name="language" value="${lang}">
        <p class="hp"><label>Company <input name="company" tabindex="-1" autocomplete="off"></label></p>
        <h3>${t.pv.formT}</h3>
        <div class="f-row">
          <label class="field"><span>${t.pv.name}</span><input name="name" required autocomplete="name"></label>
          <label class="field"><span>${t.pv.email}</span><input name="email" type="email" required autocomplete="email"></label>
        </div>
        <div class="f-row">
          <label class="field"><span>${t.pv.phone}</span><input name="phone" type="tel" autocomplete="tel"></label>
          <label class="field"><span>${t.pv.date}</span><input name="date" type="date"></label>
        </div>
        <div class="f-row">
          <label class="field"><span>${t.pv.guests}</span><input name="guests" type="number" min="8" max="200" inputmode="numeric"></label>
          <label class="field"><span>${t.pv.where}</span><input name="location"></label>
        </div>
        <label class="field"><span>${t.pv.msg}</span><textarea name="message" rows="3"></textarea></label>
        <button class="btn btn-gold" type="submit">${t.pv.send}${ic.arrow}</button>
        <p class="form-msg" role="status" aria-live="polite"></p>
      </form>
    </div>
  </section>

  <section class="section gallery">
    <div class="wrap">
      <header class="section-head reveal"><p class="eyebrow">${t.gal.eyebrow}</p><h2>${t.gal.title}</h2></header>
      <div class="mosaic reveal">
        <figure class="m1">${img(I.cheers, t.gal.a5, { w: 1200, ratio: 1.2 })}</figure>
        <figure class="m2">${img(I.sunset, t.gal.a2, { w: 800, ratio: 1.4, sizes: '(max-width: 760px) 50vw, 25vw' })}</figure>
        <figure class="m3">${img(I.bites, t.gal.a3, { w: 800, ratio: 1.4, sizes: '(max-width: 760px) 50vw, 25vw' })}</figure>
        <figure class="m4">${img(I.paint, t.exp.c1alt, { w: 800, ratio: 0.7, sizes: '(max-width: 760px) 50vw, 25vw' })}</figure>
        <figure class="m5">${img(I.hookah, t.pk.hookahAlt, { w: 800, ratio: 1.4, sizes: '(max-width: 760px) 50vw, 25vw' })}</figure>
      </div>
      <p class="fineprint">${t.gal.note}</p>
    </div>
  </section>

  <section class="section location" id="location">
    <div class="wrap loc-grid">
      <div class="loc-media reveal">${img(I.location, t.loc.alt, { w: 1200, ratio: 1.15 })}</div>
      <div class="reveal">
        <p class="eyebrow">${t.loc.eyebrow}</p>
        <h2>${t.loc.title}</h2>
        <p>${t.loc.p}</p>
        <dl class="loc-list">
          <div>${ic.cal}<dt>${t.loc.l1t}</dt><dd>${t.loc.l1}</dd></div>
          <div>${ic.pin}<dt>${t.loc.l2t}</dt><dd>${t.loc.l2}</dd></div>
          <div>${ic.door}<dt>${t.loc.l3t}</dt><dd>${t.loc.l3}</dd></div>
        </dl>
        <a class="btn btn-line" href="${c.mapsUrl}" target="_blank" rel="noopener">${ic.pin}${t.loc.map}</a>
      </div>
    </div>
  </section>

  <section class="section faq" id="faq">
    <div class="wrap narrow">
      <header class="section-head reveal"><p class="eyebrow">${t.faq.eyebrow}</p><h2>${t.faq.title}</h2></header>
      <div class="faq-list reveal">
        ${t.faq.items.map((f, i) => `<details${i === 0 ? ' open' : ''}><summary><h3>${f.q}</h3><i aria-hidden="true"></i></summary><p>${f.a}</p></details>`).join('\n        ')}
      </div>
    </div>
  </section>

  <section class="final-cta">
    <div class="final-bg">${img(I.sunset, '', { w: 1600, sizes: '100vw' })}</div>
    <div class="wrap reveal">
      <img class="final-emblem" src="/assets/logo-emblem.png" alt="" width="720" height="580" loading="lazy">
      <h2>${t.cta.title}</h2>
      <p>${t.cta.p}</p>
      <button class="btn btn-gold btn-lg" data-book>${t.cta.btn}${ic.arrow}</button>
    </div>
  </section>
</main>

${footer(ctx)}

<div class="sticky-book" id="stickyBook"><span>${t.sticky.from}</span><button class="btn btn-gold btn-sm" data-book>${t.sticky.book}</button></div>
${placeholderPhone ? `` : `<a class="wa-float" href="https://wa.me/${c.whatsapp}" target="_blank" rel="noopener" aria-label="${esc(t.ft.wa)}">${ic.wa}</a>`}

<dialog class="bk" id="bk" aria-labelledby="bkTitle">
  <div class="bk-shell">
    <header class="bk-head">
      <img src="/assets/logo-emblem.png" alt="" width="720" height="580">
      <h2 id="bkTitle">${t.bk.title}</h2>
      <button class="bk-close" id="bkClose" aria-label="${esc(t.nav.close)}">${ic.x}</button>
    </header>
    <ol class="bk-steps" id="bkSteps">${t.bk.steps.map((s, i) => `<li data-step="${i + 1}"><b>${i + 1}</b><span>${s}</span></li>`).join('')}</ol>
    <div class="bk-main">
      <div class="bk-body" id="bkBody"></div>
      <aside class="bk-sum" id="bkSum" aria-live="polite"></aside>
    </div>
    <footer class="bk-foot">
      <p class="bk-err" id="bkErr" role="alert"></p>
      <button class="btn btn-line" id="bkBack">${t.bk.back}</button>
      <button class="btn btn-gold" id="bkNext">${t.bk.next}${ic.arrow}</button>
    </footer>
  </div>
</dialog>

<script id="amb-data" type="application/json">${JSON.stringify(clientData).replace(/</g, '\\u003c')}</script>
<script src="/assets/app.js?v=${ctx.v}" defer></script>
</body>
</html>`;
}

export function renderSuccess(ctx) {
  const { t, cfg, lang, pathOf } = ctx;
  return `${head({ ...ctx, page: 'booking/success/', title: t.meta.successTitle, description: t.ok.p, noindex: true })}
<body class="plain">
${header({ ...ctx, home: pathOf(lang) })}
<main id="main" class="ok-page">
  <div class="wrap narrow ok-card">
    <div class="ok-emblem"><img src="/assets/logo-emblem.png" alt="" width="720" height="580"><i class="sheen" style="--mask:url(/assets/logo-emblem.png)"></i></div>
    ${wave('wave-live')}
    <h1 id="okTitle">${t.ok.title}</h1>
    <p id="okText">${t.ok.p}</p>
    <dl class="ok-sum" id="okSum" hidden>
      <div><dt>${t.ok.when}</dt><dd data-ok="date"></dd></div>
      <div><dt>${t.ok.guests}</dt><dd data-ok="guests"></dd></div>
      <div><dt>${t.ok.paid}</dt><dd data-ok="total"></dd></div>
    </dl>
    <ul class="ticks">${t.ok.tips.map((x) => `<li>${ic.check}<span>${x}</span></li>`).join('')}</ul>
    <div class="hero-cta">
      <a class="btn btn-gold" href="${pathOf(lang)}">${t.ok.home}</a>
      ${hasWhatsapp(cfg) ? `<a class="btn btn-line" href="https://wa.me/${cfg.contact.whatsapp}" target="_blank" rel="noopener">${ic.wa}${t.ok.cal}</a>` : (cfg.contact.email ? `<a class="btn btn-line" href="mailto:${cfg.contact.email}">${ic.mail}${cfg.contact.email}</a>` : ``)}
    </div>
  </div>
</main>
${footer(ctx)}
<script src="/assets/app.js?v=${ctx.v}" defer></script>
<script>
(function(){
  var el=document.getElementById('okSum'),lang=${JSON.stringify(lang)};
  function show(b){if(!b)return;el.hidden=false;['date','guests','total'].forEach(function(k){el.querySelector('[data-ok="'+k+'"]').textContent=b[k]})}
  var saved=null;try{saved=JSON.parse(sessionStorage.getItem('amb-booking')||'null');sessionStorage.removeItem('amb-booking');sessionStorage.removeItem('amb-draft')}catch(e){}
  var id=new URLSearchParams(location.search).get('session_id');
  if(!id)return show(saved);
  fetch('/api/confirm-booking?session_id='+encodeURIComponent(id)).then(function(r){return r.json().then(function(j){return{ok:r.ok,status:r.status,j:j}})}).then(function(res){
    if(res.ok){var d=res.j.date.split('-');return show({date:new Intl.DateTimeFormat(lang,{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(+d[0],+d[1]-1,+d[2]))),guests:String(res.j.guests),total:'$'+Number(res.j.total).toLocaleString('en-US')})}
    if(res.status===400||res.status===402||res.status===404){document.getElementById('okTitle').textContent=${JSON.stringify(t.ok.unverifiedTitle)};document.getElementById('okText').textContent=${JSON.stringify(t.ok.unverified)};return}
    show(saved)
  }).catch(function(){show(saved)});
})();
</script>
</body>
</html>`;
}

export function render404(ctx) {
  const { t, lang, pathOf } = ctx;
  return `${head({ ...ctx, page: '404.html', title: t.meta.notFoundTitle, description: t.nf.p, noindex: true })}
<body class="plain">
${header({ ...ctx, home: pathOf(lang) })}
<main id="main" class="ok-page">
  <div class="wrap narrow ok-card">
    <div class="ok-emblem"><img src="/assets/logo-emblem.png" alt="" width="720" height="580"></div>
    <h1>${t.nf.title}</h1>
    <p>${t.nf.p}</p>
    <div class="hero-cta"><a class="btn btn-gold" href="${pathOf(lang)}">${t.nf.home}</a></div>
  </div>
</main>
${footer(ctx)}
<script src="/assets/app.js?v=${ctx.v}" defer></script>
</body>
</html>`;
}
