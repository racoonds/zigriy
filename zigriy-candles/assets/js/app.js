import { CONFIG as C, GROUPS, SCENTS, calc } from './config.js';

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const fmt = n => n.toLocaleString('uk-UA').replace(/[\s,]/g, ' ') + ' грн';
const plural = (n, one, few, many) => {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
};
const candles = n => plural(n, 'свічка', 'свічки', 'свічок');
const IMG = id => `/assets/img/scents/${id}.webp`;

/* ---------- pixels (вмикаються, лише якщо в config.js задано ID) ---------- */
if (C.META_PIXEL_ID) {
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
  document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', C.META_PIXEL_ID);
  fbq('track', 'PageView');
}
if (C.TIKTOK_PIXEL_ID) {
  !function (w, d, t) {
    w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
    ttq.load(C.TIKTOK_PIXEL_ID);
    ttq.page();
  }(window, document, 'ttq');
}

/* ---------- pricing helpers ---------- */
function upsell(n) {
  if (!n) return null;
  const cur = calc(n), curPer = cur.total / n;
  const cands = [];
  for (let m = n + 1; m <= n + 5; m++) cands.push(m);
  const maxSet = C.SETS[0]?.qty;
  if (maxSet && n < maxSet) cands.push(maxSet);
  let best = null;
  for (const m of cands) {
    const nx = calc(m);
    if (nx.singles !== 0) continue;
    const per = nx.total / m;
    if (per >= curPer - 1) continue;
    const c = { add: m - n, m, total: nx.total, per: Math.round(per), cheaper: nx.total <= cur.total };
    if (c.cheaper) return c;       // більший набір коштує не більше — одразу пропонуємо
    if (!best) best = c;           // інакше — найближчий вигідніший набір
  }
  return best;
}

/* ---------- static fills ---------- */
const minSet = C.SETS.reduce((a, s) => (s.price / s.qty < a.price / a.qty ? s : a), C.SETS[0] || { qty: 1, price: C.SINGLE_PRICE });
const minPer = Math.round(minSet.price / minSet.qty);
const maxOff = Math.round((1 - minPer / C.SINGLE_PRICE) * 100);
$('#heroMin').textContent = fmt(minPer);
$('#heroOld').textContent = fmt(C.SINGLE_PRICE);
$('#heroBadge').textContent = maxOff > 0 ? `−${maxOff}% у наборі` : '';
$$('[data-free]').forEach(el => (el.textContent = fmt(C.FREE_SHIPPING_FROM)));
$$('[data-volume]').forEach(el => (el.textContent = C.VOLUME));
const freeFrom = (() => { for (let n = 1; n <= 50; n++) if (calc(n).total >= C.FREE_SHIPPING_FROM) return n; return null; })();
$('#shipSub').textContent = freeFrom
  ? `Тобто вже з ${freeFrom} ${plural(freeFrom, 'свічки', 'свічок', 'свічок')}. Відправляємо Новою Поштою`
  : 'Відправляємо Новою Поштою';
$('#yr').textContent = new Date().getFullYear();

/* ---------- placeholder art (якщо фото не завантажилось) ---------- */
function candleSVG(c1, c2) {
  const gid = 'g' + c1.slice(1) + c2.slice(1);
  return `<div class="ph" style="background:radial-gradient(circle at 50% 35%,${c2}55,${c1} 75%)">
  <svg viewBox="0 0 100 130" aria-hidden="true"><defs><linearGradient id="${gid}" x1="0" x2="1"><stop offset="0" stop-color="#e9dcc8"/><stop offset=".5" stop-color="#fff6e8"/><stop offset="1" stop-color="#d9c8ae"/></linearGradient></defs>
  <path d="M50 8c7 10 9 17 9 22a9 9 0 0 1-18 0c0-5 2-12 9-22z" fill="#f2ca5a"/><path d="M50 18c3 5 4 9 4 11a4 4 0 0 1-8 0c0-2 1-6 4-11z" fill="#fff3d0"/>
  <rect x="48" y="36" width="4" height="8" fill="#7a5a3a"/>
  <rect x="22" y="44" width="56" height="78" rx="8" fill="url(#${gid})"/>
  <ellipse cx="50" cy="46" rx="26" ry="5" fill="#fffaf0" opacity=".9"/>
  <rect x="30" y="72" width="40" height="22" rx="3" fill="#f3ece2"/>
  <text x="50" y="86" text-anchor="middle" font-family="Comfortaa,sans-serif" font-size="7.5" fill="#5a4032">Zigriy</text></svg></div>`;
}
window.__zph = (img, c1, c2) => { img.outerHTML = candleSVG(c1, c2); };

