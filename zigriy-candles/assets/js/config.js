/* ================= НАЛАШТУВАННЯ МАГАЗИНУ =================
   Цей файл читає і сайт, і серверна функція /api/order,
   тож ціни достатньо змінити тільки тут.                      */

export const CONFIG = {
  BRAND: 'Zigriy',
  INSTAGRAM: 'zigriy.candles',

  META_PIXEL_ID: '',     // ← ID Meta Pixel (порожньо = вимкнено)
  TIKTOK_PIXEL_ID: '',   // ← ID TikTok Pixel (порожньо = вимкнено)

  VOLUME: '200 мл',
  SINGLE_PRICE: 450,     // ціна однієї свічки (з Instagram)

  // Ціни наборів. Від більшого до меншого!
  SETS: [
    { qty: 12, price: 4300 },
    { qty: 6,  price: 2350 },
    { qty: 3,  price: 1250 },
  ],

  FREE_SHIPPING_FROM: 1200,  // безкоштовна доставка від, грн
  COUNTDOWN: true,           // таймер «ціни діють лише сьогодні» у шапці
};

export const GROUPS = [
  { id: 'autumn',  t: 'Осіння колекція', tag: 'Новинка' },
  { id: 'classic', t: 'Класика',         tag: 'Хіти' },
];

/* img — головне фото, img2 — друге фото (показується при наведенні).
   c — кольори заглушки, якщо фото не завантажилось.               */
export const SCENTS = [
  { g: 'autumn',  id: 'teplyi-kruasan',   n: 'Теплий круасан',   d: 'Свіжа здоба з вершковим маслом і ваніллю, як ранок у затишній пекарні', c: ['#7a4c1c', '#f0c77a'] },
  { g: 'autumn',  id: 'harbuzovyi-chai',  n: 'Гарбузовий чай',   d: 'Гарячий чай з гарбузом, корицею та мʼякими прянощами', img2: 'harbuzovyi-chai-photo', c: ['#7a3a14', '#e2873a'] },
  { g: 'autumn',  id: 'osinnii-krem',     n: 'Осінній крем',     d: 'Ніжний вершковий крем, ванільний бісквіт і тепло осіннього поля', c: ['#6b5a1c', '#e8d36a'] },
  { g: 'autumn',  id: 'pryanyi-apelsyn',  n: 'Пряний апельсин',  d: 'Теплий, трохи солодкий, з легкою пряною ноткою', img2: 'pryanyi-apelsyn-photo', c: ['#8a3a10', '#f09a3a'] },
  { g: 'classic', id: 'shokolad',         n: 'Шоколад',          d: 'Насичений какао-аромат з мʼякою солодкою ноткою', c: ['#3e261a', '#9a6a4a'] },
  { g: 'classic', id: 'vanil',            n: 'Ваніль',           d: 'Тепла класична ваніль, ніжна і затишна', c: ['#7a6a2a', '#f2e3a0'] },
  { g: 'classic', id: 'harbuzovyi-pyrih', n: 'Гарбузовий пиріг', d: 'Свіжа гарбузова випічка з корицею', c: ['#7a3a14', '#e2a07a'] },
  { g: 'classic', id: 'dynia',            n: 'Диня',             d: 'Соковита стигла диня, свіжий літній аромат', c: ['#7a6a14', '#f0e06a'] },
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
