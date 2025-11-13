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

  // JSON parser
  let body = {};
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    body = JSON.parse(Buffer.concat(chunks).toString() || '{}');
  } catch {
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

    const data = snap.val();

    // ============================
    // 1️⃣ TRIAL KEY — Unlimited devices
    // ============================
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
        msg: 'Trial works on unlimited devices',
      });
    }

    // ============================
    // 2️⃣ LIFETIME — ONE DEVICE ONLY
    // ============================
    if (data.type === 'lifetime') {
      // First activation → bind device
      if (!data.deviceId) {
        await ref.update({ deviceId });
        return json(res, 200, {
          ok: true,
          type: 'lifetime',
          msg: 'Lifetime activated on this device',
        });
      }

      // Check lock
      if (data.deviceId !== deviceId) {
        return json(res, 200, {
          ok: false,
          error: 'bound_to_other_device',
        });
      }

      // Locked to same device → allowed
      return json(res, 200, {
        ok: true,
        type: 'lifetime',
        msg: 'Lifetime valid for this device',
      });
    }

    return json(res, 200, { ok: false, error: 'unknown_type' });
  } catch (err) {
    console.error('🔥 /license/check internal error:', err);
    return json(res, 500, { ok: false, error: 'internal_error' });
  }
}
