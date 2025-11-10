import { db } from '../_firebase.js';
import { json, requireBody, daysLeft } from '../_utils.js';

const TRIAL_DAYS = Number(process.env.TRIAL_DAYS || 7);

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return json(res, 405, { error: 'Method not allowed' });
  const { key, deviceId } = requireBody(req);
  if (!key || !deviceId)
    return json(res, 400, { error: 'key and deviceId required' });

  const ref = db.ref('keys/' + key);
  const snap = await ref.get();
  if (!snap.exists()) return json(res, 404, { ok: false, error: 'not_found' });

  const data = snap.val();

  // already bound to other device
  if (data.deviceId && data.deviceId !== deviceId) {
    return json(res, 200, { ok: false, error: 'bound_to_other_device' });
  }

  const now = Date.now();

  if (data.type === 'trial') {
    let exp = Number(data.expiresAt || 0);
    if (!exp) {
      exp = now + TRIAL_DAYS * 24 * 60 * 60 * 1000;
      await ref.update({ deviceId, createdAt: now, expiresAt: exp });
    } else if (now > exp) {
      return json(res, 200, { ok: false, error: 'trial_expired' });
    } else {
      if (!data.deviceId) await ref.update({ deviceId });
    }
    return json(res, 200, {
      ok: true,
      type: 'trial',
      expiresAt: Number((await ref.get()).val().expiresAt),
      remainingDays: daysLeft((await ref.get()).val().expiresAt),
    });
  }

  if (data.type === 'lifetime') {
    if (!data.deviceId) await ref.update({ deviceId, createdAt: now });
    return json(res, 200, { ok: true, type: 'lifetime' });
  }

  return json(res, 200, { ok: false, error: 'unknown_type' });
}
