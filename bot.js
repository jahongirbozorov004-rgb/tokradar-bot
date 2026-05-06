// TokRadar Telegram Bot
// O'rnatish: npm install node-telegram-bot-api
// Ishga tushirish: node bot.js

const TelegramBot = require('node-telegram-bot-api');

// ===================================================
// SOZLAMALAR - Bu yerga o'z tokeningizni kiriting
// ===================================================
const BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE'; // BotFather dan olingan token
const MINI_APP_URL = 'https://your-domain.com'; // index.html joylashgan URL
// ===================================================

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('TokRadar bot ishga tushdi...');

// /start komandasi
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'Foydalanuvchi';

  bot.sendMessage(chatId,
    `⚡ *Assalomu alaykum, ${firstName}!*\n\n` +
    `*TokRadar* — O'zbekistoning barcha viloyatlarida elektr holati va uzilishlarini kuzatib boruvchi tizim.\n\n` +
    `🗺 *13 ta viloyat* — barcha tumanlar\n` +
    `🔔 *Bildirishnomalar* — tok o'chsa xabar olasiz\n` +
    `📢 *Xabar qiling* — mahallangizdagi holatni bildiring\n\n` +
    `Ilovani ochish uchun quyidagi tugmani bosing 👇`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          {
            text: '⚡ TokRadar ni ochish',
            web_app: { url: MINI_APP_URL }
          }
        ]]
      }
    }
  );
});

// /tok komandasi - tezkor holat
bot.onText(/\/tok/, (msg) => {
  const chatId = msg.chat.id;

  const statusText =
    `⚡ *Hozirgi holat (namuna)*\n\n` +
    `🟢 *Tok bor:* 42 ta tuman\n` +
    `🔴 *Tok yo'q:* 25 ta tuman\n` +
    `📊 *Faollik:* 63%\n\n` +
    `*Eng ko'p uzilgan viloyatlar:*\n` +
    `• Xorazm — 3 ta tuman\n` +
    `• Surxondaryo — 3 ta tuman\n` +
    `• Qashqadaryo — 2 ta tuman\n\n` +
    `_To'liq ma'lumot uchun ilovani oching_`;

  bot.sendMessage(chatId, statusText, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[
        { text: '🗺 To\'liq xarita', web_app: { url: MINI_APP_URL } }
      ]]
    }
  });
});

// /yordam komandasi
bot.onText(/\/yordam/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId,
    `📖 *TokRadar — Yordam*\n\n` +
    `*Komandalar:*\n` +
    `/start — Botni ishga tushirish\n` +
    `/tok — Hozirgi umumiy holat\n` +
    `/viloyat — Viloyat bo'yicha holat\n` +
    `/yordam — Ushbu yordam\n\n` +
    `*Mini App orqali:*\n` +
    `• Barcha 13 viloyat va tumanlarni ko'ring\n` +
    `• Tok o'chishi/kelishini xabar bering\n` +
    `• Bildirishnomalarni yoqing\n` +
    `• Kunlik grafik va tarixni koring\n\n` +
    `📩 Muammo bo'lsa: @tokradar_support`,
    { parse_mode: 'Markdown' }
  );
});

// /viloyat komandasi - viloyat tanlash
bot.onText(/\/viloyat/, (msg) => {
  const chatId = msg.chat.id;

  const viloyatlar = [
    ['🏙 Toshkent sh.', '🏘 Toshkent vil.'],
    ['🌿 Andijon', '🌿 Fargona'],
    ['🌿 Namangan', '🌾 Samarqand'],
    ['🏜 Buxoro', '💧 Xorazm'],
    ['⛰ Qashqadaryo', '⛰ Surxondaryo'],
    ['🌾 Jizzax', '🌾 Sirdaryo'],
    ['⛏ Navoiy', ''],
  ];

  const keyboard = viloyatlar.map(row =>
    row.filter(v => v).map(v => ({ text: v, callback_data: 'vil_' + v.split(' ').slice(1).join(' ') }))
  );

  bot.sendMessage(chatId, '🗺 *Viloyatni tanlang:*', {
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: keyboard }
  });
});

