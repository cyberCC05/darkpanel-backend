import fetch from 'node-fetch';

export default async function handler(req, res) {
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || '8.8.8.8';

    const geoReq = await fetch(`https://ipapi.co/${ip}/json/`);
    const geo = await geoReq.json();

    return res.status(200).json({
      ip: ip,
      country: geo.country || 'US',
      country_name: geo.country_name || 'United States',
    });
  } catch (err) {
    return res.status(500).json({ error: 'Geo lookup failed' });
  }
}
