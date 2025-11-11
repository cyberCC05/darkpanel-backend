import { db } from '../_firebase.js';
import { json, daysLeft } from '../_utils.js';

export default async function handler(req, res) {
  // CORS fix
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST')
    return json(res, 405, { ok: false, error: 'method_not_allowed' });

  // JSON body parser
  let body = {};
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString();
    body = JSON.parse(raw || '{}');
  } catch (err) {
    console.error('❌ JSON parse error:', err);
    return json(res, 400, { ok: false, error: 'invalid_json' });
  }

  const { key, deviceId } = body;
  if (!key || !deviceId)
    return json(res, 400, { ok: false, error: 'key_and_deviceId_required' });

  try {
    const ref = db.ref('keys/' + key);
    const snap = await ref.get();
    if (!snap.exists())
      return json(res, 404, { ok: false, error: 'not_found' });

    const data = snap.val(); // { type, deviceId?, expiresAt? }

    // Device lock
    if (data.deviceId && data.deviceId !== deviceId) {
      return json(res, 200, { ok: false, error: 'bound_to_other_device' });
    }

    // Trial key
    if (data.type === 'trial') {
      const exp = Number(data.expiresAt || 0);
      if (!exp)
        return json(res, 200, { ok: false, error: 'trial_not_initialized' });
      if (Date.now() > exp)
        return json(res, 200, { ok: false, error: 'trial_expired' });
      return json(res, 200, {
        ok: true,
        type: 'trial',
        expiresAt: exp,
        remainingDays: daysLeft(exp),
      });
    }

    // Lifetime key
    if (data.type === 'lifetime') {
      return json(res, 200, { ok: true, type: 'lifetime' });
    }

    // Unknown type
    return json(res, 200, { ok: false, error: 'unknown_type' });
  } catch (err) {
    console.error('🔥 Internal error in /license/check:', err);
    return json(res, 500, { ok: false, error: 'internal_error' });
  }
}
