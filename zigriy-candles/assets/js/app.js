import { CONFIG as C, GROUPS, SCENTS, calc } from './config.js';
import { fmt, plural, candles, hash, IMG, derive, setsHTML, groupsHTML } from './render.js';

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

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

/* ---------- static fills (дефолти вже в HTML; JS лише актуалізує) ---------- */
const D = derive();
$('#heroMin').textContent = fmt(D.minPer);
$('#heroOld').textContent = fmt(C.SINGLE_PRICE);
$('#heroBadge').textContent = D.badge;
$$('[data-free]').forEach(el => (el.textContent = D.free));
$$('[data-volume]').forEach(el => (el.textContent = C.VOLUME));
$$('[data-burn]').forEach(el => (el.textContent = C.BURN));
$('#shipSub').textContent = D.shipSub;
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

/* ---------- sets + scents: перемальовуємо, лише якщо HTML застарів відносно config.js ---------- */
const hydrate = (el, html) => { const h = hash(html); if (el.dataset.h !== h) { el.innerHTML = html; el.dataset.h = h; } };
hydrate($('#setsGrid'), setsHTML());
hydrate($('#groups'), groupsHTML());
$('#groups').addEventListener('error', e => {
  const im = e.target;
  if (im.tagName !== 'IMG') return;
  if (im.hasAttribute('data-opt')) im.remove(); else window.__zph(im, im.dataset.c1, im.dataset.c2);
}, true);
$$('#groups img:not([data-opt])').forEach(im => { if (im.complete && !im.naturalWidth) window.__zph(im, im.dataset.c1, im.dataset.c2); });

/* ---------- cart ---------- */
const CART_KEY = 'zigriy_cart';
const cart = {};
try {
  const saved = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
  for (const [id, q] of Object.entries(saved)) if (SCENTS.some(s => s.id === id) && q > 0) cart[id] = Math.min(C.MAX_PER_SCENT, q | 0);
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
  const was = cart[id] || 0, v = Math.max(0, Math.min(C.MAX_PER_SCENT, was + d));
  if (v) cart[id] = v; else delete cart[id];
  save();
  if (d > 0) { track('AddToCart'); toast('Додано: ' + SCENTS.find(s => s.id === id).n); }
  render();
}

// кількість, вписана вручну (0…MAX_PER_SCENT)
function setQty(id, raw) {
  if (!SCENTS.some(s => s.id === id)) return;
  const n = parseInt(raw, 10), was = cart[id] || 0;
  if (Number.isNaN(n)) { render(); return; } // порожньо чи не число — повертаємо як було
  const v = Math.max(0, Math.min(C.MAX_PER_SCENT, n));
  if (v === was) { render(); return; }
  if (v) cart[id] = v; else delete cart[id];
  save();
  if (v > was) { track('AddToCart'); toast(`${SCENTS.find(s => s.id === id).n}: ${v} шт`); }
  render();
}
document.addEventListener('change', e => { const q = e.target.closest('[data-qty]'); if (q) setQty(q.dataset.qty, q.value); });
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('[data-qty]')) { e.preventDefault(); e.target.blur(); } });
document.addEventListener('focusin', e => { if (e.target.matches('[data-qty]')) e.target.select(); });
const setVal = (el, q) => { if (el && document.activeElement !== el) el.value = q; };

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
    setVal(el.querySelector('.stepper .qty'), q);
  });
  $('#cartbar').classList.toggle('show', n > 0);
  $('#howCta').textContent = n ? `Перейти до кошика · ${n} шт` : 'Обрати аромати';
  document.body.classList.toggle('has-cart', n > 0);
  $('#cbSum').innerHTML = `${n} шт · ${fmt(p.total)}${p.save ? `<s>${fmt(p.full)}</s>` : ''}`;
  $('#cbHint').textContent = hintText(n);
  if ($('#modal').classList.contains('open')) renderModal();
  updatePrice();
  syncProduct();
}

function renderModal() {
  const n = count(), p = calc(n);
  if (!n) { if (!sent) closeModal(); return; }
  $('#mLines').innerHTML = SCENTS.filter(s => cart[s.id]).map(s => `
    <div class="line"><div class="n">${s.n}</div>
    <div class="stepper"><button type="button" data-minus="${s.id}" aria-label="Менше: ${s.n}">−</button><input class="qty" type="number" inputmode="numeric" min="0" max="${C.MAX_PER_SCENT}" data-qty="${s.id}" value="${cart[s.id]}" aria-label="Кількість: ${s.n}"><button type="button" data-plus="${s.id}" aria-label="Більше: ${s.n}">+</button></div></div>`).join('');
  const u = upsell(n);
  $('#mUpsell').textContent = u
    ? (u.cheaper
      ? `Вигідніше: додайте ще ${u.add} шт, і ${u.m} ${candles(u.m)} коштуватимуть ${fmt(u.total)}, це навіть менше, ніж зараз (${u.per} грн за штуку).`
      : `Порада: додайте ще ${u.add} шт, і вийде ${u.m} ${candles(u.m)} за ${fmt(u.total)}, тобто ${u.per} грн за штуку.`)
    : '';
  renderTotals();
}