// Viloyat tugmasi bosilganda
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;

  if (query.data.startsWith('vil_')) {
    const viloyat = query.data.replace('vil_', '');

    // Namuna ma'lumot (real tizimda DB dan olinadi)
    const info = getViloyatInfo(viloyat);

    bot.answerCallbackQuery(query.id);
    bot.sendMessage(chatId,
      `⚡ *${viloyat} viloyati*\n\n` +
      `🟢 Tok bor: *${info.on}* ta tuman\n` +
      `🔴 Tok yo'q: *${info.off}* ta tuman\n` +
      `📊 Ishonchlilik: *${info.reliability}%*\n\n` +
      `${info.off > 0 ? '⚠️ *Hozir uzilgan tumanlar:*\n' + info.offDistricts.map(d => `• ${d}`).join('\n') : '✅ Barcha tumanlarda tok bor'}\n\n` +
      `_To'liq ma'lumot uchun ilovani oching_`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '🗺 Xaritada ko\'rish', web_app: { url: MINI_APP_URL } }
          ]]
        }
      }
    );
  }
});

// Namuna ma'lumot generatori
function getViloyatInfo(viloyat) {
  const data = {
    'Toshkent sh.':  { on: 6, off: 4, reliability: 78, offDistricts: ['Yunusobod', 'Shayxontohur', 'Bektemir', 'Sergeli'] },
    'Toshkent vil.': { on: 3, off: 2, reliability: 77, offDistricts: ['Angren', 'Chirchiq'] },
    'Andijon':       { on: 3, off: 2, reliability: 73, offDistricts: ['Asaka', 'Xojaobod'] },
    'Fargona':       { on: 3, off: 2, reliability: 78, offDistricts: ['Qoqon', 'Beshariq'] },
    'Namangan':      { on: 3, off: 2, reliability: 77, offDistricts: ['Chortoq', 'Pop'] },
    'Samarqand':     { on: 3, off: 2, reliability: 77, offDistricts: ['Kattaqorgon', 'Nurobod'] },
    'Buxoro':        { on: 3, off: 2, reliability: 75, offDistricts: ['Gijduvon', 'Romitan'] },
    'Xorazm':        { on: 3, off: 2, reliability: 68, offDistricts: ['Xiva', 'Bogot'] },
    'Qashqadaryo':   { on: 3, off: 2, reliability: 72, offDistricts: ['Shahrisabz', 'Guzor'] },
    'Surxondaryo':   { on: 3, off: 2, reliability: 71, offDistricts: ['Denov', 'Boysun'] },
    'Jizzax':        { on: 2, off: 2, reliability: 77, offDistricts: ['Gallaorol', 'Dostlik'] },
    'Sirdaryo':      { on: 2, off: 2, reliability: 71, offDistricts: ['Yangiyer', 'Boyovut'] },
    'Navoiy':        { on: 3, off: 1, reliability: 82, offDistricts: ['Nurota'] },
  };
  return data[viloyat] || { on: 3, off: 2, reliability: 75, offDistricts: ['Noma\'lum'] };
}

// Web App ma'lumot qabul qilish
bot.on('message', (msg) => {
  if (msg.web_app_data) {
    const data = JSON.parse(msg.web_app_data.data);
    const chatId = msg.chat.id;

    if (data.type === 'report') {
      bot.sendMessage(chatId,
        `✅ *Xabaringiz qabul qilindi!*\n\n` +
        `📍 Viloyat: *${data.region}*\n` +
        `🏘 Tuman: *${data.district}*\n` +
        `⚡ Holat: *${data.status === 'off' ? 'Tok o\'chdi' : 'Tok keldi'}*\n\n` +
        `Rahmat! Jamoatga yordam berdingiz.`,
        { parse_mode: 'Markdown' }
      );
    }
  }
});

// Xato ushlagich
bot.on('polling_error', (err) => {
  console.error('Xato:', err.message);
});
