/* Спільна розмітка для сайту (app.js) і для prerender-скрипта (scripts/prerender.mjs):
   ціни, набори й картки ароматів потрапляють у HTML ще до запуску JS. */
import { CONFIG as C, GROUPS, SCENTS, calc, bundlePrice } from './config.js';

export const fmt = n => n.toLocaleString('uk-UA').replace(/[\s,]/g, ' ') + ' грн';
export const plural = (n, one, few, many) => {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
};
export const candles = n => plural(n, 'свічка', 'свічки', 'свічок');
export const IMG = id => `/assets/img/scents/${id}.webp?v=${C.IMG_VERSION}`;
export const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); };

export function derive() {
  const minSet = C.SETS.reduce((a, s) => (s.price / s.qty < a.price / a.qty ? s : a), C.SETS[0] || { qty: 1, price: C.SINGLE_PRICE });
  const minPer = Math.round(minSet.price / minSet.qty);
  const maxOff = Math.round((1 - minPer / C.SINGLE_PRICE) * 100);
  let freeFrom = null;
  for (let n = 1; n <= 50; n++) if (calc(n).total >= C.FREE_SHIPPING_FROM) { freeFrom = n; break; }
  return {
    minSet, minPer, maxOff, freeFrom,
    free: fmt(C.FREE_SHIPPING_FROM),
    badge: maxOff > 0 ? `−${maxOff}% у наборі` : '',
    shipSub: freeFrom ? `Тобто вже з ${freeFrom} ${plural(freeFrom, 'свічки', 'свічок', 'свічок')}. Відправляємо Новою Поштою` : 'Відправляємо Новою Поштою',
  };
}

export function setsHTML() {
  const { minSet } = derive();
  const cards = [{ qty: 1, price: C.SINGLE_PRICE }, ...[...C.SETS].reverse()];
  const popular = C.SETS.length >= 2 ? C.SETS[1].qty : null;
  return cards.map(s => {
    const full = s.qty * C.SINGLE_PRICE, per = Math.round(s.price / s.qty);
    const tag = s.qty === minSet.qty && s.qty > 1 ? '<span class="tag dark">Найвигідніший</span>'
      : s.qty === popular ? '<span class="tag">Найпопулярніший</span>' : '';
    return `<div class="set ${s.qty === popular ? 'hot' : ''}">${tag}
    <div class="q">${s.qty}</div><div class="ql">${candles(s.qty)}</div>
    <div class="p">${fmt(s.price)}</div>
    ${s.qty > 1 ? `<div class="o">${fmt(full)}</div>` : '<div class="o none">&nbsp;</div>'}
    <div class="per">${per} грн / шт</div>
    ${s.qty > 1 ? `<div class="save">економія ${fmt(full - s.price)}</div>` : ''}
  </div>`;
  }).join('');
}

// превʼю наборів: спершу аромати з оформленою карткою (колаж із назвою — осіння колекція або card: true), далі звичайні фото
const hasCard = s => s.g === 'autumn' || !!s.card;
export const cardFirst = items => [...items].sort((a, b) => hasCard(b) - hasCard(a));

// картки готових наборів (секція «Популярні набори» і «Інші набори» на сторінці набору)
export function bundlesHTML(skip) {
  return (C.BUNDLES || []).filter(b => b.id !== skip).map(b => {
    const items = b.items.map(id => SCENTS.find(s => s.id === id)).filter(Boolean), p = bundlePrice(b);
    const deal = C.COUNTDOWN && b.id === C.DEAL;
    return `
    <article class="bundle${deal ? ' deal' : ''}">
      <a class="bd-pics" href="/nabir/${b.id}" data-bundle="${b.id}" aria-label="${b.n}: склад і ціна">${cardFirst(items).map(s => `<img src="${IMG(s.id)}" alt="" loading="lazy" width="800" height="800">`).join('')}<span class="bd-tag">${deal ? 'Набір тижня' : `${items.length} ${candles(items.length)}`}</span></a>
      <div class="bd-body">
        <h3><a href="/nabir/${b.id}" data-bundle="${b.id}">${b.n}</a></h3>
        <p class="bd-sub">${b.t || ''}</p>
        <ul class="bd-list">${items.map(s => `<li>${s.n}</li>`).join('')}</ul>
        <div class="bd-pr"><b>${fmt(p.total)}</b>${p.save ? `<s>${fmt(p.full)}</s><span>−${fmt(p.save)}</span>` : ''}</div>
        <div class="bd-act"><button type="button" class="btn" data-add-bundle="${b.id}">Додати набір</button><a class="bd-more" href="/nabir/${b.id}" data-bundle="${b.id}">Склад</a></div>
      </div>
    </article>`;
  }).join('');
}

export function groupsHTML() {
  const { minPer } = derive();
  return GROUPS.map(g => `
  <div class="group-title">${g.t}${g.tag ? ` <small>${g.tag}</small>` : ''}</div>
  <div class="grid">${SCENTS.filter(s => s.g === g.id).map(s => `
    <div class="scent" data-id="${s.id}">
      <div class="img">
        <img src="${IMG(s.id)}" alt="Свічка Zigriy «${s.n}»" loading="lazy" width="800" height="800" data-c1="${s.c[0]}" data-c2="${s.c[1]}">
        ${s.img2 ? `<img class="alt" src="${IMG(s.img2)}" alt="" loading="lazy" width="800" height="800" data-opt>` : ''}
        <a class="info-btn" href="/aromat/${s.id}" data-pv="${s.id}" aria-label="Детальніше про аромат «${s.n}»"><span>Детальніше</span></a>
        <span class="cnt"></span>
      </div>
      <div class="body">
        <a class="nm" href="/aromat/${s.id}" data-pv="${s.id}">${s.n}</a><div class="ds">${s.d}</div>
        <div class="burn">${C.VOLUME} · горить ${C.BURN}</div>
        <div class="pr"><b>${fmt(C.SINGLE_PRICE)}</b><span>у наборі від ${fmt(minPer)}</span></div>
        <button class="add" data-plus="${s.id}">+ Додати</button>
        <div class="stepper"><button data-minus="${s.id}" aria-label="Менше: ${s.n}">−</button><input class="qty" type="number" inputmode="numeric" min="0" max="${C.MAX_PER_SCENT}" data-qty="${s.id}" aria-label="Кількість: ${s.n}"><button data-plus="${s.id}" aria-label="Більше: ${s.n}">+</button></div>
      </div>
    </div>`).join('')}</div>`).join('');
}