function renderTotals() {
  const n = count(), p = calc(n);
  if (!n || !$('#modal').classList.contains('open')) return;
  const free = p.total >= C.FREE_SHIPPING_FROM;
  const ship = free ? '<span class="g">безкоштовно</span>'
    : NP.price ? `<span class="est">≈ ${fmt(NP.price)}</span>`
    : '<span>за тарифами перевізника</span>';
  $('#mTotals').innerHTML = `
    <div class="r"><span>${n} шт × ${C.SINGLE_PRICE} грн</span><span>${fmt(p.full)}</span></div>
    ${p.save ? `<div class="r g"><span>Знижка набору</span><span>−${fmt(p.save)}</span></div>` : ''}
    <div class="r"><span>Доставка${NP.cityRef ? ` (${NP.type === 'P' ? 'поштомат' : 'відділення'})` : ''}</span>${ship}</div>
    ${!free && NP.price ? `<div class="r muted"><span>Орієнтовно, за тарифами Нової Пошти</span></div>` : ''}
    ${!free ? `<div class="r muted"><span>До безкоштовної доставки ще ${fmt(C.FREE_SHIPPING_FROM - p.total)}</span></div>` : ''}
    <div class="r t"><span>До сплати${!free ? ' за свічки' : ''}</span><span>${fmt(p.total)}</span></div>`;
}

document.addEventListener('click', e => {
  const pl = e.target.closest('[data-plus]'), mi = e.target.closest('[data-minus]');
  if (pl) change(pl.dataset.plus, 1);
  else if (mi) change(mi.dataset.minus, -1);
  else if (e.target.closest('[data-close]') || e.target.id === 'modal') closeModal();
  // посилання саме відкриває Instagram, тут лише копіюємо список ароматів
  if (e.target.closest('[data-direct]')) {
    if (count() && !manualShown) {
      if (copyText(orderText())) toast('Замовлення скопійовано, вставте його в Direct');
      else { e.preventDefault(); showManual(orderText()); return; }  // in-app браузер заблокував копіювання
    }
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
let lastFocus = null, sent = false;
function openModal() {
  lastFocus = document.activeElement;
  $('#modal').classList.add('open'); document.body.style.overflow = 'hidden';
  renderModal(); track('InitiateCheckout');
  setTimeout(() => $('#modal .x').focus(), 30);
}
function closeModal() {
  if (!$('#modal').classList.contains('open')) return;
  if (sent) { sent = false; $('.sheet').classList.remove('sent'); $('#orderDone').hidden = true; }
  $('#modal').classList.remove('open'); document.body.style.overflow = '';
  lastFocus && lastFocus.focus && lastFocus.focus();
}
$('#cbBtn').onclick = openModal;
$('#howCta').addEventListener('click', e => { if (count()) { e.preventDefault(); openModal(); } });
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if ($('#modal').classList.contains('open')) closeModal();
  else if ($('#lb').hidden) closeProduct();
});


/* ---------- замовлення в Direct ---------- */
function orderText() {
  const n = count(), p = calc(n);
  return [`Привіт! Хочу замовити свічки ${C.BRAND}:`,
    ...SCENTS.filter(s => cart[s.id]).map(s => `— ${s.n} × ${cart[s.id]}`),
    `Разом: ${n} шт, ${fmt(p.total)}`].join('\n');
}
let manualShown = false;
function copyText(t) {
  const ta = document.createElement('textarea');
  ta.value = t; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;opacity:0';
  document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, t.length);
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) {}
  ta.remove();
  if (!ok && navigator.clipboard && isSecureContext) navigator.clipboard.writeText(t).catch(() => {});
  return ok;
}
function showManual(t) {
  manualShown = true;
  const box = $('#mManual'), ta = box.querySelector('textarea');
  ta.value = t; box.hidden = false; ta.focus(); ta.select();
}

/* ---------- Нова Пошта: місто → відділення або поштомат → ціна доставки ---------- */
const NP = { cityRef: '', city: '', cityLabel: '', type: 'W', pointRef: '', point: '', manual: false, price: null, priceKey: '' };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
async function npGet(params) {
  const r = await fetch('/api/np?' + new URLSearchParams(params));
  if (!r.ok) throw new Error('np ' + r.status);
  return r.json();
}
const fCity = $('#fCity'), fPoint = $('#fPoint');
const kindName = () => (NP.type === 'P' ? 'Поштомат' : 'Відділення');