/* ---------- render: sets ---------- */
const setCards = [{ qty: 1, price: C.SINGLE_PRICE }, ...[...C.SETS].reverse()];
const popular = C.SETS.length >= 2 ? C.SETS[1].qty : null;
const best = minSet.qty;
$('#setsGrid').innerHTML = setCards.map(s => {
  const full = s.qty * C.SINGLE_PRICE, per = Math.round(s.price / s.qty);
  const tag = s.qty === best && s.qty > 1 ? '<span class="tag dark">Найвигідніший</span>'
    : s.qty === popular ? '<span class="tag">Найпопулярніший</span>' : '';
  return `<div class="set ${s.qty === popular ? 'hot' : ''}">${tag}
    <div class="q">${s.qty}</div><div class="ql">${candles(s.qty)}</div>
    <div class="p">${fmt(s.price)}</div>
    ${s.qty > 1 ? `<div class="o">${fmt(full)}</div>` : '<div class="o none">&nbsp;</div>'}
    <div class="per">${per} грн / шт</div>
    ${s.qty > 1 ? `<div class="save">економія ${fmt(full - s.price)}</div>` : ''}
  </div>`;
}).join('');

/* ---------- render: scents ---------- */
$('#groups').innerHTML = GROUPS.map(g => `
  <div class="group-title">${g.t}${g.tag ? ` <small>${g.tag}</small>` : ''}</div>
  <div class="grid">${SCENTS.filter(s => s.g === g.id).map(s => `
    <div class="scent" data-id="${s.id}">
      <div class="img">
        <img src="${IMG(s.id)}" alt="Свічка Zigriy «${s.n}»" loading="lazy" width="800" height="800" onerror="__zph(this,'${s.c[0]}','${s.c[1]}')">
        ${s.img2 ? `<img class="alt" src="${IMG(s.img2)}" alt="" loading="lazy" width="800" height="800" onerror="this.remove()">` : ''}
        <span class="cnt"></span>
      </div>
      <div class="body">
        <div class="nm">${s.n}</div><div class="ds">${s.d}</div>
        <div class="pr">${C.VOLUME} · ${fmt(C.SINGLE_PRICE)}</div>
        <button class="add" data-plus="${s.id}">+ Додати</button>
        <div class="stepper"><button data-minus="${s.id}" aria-label="Менше: ${s.n}">−</button><span></span><button data-plus="${s.id}" aria-label="Більше: ${s.n}">+</button></div>
      </div>
    </div>`).join('')}</div>`).join('');

/* ---------- cart ---------- */
const CART_KEY = 'zigriy_cart';
const cart = {};
try {
  const saved = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
  for (const [id, q] of Object.entries(saved)) if (SCENTS.some(s => s.id === id) && q > 0) cart[id] = Math.min(99, q | 0);
} catch (e) {}
const save = () => { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {} };
const count = () => Object.values(cart).reduce((a, b) => a + b, 0);

function track(ev, extra, eventID) {
  const n = count(), p = calc(n);
  const per = n ? Math.round(p.total / n) : C.SINGLE_PRICE;
  const items = SCENTS.filter(s => cart[s.id]).map(s => ({ id: s.id, quantity: cart[s.id], item_price: per }));
  const d = Object.assign({ value: p.total, currency: 'UAH', content_type: 'product', num_items: n, content_name: `Свічки Zigriy ${C.VOLUME}`,
    content_ids: items.map(i => i.id), contents: items }, extra || {});
  try { window.fbq && (eventID ? fbq('track', ev, d, { eventID }) : fbq('track', ev, d)); } catch (e) {}
  const map = { AddToCart: 'AddToCart', InitiateCheckout: 'InitiateCheckout', Purchase: 'PlaceAnOrder' };
  try {
    window.ttq && ttq.track(map[ev] || ev, { value: d.value, currency: 'UAH', content_type: 'product', quantity: n,
      contents: items.map(i => ({ content_id: i.id, content_name: (SCENTS.find(s => s.id === i.id) || {}).n, quantity: i.quantity, price: i.item_price })) },
      eventID ? { event_id: eventID } : undefined);
  } catch (e) {}
}

