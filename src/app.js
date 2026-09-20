/* Ambience Curaçao — interactions + booking flow (no dependencies) */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var body = document.body;

  $$('[data-year]').forEach(function (n) { n.textContent = new Date().getFullYear(); });

  /* ---------- intro ---------- */
  (function intro() {
    var el = $('#intro');
    if (!el) return;
    var seen = body.classList.contains('intro-seen');
    var done = function () {
      body.classList.remove('intro-lock');
      try { sessionStorage.setItem('amb-intro', '1'); } catch (e) {}
    };
    if (seen || reduced) return done();
    body.classList.add('intro-lock');
    var timer = setTimeout(done, 4300);
    el.addEventListener('click', function () {
      clearTimeout(timer);
      body.classList.add('intro-skipped');
      // running animations keep the long delay they started with — restart them so the hero appears right away
      $$('.hero h1 .eyebrow, .hero-title > span, .hero-sub, .hero-cta, .hero-price').forEach(function (n) {
        n.style.animation = 'none'; void n.offsetWidth; n.style.animation = '';
      });
      done();
    });
  })();

  /* ---------- header, nav, reveal ---------- */
  var header = $('.site-header');
  var sticky = $('#stickyBook');
  var onScroll = function () {
    var y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 40);
    if (sticky) sticky.classList.toggle('show', y > window.innerHeight * 0.7);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var burger = $('#burger');
  var nav = $('#nav');
  var setNav = function (open) {
    if (!nav || !burger) return;
    nav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.documentElement.style.overflow = open ? 'hidden' : '';
  };
  var closeNav = function () { setNav(false); };
  if (burger && nav) {
    burger.addEventListener('click', function () { setNav(!nav.classList.contains('open')); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) { closeNav(); burger.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth > 1180) closeNav(); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a, button')) closeNav(); });
  }

  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    $$('.reveal').forEach(function (n) { io.observe(n); });
  } else {
    $$('.reveal').forEach(function (n) { n.classList.add('in'); });
  }

  // one FAQ open at a time
  $$('.faq-list details').forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open) $$('.faq-list details[open]').forEach(function (o) { if (o !== d) o.open = false; });
    });
  });

  /* ---------- hero fireflies ---------- */
  (function fireflies() {
    var c = $('#fireflies');
    if (!c || reduced) return;
    var ctx = c.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W, H, parts = [], running = false, raf;
    var resize = function () { W = c.clientWidth; H = c.clientHeight; c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    var spawn = function (anywhere) {
      return { x: Math.random() * W, y: anywhere ? Math.random() * H : H + 20, r: 0.8 + Math.random() * 2.6, vy: 0.12 + Math.random() * 0.38, drift: Math.random() * Math.PI * 2, tw: Math.random() * Math.PI * 2, a: 0.25 + Math.random() * 0.55 };
    };
    var tick = function () {
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.y -= p.vy; p.drift += 0.008; p.tw += 0.03; p.x += Math.sin(p.drift) * 0.3;
        if (p.y < -20) parts[i] = spawn(false);
        var alpha = p.a * (0.55 + 0.45 * Math.sin(p.tw));
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
        g.addColorStop(0, 'rgba(255,226,150,' + alpha + ')');
        g.addColorStop(0.3, 'rgba(230,180,90,' + alpha * 0.4 + ')');
        g.addColorStop(1, 'rgba(230,180,90,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 5, 0, 6.2832); ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    resize();
    var n = Math.round(Math.min(46, W / 28));
    for (var i = 0; i < n; i++) parts.push(spawn(true));
    window.addEventListener('resize', resize);
    new IntersectionObserver(function (e) {
      var vis = e[0].isIntersecting;
      if (vis && !running) { running = true; tick(); } else if (!vis && running) { running = false; cancelAnimationFrame(raf); }
    }).observe(c);
  })();

  /* ---------- private event form (Netlify Forms) ---------- */
  var dataEl = $('#amb-data');
  if (!dataEl) return;
  var D = JSON.parse(dataEl.textContent);
  var T = D.t;
  var tr = function (s, v) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return v && k in v ? v[k] : m; }); };

  var pv = $('#pvForm');
  if (pv && pv.elements.date) pv.elements.date.min = new Date().toISOString().slice(0, 10);
  if (pv) pv.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = $('button[type=submit]', pv), msg = $('.form-msg', pv), label = btn.innerHTML;
    btn.disabled = true; btn.textContent = T.pvSending; msg.className = 'form-msg'; msg.textContent = '';
    fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(pv)).toString() })
      .then(function (r) { if (!r.ok) throw new Error(r.status); msg.textContent = T.pvOk; pv.reset(); })
      .catch(function () { msg.className = 'form-msg err'; msg.textContent = T.pvErr; })
      .then(function () { btn.disabled = false; btn.innerHTML = label; });
  });

  /* ---------- booking ---------- */
  var dlg = $('#bk');
  if (!dlg) return;
  var contactUrl = function (text) {
    return D.contact.whatsapp ? 'https://wa.me/' + D.contact.whatsapp + '?text=' + encodeURIComponent(text)
      : !D.contact.email ? '' : 'mailto:' + D.contact.email + '?subject=' + encodeURIComponent(T.title) + '&body=' + encodeURIComponent(text);
  };
  if (!dlg.showModal) {
    document.addEventListener('click', function (e) { if (e.target.closest('[data-book]') && contactUrl(T.title)) { e.preventDefault(); window.location.href = contactUrl(T.title); } });
    return;
  }
  var elBody = $('#bkBody'), elSum = $('#bkSum'), elErr = $('#bkErr'), elNext = $('#bkNext'), elBack = $('#bkBack'), elSteps = $$('#bkSteps li');
  var ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>';
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var money = function (n) { return '$' + Number(n).toLocaleString('en-US'); };

  // "today" in Curaçao, independent of the visitor's timezone
  var tzParts = function () {
    var f = new Intl.DateTimeFormat('en-CA', { timeZone: D.schedule.timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false });
    var o = {}; f.formatToParts(new Date()).forEach(function (p) { o[p.type] = p.value; });
    return { ymd: o.year + '-' + o.month + '-' + o.day, hour: parseInt(o.hour, 10) % 24 };
  };
  var toDate = function (ymd) { var a = ymd.split('-'); return new Date(Date.UTC(+a[0], +a[1] - 1, +a[2])); };
  var toYmd = function (d) { return d.toISOString().slice(0, 10); };
  var addDays = function (ymd, n) { var d = toDate(ymd); d.setUTCDate(d.getUTCDate() + n); return toYmd(d); };
  var now = tzParts();
  var minDate = now.hour < D.schedule.sameDayCutoffHour ? now.ymd : addDays(now.ymd, 1);
  var maxDate = addDays(now.ymd, D.schedule.bookAheadDays);
  var longDate = function (ymd) { return new Intl.DateTimeFormat(D.lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(toDate(ymd)); };

  var firstEvening = minDate;
  for (var fe = 0; fe < 8 && D.schedule.weekdays.indexOf(toDate(firstEvening).getUTCDay()) < 0; fe++) firstEvening = addDays(firstEvening, 1);
  var S = { step: 1, date: null, guests: 2, addons: { hookah: 0, bottle: 0 }, f: { name: '', email: '', phone: '', stay: '', note: '', age: false, terms: false }, booked: {}, demo: false, month: toDate(firstEvening.slice(0, 8) + '01'), loaded: false, busy: false };

  var DRAFT = 'amb-draft';
  var saveDraft = function () { try { sessionStorage.setItem(DRAFT, JSON.stringify({ date: S.date, guests: S.guests, addons: S.addons, f: S.f })); } catch (e) {} };
  var loadDraft = function () {
    try {
      var d = JSON.parse(sessionStorage.getItem(DRAFT) || 'null');
      if (!d) return false;
      if (d.date && isEventDay(d.date)) { S.date = d.date; S.month = toDate(d.date.slice(0, 8) + '01'); }
      S.guests = Math.max(1, Math.min(D.capacity, parseInt(d.guests, 10) || 2));
      ['hookah', 'bottle'].forEach(function (k) { S.addons[k] = Math.max(0, Math.min(4, parseInt(d.addons && d.addons[k], 10) || 0)); });
      Object.keys(S.f).forEach(function (k) { if (d.f && typeof d.f[k] === typeof S.f[k]) S.f[k] = d.f[k]; });
      return true;
    } catch (e) { return false; }
  };

  var remaining = function (ymd) { return Math.max(0, D.capacity - (S.booked[ymd] || 0)); };
  var isEventDay = function (ymd) { return ymd >= minDate && ymd <= maxDate && D.schedule.weekdays.indexOf(toDate(ymd).getUTCDay()) > -1; };
  var tickets = function (n) {
    var p = D.pricing, g = Math.floor(n / p.groupSize), r = n % p.groupSize;
    var normal = g * p.groupPrice + r * p.perPerson, roundUp = (g + 1) * p.groupPrice;
    if (r && roundUp < normal) return { total: roundUp, group: true };
    return { total: normal, group: g > 0 };
  };
  var total = function () { return tickets(S.guests).total + S.addons.hookah * D.addons.hookah.price + S.addons.bottle * D.addons.bottle.price; };
  var maxGuests = function () { return S.date ? Math.min(D.capacity, remaining(S.date)) : D.capacity; };

  function loadAvailability() {
    return fetch('/api/availability').then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) {
        S.booked = j.booked || {}; S.demo = !!j.demo;
        if (S.date && remaining(S.date) === 0) S.date = null;
        S.guests = Math.max(1, Math.min(S.guests, maxGuests()));
      })
      .catch(function () { S.booked = {}; })
      .then(function () { S.loaded = true; });
  }

  /* --- renderers --- */
  function calendar() {
    var y = S.month.getUTCFullYear(), m = S.month.getUTCMonth();
    var first = D.lang === 'en' ? 0 : 1;
    var lead = (new Date(Date.UTC(y, m, 1)).getUTCDay() - first + 7) % 7;
    var days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    var title = new Intl.DateTimeFormat(D.lang, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(S.month);
    var prevOk = toYmd(S.month) > minDate.slice(0, 8) + '01';
    var nextOk = toYmd(new Date(Date.UTC(y, m + 1, 1))) <= maxDate;
    var h = '<div class="cal"><div class="cal-head"><button type="button" data-cal="-1" aria-label="Previous month"' + (prevOk ? '' : ' disabled') + '>' + ARROW + '</button><strong>' + title + '</strong><button type="button" data-cal="1" aria-label="Next month"' + (nextOk ? '' : ' disabled') + '>' + ARROW + '</button></div><div class="cal-grid">';
    for (var i = 0; i < 7; i++) h += '<span class="cal-dow">' + T.days[(i + first) % 7] + '</span>';
    for (i = 0; i < lead; i++) h += '<span></span>';
    for (var d = 1; d <= days; d++) {
      var ymd = toYmd(new Date(Date.UTC(y, m, d)));
      if (!isEventDay(ymd)) { h += '<span class="cal-day">' + d + '</span>'; continue; }
      var left = remaining(ymd);
      var cls = left === 0 ? 'full' : 'open' + (left <= 6 ? ' few' : '') + (ymd === S.date ? ' sel' : '');
      var label = longDate(ymd) + ' — ' + (left ? tr(T.left, { n: left }) : T.soldOut);
      h += '<button type="button" class="cal-day ' + cls + '" data-date="' + ymd + '" aria-label="' + esc(label) + '"' + (left ? '' : ' disabled') + (ymd === S.date ? ' aria-pressed="true"' : '') + '>' + d + '</button>';
    }
    h += '</div><div class="cal-legend"><span><i></i>' + T.legendOpen + '</span><span class="few"><i></i>' + T.legendFew + '</span><span class="full"><i></i>' + T.legendFull + '</span></div><p class="cal-note">' + T.onlyDays + '</p></div>';
    return h;
  }

  function stepper(key, val, min, max, label) {
    label = esc(label || '');
    return '<div class="stepper" role="group" aria-label="' + label + '"><button type="button" data-step-key="' + key + '" data-dir="-1" aria-label="' + label + ' −1"' + (val <= min ? ' disabled' : '') + '>−</button><output aria-live="polite">' + val + '</output><button type="button" data-step-key="' + key + '" data-dir="1" aria-label="' + label + ' +1"' + (val >= max ? ' disabled' : '') + '>+</button></div>';
  }

  function guestBox() {
    var p = D.pricing, tk = tickets(S.guests), r = S.guests % p.groupSize, h = '';
    h += '<div class="guest-box"><h4>' + T.guests + '</h4>' + stepper('guests', S.guests, 1, Math.max(1, maxGuests()), T.guests);
    h += '<p class="guest-hint">' + T.guestsHint + '</p>';
    if (S.date) { var left = remaining(S.date); h += '<p class="seat-note' + (left <= 6 ? ' few' : '') + '">' + tr(T.left, { n: left }) + '</p>'; }
    if (tk.group) h += '<p class="nudge ok">✓ ' + T.groupApplied + '</p>';
    else if (r && p.groupSize - r <= 2 && S.guests + (p.groupSize - r) <= maxGuests()) h += '<p class="nudge">' + tr(T.groupNudge, { n: p.groupSize - r }) + '</p>';
    return h + '</div>';
  }

  var panes = {
    1: function () {
      return '<div class="bk-pane"><h3>' + T.pickDate + '</h3>' + (S.demo ? '<p class="bk-demo">' + T.demo + '</p>' : '') + '<div class="bk-cols">' + calendar() + guestBox() + '</div></div>';
    },
    2: function () {
      var h = '<div class="bk-pane"><h3>' + T.upT + '</h3><p>' + T.upLead + '</p>';
      ['hookah', 'bottle'].forEach(function (k) {
        var a = D.addons[k], q = S.addons[k];
        h += '<div class="addon' + (q ? ' active' : '') + '"><div><h4>' + a.name + '</h4><p>' + a.desc + '</p><p class="a-price"><b>' + money(a.price) + '</b>' + T.perTable + '</p></div>' + stepper(k, q, 0, 4, a.name) + '</div>';
      });
      return h + '</div>';
    },
    3: function () {
      var f = S.f, opt = ' <small>(' + T.optional + ')</small>';
      var field = function (k, label, type, ac, req) { return '<label class="field" data-f="' + k + '"><span>' + label + (req ? '' : opt) + '</span><input name="' + k + '" type="' + type + '" value="' + esc(f[k]) + '" autocomplete="' + ac + '"' + (req ? ' required' : '') + '></label>'; };
      return '<div class="bk-pane"><h3>' + T.detailsT + '</h3>' +
        field('name', T.fName, 'text', 'name', true) +
        '<div class="f-row">' + field('email', T.fEmail, 'email', 'email', true) + field('phone', T.fPhone, 'tel', 'tel', true) + '</div>' +
        field('stay', T.fStay, 'text', 'off', false) + field('note', T.fNote, 'text', 'off', false) +
        '<label class="check"><input type="checkbox" name="age"' + (f.age ? ' checked' : '') + '><span>' + T.age + '</span></label>' +
        '<label class="check"><input type="checkbox" name="terms"' + (f.terms ? ' checked' : '') + '><span>' + T.terms + '</span></label></div>';
    },
    4: function () {
      var tk = tickets(S.guests);
      var h = '<div class="bk-pane"><h3>' + T.reviewT + '</h3>' + (S.demo ? '<p class="bk-demo">' + T.demo + '</p>' : '') + '<dl class="review">';
      h += '<div><dt>' + T.rDate + '</dt><dd>' + longDate(S.date) + '<br><small>' + T.rTime + '</small></dd></div>';
      h += '<div><dt>' + T.rTickets + ' × ' + S.guests + '</dt><dd>' + money(tk.total) + (tk.group ? '<br><small>' + T.rGroup + '</small>' : '') + '</dd></div>';
      ['hookah', 'bottle'].forEach(function (k) { if (S.addons[k]) h += '<div><dt>' + D.addons[k].name + ' × ' + S.addons[k] + '</dt><dd>' + money(S.addons[k] * D.addons[k].price) + '</dd></div>'; });
      h += '<div><dt>' + esc(S.f.name) + '</dt><dd>' + esc(S.f.email) + '<br>' + esc(S.f.phone) + '</dd></div>';
      h += '<div class="tot"><dt>' + T.rTotal + ' <small>(' + T.rTax + ')</small></dt><dd>' + money(total()) + '</dd></div></dl></div>';
      return h;
    },
  };

  function renderSum() {
    var tk = tickets(S.guests);
    var h = '<h3>' + T.summary + '</h3><p class="sum-date' + (S.date ? '' : ' empty') + '">' + (S.date ? longDate(S.date) : T.pickDate) + '</p><p class="sum-time">' + T.rTime + '</p><div class="sum-lines">';
    h += '<div><span>' + T.rTickets + ' × ' + S.guests + (tk.group ? '<small>' + T.rGroup + '</small>' : '') + '</span><span>' + money(tk.total) + '</span></div>';
    ['hookah', 'bottle'].forEach(function (k) { if (S.addons[k]) h += '<div><span>' + D.addons[k].name + ' × ' + S.addons[k] + '</span><span>' + money(S.addons[k] * D.addons[k].price) + '</span></div>'; });
    h += '</div><div class="sum-total"><span>' + T.rTotal + '</span><strong>' + money(total()) + '</strong></div><p class="sum-tax">' + T.rTax + '</p><p class="sum-secure">' + LOCK + '<span>' + T.secure + '</span></p>';
    elSum.innerHTML = h;
  }

  function render(keepScroll) {
    var top = elBody.scrollTop;
    elBody.innerHTML = panes[S.step]();
    elBody.scrollTop = keepScroll ? top : 0;
    elSteps.forEach(function (li, i) { li.className = i + 1 === S.step ? 'on' : i + 1 < S.step ? 'done' : ''; if (i + 1 === S.step) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); });
    elBack.style.visibility = S.step === 1 ? 'hidden' : '';
    elNext.innerHTML = S.step === 4 ? LOCK + tr(T.pay, { total: money(total()) }) : T.next + ARROW;
    elNext.disabled = S.busy;
    renderSum();
  }
  var fail = function (msg, html) { elErr.innerHTML = esc(msg) + (html || ''); };

  function collect() {
    $$('input', elBody).forEach(function (i) { if (i.name in S.f) S.f[i.name] = i.type === 'checkbox' ? i.checked : i.value.trim(); });
  }
  function validate() {
    elErr.textContent = '';
    $$('.field.bad', elBody).forEach(function (n) { n.classList.remove('bad'); });
    var bad = function (k, msg) { var n = $('[data-f="' + k + '"]', elBody); if (n) { n.classList.add('bad'); $('input', n).focus(); } fail(msg); return false; };
    if (S.step === 1) {
      if (!S.date) return fail(T.errDate), false;
      if (S.guests > remaining(S.date)) return fail(tr(T.errSeats, { n: remaining(S.date) })), false;
    }
    if (S.step === 3) {
      collect();
      if (S.f.name.length < 3) return bad('name', T.errName);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(S.f.email)) return bad('email', T.errEmail);
      if (S.f.phone.replace(/\D/g, '').length < 7) return bad('phone', T.errPhone);
      if (!S.f.age) return fail(T.errAge), false;
      if (!S.f.terms) return fail(T.errTerms), false;
    }
    return true;
  }

  function validateQuiet() {
    return !!S.date && S.guests <= remaining(S.date) && S.f.name.length >= 3 && /^[^s@]+@[^s@]+.[^s@]{2,}$/.test(S.f.email) && S.f.phone.replace(/D/g, '').length >= 7 && S.f.age && S.f.terms;
  }

  function pay() {
    S.busy = true; elNext.disabled = true; elNext.textContent = T.paying; elErr.textContent = '';
    var summary = { date: longDate(S.date), guests: String(S.guests), total: money(total()) };
    fetch('/api/create-checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: S.date, guests: S.guests, addons: S.addons, name: S.f.name, email: S.f.email, phone: S.f.phone, stay: S.f.stay, note: S.f.note, lang: D.lang }),
    }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (res.ok && res.j.url) {
          saveDraft();
          try { sessionStorage.setItem('amb-booking', JSON.stringify(summary)); } catch (e) {}
          window.location.href = res.j.url; return;
        }
        if (res.j && res.j.error === 'sold_out') {
          S.booked[S.date] = D.capacity - (res.j.remaining || 0); S.busy = false; S.step = 1; render();
          return fail(tr(T.errSeats, { n: res.j.remaining || 0 }));
        }
        throw new Error('checkout');
      })
      .catch(function () {
        S.busy = false; render(true);
        var addons = ['hookah', 'bottle'].filter(function (k) { return S.addons[k]; }).map(function (k) { return D.addons[k].name + ' × ' + S.addons[k]; }).join(', ') || '—';
        var text = tr(T.waMsg, { guests: S.guests, date: summary.date, name: S.f.name, addons: addons, total: summary.total });
        fail(T.errPay, !contactUrl(text) ? '' : '<br><a target="_blank" rel="noopener" href="' + esc(contactUrl(text)) + '">' + esc(D.contact.whatsapp ? T.waFallback : T.mailFallback) + ' →</a>');
      });
  }

  /* --- events --- */
  elBody.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    elErr.textContent = '';
    if (b.dataset.cal) { S.month = new Date(Date.UTC(S.month.getUTCFullYear(), S.month.getUTCMonth() + +b.dataset.cal, 1)); return render(true); }
    if (b.dataset.date) { S.date = b.dataset.date; S.guests = Math.max(1, Math.min(S.guests, maxGuests())); return render(true); }
    if (b.dataset.stepKey) {
      var k = b.dataset.stepKey, dir = +b.dataset.dir;
      if (k === 'guests') S.guests = Math.max(1, Math.min(maxGuests(), S.guests + dir));
      else S.addons[k] = Math.max(0, Math.min(4, S.addons[k] + dir));
      render(true);
      var again = $('[data-step-key="' + k + '"][data-dir="' + dir + '"]', elBody); if (again && !again.disabled) again.focus();
    }
  });
  elNext.addEventListener('click', function () {
    if (!validate()) return;
    if (S.step === 4) return pay();
    S.step++; render();
  });
  elBack.addEventListener('click', function () { if (S.step === 3) collect(); elErr.textContent = ''; if (S.step > 1) { S.step--; render(); } });
  elSteps.forEach(function (li, i) { li.addEventListener('click', function () { if (i + 1 < S.step && !S.busy) { if (S.step === 3) collect(); S.step = i + 1; elErr.textContent = ''; render(); } }); });
  elBody.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox') { e.preventDefault(); elNext.click(); } });

  // the chosen evening may have sold out in the meantime: fall back to step 1 instead of reviewing a booking without a date
  function afterAvailability() { if (!S.date && S.step > 1) { S.step = 1; fail(T.errDate); } render(true); }

  function openBooking(opts) {
    opts = opts || {};
    closeNav();
    if (opts.guests) S.guests = Math.min(+opts.guests, maxGuests());
    if (opts.addon && !S.addons[opts.addon]) S.addons[opts.addon] = 1;
    S.step = 1; elErr.textContent = '';
    render();
    if (!dlg.open) dlg.showModal();
    body.style.overflow = 'hidden';
    if (!S.loaded) loadAvailability().then(afterAvailability);
  }
  dlg.addEventListener('close', function () { body.style.overflow = ''; if (location.hash === '#book') history.replaceState(null, '', location.pathname); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  $('#bkClose').addEventListener('click', function () { dlg.close(); });
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-book]'); if (!t) return;
    e.preventDefault();
    openBooking({ guests: t.dataset.guests, addon: t.dataset.addon });
  });
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted || !S.busy) return;
    S.busy = false; S.loaded = false;
    if (dlg.open) { render(true); loadAvailability().then(afterAvailability); }
  });
  if (location.hash === '#book') { var restored = loadDraft(); openBooking(); if (restored && S.date) { S.step = 4; if (!validateQuiet()) S.step = 1; render(); } }
})();
