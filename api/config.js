export default function handler(req, res) {
  return res.status(200).json({
    apiBase: `${
      req.headers.origin || 'https://darkpanel-backend-swart.vercel.app'
    }/api`,
    github:
      process.env.GITHUB_RAW ||
      'https://raw.githubusercontent.com/Cyber05CC/darkpanel/main',
  });
}