function change(id, d) {
  const was = cart[id] || 0, v = Math.max(0, Math.min(99, was + d));
  if (v) cart[id] = v; else delete cart[id];
  save();
  if (d > 0) { track('AddToCart'); toast('Додано: ' + SCENTS.find(s => s.id === id).n); }
  render();
}

function hintText(n) {
  const u = upsell(n), p = calc(n);
  if (u) return u.cheaper ? `+${u.add} шт → ${u.m} за ${fmt(u.total)}, дешевше!` : `+${u.add} шт → ${u.m} за ${fmt(u.total)}`;
  if (p.total < C.FREE_SHIPPING_FROM) return `До безкоштовної доставки: ${fmt(C.FREE_SHIPPING_FROM - p.total)}`;
  return 'Безкоштовна доставка ✓';
}

function render() {
  const n = count(), p = calc(n);
  $$('.scent').forEach(el => {
    const q = cart[el.dataset.id] || 0;
    el.classList.toggle('in', q > 0);
    el.querySelector('.cnt').textContent = q;
    el.querySelector('.stepper span').textContent = q;
  });
  $('#cartbar').classList.toggle('show', n > 0);
  document.body.classList.toggle('has-cart', n > 0);
  $('#cbSum').innerHTML = `${n} шт · ${fmt(p.total)}${p.save ? `<s>${fmt(p.full)}</s>` : ''}`;
  $('#cbHint').textContent = hintText(n);
  if ($('#modal').classList.contains('open')) renderModal();
}

function renderModal() {
  const n = count(), p = calc(n);
  if (!n) { closeModal(); return; }
  $('#mLines').innerHTML = SCENTS.filter(s => cart[s.id]).map(s => `
    <div class="line"><div class="n">${s.n}</div>
    <div class="stepper"><button type="button" data-minus="${s.id}" aria-label="Менше: ${s.n}">−</button><span>${cart[s.id]}</span><button type="button" data-plus="${s.id}" aria-label="Більше: ${s.n}">+</button></div></div>`).join('');
  const u = upsell(n);
  $('#mUpsell').textContent = u
    ? (u.cheaper
      ? `Вигідніше: додайте ще ${u.add} шт, і ${u.m} ${candles(u.m)} коштуватимуть ${fmt(u.total)}, це навіть менше, ніж зараз (${u.per} грн за штуку).`
      : `Порада: додайте ще ${u.add} шт, і вийде ${u.m} ${candles(u.m)} за ${fmt(u.total)}, тобто ${u.per} грн за штуку.`)
    : '';
  const free = p.total >= C.FREE_SHIPPING_FROM;
  $('#mTotals').innerHTML = `
    <div class="r"><span>${n} шт × ${C.SINGLE_PRICE} грн</span><span>${fmt(p.full)}</span></div>
    ${p.save ? `<div class="r g"><span>Знижка набору</span><span>−${fmt(p.save)}</span></div>` : ''}
    <div class="r"><span>Доставка</span><span class="${free ? 'g' : ''}">${free ? 'безкоштовно' : 'за тарифами НП'}</span></div>
    ${!free ? `<div class="r muted"><span>До безкоштовної доставки ще ${fmt(C.FREE_SHIPPING_FROM - p.total)}</span></div>` : ''}
    <div class="r t"><span>До сплати</span><span>${fmt(p.total)}</span></div>`;
}

document.addEventListener('click', e => {
  const pl = e.target.closest('[data-plus]'), mi = e.target.closest('[data-minus]');
  if (pl) change(pl.dataset.plus, 1);
  else if (mi) change(mi.dataset.minus, -1);
  else if (e.target.closest('[data-close]') || e.target.id === 'modal') closeModal();
  // посилання саме відкриває Instagram, тут лише копіюємо список ароматів
  if (e.target.closest('[data-direct]')) {
    if (count()) { copyText(orderText()); toast('Замовлення скопійовано, вставте його в Direct'); }
    track('Contact');
  }
});

