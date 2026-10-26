// Допомагає підключити Telegram-бота, який отримує замовлення з сайту.
//
//   node scripts/telegram-setup.mjs <TOKEN>             перевіряє токен і показує chat id (бот мусить уже отримати від вас повідомлення)
//   node scripts/telegram-setup.mjs <TOKEN> <CHAT_ID>   надсилає тестове повідомлення (кілька id — через кому)
//
// Токен і chat id можна передати й змінними TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID.
const [token = process.env.TELEGRAM_BOT_TOKEN, chats = process.env.TELEGRAM_CHAT_ID] = process.argv.slice(2);
const API = process.env.TELEGRAM_API || 'https://api.telegram.org';

if (!token) {
  console.log('Потрібен токен бота від @BotFather.\n\nВикористання:\n  node scripts/telegram-setup.mjs <TOKEN>\n  node scripts/telegram-setup.mjs <TOKEN> <CHAT_ID>');
  process.exit(1);
}

const call = async (method, body = {}) => {
  const r = await fetch(`${API}/bot${token}/${method}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!j.ok) throw new Error(j.description || `HTTP ${r.status}`);
  return j.result;
};

try {
  const me = await call('getMe');
  console.log(`✓ Токен робочий. Бот: @${me.username}`);

  if (chats) {
    for (const id of chats.split(',').map(s => s.trim()).filter(Boolean)) {
      try {
        await call('sendMessage', { chat_id: id, text: '✅ Zigriy: бот підключено. Сюди приходитимуть замовлення з сайту.' });
        console.log(`✓ Тест надіслано в чат ${id}`);
      } catch (e) { console.log(`✗ Чат ${id}: ${e.message}`); process.exitCode = 1; }
    }
  } else {
    const seen = new Map();
    for (const u of await call('getUpdates')) {
      const c = (u.message || u.channel_post || u.my_chat_member || {}).chat;
      if (c) seen.set(c.id, c);
    }
    if (!seen.size) {
      console.log(`\nБот ще не бачив жодного повідомлення. Відкрийте @${me.username}, натисніть Start і напишіть щось\n(або додайте бота в групу й напишіть там), потім запустіть скрипт ще раз.`);
      process.exitCode = 1;
    } else {
      console.log('\nЗнайдені чати (TELEGRAM_CHAT_ID — це число зліва):');
      for (const c of seen.values()) console.log(`  ${c.id}   ${c.type}   ${c.title || [c.first_name, c.last_name].filter(Boolean).join(' ') || '@' + c.username}`);
    }
  }
} catch (e) {
  console.log('✗ ' + e.message);
  process.exit(1);
}