// Поле з випадним списком підказок: стрілки, Enter, Esc, мишка й дотик
function combo(input, list, { load, render, pick }) {
  let items = [], active = -1, seq = 0;
  const open = on => { list.hidden = !on; input.setAttribute('aria-expanded', on); };
  const paint = note => {
    list.innerHTML = items.length
      ? items.map((it, i) => `<li role="option" id="${list.id}-${i}" data-i="${i}" aria-selected="${i === active}" class="${i === active ? 'on' : ''}">${render(it)}</li>`).join('')
      : `<li class="note">${note || 'Нічого не знайшли'}</li>`;
    input.setAttribute('aria-activedescendant', active >= 0 ? `${list.id}-${active}` : '');
    open(true);
  };
  const run = async () => {
    const my = ++seq;
    try {
      const res = await load(input.value.trim());
      if (my !== seq) return;
      if (!res) { open(false); return; }
      items = res.items; active = -1; paint(res.note);
    } catch (e) {
      if (my !== seq) return;
      items = []; npFail(); paint('Список Нової Пошти зараз недоступний. Впишіть вручну');
    }
  };
  const choose = i => { pick(items[i]); open(false); };
  input.addEventListener('input', debounce(run, 250));
  input.addEventListener('focus', () => { if (!input.disabled) run(); });
  input.addEventListener('blur', () => setTimeout(() => open(false), 150));
  input.addEventListener('keydown', e => {
    if (list.hidden) return;
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && items.length) {
      e.preventDefault();
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      paint(); list.children[active].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); choose(active); }
    else if (e.key === 'Escape') { e.stopPropagation(); open(false); }
  });
  list.addEventListener('mousedown', e => e.preventDefault()); // фокус лишається в полі
  list.addEventListener('click', e => { const li = e.target.closest('[data-i]'); if (li) choose(+li.dataset.i); });
  return { close: () => open(false) };
}

// API НП не відповідає — даємо вписати місто й відділення вручну, як раніше
function npFail() {
  if (NP.manual) return;
  NP.manual = true;
  fPoint.disabled = false;
  fPoint.placeholder = 'Наприклад: відділення №5';
}

function resetPoint() { NP.pointRef = ''; NP.point = ''; fPoint.value = ''; pointCombo.close(); }

const cityCombo = combo(fCity, $('#cityList'), {
  load: async q => {
    if (NP.manual || q.length < 2 || (NP.cityRef && q === NP.city)) return null;
    const r = await npGet({ action: 'cities', q });
    return { items: r.items, note: 'Такого міста не знайшли. Перевірте назву' };
  },
  render: c => `<b>${esc(c.name)}</b><small>${esc(c.label)}</small>`,
  pick: c => {
    Object.assign(NP, { cityRef: c.ref, city: c.name, cityLabel: c.label });
    fCity.value = c.name;
    resetPoint();
    fPoint.disabled = false; fPoint.placeholder = 'Номер або вулиця';
    updatePrice();
    fPoint.focus();
  },
});
fCity.addEventListener('input', () => {
  if (!NP.cityRef) return;
  Object.assign(NP, { cityRef: '', city: '', cityLabel: '' });
  resetPoint();
  if (!NP.manual) { fPoint.disabled = true; fPoint.placeholder = 'Спочатку оберіть місто'; }
  updatePrice();
});

const pointCombo = combo(fPoint, $('#pointList'), {
  load: async q => {
    if (NP.manual || !NP.cityRef) return null;
    if (NP.pointRef && q === NP.point) q = '';
    const r = await npGet({ action: 'points', city: NP.cityRef, type: NP.type, q });
    return {
      items: r.items,
      note: q ? 'Нічого не знайшли. Спробуйте номер або іншу вулицю' : `У цьому місті немає ${NP.type === 'P' ? 'поштоматів' : 'відділень'} Нової Пошти`,
    };
  },
  render: p => `<b>${kindName()} №${esc(p.n)}</b>${p.kg ? ` · до ${p.kg} кг` : ''}<small>${esc(p.d)}</small>`,
  pick: p => { NP.pointRef = p.ref; NP.point = `№${p.n}: ${p.d}`; fPoint.value = NP.point; },
});
fPoint.addEventListener('input', () => { NP.pointRef = ''; });

$$('input[name="npType"]').forEach(r => r.addEventListener('change', () => {
  NP.type = r.value;
  $('#fPointLabel').textContent = NP.type === 'P' ? 'Поштомат Нової Пошти' : 'Відділення Нової Пошти';
  resetPoint();
  updatePrice();
  if (NP.cityRef) fPoint.focus();
}));

