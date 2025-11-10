import { db } from '../_firebase.js';
import { json, requireBody, daysLeft } from '../_utils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return json(res, 405, { error: 'Method not allowed' });
  const { key, deviceId } = requireBody(req);
  if (!key || !deviceId)
    return json(res, 400, { error: 'key and deviceId required' });

  const snap = await db.ref('keys/' + key).get();
  if (!snap.exists())
    return json(res, 404, { valid: false, reason: 'not_found' });

  const data = snap.val(); // { type: 'trial'|'lifetime', deviceId?, expiresAt? }
  // device lock
  if (data.deviceId && data.deviceId !== deviceId) {
    return json(res, 200, { valid: false, reason: 'bound_to_other_device' });
  }

  if (data.type === 'trial') {
    const exp = Number(data.expiresAt || 0);
    if (!exp)
      return json(res, 200, { valid: false, reason: 'trial_not_initialized' });
    if (Date.now() > exp)
      return json(res, 200, { valid: false, reason: 'trial_expired' });
    return json(res, 200, {
      valid: true,
      type: 'trial',
      expiresAt: exp,
      remainingDays: daysLeft(exp),
    });
  }

  if (data.type === 'lifetime') {
    return json(res, 200, { valid: true, type: 'lifetime' });
  }

  return json(res, 200, { valid: false, reason: 'unknown_type' });
}
