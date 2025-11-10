import fs from 'node:fs/promises';
import path from 'node:path';
import { json } from './_utils.js';

export default async function handler(req, res) {
  if (req.method !== 'GET')
    return json(res, 405, { error: 'Method not allowed' });
  const file = path.join(process.cwd(), 'data', 'update.json');
  const raw = await fs.readFile(file, 'utf8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  res.end(raw);
}
