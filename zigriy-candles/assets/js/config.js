/* ================= НАЛАШТУВАННЯ МАГАЗИНУ =================
   Цей файл читає і сайт, і серверна функція /api/order,
   тож ціни достатньо змінити тільки тут.                      */

export const CONFIG = {
  BRAND: 'Zigriy',
  INSTAGRAM: 'zigriy.candles',

  META_PIXEL_ID: '',     // ← ID Meta Pixel (порожньо = вимкнено)
  TIKTOK_PIXEL_ID: '',   // ← ID TikTok Pixel (порожньо = вимкнено)

  IMG_VERSION: 3,         // збільшуйте, коли замінюєте фото ароматів, щоб браузери не показували старі з кешу

  VOLUME: '200 мл',
  BURN: '40+ годин',     // скільки горить одна свічка
  SINGLE_PRICE: 450,     // ціна однієї свічки (з Instagram)

  // Ціни наборів. Від більшого до меншого!
  SETS: [
    { qty: 12, price: 4300 },
    { qty: 6,  price: 2350 },
    { qty: 3,  price: 1250 },
  ],

  // Нова Пошта: звідки відправляємо і скільки важить одна свічка з упаковкою (для розрахунку доставки)
  NP: {
    SENDER_CITY: 'db5c88f6-391c-11dd-90d9-001a92567626', // Дрогобич
    WEIGHT_PER_CANDLE: 0.5,                               // кг
  },

  FREE_SHIPPING_FROM: 1200,
  MAX_ORDER: 1000,           // більше свічок в одному замовленні з сайту — тільки через Direct
  MAX_PER_SCENT: 999,        // скільки свічок одного аромату можна вписати
  COUNTDOWN: true,           // таймер «ціни на набори діють до кінця тижня» у шапці, щотижня до опівночі неділі

  // Готові набори: секція «Популярні набори» на головній і сторінка /nabir/<id>.
  // «Додати набір» кладе в кошик по одній свічці кожного аромату, ціна рахується як звичайний набір (3 свічки = ціна набору на 3).
  // t — короткий підпис у картці, d — опис на сторінці набору.
  // price — своя ціна набору (необовʼязково): діє, щойно в кошику є всі його аромати, навіть додані поштучно;
  // сайт і сервер беруть найвигідніший для покупця варіант. Після змін запустіть node scripts/prerender.mjs
  BUNDLES: [
    { id: 'osinnii', n: 'Осінній набір', items: ['pryanyi-apelsyn', 'teplyi-kruasan', 'harbuzovyi-pyrih'], price: 1200,
      t: 'Цитрус із прянощами, тепла здоба й гарбузова випічка',
      d: 'Три найпопулярніші осінні аромати в одному наборі: цитрусово-пряний апельсин, тепла здоба з медом і гарбузова випічка з корицею. Запалюйте під настрій або подаруйте комусь трохи осіннього затишку.' },
    { id: 'solodkyi', n: 'Солодкий набір', items: ['shokolad', 'vanil', 'osinnii-krem'],
      t: 'Для тих, хто любить десертні аромати',
      d: 'Три десертні аромати: насичений шоколад, класична тепла ваніль і вершковий гарбузовий крем з корицею. Вдома пахне, як у затишній кондитерській.' },
    { id: 'znaiomstvo', n: 'Набір-знайомство', items: ['harbuzovyi-chai', 'dynia', 'vanil'],
      t: 'Три різні настрої, щоб знайти свій аромат',
      d: 'Не знаєте, з чого почати? Тут три зовсім різні характери: пряний гарбузовий чай, свіжа соковита диня і класична ваніль. Гарний вибір для першого замовлення чи на подарунок.' },
  ],
  DEAL: 'osinnii',           // набір, який відкривається, коли натиснути на таймер
};

export const GROUPS = [
  { id: 'autumn',  t: 'Осіння колекція', tag: 'Новинка' },
  { id: 'classic', t: 'Класика',         tag: 'Хіти' },
];

/* photo — фото свічки в єдиному стилі (на пледі) для «Вам також сподобається»; без нього — головне фото.
   notes — ноти аромату (top/mid/base) для вікна «Ноти аромату»; d — короткий опис.
   img — головне фото, img2 — друге фото (показується при наведенні).
   c — кольори заглушки, якщо фото не завантажилось.               */
