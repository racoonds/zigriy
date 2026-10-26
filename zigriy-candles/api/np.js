// Vercel Serverless Function: Нова Пошта для форми замовлення.
//   /api/np?action=cities&q=Дрог                          → міста з відділеннями
//   /api/np?action=points&city=<CityRef>&type=W|P&q=...   → відділення (W) або поштомати (P)
//   /api/np?action=price&city=<CityRef>&type=W|P&n=3      → орієнтовна вартість доставки, грн
// Ключ NP_API_KEY необовʼязковий: ці методи НП працюють і без нього, з ключем — стабільніші ліміти.

import { CONFIG, calc } from '../assets/js/config.js';

const API = 'https://api.novaposhta.ua/v2.0/json/';
const POSTOMAT_TYPES = new Set([
  'f9316480-5f2d-425d-bc2c-ac7cd29decf0', // Поштомат
  '95dc212d-479c-4ffb-a8ab-8c1b9073d0bc', // Поштомат ПриватБанку
]);
const RESTRICTED = /тільки\s+для/i; // «ТІЛЬКИ ДЛЯ МЕШКАНЦІВ / СПІВРОБІТНИКІВ / ГОСТЕЙ» — сторонній покупець не забере
const REF = /^[0-9a-f-]{36}$/i;
const kind = w => (w.CategoryOfWarehouse === 'Postomat' || POSTOMAT_TYPES.has(w.TypeOfWarehouse) ? 'P' : 'W');

async function np(modelName, calledMethod, methodProperties) {
  const r = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: process.env.NP_API_KEY || '', modelName, calledMethod, methodProperties }),
    signal: AbortSignal.timeout(8000),
  });
  const j = await r.json();
  if (!j.success) throw new Error((j.errors || []).join('; ') || 'Nova Poshta error');
  return j;
}

const send = (res, body, maxAge) => {
  res.setHeader('Cache-Control', `public, s-maxage=${maxAge}, stale-while-revalidate=86400`);
  return res.status(200).json(body);
};
const bad = (res, error = 'Bad request') => res.status(400).json({ error });

export default async function handler(req, res) {
  const q = req.query || {};
  try {
    if (q.action === 'cities') {
      const name = String(q.q || '').trim().slice(0, 50);
      if (name.length < 2) return send(res, { items: [] }, 3600);
      const j = await np('Address', 'searchSettlements', { CityName: name, Limit: '10', Page: '1' });
      const items = (j.data[0]?.Addresses || [])
        .filter(a => a.DeliveryCity && Number(a.Warehouses) > 0)
        .map(a => ({ ref: a.DeliveryCity, name: a.MainDescription, label: a.Present }));
      return send(res, { items }, 86400);
    }

    if (q.action === 'points') {
      const city = String(q.city || '');
      if (!REF.test(city)) return bad(res);
      const type = q.type === 'P' ? 'P' : 'W';
      const s = String(q.q || '').trim().replace(/^№\s*/, '').slice(0, 60);
      const props = { CityRef: city, Limit: '500', Page: '1' };
      if (/^\d+$/.test(s)) props.WarehouseId = s;
      else if (s) props.FindByString = s;
      const j = await np('AddressGeneral', 'getWarehouses', props);
      const items = j.data
        .filter(w => w.CategoryOfWarehouse !== 'Fulfillment' && kind(w) === type && !RESTRICTED.test(w.Description))
        .map(w => ({
          ref: w.Ref,
          n: w.Number,
          d: w.Description.replace(/^(Поштомат|Відділення|Пункт)[^:]*:\s*/, ''),
          kg: Number(w.TotalMaxWeightAllowed) || null,
        }))
        .sort((a, b) => Number(a.n) - Number(b.n));
      return send(res, { items: items.slice(0, 80), more: items.length > 80 }, 21600);
    }

    if (q.action === 'price') {
      const city = String(q.city || '');
      const n = Math.floor(Number(q.n));
      if (!REF.test(city) || !(n > 0 && n <= 200)) return bad(res);
      const j = await np('InternetDocument', 'getDocumentPrice', {
        CitySender: CONFIG.NP.SENDER_CITY,
        CityRecipient: city,
        Weight: String(Math.max(0.1, +(n * CONFIG.NP.WEIGHT_PER_CANDLE).toFixed(2))),
        ServiceType: q.type === 'P' ? 'WarehousePostomat' : 'WarehouseWarehouse',
        Cost: String(calc(n).total),
        CargoType: 'Parcel',
        SeatsAmount: '1',
      });
      return send(res, { cost: Math.ceil(Number(j.data[0]?.Cost) || 0) || null }, 21600);
    }

    return bad(res, 'Unknown action');
  } catch (e) {
    console.error('[np]', q.action, e.message);
    return res.status(502).json({ error: 'Nova Poshta is unavailable' });
  }
}
