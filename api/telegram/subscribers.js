// ============================================
// FAYL: api/telegram/subscribers.js
// Vercel backend papkasiga qo'ying
//
// Vercel Settings > Environment Variables ga qo'shing:
//   TG_BOT_TOKEN = sizning_bot_token
//   TG_CHANNEL_ID = @DARKEN_AE (yoki -100xxxxxxxx raqami)
// ============================================

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = process.env.TG_BOT_TOKEN;
  const chatId = process.env.TG_CHANNEL_ID || '@DARKEN_AE';

  if (!token) {
    return res.status(500).json({ error: 'Bot token not configured' });
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/getChatMemberCount?chat_id=${encodeURIComponent(chatId)}`,
    );
    const data = await response.json();

    if (data.ok) {
      return res.status(200).json({
        count: data.result,
        cached: false,
      });
    } else {
      return res.status(400).json({
        error: data.description || 'Telegram API error',
        count: null,
      });
    }
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to fetch',
      count: null,
    });
  }
}
