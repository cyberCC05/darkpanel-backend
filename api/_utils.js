export function json(res, status, data, extraHeaders = {}) {
  res.status(status);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  for (const [k, v] of Object.entries(extraHeaders)) res.setHeader(k, v);
  res.end(JSON.stringify(data));
}

export function requireBody(req) {
  try {
    return req.body || JSON.parse(req.rawBody?.toString() || '{}');
  } catch {
    return {};
  }
}

export function daysLeft(ts) {
  const diff = Number(ts) - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function assertKeyFormat(key) {
  // basic sanity check (XXXX-XXXX-XXXX)
  return /^[A-Z0-9]{4}(-[A-Z0-9]{4}){2,3}$/.test(key);
}
