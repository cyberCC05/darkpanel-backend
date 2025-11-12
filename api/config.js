export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    apiBase:
      process.env.API_BASE || 'https://darkpanel-backend-swart.vercel.app/api',
    github:
      process.env.GITHUB_RAW ||
      'https://raw.githubusercontent.com/Cyber05CC/darkpanel/main',
  });
}
