// ============================================
// FAYL: api/caption/key.js
// Vercel backend papkasiga qo'ying
//
// Bu endpoint Groq API key ni qaytaradi
// CEP to'g'ridan-to'g'ri Groq ga murojaat qiladi
// ============================================

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY not set' });

  return res.status(200).json({ key: apiKey });
}