let tt;
function toast(m) {
  const el = $('#toast');
  el.textContent = m; el.classList.add('show');
  clearTimeout(tt); tt = setTimeout(() => el.classList.remove('show'), 1400);
}

/* ---------- modal ---------- */
let lastFocus = null;
function openModal() {
  lastFocus = document.activeElement;
  $('#modal').classList.add('open'); document.body.style.overflow = 'hidden';
  renderModal(); track('InitiateCheckout');
  setTimeout(() => $('#modal .x').focus(), 30);
}
function closeModal() {
  if (!$('#modal').classList.contains('open')) return;
  $('#modal').classList.remove('open'); document.body.style.overflow = '';
  lastFocus && lastFocus.focus && lastFocus.focus();
}
$('#cbBtn').onclick = openModal;
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ---------- замовлення в Direct ---------- */
function orderText() {
  const n = count(), p = calc(n);
  return [`Привіт! Хочу замовити свічки ${C.BRAND}:`,
    ...SCENTS.filter(s => cart[s.id]).map(s => `— ${s.n} × ${cart[s.id]}`),
    `Разом: ${n} шт, ${fmt(p.total)}`].join('\n');
}
function copyText(t) {
  const legacy = () => {
    const ta = document.createElement('textarea');
    ta.value = t; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;opacity:0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove();
  };
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).catch(legacy);
  else legacy();
}

/* ---------- відгуки ---------- */
/* Стрілки гортають на одну картку, з кінця — на початок. Крапка = позиція прокрутки,
   а не картка: на широкому екрані видно кілька карток одразу. */
(function () {
  const tr = $('#rvTrack'), items = [...tr.children], dots = $('#rvDots');
  const step = () => (items[1] ? items[1].offsetLeft - items[0].offsetLeft : tr.clientWidth);
  const max = () => tr.scrollWidth - tr.clientWidth;
  let D = [];
  const cur = () => (max() - tr.scrollLeft < 4 ? D.length - 1 : Math.round(tr.scrollLeft / step()));
  const upd = () => { const c = cur(); D.forEach((d, i) => d.classList.toggle('on', i === c)); };
  const build = () => {
    const n = max() > 4 ? Math.round(max() / step()) + 1 : 1;
    $('#rvNav').hidden = n < 2;
    if (D.length !== n) { dots.innerHTML = '<i></i>'.repeat(n); D = [...dots.children]; }
    upd();
  };
  const go = i => tr.scrollTo({ left: i >= D.length - 1 ? max() : Math.max(0, i * step()), behavior: 'smooth' });
  $('#rvPrev').onclick = () => { const c = cur(); go(c > 0 ? c - 1 : D.length - 1); };
  $('#rvNext').onclick = () => { const c = cur(); go(c < D.length - 1 ? c + 1 : 0); };
  dots.onclick = e => { const i = D.indexOf(e.target); if (i >= 0) go(i); };
  tr.addEventListener('scroll', () => requestAnimationFrame(upd), { passive: true });
  addEventListener('resize', build);
  build();
})();

/* ---------- countdown ---------- */
if (C.COUNTDOWN) {
  const pad = x => String(x).padStart(2, '0');
  const tick = () => {
    const now = new Date(), end = new Date(now); end.setHours(23, 59, 59, 999);
    const s = Math.max(0, Math.floor((end - now) / 1000));
    $('#cdH').textContent = pad(Math.floor(s / 3600)); $('#cdM').textContent = pad(Math.floor(s % 3600 / 60)); $('#cdS').textContent = pad(s % 60);
  };
  // при прокрутці таймер стає компактним, щоб не закривати сторінку
  let tbC = false;
  addEventListener('scroll', () => { const c = scrollY > 160; if (c !== tbC) { tbC = c; $('#topbar').classList.toggle('compact', c); } }, { passive: true });
  tick(); setInterval(tick, 1000);
} else {
  $$('[data-countdown]').forEach(el => el.remove());
  $('#topbar').classList.add('no-timer');
}

render();
