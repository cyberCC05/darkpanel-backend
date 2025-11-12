export default async function handler(req, res) {
  try {
    const path = req.url.replace(/^\/api\/assets\//, '');
    if (!path) return res.status(400).json({ error: 'Missing file path' });

    const base =
      process.env.GITHUB_RAW ||
      'https://raw.githubusercontent.com/Cyber05CC/darkpanel/main';
    const url = `${base}/${path}`;

    const response = await fetch(url);
    if (!response.ok)
      return res.status(response.status).json({ error: 'File not found' });

    res.setHeader('Cache-Control', 'no-store');
    res.setHeader(
      'Content-Type',
      response.headers.get('content-type') || 'application/octet-stream',
    );

    const buf = await response.arrayBuffer();
    res.status(200).send(Buffer.from(buf));
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'proxy_failed', message: err.message });
  }
}
