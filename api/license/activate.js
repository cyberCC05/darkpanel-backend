import { db } from '../_firebase.js';
import { json, daysLeft } from '../_utils.js';

const TRIAL_DAYS = Number(process.env.TRIAL_DAYS || 7);

export default async function handler(req, res) {
  // 🔐 CORS fix
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST')
    return json(res, 405, { error: 'Method not allowed' });

  // 🧠 JSON parser (for Vercel serverless)
  let body = {};
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString();
    body = JSON.parse(raw || '{}');
  } catch (err) {
    console.error('❌ JSON parse error', err);
    return json(res, 400, { error: 'invalid_json' });
  }

  const { key, deviceId } = body;
  if (!key || !deviceId)
    return json(res, 400, { error: 'key and deviceId required' });

  try {
    const ref = db.ref('keys/' + key);
    const snap = await ref.get();

    if (!snap.exists())
      return json(res, 404, { ok: false, error: 'not_found' });
    const data = snap.val();
    const now = Date.now();

    if (data.deviceId && data.deviceId !== deviceId) {
      return json(res, 200, { ok: false, error: 'bound_to_other_device' });
    }

    if (data.type === 'trial') {
      let exp = Number(data.expiresAt || 0);
      if (!exp) {
        exp = now + TRIAL_DAYS * 24 * 60 * 60 * 1000;
        await ref.update({ deviceId, createdAt: now, expiresAt: exp });
      } else if (now > exp) {
        return json(res, 200, { ok: false, error: 'trial_expired' });
      } else if (!data.deviceId) {
        await ref.update({ deviceId });
      }

      const updated = (await ref.get()).val();
      return json(res, 200, {
        ok: true,
        type: 'trial',
        expiresAt: updated.expiresAt,
        remainingDays: daysLeft(updated.expiresAt),
      });
    }

    if (data.type === 'lifetime') {
      if (!data.deviceId) await ref.update({ deviceId, createdAt: now });
      return json(res, 200, { ok: true, type: 'lifetime' });
    }

    return json(res, 200, { ok: false, error: 'unknown_type' });
  } catch (err) {
    console.error('🔥 Internal error', err);
    return json(res, 500, { ok: false, error: 'internal_error' });
  }
}