// Орієнтовна вартість доставки з тарифів НП (лише коли доставка не безкоштовна)
async function updatePrice() {
  const n = count(), free = calc(n).total >= C.FREE_SHIPPING_FROM;
  const key = NP.cityRef && n && !free ? `${NP.cityRef}|${NP.type}|${n}` : '';
  if (key === NP.priceKey) return;
  NP.priceKey = key; NP.price = null; renderTotals();
  if (!key) return;
  try {
    const r = await npGet({ action: 'price', city: NP.cityRef, type: NP.type, n });
    if (NP.priceKey === key) { NP.price = r.cost; renderTotals(); }
  } catch (e) { /* лишаємо «за тарифами перевізника» */ }
}

/* ---------- швидке замовлення → /api/order → Telegram ---------- */
const tooMany = () => `В одному замовленні максимум ${C.MAX_ORDER} свічок, а у вас ${count()} шт. Зменште кількість, будь ласка.`;
const normPhone = v => { const d = v.replace(/\D/g, ''); return /^380\d{9}$/.test(d) ? '+' + d : /^0\d{9}$/.test(d) ? '+38' + d : null; };
function sourceInfo() {
  const q = new URLSearchParams(location.search), o = {};
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign']) if (q.get(k)) o[k] = q.get(k);
  try { if (document.referrer) o.ref = new URL(document.referrer).hostname; } catch (e) {}
  if (/Instagram/i.test(navigator.userAgent)) o.app = 'instagram';
  return o;
}
$('#orderForm').addEventListener('submit', async e => {
  e.preventDefault();
  const v = Object.fromEntries(new FormData(e.target)), err = m => { const el = $('#orderErr'); el.textContent = m; el.hidden = !m; };
  const phone = normPhone(v.phone || '');
  const point = fPoint.value.trim(), what = NP.type === 'P' ? 'поштомат' : 'відділення';
  if (count() > C.MAX_ORDER) return err(tooMany());
  if (!v.name.trim()) return err('Вкажіть імʼя та прізвище.');
  if (!phone) return err('Введіть телефон у форматі +380XXXXXXXXX або 0XXXXXXXXX.');
  if (NP.manual ? !fCity.value.trim() : !NP.cityRef) return err(NP.manual ? 'Вкажіть місто.' : 'Оберіть місто зі списку підказок.');
  if (NP.manual ? !point : !NP.pointRef) return err(NP.manual ? `Вкажіть ${what} Нової Пошти.` : `Оберіть ${what} зі списку.`);
  const free = calc(count()).total >= C.FREE_SHIPPING_FROM;
  err('');
  const btn = $('#orderBtn'), label = btn.textContent;
  btn.disabled = true; btn.textContent = 'Надсилаємо…';
  const orderId = 'Z-' + Date.now().toString(36).toUpperCase().slice(-6);
  try {
    const r = await fetch('/api/order', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId, firstName: v.name.trim(), phone,
        city: NP.cityLabel || fCity.value.trim(), np: point, npType: NP.type, noCall: !!v.noCall,
        delivery: free ? '' : NP.price ? `≈ ${NP.price} грн` : '',
        instagram: v.instagram.trim(), contact: v.instagram.trim() ? 'Instagram' : 'Телефон', website: v.website,
        items: SCENTS.filter(s => cart[s.id]).map(s => ({ id: s.id, qty: cart[s.id] })), source: sourceInfo(),
      }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) throw new Error(j.error || r.status);
    track('Purchase', {}, orderId);
    sent = true;
    for (const k of Object.keys(cart)) delete cart[k];
    save(); render();
    $('#orderDoneId').textContent = orderId;
    $('.sheet').classList.add('sent'); $('#orderDone').hidden = false;
  } catch (x) {
    const why = {
      'Too many items': tooMany(),
      'Invalid contact data': 'Перевірте імʼя, телефон, місто та відділення.',
      'Empty cart': 'Кошик порожній. Додайте хоча б одну свічку.',
    }[x.message];
    err(why || 'Не вдалося надіслати заявку. Спробуйте ще раз або напишіть нам у Direct.');
  } finally {
    btn.disabled = false; btn.textContent = label;
  }
});

/* ---------- звук у hero ---------- */
(function () {
  const v = $('.hero-visual video'), btns = [$('#heroSound'), $('#heroSoundTop')].filter(Boolean);
  if (!v || !btns.length) return;
  const sync = () => btns.forEach(b => {
    b.setAttribute('aria-pressed', !v.muted);
    b.textContent = v.muted ? '🔊 Послухати тріскіт' : '🔇 Вимкнути звук';
  });
  const toggle = () => {
    v.muted = !v.muted;
    if (!v.muted) { v.volume = 1; v.play().catch(() => {}); }
    sync();
  };
  $('#heroSound').onclick = toggle;
  // на телефоні відео нижче тексту: показуємо його й одразу вмикаємо звук
  const top = $('#heroSoundTop');
  if (top) top.onclick = () => {
    if (v.muted) $('.hero-visual').scrollIntoView({ behavior: 'smooth', block: 'center' });
    toggle();
  };
})();

