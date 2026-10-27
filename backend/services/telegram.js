const fetch = require('node-fetch');
const { config } = require('../config/env');
const { logger } = require('../utils/logger');

async function sendTelegramMessage(text) {
  if (!config.telegram) return;

  const url = `https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: config.telegram.chatId,
      text: String(text).slice(0, 4096),
      parse_mode: 'HTML',
    }),
    timeout: 15000,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    logger.error('Telegram sendMessage failed', { status: res.status, response: body.slice(0, 500) });
  }
}

module.exports = { sendTelegramMessage };
