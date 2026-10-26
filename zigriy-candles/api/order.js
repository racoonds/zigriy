// Vercel Serverless Function: приймає замовлення з сайту і надсилає його в Telegram.
// Потрібні змінні середовища (Vercel → Project → Settings → Environment Variables):
//   TELEGRAM_BOT_TOKEN — токен бота від @BotFather
//   TELEGRAM_CHAT_ID   — ID чату/групи (можна кілька через кому)

import { CONFIG, SCENTS, calc } from '../assets/js/config.js';

const esc = s => String(s ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const clip = (s, n = 200) => String(s ?? '').trim().slice(0, n);
const normPhone = v => { const d = v.replace(/\D/g, ''); return /^380\d{9}$/.test(d) ? '+' + d : /^0\d{9}$/.test(d) ? '+38' + d : ''; };
const fmt = n => n.toLocaleString('uk-UA').replace(/[\s,]/g, ' ') + ' грн';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = null; } }
  if (!b || typeof b !== 'object') return res.status(400).json({ ok: false, error: 'Bad request' });

  // Honeypot: бот заповнив приховане поле — мовчки «приймаємо»
  if (b.website) return res.status(200).json({ ok: true });

  const order = {
    firstName: clip(b.firstName, 60),
    lastName: clip(b.lastName, 60),
    phone: normPhone(clip(b.phone, 20)),
    contact: clip(b.contact, 20) || 'Дзвінок',
    instagram: clip(b.instagram, 60),
    city: clip(b.city, 80),
    np: clip(b.np, 160),
    npType: b.npType === 'P' ? 'Поштомат' : 'Відділення',
    noCall: b.noCall === true,
    delivery: clip(b.delivery, 30),
    comment: clip(b.comment, 600),
  };
  if (!/^\+380\d{9}$/.test(order.phone) || !order.firstName || !order.city || !order.np) {
    return res.status(400).json({ ok: false, error: 'Invalid contact data' });
  }

  // Позиції перевіряємо за каталогом, ціну рахуємо на сервері
  const items = [];
  for (const it of Array.isArray(b.items) ? b.items : []) {
    const s = SCENTS.find(x => x.id === it?.id);
    const qty = Math.floor(Number(it?.qty));
    if (s && qty > 0 && qty <= CONFIG.MAX_PER_SCENT) items.push({ name: s.n, qty });
  }
  const n = items.reduce((a, i) => a + i.qty, 0);
  if (!n) return res.status(400).json({ ok: false, error: 'Empty cart' });
  if (n > CONFIG.MAX_ORDER) return res.status(400).json({ ok: false, error: 'Too many items' });
  const p = calc(n);
  const free = p.total >= CONFIG.FREE_SHIPPING_FROM;

  const orderId = /^[A-Z0-9-]{3,20}$/.test(b.orderId) ? b.orderId : 'Z-' + Date.now().toString(36).toUpperCase().slice(-6);
  const src = b.source && typeof b.source === 'object'
    ? Object.entries(b.source).filter(([k]) => k !== 'ts').map(([k, v]) => `${k}=${clip(v, 150)}`).join(', ')
    : '';

  const text = [
    `🕯 <b>Нове замовлення ${esc(orderId)}</b>`,
    '',
    ...items.map(i => `• ${esc(i.name)} × ${i.qty}`),
    `Разом: ${n} шт — <b>${fmt(p.total)}</b>${p.save ? ` (знижка ${fmt(p.save)})` : ''}`,
    `Доставка: ${free ? 'безкоштовно' : `за тарифами НП${order.delivery ? ` (${esc(order.delivery)}, орієнтовно)` : ''}`}`,
    '',
    `👤 ${esc(`${order.firstName} ${order.lastName}`.trim())}`,
    `📞 ${esc(order.phone)}`,
    `💬 Звʼязок: ${esc(order.contact)}${order.instagram ? ` (${esc(order.instagram)})` : ''}`,
    `📍 ${esc(order.city)}`,
    `📦 ${order.npType} ${esc(order.np)}`,
    order.noCall ? '✅ Не передзвонювати: клієнт підтвердив замовлення' : '📞 Передзвонити для підтвердження',
    order.comment ? `📝 ${esc(order.comment)}` : null,
    src ? `🔗 ${esc(src)}` : null,
  ].filter(l => l !== null).join('\n');

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chats = (process.env.TELEGRAM_CHAT_ID || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!token || !chats.length) {
    console.error('[order] TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID не налаштовані', orderId);
    return res.status(500).json({ ok: false, error: 'Order delivery is not configured' });
  }

  const results = await Promise.allSettled(chats.map(chat_id =>
    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    }).then(r => { if (!r.ok) throw new Error('Telegram HTTP ' + r.status); })
  ));
  if (!results.some(r => r.status === 'fulfilled')) {
    console.error('[order] Telegram send failed', orderId, results.map(r => r.reason?.message));
    return res.status(502).json({ ok: false, error: 'Failed to deliver order' });
  }

  return res.status(200).json({ ok: true, orderId });
}
