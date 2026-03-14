// ============================================
// FAYL: api/caption/generate.js
// Vercel backend papkasiga qo'ying
//
// Vercel Settings > Environment Variables:
//   GROQ_API_KEY = sizning_yangi_groq_key
// ============================================

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
};

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'POST only' });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey)
    return res.status(500).json({ error: 'GROQ_API_KEY not configured' });

  try {
    const { audio, language } = req.body;
    if (!audio) return res.status(400).json({ error: 'No audio data' });

    // Base64 → Buffer
    const audioBuffer = Buffer.from(audio, 'base64');

    // FormData yaratish (Groq Whisper uchun)
    const boundary = '----FormBoundary' + Date.now();
    const formParts = [];

    // Audio fayl
    formParts.push(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="audio.wav"\r\n` +
        `Content-Type: audio/wav\r\n\r\n`,
    );
    formParts.push(audioBuffer);
    formParts.push('\r\n');

    // Model
    formParts.push(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="model"\r\n\r\n` +
        `whisper-large-v3-turbo\r\n`,
    );

    // Language (o'zbek)
    formParts.push(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="language"\r\n\r\n` +
        `${language || 'uz'}\r\n`,
    );

    // Response format — verbose JSON (word timestamps uchun)
    formParts.push(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="response_format"\r\n\r\n` +
        `verbose_json\r\n`,
    );

    // Word timestamps
    formParts.push(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="timestamp_granularities[]"\r\n\r\n` +
        `word\r\n`,
    );

    formParts.push(`--${boundary}--\r\n`);

    // Buffer ga birlashtirish
    const bodyParts = formParts.map((part) =>
      typeof part === 'string' ? Buffer.from(part) : part,
    );
    const bodyBuffer = Buffer.concat(bodyParts);

    // Groq Whisper API ga yuborish
    const groqRes = await fetch(
      'https://api.groq.com/openai/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body: bodyBuffer,
      },
    );

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('Groq error:', errText);
      return res.status(groqRes.status).json({
        error: 'Whisper API error',
        details: errText,
      });
    }

    const data = await groqRes.json();

    // Word-level timestamps ni qaytarish
    const words = (data.words || []).map((w) => ({
      word: w.word,
      start: w.start,
      end: w.end,
    }));

    return res.status(200).json({
      text: data.text || '',
      words: words,
      language: data.language || 'uz',
      duration: data.duration || 0,
    });
  } catch (err) {
    console.error('Caption generate error:', err);
    return res.status(500).json({ error: err.message });
  }
}
