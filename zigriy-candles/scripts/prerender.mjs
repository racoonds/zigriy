// Вшиває в index.html ціни, набори й картки ароматів, щоб вони були в HTML ще до запуску JS
// (швидше перше відображення, без стрибків верстки, видно парсерам превʼю й AI-асистентам).
// Запускати після змін у assets/js/config.js:  node scripts/prerender.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { CONFIG as C } from '../assets/js/config.js';
import { derive, fmt, hash, setsHTML, groupsHTML } from '../assets/js/render.js';

const file = new URL('../index.html', import.meta.url);
let html = readFileSync(file, 'utf8');
const d = derive();

const swap = (re, to, what) => {
  if (!re.test(html)) throw new Error('Не знайшов у index.html: ' + what);
  html = html.replace(re, to);
};
swap(/(<span data-free>)[^<]*(<\/span>)/g, `$1${d.free}$2`, 'data-free');
swap(/(<span data-volume>)[^<]*(<\/span>)/g, `$1${C.VOLUME}$2`, 'data-volume');
swap(/(<span data-burn>)[^<]*(<\/span>)/g, `$1${C.BURN}$2`, 'data-burn');
swap(/(id="heroMin">)[^<]*/, `$1${fmt(d.minPer)}`, 'heroMin');
swap(/(id="heroOld">)[^<]*/, `$1${fmt(C.SINGLE_PRICE)}`, 'heroOld');
swap(/(id="heroBadge">)[^<]*/, `$1${d.badge}`, 'heroBadge');
swap(/(id="shipSub">)[^<]*/, `$1${d.shipSub}`, 'shipSub');
swap(/(id="yr">)[^<]*/, `$1${new Date().getFullYear()}`, 'yr');
for (const [id, make] of [['setsGrid', setsHTML], ['groups', groupsHTML]]) {
  const body = make();
  swap(new RegExp(`(id="${id}" data-h=")[^"]*(">)[\\s\\S]*?(<!--/${id}-->)`), `$1${hash(body)}$2${body}$3`, id);
}
writeFileSync(file, html);
console.log('index.html оновлено');