export const SCENTS = [
  { g: 'autumn',  id: 'teplyi-kruasan',   n: 'Теплий круасан',   d: 'Тепла здоба з медом, вершковим маслом і горіхами, з карамельним фіналом', notes: { top: ['цукор', 'мед', 'лимон'], mid: ['вершкове масло', 'волоський горіх', 'мигдаль'], base: ['карамель'] }, c: ['#7a4c1c', '#f0c77a'] },
  { g: 'autumn',  id: 'harbuzovyi-chai',  n: 'Гарбузовий чай',   d: 'Гарячий чай з гарбузом, корицею та мʼякими прянощами', img2: 'harbuzovyi-chai-photo', photo: 'harbuzovyi-chai-photo', notes: { top: ['кардамон', 'яблуко'], mid: ['гарбуз', 'коричневий цукор'], base: ['чорний перець', 'ваніль', 'гвоздика', 'кориця', 'вершки', 'праліне'] }, c: ['#7a3a14', '#e2873a'] },
  { g: 'autumn',  id: 'osinnii-krem',     n: 'Осінній крем',     d: 'Гарбузовий крем з корицею та гвоздикою, ванільно-вершкове тепло', notes: { top: ['гарбуз', 'коричневий цукор'], mid: ['кориця', 'гвоздика'], base: ['вершкове масло', 'вершки', 'ваніль', 'мускатний горіх'] }, c: ['#6b5a1c', '#e8d36a'] },
  { g: 'autumn',  id: 'pryanyi-apelsyn',  n: 'Пряний апельсин',  d: 'Теплий, трохи солодкий, з легкою пряною ноткою', img2: 'pryanyi-apelsyn-photo', photo: 'pryanyi-apelsyn-photo', notes: { top: ['цедра апельсина'], mid: ['терпка журавлина', 'гвоздика', 'кориця'], base: ['свіжий хліб'] }, c: ['#8a3a10', '#f09a3a'] },
  { g: 'classic', id: 'shokolad',         n: 'Шоколад',          d: 'Насичений какао-аромат з мʼякою солодкою ноткою', notes: { top: ['молочний шоколад'], mid: ['темний какао-порошок', 'цукор'], base: ['ваніль'] }, c: ['#3e261a', '#9a6a4a'] },
  { g: 'classic', id: 'vanil',            n: 'Ваніль',           d: 'Тепла класична ваніль, ніжна і затишна', notes: { top: ['масляний крем'], mid: ['торт', 'ванільний'], base: ['бурбон', 'цукор'] }, c: ['#7a6a2a', '#f2e3a0'] },
  { g: 'classic', id: 'harbuzovyi-pyrih', n: 'Гарбузовий пиріг', d: 'Свіжа гарбузова випічка з корицею', img2: 'harbuzovyi-pyrih-photo', photo: 'harbuzovyi-pyrih-photo', card: true, notes: { top: ['кориця', 'мускатний горіх', 'імбир'], mid: ['гвоздика', 'гарбуз'], base: ['корж для пирога', 'ваніль'] }, c: ['#7a3a14', '#e2a07a'] },
  { g: 'classic', id: 'dynia',            n: 'Диня',             d: 'Соковита стигла диня, свіжий літній аромат', notes: { top: ['огірок', 'бергамот'], mid: ['медова диня', 'канталупа', 'зелене листя', 'полуниця'], base: ['ваніль', 'цукор'] }, c: ['#7a6a14', '#f0e06a'] },
];

/* Ціна за кількість: жадібно складаємо найбільші набори, решта — поштучно. */
export function calc(n) {
  let rest = n, total = 0;
  const parts = [];
  for (const s of CONFIG.SETS) {
    while (rest >= s.qty) { total += s.price; rest -= s.qty; parts.push(s.qty); }
  }
  total += rest * CONFIG.SINGLE_PRICE;
  const full = n * CONFIG.SINGLE_PRICE;
  return { n, total, full, save: full - total, parts, singles: rest };
}

/* Ціна готового набору: своя (price) або як звичайний набір на стільки ж свічок. */
export function bundlePrice(b) {
  const k = b.items.length, full = k * CONFIG.SINGLE_PRICE;
  if (!b.price) return calc(k);
  return { n: k, total: b.price, full, save: full - b.price };
}

/* Ціна кошика { id: кількість } з урахуванням наборів зі своєю ціною.
   Перебираємо, скільки таких наборів «зібрати» з кошика (0…максимум), решта — за звичайними цінами,
   і беремо найменшу суму. deals — які набори застосувались: [{ id, n, k, price }]. */
export function calcCart(cart) {
  const n = Object.values(cart).reduce((a, q) => a + (q > 0 ? q : 0), 0);
  const priced = (CONFIG.BUNDLES || []).filter(b => b.price);
  let best = null;
  const go = (i, left, rest, acc, deals) => {
    if (i === priced.length) {
      const total = acc + calc(rest).total;
      if (!best || total < best.total) best = { total, deals };
      return;
    }
    const b = priced[i], max = Math.min(...b.items.map(id => left[id] || 0));
    for (let k = 0; k <= max; k++) {
      const l2 = { ...left };
      b.items.forEach(id => (l2[id] = (l2[id] || 0) - k));
      go(i + 1, l2, rest - k * b.items.length, acc + k * b.price, k ? [...deals, { id: b.id, n: b.n, k, price: b.price }] : deals);
    }
  };
  go(0, cart, n, 0, []);
  const base = calc(n), full = n * CONFIG.SINGLE_PRICE;
  if (best.total >= base.total) return { ...base, deals: [] };
  return { n, total: best.total, full, save: full - best.total, deals: best.deals };
}