/* ---------- лайтбокс відгуків ---------- */
(function () {
  const rvs = [...$$('.rv')], lb = $('#lb'), img = $('#lbImg');
  let cur = 0;
  const show = i => { cur = (i + rvs.length) % rvs.length; const im = rvs[cur].querySelector('img'); img.src = im.currentSrc || im.src; img.alt = im.alt; };
  let back = null;
  const open = i => { back = document.activeElement; show(i); lb.hidden = false; document.body.style.overflow = 'hidden'; $('.lb-x').focus(); };
  const close = () => { if (lb.hidden) return; lb.hidden = true; document.body.style.overflow = ''; back && back.focus && back.focus({ preventScroll: true }); };
  window.__openReview = open;
  rvs.forEach((b, i) => (b.onclick = () => open(i)));
  $('#lbPrev').onclick = () => show(cur - 1);
  $('#lbNext').onclick = () => show(cur + 1);
  lb.addEventListener('click', e => { if (e.target === lb || e.target.closest('[data-lb-close]')) close(); });
  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') show(cur - 1); else if (e.key === 'ArrowRight') show(cur + 1);
  });
})();

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

/* ---------- сторінка аромату: /aromat/<id> ---------- */
const pv = $('#pv'), BASE_TITLE = document.title;
let pvId = null, pvQty = 1, pvFocus = null;
const NOTE_ROWS = [['top', 'Верхні ноти', 0], ['mid', 'Середні ноти', 1], ['base', 'Базові ноти', 2]];
const PV_EXTRA = { shokolad: ["/assets/img/gallery/shokolad-cozy.webp"] }; // додаткові фото аромату
const ICO = {
  wax: '<path d="M12 22c4.4 0 7-2.7 7-6.5 0-4.6-4-6.5-4.6-11.5C11 6 8.5 9 8.5 12c-1.2-.6-2-1.8-2.2-3C5.6 10.4 5 12.2 5 14.5 5 19.3 7.6 22 12 22z"/>',
  wick: '<path d="M4 20 20 4M7 21l-4-4M21 7l-4-4M9 13l2 2M13 9l2 2"/>',
  volume: '<path d="M8 3h8M9 3v6l-4 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-4-9V3"/><path d="M6.5 15h11"/>',
  time: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  scent: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="2.5"/>',
  jar: '<rect x="6" y="3" width="12" height="4" rx="1"/><path d="M7 7h10v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z"/>',
  crystal: '<path d="M12 2v20M4.9 4.9l14.2 14.2M2 12h20M4.9 19.1 19.1 4.9M9 3l3 3 3-3M9 21l3-3 3 3"/>',
  hand: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z"/>',
  truck: '<path d="M1 6h13v10H1zM14 10h4l3 3v3h-7"/><circle cx="5" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
};
const ico = k => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[k]}</svg>`;
const PV_ABOUT = [
  ['wax', 'Віск', 'натуральний пальмовий, без парафіну'],
  ['wick', 'Ґніт', 'деревʼяний, тихо потріскує, як камін'],
  ['volume', 'Обʼєм', () => C.VOLUME],
  ['time', 'Горіння', () => C.BURN],
  ['scent', 'Аромат', 'сертифіковані аромаолії'],
  ['jar', 'Баночка', 'скляна, з деревʼяною кришечкою'],
  ['crystal', 'Візерунок', 'кришталевий, у кожної свічки свій'],
  ['hand', 'Виготовлення', 'вручну, у Дрогобичі'],
];
// трикутник-піраміда: підсвічений рівень нот
const tri = lvl => `<svg class="tri" viewBox="0 0 36 32" aria-hidden="true">
  <path d="M18 2 23.7 12H12.3Z" class="${lvl === 0 ? 'on' : ''}"/><path d="M12.3 12h11.4l5.1 9H7.2Z" class="${lvl === 1 ? 'on' : ''}"/><path d="M7.2 21h21.6L34 30H2Z" class="${lvl === 2 ? 'on' : ''}"/></svg>`;

// галерея: фото гортаються пальцем, стрілками, мініатюрами й клавішами ← →
function pvGallery(s) {
  const items = [IMG(s.id), ...(s.img2 ? [IMG(s.img2)] : []), ...(PV_EXTRA[s.id] || [])].map(src => ({ src, thumb: src }));
  const v = $('.hero-visual video');
  if (s.id === 'harbuzovyi-chai' && v) items.push({ video: v.currentSrc || v.src, thumb: v.poster });
  const slides = items.map((it, i) => `<div class="pv-slide" role="group" aria-roledescription="слайд" aria-label="${i + 1} з ${items.length}">${it.video
    ? `<video src="${it.video}" muted loop playsinline autoplay aria-label="Свічка «${s.n}» горить"></video>`
    : `<img src="${it.src}" alt="${i ? `«${s.n}», фото ${i + 1}` : `Свічка Zigriy «${s.n}»`}" width="800" height="800" ${i ? 'loading="lazy"' : ''}>`}</div>`).join('');
  const many = items.length > 1;
  return `<div class="pv-media">
    <div class="pv-gal" aria-roledescription="галерея" aria-label="Фото «${s.n}»">
      <div class="pv-track" id="pvTrack" tabindex="0">${slides}</div>
      ${many ? `<button type="button" class="pv-nav prev" data-gal="-1" aria-label="Попереднє фото"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg></button>
      <button type="button" class="pv-nav next" data-gal="1" aria-label="Наступне фото"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>
      <div class="pv-count" aria-live="polite"><span id="pvIdx">1</span> / ${items.length}</div>` : ''}
    </div>
    ${many ? `<div class="pv-thumbs">${items.map((it, i) => `<button type="button" class="pv-thumb${i ? '' : ' on'}" data-go="${i}" aria-label="Фото ${i + 1}"${i ? '' : ' aria-current="true"'}><img src="${it.thumb}" alt="" width="64" height="64">${it.video ? '<span class="play" aria-hidden="true">▶</span>' : ''}</button>`).join('')}</div>` : ''}
  </div>`;
}
const galN = () => $$('#pvTrack .pv-slide').length;
const galCur = () => { const tr = $('#pvTrack'); return Math.round(tr.scrollLeft / tr.clientWidth); };
function galGo(i) {
  const tr = $('#pvTrack'), n = galN();
  if (!tr || n < 2) return;
  i = (i + n) % n;
  tr.scrollTo({ left: i * tr.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}
function galSync() {
  const i = galCur();
  if ($('#pvIdx')) $('#pvIdx').textContent = i + 1;
  $$('.pv-thumb').forEach((t, k) => { t.classList.toggle('on', k === i); t.toggleAttribute('aria-current', k === i); });
}

function pvReviews(s) {
  const all = [...$$('.rv')];
  const own = all.filter(b => b.dataset.scent === s.id);
  const list = [...own, ...all.filter(b => !own.includes(b))]; // спершу про цей аромат, далі всі інші
  return `<section class="pv-sec"><h2>Відгуки покупців</h2>${own.length ? `<p class="pv-hint">Спершу відгуки саме про «${s.n}»</p>` : ''}
    <div class="pv-rvs">${list.map(b => { const im = b.querySelector('img'); return `<button type="button" class="pv-rv" data-rvi="${all.indexOf(b)}" aria-label="Відкрити відгук"><img src="${im.getAttribute('src')}" alt="${esc(im.alt)}" loading="lazy" width="600" height="1067"></button>`; }).join('')}</div></section>`;
}

function pvRelated(s) {
  const others = SCENTS.filter(x => x.id !== s.id).sort((a, b) => (b.g === s.g) - (a.g === s.g));
  return `<section class="pv-sec"><h2>Вам також сподобається</h2><div class="pv-rel">${others.map(x => `
    <a class="pv-card" href="/aromat/${x.id}" data-pv="${x.id}"><img src="${IMG(x.id)}" alt="" loading="lazy" width="800" height="800"><b>${x.n}</b><span>${fmt(C.SINGLE_PRICE)}</span></a>`).join('')}</div></section>`;
}

function pvFaq() {
  const pick = [...$$('.faq details')].filter(d => /доставка|оплатити|безпечні/i.test(d.querySelector('summary').textContent));
  return pick.length ? `<section class="pv-sec"><h2>Питання</h2><div class="faq">${pick.map(d => d.outerHTML.replace(/\sopen(="")?/, '')).join('')}</div></section>` : '';
}

function renderProduct() {
  const s = SCENTS.find(x => x.id === pvId), g = GROUPS.find(x => x.id === s.g) || {};
  const rows = NOTE_ROWS.filter(([k]) => s.notes && s.notes[k] && s.notes[k].length);
  const sets = [{ qty: 1, price: C.SINGLE_PRICE }, ...[...C.SETS].reverse()];
  $('#pvBody').innerHTML = `
    <nav class="crumbs" aria-label="Навігація"><a href="/" data-pv-close>Головна</a><span>/</span><a href="/#scents" data-pv-close>Аромати</a><span>/</span><span aria-current="page">${s.n}</span></nav>
    <div class="pv-main">
      ${pvGallery(s)}
      <div class="pv-info">
        ${g.t ? `<p class="pv-group">${g.t}${g.tag ? ` · ${g.tag}` : ''}</p>` : ''}
        <h1 id="pvTitle" tabindex="-1">${s.n}</h1>
        <ul class="pv-chips"><li>${ico('volume')}${C.VOLUME}</li><li>${ico('time')}горить ${C.BURN}</li><li>${ico('wick')}потріскує</li></ul>
        <div class="pv-price"><b>${fmt(C.SINGLE_PRICE)}</b><span>у наборі від ${fmt(D.minPer)} за штуку</span></div>
        <p class="pv-ds">${s.d}</p>
        <div class="pv-buy">
          <div class="stepper pv-step"><button type="button" data-pvq="-1" aria-label="Менше">−</button><input class="qty" id="pvQty" type="number" inputmode="numeric" min="1" max="${C.MAX_PER_SCENT}" value="${pvQty}" aria-label="Кількість"><button type="button" data-pvq="1" aria-label="Більше">+</button></div>
          <button type="button" class="btn" id="pvAdd">Додати в кошик</button>
        </div>
        <button type="button" class="btn alt block" id="pvNow">Замовити зараз</button>
        <p class="pv-incart" id="pvInCart" aria-live="polite"></p>
        <ul class="pv-trust">
          <li>${ico('truck')}<span>Безкоштовна доставка від <b>${D.free}</b></span></li>
          <li>${ico('box')}<span>Новою Поштою у відділення чи поштомат</span></li>
          <li>${ico('check')}<span>Оплата після підтвердження менеджером</span></li>
        </ul>
        ${rows.length ? `<div class="pv-notes-wrap"><h2>Ноти аромату</h2><div class="pv-notes">${rows.map(([k, t, l]) => `
          <div class="pv-note">${tri(l)}<div><b>${t}</b><ul>${s.notes[k].map(n => `<li>${esc(n)}</li>`).join('')}</ul></div></div>`).join('')}</div></div>` : ''}
      </div>
    </div>
    <section class="pv-sec"><h2>Про свічку</h2><dl class="pv-about">${PV_ABOUT.map(([i, k, v]) => `<div>${ico(i)}<dt>${k}</dt><dd>${typeof v === 'function' ? v() : v}</dd></div>`).join('')}</dl></section>
    <section class="pv-sec"><h2>Чим більше, тим дешевше</h2><p class="pv-hint">Аромати в набір можна змішувати: ціна рахується від загальної кількості.</p>
      <div class="pv-sets">${sets.map(x => `<div class="${x.qty === D.minSet.qty ? 'best' : ''}"><b>${x.qty} ${candles(x.qty)}</b><span>${fmt(x.price)}</span><small>${Math.round(x.price / x.qty)} грн / шт</small></div>`).join('')}</div></section>
    ${pvReviews(s)}
    ${pvRelated(s)}
    ${pvFaq()}`;
  $('#pvBar').innerHTML = `<div class="pv-bar-in"><div class="pv-bar-t"><b>${s.n}</b><span>${fmt(C.SINGLE_PRICE)} · ${C.VOLUME}</span></div><button type="button" class="btn" id="pvBarAdd">Додати в кошик</button></div>`;
  const tr = $('#pvTrack');
  tr.addEventListener('scroll', () => requestAnimationFrame(galSync), { passive: true });
  tr.addEventListener('keydown', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); galGo(galCur() + (e.key === 'ArrowRight' ? 1 : -1)); } });
  syncProduct();
}

// лічильник кошика й «у кошику вже N шт» на сторінці аромату
function syncProduct() {
  if (!pvId) return;
  const n = count(), q = cart[pvId] || 0;
  $('#pvCartN').textContent = n || '';
  $('#pvCart').setAttribute('aria-label', n ? `Кошик, ${n} шт` : 'Кошик порожній');
  $('#pvInCart').textContent = q ? `У кошику вже ${q} шт цього аромату` : '';
}

function openProduct(id, push = true) {
  const s = SCENTS.find(x => x.id === id);
  if (!s) return;
  if (!pvId) pvFocus = document.activeElement;
  pvId = id; pvQty = 1;
  renderProduct();
  pv.hidden = false; document.body.classList.add('pv-open'); pv.scrollTop = 0;
  document.title = `${s.n}: свічка Zigriy ${C.VOLUME}`;
  if (push) { try { history.pushState({ pv: id }, '', '/aromat/' + id); } catch (e) {} }
  $('#pvTitle').focus({ preventScroll: true });
  try { window.fbq && fbq('track', 'ViewContent', { content_ids: [id], content_name: s.n, content_type: 'product', value: C.SINGLE_PRICE, currency: 'UAH' }); } catch (e) {}
}

function closeProduct(fromHistory = false) {
  if (!pvId) return;
  pvId = null;
  pv.hidden = true; document.body.classList.remove('pv-open'); document.title = BASE_TITLE;
  pv.querySelectorAll('video').forEach(v => v.pause());
  if (!fromHistory) { try { if (history.state && history.state.pv) history.back(); else history.replaceState(null, '', '/'); } catch (e) {} }
  pvFocus && pvFocus.focus && pvFocus.focus({ preventScroll: true });
}

addEventListener('popstate', e => { const id = e.state && e.state.pv; if (id) openProduct(id, false); else closeProduct(true); });

const pvTake = () => { const v = parseInt($('#pvQty').value, 10); pvQty = Math.max(1, Math.min(C.MAX_PER_SCENT, v || 1)); $('#pvQty').value = pvQty; return pvQty; };
pv.addEventListener('click', e => {
  const t = e.target;
  const gal = t.closest('[data-gal]'), th = t.closest('[data-go]');
  if (gal) { galGo(galCur() + +gal.dataset.gal); return; }
  if (th) { galGo(+th.dataset.go); return; }
  const q = t.closest('[data-pvq]');
  if (q) { pvQty = Math.max(1, Math.min(C.MAX_PER_SCENT, pvTake() + +q.dataset.pvq)); $('#pvQty').value = pvQty; return; }
  if (t.closest('#pvAdd, #pvBarAdd')) { change(pvId, pvTake()); return; }
  if (t.closest('#pvNow')) { if (!cart[pvId]) change(pvId, pvTake()); openModal(); return; }
  if (t.closest('#pvCart')) { if (count()) openModal(); else closeProduct(); return; }
  const rv = t.closest('[data-rvi]');
  if (rv) { window.__openReview(+rv.dataset.rvi); return; }
  const cl = t.closest('[data-pv-close]');
  if (cl) {
    e.preventDefault();
    const toScents = (cl.getAttribute('href') || '').includes('#scents') || cl.classList.contains('pv-back');
    closeProduct();
    if (toScents) setTimeout(() => $('#scents').scrollIntoView(), 0);
  }
});
pv.addEventListener('change', e => { if (e.target.id === 'pvQty') pvTake(); });

// посилання на аромат з каталогу й зі схожих ароматів
document.addEventListener('click', e => {
  const a = e.target.closest('[data-pv]');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
  e.preventDefault();
  openProduct(a.dataset.pv);
});

// пряме посилання /aromat/<id>
{
  const m = location.pathname.match(/^\/aromat\/([\w-]+)\/?$/);
  if (m && SCENTS.some(s => s.id === m[1])) { try { history.replaceState({ pv: m[1] }, '', location.pathname); } catch (e) {} openProduct(m[1], false); }
}

/* ---------- countdown ---------- */
if (C.COUNTDOWN) {
  const pad = x => String(x).padStart(2, '0');
  const end = new Date(C.PROMO_UNTIL).getTime();
  let timerId;
  const tick = () => {
    const s = Math.floor((end - Date.now()) / 1000);
    if (s <= 0) { // акція скінчилась — ховаємо таймер, лишаємо смужку з доставкою
      clearInterval(timerId);
      $$('[data-countdown]').forEach(el => el.remove());
      $('#topbar').classList.add('no-timer');
      return;
    }
    const d = Math.floor(s / 86400);
    $('#cdD').textContent = pad(d); $('#cdDl').textContent = plural(d, 'день', 'дні', 'днів');
    $('#cdH').textContent = pad(Math.floor(s % 86400 / 3600)); $('#cdM').textContent = pad(Math.floor(s % 3600 / 60)); $('#cdS').textContent = pad(s % 60);
  };
  // при прокрутці таймер стає компактним. Пороги різні (згортаємо після 140px, розгортаємо вище 40px),
  // а місце під смужку не змінюється, тож вона більше не «смикається» туди-сюди
  let tbC = false;
  const onScroll = () => {
    const c = tbC ? scrollY > 40 : scrollY > 140;
    if (c !== tbC) { tbC = c; $('#topbar').classList.toggle('compact', c); }
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  timerId = setInterval(tick, 1000); tick();
} else {
  $$('[data-countdown]').forEach(el => el.remove());
  $('#topbar').classList.add('no-timer');
}

/* висота місця під фіксовану смужку = її повна (не компактна) висота */
(function () {
  const tb = $('#topbar'), root = document.documentElement;
  let full = 0, w = innerWidth;
  // під час анімації висота проміжна, тому беремо максимум; скидаємо лише при зміні ширини екрана
  const measure = () => {
    const h = tb.offsetHeight;
    if (tb.classList.contains('compact')) { root.style.setProperty('--tb-h-compact', h + 'px'); return; }
    if (h > full) { full = h; root.style.setProperty('--tb-h', h + 'px'); }
  };
  measure();
  addEventListener('resize', () => { if (innerWidth !== w) { w = innerWidth; full = 0; } measure(); });
  document.fonts && document.fonts.ready.then(measure);
  if (window.ResizeObserver) new ResizeObserver(measure).observe(tb);
})();

render();
